/**
 * Markdown Frontmatter 切分与浅层 YAML / TOML 子集解析（零依赖）
 *
 * 设计原则（参考 rejected 先例：不做完整 YAML/TOML 语法）：
 * - 只覆盖 Frontmatter 常见子集：标量、两级缩进 map、标量序列、[section] 表
 * - 超出子集的流式语法（[]/{} 内联、锚点等）记录 unsupported 告警，不静默错解
 * - 所有函数纯函数、不抛异常，错误经 issues 返回
 */

export type FrontmatterFormat = 'yaml' | 'toml';

export type FmPrimitive = string | number | boolean | null;
export type FmValue = FmPrimitive | FmValue[] | { [key: string]: FmValue };

export interface FmIssue {
  /** 1 起始行号（相对于 frontmatter 块内部），0 表示块级问题 */
  line: number;
  level: 'error' | 'warning';
  message: string;
}

export interface SplitResult {
  format: FrontmatterFormat | null;
  /** 围栏内原始文本（不含围栏行），无围栏时为空字符串 */
  raw: string;
  body: string;
  /** 围栏起始行号（1 起始），无围栏时为 0 */
  startLine: number;
  endLine: number;
}

export interface ParsedFrontmatter {
  format: FrontmatterFormat;
  data: Record<string, FmValue>;
  issues: FmIssue[];
}

/** 剥离 BOM、归一化换行 */
function normalize(text: string): string {
  return text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

/**
 * 识别文档开头的 --- / +++ 围栏。
 * 正文中部出现的 --- 分隔线不视为围栏（必须从首行开始）。
 */
export function splitFrontmatter(markdown: string): SplitResult {
  const normalized = normalize(markdown);
  const lines = normalized.split('\n');
  const first = lines[0] ?? '';

  if (first !== '---' && first !== '+++') {
    return { format: null, raw: '', body: normalized, startLine: 0, endLine: 0 };
  }

  const format: FrontmatterFormat = first === '---' ? 'yaml' : 'toml';
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === first) {
      const raw = lines.slice(1, i).join('\n');
      const body = lines.slice(i + 1).join('\n');
      return { format, raw, body, startLine: 1, endLine: i + 1 };
    }
  }

  // 有开头围栏但找不到闭合围栏：块级错误，正文置空
  return {
    format,
    raw: lines.slice(1).join('\n'),
    body: '',
    startLine: 1,
    endLine: 0,
  };
}

/** 解析 YAML 标量：数字 / 布尔 / null / 字符串（去引号） */
export function parseYamlScalar(token: string): FmPrimitive {
  const trimmed = token.trim();
  if (trimmed === '') {
    return '';
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (trimmed === 'null' || trimmed === '~') {
    return null;
  }
  if (/^[-+]?\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  if (/^[-+]?\d+\.\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed;
}

/** 解析 TOML 标量（规则与 YAML 基本一致，额外支持基本字符串转义子集） */
export function parseTomlScalar(token: string): FmPrimitive {
  const trimmed = token.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return trimmed
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
    return trimmed.slice(1, -1);
  }
  return parseYamlScalar(trimmed);
}

function isUnsupportedInline(trimmed: string): boolean {
  // 流式集合：key: [..] / key: {..}
  return /:\s*[[{]/.test(trimmed);
}

/** 浅层 YAML 子集解析：标量键值、两级 map、- 标量序列、# 注释 */
interface YamlContainer {
  key: string;
  map: Record<string, FmValue>;
  list: FmPrimitive[];
}

export function parseYamlSimple(raw: string): ParsedFrontmatter {
  const data: Record<string, FmValue> = {};
  const issues: FmIssue[] = [];
  const lines = raw.split('\n');

  let container: YamlContainer | null = null;

  const closeContainer = () => {
    // 容器关闭时定型：收集到序列项则替换初始空 map，否则保持 map
    if (container !== null && container.list.length > 0) {
      data[container.key] = container.list;
    }
    container = null;
  };

  lines.forEach((rawLine, index) => {
    const line = index + 1;
    const trimmed = rawLine.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      return;
    }
    if (trimmed.startsWith('- ') || trimmed === '-') {
      if (container === null) {
        issues.push({ line, level: 'error', message: `第 ${line} 行序列项缺少所属键` });
        return;
      }
      container.list.push(parseYamlScalar(trimmed === '-' ? '' : trimmed.slice(2)));
      return;
    }
    if (isUnsupportedInline(trimmed)) {
      issues.push({
        line,
        level: 'warning',
        message: `第 ${line} 行使用了流式内联集合语法，超出支持子集，未解析该行`,
      });
      closeContainer();
      return;
    }
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex < 0) {
      issues.push({ line, level: 'error', message: `第 ${line} 行无法识别为「键: 值」` });
      closeContainer();
      return;
    }
    const key = trimmed.slice(0, colonIndex).trim();
    const valuePart = trimmed.slice(colonIndex + 1).trim();
    const indent = rawLine.length - rawLine.trimStart().length;

    if (indent >= 2 && container !== null) {
      // 两级 map 的子键
      if (valuePart === '') {
        issues.push({ line, level: 'warning', message: `第 ${line} 行嵌套层级超过两级，已忽略` });
        return;
      }
      container.map[key] = parseYamlScalar(valuePart);
      return;
    }

    if (valuePart === '') {
      // 开启新容器前先定型上一个容器；默认 map，遇到首个 "- " 时由 list 收集定型
      closeContainer();
      const next: YamlContainer = { key, map: {}, list: [] };
      container = next;
      data[key] = next.map;
      return;
    }

    if (Object.prototype.hasOwnProperty.call(data, key)) {
      issues.push({ line, level: 'warning', message: `第 ${line} 行键「${key}」重复，后值覆盖前值` });
    }
    data[key] = parseYamlScalar(valuePart);
    closeContainer();
  });

  // 末尾容器定型：空容器保持 map；若收集到序列项则替换为 list
  closeContainer();

  return { format: 'yaml', data, issues };
}

/** 浅层 TOML 子集解析：key=value、[section] 表、标量数组 */
export function parseTomlSimple(raw: string): ParsedFrontmatter {
  const data: Record<string, FmValue> = {};
  const issues: FmIssue[] = [];
  const lines = raw.split('\n');
  let currentSection: Record<string, FmValue> | null = null;

  lines.forEach((rawLine, index) => {
    const line = index + 1;
    const trimmed = rawLine.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      return;
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const sectionName = trimmed.slice(1, -1).trim();
      if (sectionName.includes('.') || sectionName.includes('[')) {
        issues.push({
          line,
          level: 'warning',
          message: `第 ${line} 行嵌套表 / 表数组超出支持子集，未解析`,
        });
        currentSection = null;
        return;
      }
      currentSection = {};
      data[sectionName] = currentSection;
      return;
    }
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex < 0) {
      issues.push({ line, level: 'error', message: `第 ${line} 行无法识别为「key = value」` });
      return;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    const valueToken = trimmed.slice(eqIndex + 1).trim();
    const target = currentSection ?? data;

    if (valueToken.startsWith('[') && valueToken.endsWith(']')) {
      const inner = valueToken.slice(1, -1).trim();
      if (inner === '') {
        target[key] = [];
        return;
      }
      target[key] = inner
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part !== '')
        .map((part) => parseTomlScalar(part));
      return;
    }
    if (valueToken.includes('{') || /\[\d/.test(valueToken)) {
      issues.push({
        line,
        level: 'warning',
        message: `第 ${line} 行内联表 / 表数组超出支持子集，未解析`,
      });
      return;
    }
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      issues.push({ line, level: 'warning', message: `第 ${line} 行键「${key}」重复，后值覆盖前值` });
    }
    target[key] = parseTomlScalar(valueToken);
  });

  return { format: 'toml', data, issues };
}

