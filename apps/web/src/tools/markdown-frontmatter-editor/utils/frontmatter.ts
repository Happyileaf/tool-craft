/**
 * Markdown Frontmatter 解析与回写核心（零依赖纯函数）
 *
 * 设计范围（见 idea 20261106160209）：块切分 + 浅层键值编辑 + 回写，
 * 不实现完整 YAML/TOML 语法。支持的 frontmatter 子集：
 * - 定界符：YAML 用 `---`，TOML 用 `+++`，必须位于文件首行
 * - 标量：string / number / boolean / null
 * - 数组：行内 `[a, b]` 与 YAML 块式 `- item` 两种写法
 * - 嵌套：单层对象（YAML 缩进两空格、TOML `[section]` 表头），以点路径键暴露
 * 未识别行以 error 形式返回位置，由 UI 定位，不做猜测性解析。
 */

export type FrontmatterFormat = 'yaml' | 'toml';

export type FieldType = 'string' | 'number' | 'boolean' | 'null' | 'array';

export interface FrontmatterField {
  /** 顶层键或点路径键，如 title、author.name */
  key: string;
  /** 原始行文本（数组块可能对应多行） */
  raw: string;
  type: FieldType;
  /** 解析后的值；array 为 string[]，null 类型固定为 null */
  value: string | number | boolean | null | string[];
  /** 该字段在 frontmatter 文本中的起始行号（0 起始，不含定界行） */
  startLine: number;
  /** 占用行数（块式数组可能大于 1） */
  lineCount: number;
}

export interface FrontmatterError {
  /** 0 起始行号（相对整个文档） */
  line: number;
  message: string;
}

export interface ParsedFrontmatter {
  /** 不存在 frontmatter 块时为 null */
  format: FrontmatterFormat | null;
  /** 不含定界行的 frontmatter 原文（无块时为空串） */
  raw: string;
  /** 定界行在原文中的行号 */
  openLine: number;
  closeLine: number;
  fields: FrontmatterField[];
  errors: FrontmatterError[];
  /** 去掉 frontmatter 块后的正文（保留原始换行风格） */
  body: string;
}

const YAML_DELIM = '---';
const TOML_DELIM = '+++';

/** 判断首行是否为合法定界符（允许尾随空白，不允许额外字符） */
function matchDelimiter(line: string): FrontmatterFormat | null {
  const trimmed = line.trim();
  if (trimmed === YAML_DELIM) return 'yaml';
  if (trimmed === TOML_DELIM) return 'toml';
  return null;
}

/** 去掉 YAML 字符串两端引号，返回内层文本与是否带引号 */
function unquoteScalar(token: string): { value: string; quoted: boolean } {
  const t = token.trim();
  if (
    (t.startsWith('"') && t.endsWith('"') && t.length >= 2) ||
    (t.startsWith("'") && t.endsWith("'") && t.length >= 2)
  ) {
    return { value: t.slice(1, -1), quoted: true };
  }
  return { value: t, quoted: false };
}

/** 把无引号标量文本推断为 number/boolean/null，否则保留字符串 */
function inferScalar(token: string): string | number | boolean | null {
  const { value, quoted } = unquoteScalar(token);
  if (quoted) return value;
  if (value === 'null' || value === '~' || value === '') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  const n = Number(value);
  if (value !== '' && Number.isFinite(n)) return n;
  return value;
}

