/**
 * logfmt（key=value 行格式）解析与序列化纯函数层（零依赖）
 *
 * 语法：空格分隔的 key=value 片段；双引号包裹的值可含空格并支持反斜杠转义
 * （\" \\ \n \t \r 等）；无等号的裸键视为布尔 true；key= 后直接结束或接空格
 * 视为空字符串。解析采用字符级状态机，不依赖正则拆分，错误以结果对象返回
 * 而非抛出；本模块不触碰 DOM 与 React。
 */

/** 值的推断类型 */
export type LogfmtValueType = 'string' | 'number' | 'boolean';

/** 单个键值对字段，保留原始字符串与推断类型 */
export interface LogfmtField {
  key: string;
  /** 反转义后的原始字符串值；裸键固定为 'true' */
  rawValue: string;
  /** 按整数 / 浮点 / 布尔规则推断出的类型 */
  type: LogfmtValueType;
  /** 按推断类型转换后的实际值 */
  value: string | number | boolean;
}

/** 单行解析结果 */
export interface ParsedLogfmtLine {
  /** 行号（从 1 开始） */
  lineNo: number;
  /** 有序字段列表（重复键按出现顺序保留） */
  fields: LogfmtField[];
  /** 原始行 */
  raw: string;
  /** 解析错误信息（如引号不配对），无错误为空数组 */
  errors: string[];
}

/** 批量解析汇总 */
export interface LogfmtSummary {
  /** 有效记录行数（不含空行） */
  total: number;
  /** 含解析错误的行数 */
  errorLines: number;
  /** 字段总数 */
  fieldCount: number;
}

/** 批量解析完整结果 */
export interface LogfmtParseResult {
  lines: ParsedLogfmtLine[];
  warnings: string[];
  summary: LogfmtSummary;
  /** 缩进 2 空格的 JSON 文本；无有效记录时为空串 */
  jsonOutput: string;
}

/** 序列化结果 */
export interface LogfmtFormatResult {
  output: string;
  error: string | null;
}

/** 整数形态（可选正负号），超出安全整数范围时不推断为 number */
const INTEGER_PATTERN = /^[+-]?\d+$/;
/** 浮点形态：必须含小数点或指数，避免把整数误判 */
const FLOAT_PATTERN = /^[+-]?(?:\d+\.\d*|\.\d+|\d+(?:\.\d*)?[eE][+-]?\d+|\d+\.\d*[eE][+-]?\d+)$/;

/**
 * 反转义双引号值内的反斜杠序列；未知转义保留反斜杠原样，避免信息丢失
 *
 * @param raw - 引号内的原始片段（不含两端引号）
 * @returns 反转义后的字符串
 */
function unescapeQuoted(raw: string): string {
  let output = '';
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch !== '\\') {
      output += ch;
      continue;
    }
    const next = raw[i + 1];
    if (next === undefined) {
      // 末尾孤立反斜杠：原样保留
      output += '\\';
      break;
    }
    switch (next) {
      case 'n':
        output += '\n';
        break;
      case 't':
        output += '\t';
        break;
      case 'r':
        output += '\r';
        break;
      case '"':
        output += '"';
        break;
      case '\\':
        output += '\\';
        break;
      default:
        output += `\\${next}`;
        break;
    }
    i += 1;
  }
  return output;
}

/**
 * 按规则推断字段值类型：整数 / 浮点 → number，true/false → boolean，其余 string
 *
 * @param rawValue - 反转义后的字符串值
 * @returns 推断类型与转换后的值
 */
export function inferValue(rawValue: string): {
  type: LogfmtValueType;
  value: string | number | boolean;
} {
  if (rawValue === 'true' || rawValue === 'false') {
    return { type: 'boolean', value: rawValue === 'true' };
  }
  if (INTEGER_PATTERN.test(rawValue)) {
    const num = Number(rawValue);
    // 超出安全整数范围时保留字符串，避免精度丢失
    if (Number.isSafeInteger(num)) {
      return { type: 'number', value: num };
    }
    return { type: 'string', value: rawValue };
  }
  if (FLOAT_PATTERN.test(rawValue)) {
    const num = Number(rawValue);
    if (Number.isFinite(num)) {
      return { type: 'number', value: num };
    }
  }
  return { type: 'string', value: rawValue };
}

/**
 * 字符级状态机解析单行 logfmt，容忍行首行尾多余空格
 *
 * @param line - 原始行
 * @param lineNo - 行号
 * @returns 有序字段与可能的错误信息
 */
export function parseLogfmtLine(line: string, lineNo: number): ParsedLogfmtLine {
  const fields: LogfmtField[] = [];
  const errors: string[] = [];
  const length = line.length;
  let i = 0;

  const skipSpaces = () => {
    while (i < length && line[i] === ' ') {
      i += 1;
    }
  };

  skipSpaces();
  while (i < length) {
    // 读取键：直到空格或等号为止
    let key = '';
    while (i < length && line[i] !== ' ' && line[i] !== '=') {
      key += line[i];
      i += 1;
    }

    if (i >= length || line[i] === ' ') {
      // 裸键（无等号）：视为布尔 true
      if (key !== '') {
        fields.push({ key, rawValue: 'true', ...inferValue('true') });
      }
      skipSpaces();
      continue;
    }

    // 当前字符为 '='，消费后读取值
    i += 1;
    let rawValue: string;
    if (i >= length || line[i] === ' ') {
      // key= 后直接结尾或接空格：空字符串
      rawValue = '';
    } else if (line[i] === '"') {
      // 双引号值：字符级扫描，反斜杠转义；引号内允许出现空格与等号
      i += 1;
      let quoted = '';
      let closed = false;
      while (i < length) {
        const ch = line[i];
        if (ch === '\\') {
          const next = line[i + 1];
          if (next === undefined) {
            quoted += '\\';
            i += 1;
            break;
          }
          quoted += `\\${next}`;
          i += 2;
          continue;
        }
        if (ch === '"') {
          closed = true;
          i += 1;
          // 闭合引号后必须是空格或行尾，否则视为分隔缺失
          if (i < length && line[i] !== ' ') {
            errors.push(`字段「${key}」的闭合引号后缺少空格分隔`);
          }
          break;
        }
        quoted += ch;
        i += 1;
      }
      if (!closed) {
        errors.push(`字段「${key}」的双引号未闭合`);
      }
      rawValue = unescapeQuoted(quoted);
    } else {
      // 裸值：读取到下一个空格
      let bare = '';
      while (i < length && line[i] !== ' ') {
        bare += line[i];
        i += 1;
      }
      rawValue = bare;
    }

    fields.push({ key, rawValue, ...inferValue(rawValue) });
    skipSpaces();
  }

  return { lineNo, fields, raw: line, errors };
}