/** 统一入口：按 format 分派 */
export function parseFrontmatter(format: FrontmatterFormat, raw: string): ParsedFrontmatter {
  return format === 'yaml' ? parseYamlSimple(raw) : parseTomlSimple(raw);
}

function needsYamlQuoting(value: string): boolean {
  return (
    value === '' ||
    /[:#]/.test(value) ||
    /^\s|\s$/.test(value) ||
    /^(true|false|null|~)$/.test(value) ||
    /^[-+]?\d+(\.\d+)?$/.test(value) ||
    value.startsWith('[') ||
    value.startsWith('{') ||
    value.startsWith('"') ||
    value.startsWith("'")
  );
}

function formatYamlScalar(value: FmPrimitive): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (needsYamlQuoting(value)) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

/** 把对象写回 YAML 子集文本（两级 map 缩进 2 空格、序列用 - ） */
export function stringifyYaml(data: Record<string, FmValue>): string {
  const out: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      out.push(`${key}:`);
      for (const item of value) {
        out.push(`  - ${formatYamlScalar(item as FmPrimitive)}`);
      }
    } else if (value !== null && typeof value === 'object') {
      out.push(`${key}:`);
      for (const [subKey, subValue] of Object.entries(value)) {
        out.push(`  ${subKey}: ${formatYamlScalar(subValue as FmPrimitive)}`);
      }
    } else {
      out.push(`${key}: ${formatYamlScalar(value)}`);
    }
  }
  return out.join('\n');
}

function formatTomlScalar(value: FmPrimitive): string {
  if (value === null) {
    return '""';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** 把对象写回 TOML 子集文本（嵌套对象转 [section]，数组转内联标量数组） */
export function stringifyToml(data: Record<string, FmValue>): string {
  const top: string[] = [];
  const sections: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      top.push(`${key} = [${value.map((item) => formatTomlScalar(item as FmPrimitive)).join(', ')}]`);
    } else if (value !== null && typeof value === 'object') {
      sections.push(`[${key}]`);
      for (const [subKey, subValue] of Object.entries(value)) {
        sections.push(`${subKey} = ${formatTomlScalar(subValue as FmPrimitive)}`);
      }
      sections.push('');
    } else {
      top.push(`${key} = ${formatTomlScalar(value)}`);
    }
  }
  return [...top, ...sections].filter((line, index, arr) => !(line === '' && index === arr.length - 1)).join('\n');
}

/** 重组完整 Markdown 文档 */
export function buildDocument(
  format: FrontmatterFormat,
  raw: string,
  body: string,
): string {
  const fence = format === 'yaml' ? '---' : '+++';
  const frontmatterBlock = [fence, raw, fence].join('\n');
  return body === '' ? frontmatterBlock : `${frontmatterBlock}\n${body.startsWith('\n') ? body.slice(1) : body}`;
}