/** 解析行内数组 `[a, "b", c]`，不支持嵌套数组 */
export function parseInlineArray(token: string): string[] | null {
  const t = token.trim();
  if (!(t.startsWith('[') && t.endsWith(']'))) return null;
  const inner = t.slice(1, -1).trim();
  if (inner === '') return [];
  // 简单逗号切分；引号内逗号不拆分
  const items: string[] = [];
  let buf = '';
  let quote: '"' | "'" | null = null;
  for (const ch of inner) {
    if (quote) {
      buf += ch;
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch as '"' | "'";
      buf += ch;
    } else if (ch === ',') {
      items.push(unquoteScalar(buf).value);
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (quote) return null;
  items.push(unquoteScalar(buf).value);
  return items.map((s) => s.trim()).filter((s) => s !== '');
}

function classifyScalar(
  token: string,
): Pick<FrontmatterField, 'type' | 'value'> {
  const v = inferScalar(token);
  if (v === null) return { type: 'null', value: null };
  if (typeof v === 'boolean') return { type: 'boolean', value: v };
  if (typeof v === 'number') return { type: 'number', value: v };
  return { type: 'string', value: v };
}

/** 切分文档为行数组，同时记录原始换行符（\r\n 或 \n） */
export function splitLines(text: string): { lines: string[]; eol: string } {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  return { lines: text.split(/\r?\n/), eol };
}

/**
 * 解析整篇 Markdown：识别顶部 frontmatter 块并抽取浅层字段。
 * 纯函数，不修改输入。
 */
export function parseFrontmatter(text: string): ParsedFrontmatter {
  const { lines } = splitLines(text);
  const first = lines[0];
  const format = first ? matchDelimiter(first) : null;

  if (!format) {
    return {
      format: null,
      raw: '',
      openLine: -1,
      closeLine: -1,
      fields: [],
      errors: [],
      body: text,
    };
  }

  const delim = format === 'yaml' ? YAML_DELIM : TOML_DELIM;
  let closeLine = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i]?.trim() === delim) {
      closeLine = i;
      break;
    }
  }
  if (closeLine === -1) {
    return {
      format,
      raw: '',
      openLine: 0,
      closeLine: -1,
      fields: [],
      errors: [
        {
          line: 0,
          message: `缺少闭合定界符 ${delim}，frontmatter 块未结束`,
        },
      ],
      body: text,
    };
  }

  const blockLines = lines.slice(1, closeLine);
  const fields: FrontmatterField[] = [];
  const errors: FrontmatterError[] = [];
  let sectionPrefix = ''; // TOML [section] / YAML 单层缩进对象的点路径前缀
  let pendingArray: {
    key: string;
    items: string[];
    startLine: number;
  } | null = null;

  const flushArray = (endLine: number) => {
    if (!pendingArray) return;
    fields.push({
      key: pendingArray.key,
      raw: '',
      type: 'array',
      value: pendingArray.items,
      startLine: pendingArray.startLine,
      lineCount: endLine - pendingArray.startLine,
    });
    pendingArray = null;
  };

  for (let i = 0; i < blockLines.length; i += 1) {
    const docLine = i + 1; // 相对整篇文档的行号
    const line = blockLines[i] ?? '';
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      if (pendingArray && trimmed === '') flushArray(i);
      continue;
    }

    // YAML 块式数组续行：`  - item`
    if (pendingArray && /^\s*-\s+/.test(line)) {
      const item = line.replace(/^\s*-\s+/, '').trim();
      pendingArray.items.push(unquoteScalar(item).value);
      continue;
    }
    flushArray(i);

    // TOML 表头 [section]
    if (format === 'toml' && /^\[[^\]]+\]$/.test(trimmed)) {
      sectionPrefix = trimmed.slice(1, -1).trim();
      continue;
    }

    const colonIdx = line.indexOf(':');
    const equalIdx = line.indexOf('=');
    const isYamlKv = format === 'yaml' && colonIdx !== -1;
    const isTomlKv = format === 'toml' && equalIdx !== -1;
    const sepIdx = isYamlKv ? colonIdx : isTomlKv ? equalIdx : -1;

    if (sepIdx === -1) {
      errors.push({ line: docLine, message: `无法识别的行：「${trimmed}」` });
      continue;
    }

    const indent = line.length - line.trimStart().length;
    const keyRaw = line.slice(0, sepIdx).trim();
    const valueToken = line.slice(sepIdx + 1).trim();

    if (format === 'yaml' && indent === 0 && valueToken === '') {
      // 前瞻下一非空行：`- item` 为块式数组，否则为单层嵌套对象
      let j = i + 1;
      while (j < blockLines.length && (blockLines[j] ?? '').trim() === '') j += 1;
      const nextLine = blockLines[j] ?? '';
      if (/^\s*-\s+/.test(nextLine)) {
        pendingArray = { key: keyRaw, items: [], startLine: i };
        continue;
      }
      sectionPrefix = keyRaw;
      continue;
    }
    if (format === 'yaml' && indent === 0) {
      sectionPrefix = '';
    }

    const fullKey =
      sectionPrefix !== '' && (format === 'toml' || indent >= 2)
        ? `${sectionPrefix}.${keyRaw}`
        : keyRaw;

    // YAML 块式数组起始：key: 后紧跟空值，下一行起为 `- item`
    if (format === 'yaml' && valueToken === '') {
      pendingArray = { key: fullKey, items: [], startLine: i };
      continue;
    }

    const inlineArray = parseInlineArray(valueToken);
    if (inlineArray) {
      fields.push({
        key: fullKey,
        raw: line,
        type: 'array',
        value: inlineArray,
        startLine: i,
        lineCount: 1,
      });
      continue;
    }

    if (format === 'toml') {
      // TOML 标量：剥引号后走同一套推断
      fields.push({
        key: fullKey,
        raw: line,
        ...classifyScalar(valueToken),
        startLine: i,
        lineCount: 1,
      });
    } else {
      fields.push({
        key: fullKey,
        raw: line,
        ...classifyScalar(valueToken),
        startLine: i,
        lineCount: 1,
      });
    }
  }
  flushArray(blockLines.length);

  const raw = blockLines.join('\n');
  // 正文 = 闭合行之后的内容；若闭合行后紧跟换行，保留该换行之后的全部
  const bodyLines = lines.slice(closeLine + 1);
  const body = bodyLines.join('\n').replace(/^\n/, '');

  return {
    format,
    raw,
    openLine: 0,
    closeLine,
    fields,
    errors,
    body,
  };
}

