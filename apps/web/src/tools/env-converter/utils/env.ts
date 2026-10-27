/**
 * .env 解析与多格式互转纯函数层
 *
 * 支持四种格式：dotenv（.env）、JSON、扁平 YAML、shell export 语句。
 * 所有函数均为纯函数，不触碰 DOM，不引入第三方依赖。
 */

export type EnvFormat = 'env' | 'json' | 'yaml' | 'export';

export interface EnvEntry {
  key: string;
  value: string;
}

export interface EnvWarning {
  /** 1 起始的行号；非逐行格式（JSON）为 null */
  line: number | null;
  key: string;
  message: string;
}

export interface EnvError {
  /** 1 起始的行号；无法定位时为 null */
  line: number | null;
  message: string;
}

export interface ParseResult {
  entries: EnvEntry[];
  warnings: EnvWarning[];
  error: EnvError | null;
}

export interface ConvertResult {
  output: string;
  warnings: EnvWarning[];
  error: EnvError | null;
}

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * 解析双引号包裹的值，处理常见转义：\n \t \r \" \\
 * 未知转义保留反斜杠原样输出，避免信息丢失。
 */
function unescapeDoubleQuoted(raw: string): string {
  return raw.replace(/\\(.)/g, (_match, ch: string) => {
    switch (ch) {
      case 'n':
        return '\n';
      case 't':
        return '\t';
      case 'r':
        return '\r';
      case '"':
        return '"';
      case '\\':
        return '\\';
      default:
        return `\\${ch}`;
    }
  });
}

/**
 * 解析等号右侧的值：支持双引号、单引号与无引号（含行内注释剥离）。
 */
function parseScalar(raw: string, line: number): string {
  const trimmed = raw.trim();
  const firstChar = trimmed[0];

  if (firstChar === '"' || firstChar === "'") {
    const quote = firstChar;
    // 寻找闭合引号（双引号内允许 \" 转义）
    let end = -1;
    for (let j = 1; j < trimmed.length; j += 1) {
      if (trimmed[j] === quote && (quote === "'" || trimmed[j - 1] !== '\\')) {
        end = j;
        break;
      }
    }
    if (end === -1) {
      throw { line, message: `${quote === '"' ? '双' : '单'}引号未闭合` };
    }
    const inner = trimmed.slice(1, end);
    const tail = trimmed.slice(end + 1).trim();
    if (tail !== '' && !tail.startsWith('#')) {
      throw { line, message: `引号后存在多余内容：${tail}` };
    }
    return quote === '"' ? unescapeDoubleQuoted(inner) : inner;
  }

  // 无引号值：剥离「空白 + #」起始的行内注释
  return trimmed.replace(/\s+#.*$/, '').trim();
}

/**
 * 解析 dotenv / shell export 文本为扁平键值对。
 * 忽略空行与整行注释；可选识别 `export ` 前缀；重复键产生警告且以后值为准。
 */
export function parseDotenv(input: string): ParseResult {
  const entries: EnvEntry[] = [];
  const warnings: EnvWarning[] = [];
  const seen = new Map<string, number>();

  const lines = input.replace(/^\uFEFF/, '').split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    const line = (lines[i] ?? '').trim();

    if (line === '' || line.startsWith('#')) {
      continue;
    }

    let body = line;
    if (/^export(\s+|=)/.test(body)) {
      body = body.replace(/^export\s*/, '');
    }

    const eqIndex = body.indexOf('=');
    if (eqIndex === -1) {
      return {
        entries,
        warnings,
        error: { line: lineNumber, message: '缺少 "="，无法解析为 KEY=VALUE' },
      };
    }

    const key = body.slice(0, eqIndex).trim();
    if (!KEY_PATTERN.test(key)) {
      return {
        entries,
        warnings,
        error: {
          line: lineNumber,
          message: `键名 "${key}" 非法，须匹配 [A-Za-z_][A-Za-z0-9_]*`,
        },
      };
    }

    let value: string;
    try {
      value = parseScalar(body.slice(eqIndex + 1), lineNumber);
    } catch (e) {
      const parseError = e as { line: number; message: string };
      return { entries, warnings, error: parseError };
    }

    const previous = seen.get(key);
    if (previous !== undefined) {
      warnings.push({
        line: lineNumber,
        key,
        message: `重复键，第 ${previous} 行的值被本行覆盖（以后值为准）`,
      });
      const index = entries.findIndex((entry) => entry.key === key);
      if (index !== -1) {
        entries[index] = { key, value };
      }
    } else {
      seen.set(key, lineNumber);
      entries.push({ key, value });
    }
  }

  return { entries, warnings, error: null };
}