/** 把单行记录转为 JSON 对象；重复键后者覆盖前者，与常规 JSON 语义一致 */
function lineToRecord(line: ParsedLogfmtLine): Record<string, string | number | boolean> {
  const record: Record<string, string | number | boolean> = {};
  for (const field of line.fields) {
    record[field.key] = field.value;
  }
  return record;
}

/**
 * 批量解析多行 logfmt 文本，空行自动跳过；坏行保留并产出带行号的中文警告
 *
 * @param input - 原始 logfmt 文本
 * @returns 逐行记录、警告、汇总与 JSON 输出
 */
export function parseLogfmt(input: string): LogfmtParseResult {
  const lines = input.split(/\r?\n/);
  const parsed: ParsedLogfmtLine[] = [];
  const warnings: string[] = [];
  let errorLines = 0;
  let fieldCount = 0;

  lines.forEach((line, index) => {
    if (line.trim() === '') {
      return;
    }
    const parsedLine = parseLogfmtLine(line, index + 1);
    parsed.push(parsedLine);
    fieldCount += parsedLine.fields.length;
    if (parsedLine.errors.length > 0) {
      errorLines += 1;
      for (const error of parsedLine.errors) {
        warnings.push(`第 ${parsedLine.lineNo} 行：${error}`);
      }
    }
  });

  const jsonOutput =
    parsed.length > 0 ? JSON.stringify(parsed.map((line) => lineToRecord(line)), null, 2) : '';

  return {
    lines: parsed,
    warnings,
    summary: { total: parsed.length, errorLines, fieldCount },
    jsonOutput,
  };
}

/**
 * 转义并按需为值加双引号：值为空、含空白、引号、等号或反斜杠时必须加引号
 *
 * @param value - 已转为字符串的值
 * @returns 可直接拼接到 logfmt 行的片段
 */
export function quoteValueIfNeeded(value: string): string {
  const needsQuote =
    value === '' || /[\s"=\\]/.test(value);
  if (!needsQuote) {
    return value;
  }
  // 先转义反斜杠再转义引号，顺序不可颠倒
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * 把单个字段序列化为 logfmt 片段
 *
 * 约定：布尔 true 输出为裸键（key），布尔 false 与其余类型统一 key=value
 *
 * @param key - 字段名
 * @param value - 字段值
 * @returns 序列化片段
 */
export function formatField(key: string, value: unknown): string {
  if (value === true) {
    return key;
  }
  if (value === null || value === undefined) {
    return `${key}=`;
  }
  if (value === '') {
    // 空字符串输出裸 key=，解析侧同样识别为空字符串
    return `${key}=`;
  }
  if (typeof value === 'object') {
    // 嵌套结构不支持扁平化，转成 JSON 文本后按普通字符串处理
    return `${key}=${quoteValueIfNeeded(JSON.stringify(value))}`;
  }
  return `${key}=${quoteValueIfNeeded(String(value))}`;
}

/**
 * 把一条对象记录序列化为单行 logfmt，保持对象自身的键枚举顺序
 *
 * @param record - 键值对象
 * @returns logfmt 行
 */
export function formatRecord(record: Record<string, unknown>): string {
  return Object.entries(record)
    .map(([key, value]) => formatField(key, value))
    .join(' ');
}

/**
 * 解析 JSON 文本（JSON 数组，或每行一个对象的 NDJSON）并序列化为多行 logfmt
 *
 * @param input - JSON 数组或 NDJSON 文本
 * @returns logfmt 文本与可读错误
 */
export function formatLogfmt(input: string): LogfmtFormatResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { output: '', error: null };
  }

  let records: unknown[];
  if (trimmed.startsWith('[')) {
    try {
      records = JSON.parse(trimmed) as unknown[];
    } catch (error) {
      return {
        output: '',
        error: `JSON 数组解析失败：${error instanceof Error ? error.message : String(error)}`,
      };
    }
  } else {
    // NDJSON：逐行解析，空行跳过
    records = [];
    const lines = trimmed.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (line === undefined || line.trim() === '') {
        continue;
      }
      try {
        records.push(JSON.parse(line));
      } catch (error) {
        return {
          output: '',
          error: `第 ${i + 1} 行 JSON 解析失败：${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }
    }
  }

  if (!Array.isArray(records)) {
    return { output: '', error: 'JSON 顶层必须是对象数组（或每行一个对象的 NDJSON）' };
  }

  const outputs: string[] = [];
  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    if (typeof record !== 'object' || record === null || Array.isArray(record)) {
      return { output: '', error: `第 ${i + 1} 条记录不是 JSON 对象，无法序列化为 logfmt 行` };
    }
    outputs.push(formatRecord(record as Record<string, unknown>));
  }
  return { output: outputs.join('\n'), error: null };
}