/** 标量值序列化为 YAML 文本（字符串在需要时加引号） */
function toYamlScalar(value: string | number | boolean | null): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (needsQuoting(value)) return JSON.stringify(value);
  return value;
}

/** 含特殊字符或以 YAML 保留字开头的字符串需要引号 */
function needsQuoting(s: string): boolean {
  if (s === '') return true;
  if (/^(true|false|null|~|yes|no|on|off)$/i.test(s)) return true;
  if (Number.isFinite(Number(s))) return true;
  return /[:#\[\]{}&*!|>'"%@`,]/.test(s) || /^\s|\s$/.test(s);
}

function toTomlScalar(value: string | number | boolean | null): string {
  if (value === null) return '""';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return JSON.stringify(value);
}

/** 数组按行内形式序列化 */
function toInlineArray(items: string[]): string {
  return `[${items.map((s) => JSON.stringify(s)).join(', ')}]`;
}

export interface FieldInput {
  key: string;
  value: string | number | boolean | null | string[];
}

/** 把字段列表回写为 YAML frontmatter 文本（含定界行），正文保持外部拼接 */
export function stringifyYaml(fields: FieldInput[]): string {
  const lines: string[] = [YAML_DELIM];
  let currentSection = '';
  for (const f of fields) {
    const dotIdx = f.key.indexOf('.');
    if (dotIdx !== -1) {
      const section = f.key.slice(0, dotIdx);
      const subKey = f.key.slice(dotIdx + 1);
      if (section !== currentSection) {
        lines.push(`${section}:`);
        currentSection = section;
      }
      if (Array.isArray(f.value)) {
        lines.push(`  ${subKey}: ${toInlineArray(f.value)}`);
      } else {
        lines.push(`  ${subKey}: ${toYamlScalar(f.value)}`);
      }
    } else {
      currentSection = '';
      if (Array.isArray(f.value)) {
        // 块式数组输出，兼容性最好
        lines.push(`${f.key}:`);
        for (const item of f.value) lines.push(`  - ${item}`);
      } else {
        lines.push(`${f.key}: ${toYamlScalar(f.value)}`);
      }
    }
  }
  lines.push(YAML_DELIM);
  return lines.join('\n');
}

/** 把字段列表回写为 TOML frontmatter 文本（+++ 定界） */
export function stringifyToml(fields: FieldInput[]): string {
  const lines: string[] = [TOML_DELIM];
  const top: FieldInput[] = [];
  const sections = new Map<string, FieldInput[]>();
  for (const f of fields) {
    const dotIdx = f.key.indexOf('.');
    if (dotIdx === -1) {
      top.push(f);
    } else {
      const section = f.key.slice(0, dotIdx);
      const subKey = f.key.slice(dotIdx + 1);
      const list = sections.get(section) ?? [];
      list.push({ key: subKey, value: f.value });
      sections.set(section, list);
    }
  }
  for (const f of top) {
    if (Array.isArray(f.value)) {
      lines.push(`${f.key} = ${toInlineArray(f.value)}`);
    } else {
      lines.push(`${f.key} = ${toTomlScalar(f.value)}`);
    }
  }
  for (const [section, list] of sections) {
    if (top.length > 0 || lines.length > 1) lines.push('');
    lines.push(`[${section}]`);
    for (const f of list) {
      if (Array.isArray(f.value)) {
        lines.push(`${f.key} = ${toInlineArray(f.value)}`);
      } else {
        lines.push(`${f.key} = ${toTomlScalar(f.value)}`);
      }
    }
  }
  lines.push(TOML_DELIM);
  return lines.join('\n');
}

/** 用编辑后的字段替换原 frontmatter，正文原样保留；无块时新建 YAML 块 */
export function writeFrontmatter(
  original: string,
  fields: FieldInput[],
  format: FrontmatterFormat,
): string {
  const parsed = parseFrontmatter(original);
  const block =
    format === 'yaml' ? stringifyYaml(fields) : stringifyToml(fields);
  if (parsed.format === null) {
    return `${block}\n${original}`;
  }
  return `${block}\n${parsed.body}`;
}

/** 字段值在 UI 表单中的字符串表示（数组用逗号连接） */
export function valueToInput(value: FrontmatterField['value']): string {
  if (Array.isArray(value)) return value.join(', ');
  if (value === null) return '';
  return String(value);
}

/** 把表单字符串按目标类型转回字段值 */
export function inputToValue(
  input: string,
  type: FieldType,
): FieldInput['value'] {
  switch (type) {
    case 'number': {
      const n = Number(input);
      return Number.isFinite(n) ? n : 0;
    }
    case 'boolean':
      return input === 'true';
    case 'null':
      return null;
    case 'array':
      return input
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '');
    default:
      return input;
  }
}