/**
 * 解析 JSON 对象为扁平键值对。
 * 仅接受对象顶层；值允许 string / number / boolean / null（null → 空串），
 * 数组与嵌套对象报错。
 */
export function parseJsonEnv(input: string): ParseResult {
  const entries: EnvEntry[] = [];
  const warnings: EnvWarning[] = [];

  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (e) {
    return {
      entries,
      warnings,
      error: { line: null, message: `JSON 解析失败：${(e as Error).message}` },
    };
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      entries,
      warnings,
      error: { line: null, message: 'JSON 顶层必须是对象，例如 {"KEY":"value"}' },
    };
  }

  for (const [key, raw] of Object.entries(data as Record<string, unknown>)) {
    if (!KEY_PATTERN.test(key)) {
      return {
        entries,
        warnings,
        error: { line: null, message: `键名 "${key}" 非法，须匹配 [A-Za-z_][A-Za-z0-9_]*` },
      };
    }
    if (typeof raw === 'string') {
      entries.push({ key, value: raw });
    } else if (typeof raw === 'number' || typeof raw === 'boolean') {
      entries.push({ key, value: String(raw) });
    } else if (raw === null) {
      entries.push({ key, value: '' });
    } else {
      return {
        entries,
        warnings,
        error: { line: null, message: `键 "${key}" 的值为数组或嵌套对象，仅支持扁平键值` },
      };
    }
  }

  return { entries, warnings, error: null };
}

function unquoteYamlKey(raw: string): string {
  const t = raw.trim();
  if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) {
    return unescapeDoubleQuoted(t.slice(1, -1));
  }
  if (t.startsWith("'") && t.endsWith("'") && t.length >= 2) {
    return t.slice(1, -1).replace(/''/g, "'");
  }
  return t;
}

/**
 * 解析扁平 YAML（`key: value` 每行一对）为键值对。
 * 不支持缩进与嵌套结构；单引号内 "''" 表示一个单引号。
 */
export function parseYamlEnv(input: string): ParseResult {
  const entries: EnvEntry[] = [];
  const warnings: EnvWarning[] = [];

  const lines = input.replace(/^\uFEFF/, '').split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    const line = lines[i] ?? '';

    if (line.trim() === '' || line.trim().startsWith('#')) {
      continue;
    }
    if (/^\s/.test(line)) {
      return {
        entries,
        warnings,
        error: { line: lineNumber, message: '出现缩进行，仅支持扁平 key: value，不支持嵌套' },
      };
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      return {
        entries,
        warnings,
        error: { line: lineNumber, message: '缺少 ":"，无法解析为 key: value' },
      };
    }

    const key = unquoteYamlKey(line.slice(0, colonIndex));
    if (!KEY_PATTERN.test(key)) {
      return {
        entries,
        warnings,
        error: {
          line: lineNumber,
          message: `键名 "${key}" 非法，须匹配 [A-Za-z_][A-Za-z0-9_]*`,
        },
      };
    }

    const rest = line.slice(colonIndex + 1);
    if (rest !== '' && !rest.startsWith(' ')) {
      return {
        entries,
        warnings,
        error: { line: lineNumber, message: '冒号后须为空格或行尾' },
      };
    }

    let value: string;
    const candidate = rest.trim();
    if (candidate.startsWith('"')) {
      if (!candidate.endsWith('"') || candidate.length < 2) {
        return { entries, warnings, error: { line: lineNumber, message: '双引号未闭合' } };
      }
      value = unescapeDoubleQuoted(candidate.slice(1, -1));
    } else if (candidate.startsWith("'")) {
      if (!candidate.endsWith("'") || candidate.length < 2) {
        return { entries, warnings, error: { line: lineNumber, message: '单引号未闭合' } };
      }
      value = candidate.slice(1, -1).replace(/''/g, "'");
    } else {
      value = candidate.replace(/\s+#.*$/, '').trim();
    }

    const existing = entries.findIndex((entry) => entry.key === key);
    if (existing !== -1) {
      warnings.push({
        line: lineNumber,
        key,
        message: '重复键，以前值被本行覆盖（以后值为准）',
      });
      entries[existing] = { key, value };
    } else {
      entries.push({ key, value });
    }
  }

  return { entries, warnings, error: null };
}

/**
 * 按源格式解析输入文本。
 */
export function parseEnv(input: string, format: EnvFormat): ParseResult {
  switch (format) {
    case 'json':
      return parseJsonEnv(input);
    case 'yaml':
      return parseYamlEnv(input);
    case 'env':
    case 'export':
      return parseDotenv(input);
    default:
      return {
        entries: [],
        warnings: [],
        error: { line: null, message: `不支持的源格式：${String(format)}` },
      };
  }
}

/**
 * 为 dotenv / export 序列化决定值的写法：必要时用双引号包裹并转义。
 */
function quoteDotenvValue(value: string): string {
  const safe = /^[^\s"'\n\r\t\\]*$/.test(value) && !/(^|\s)#/.test(value);
  if (safe) {
    return value;
  }
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

/** 序列化为 dotenv 文本 */
export function toDotenv(entries: EnvEntry[]): string {
  return entries.map(({ key, value }) => `${key}=${quoteDotenvValue(value)}`).join('\n');
}

/** 序列化为 shell export 语句 */
export function toExport(entries: EnvEntry[]): string {
  return entries.map(({ key, value }) => `export ${key}=${quoteDotenvValue(value)}`).join('\n');
}

/** 序列化为缩进 2 空格的 JSON 文本 */
export function toJson(entries: EnvEntry[]): string {
  const obj: Record<string, string> = {};
  for (const { key, value } of entries) {
    obj[key] = value;
  }
  return JSON.stringify(obj, null, 2);
}

/**
 * 序列化为扁平 YAML：安全裸值直接输出，其余使用双引号包裹。
 */
export function toYaml(entries: EnvEntry[]): string {
  const reserved = /^(true|false|null|~|yes|no|on|off)$/i;
  const numeric = /^-?\d+(\.\d+)?$/;
  const safeScalar = /^[A-Za-z0-9_./@-]+$/;

  return entries
    .map(({ key, value }) => {
      if (value !== '' && safeScalar.test(value) && !reserved.test(value) && !numeric.test(value)) {
        return `${key}: ${value}`;
      }
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `${key}: "${escaped}"`;
    })
    .join('\n');
}

/**
 * 在 .env / JSON / YAML / export 四种格式之间转换。
 * 解析失败时 output 为空串且 error 带定位信息；重复键等不阻断转换的问题进 warnings。
 */
export function convertEnv(input: string, source: EnvFormat, target: EnvFormat): ConvertResult {
  const parsed = parseEnv(input, source);
  if (parsed.error) {
    return { output: '', warnings: parsed.warnings, error: parsed.error };
  }

  let output: string;
  switch (target) {
    case 'json':
      output = toJson(parsed.entries);
      break;
    case 'yaml':
      output = toYaml(parsed.entries);
      break;
    case 'export':
      output = toExport(parsed.entries);
      break;
    case 'env':
      output = toDotenv(parsed.entries);
      break;
    default:
      return {
        output: '',
        warnings: parsed.warnings,
        error: { line: null, message: `不支持的目标格式：${String(target)}` },
      };
  }

  return { output, warnings: parsed.warnings, error: null };
}
