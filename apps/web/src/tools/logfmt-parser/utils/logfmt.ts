/**
 * logfmt 行格式解析与序列化（纯字符串状态机，零依赖，确定性输出）。
 * 语法：空格分隔的 key=value 对；双引号值支持反斜杠转义；裸键视为布尔 true。
 */

export type LogfmtValueType = 'integer' | 'float' | 'boolean' | 'string' | 'null';

export interface LogfmtField {
  /** 键名 */
  key: string;
  /** 原始值（裸键为 'true'，= 后空值为空字符串） */
  rawValue: string;
  /** 类型推断结果 */
  type: LogfmtValueType;
  /** 按推断类型转换后的实际值 */
  value: string | number | boolean | null;
  /** 该字段在源行中的起始列（0 起） */
  start: number;
}

export interface LogfmtLine {
  /** 行号（1 起） */
  lineNo: number;
  /** 原始行文本 */
  raw: string;
  /** 解析出的字段（重复键全部保留，按出现顺序） */
  fields: LogfmtField[];
  /** 该行的告警信息（如未闭合引号）；无告警为 null */
  warning: string | null;
}

export interface LogfmtParseResult {
  lines: LogfmtLine[];
  /** 全部告警（含行号） */
  warnings: string[];
  /** 字段总数 */
  fieldCount: number;
  /** 去重后的字段名（按首次出现顺序） */
  fieldNames: string[];
}

/** 对裸值做轻量类型推断 */
export function inferType(raw: string): { type: LogfmtValueType; value: string | number | boolean | null } {
  if (raw === 'true') return { type: 'boolean', value: true };
  if (raw === 'false') return { type: 'boolean', value: false };
  if (raw === 'null' || raw === '') {
    // 空字符串保留为字符串类型（= 后空值），仅字面 null 推断为 null
    if (raw === 'null') return { type: 'null', value: null };
    return { type: 'string', value: '' };
  }
  // 整数：可选符号 + 纯数字
  if (/^[+-]?\d+$/.test(raw)) {
    const n = Number(raw);
    if (Number.isSafeInteger(n)) return { type: 'integer', value: n };
  }
  // 浮点：含小数点，或整数带指数（如 1e3）
  const isFloat =
    (/^[+-]?(\d+\.\d*|\.\d+|\d+\.\d+)([eE][+-]?\d+)?$/.test(raw) && raw.includes('.')) ||
    /^[+-]?\d+[eE][+-]?\d+$/.test(raw);
  if (isFloat) {
    const n = Number(raw);
    if (Number.isFinite(n)) return { type: 'float', value: n };
  }
  return { type: 'string', value: raw };
}

/**
 * 解析单行 logfmt。
 * 状态机在「键 / 等号 / 裸值 / 引号值」之间迁移，引号内处理 \"、\\、\n、\t 转义。
 */
export function parseLogfmtLine(raw: string, lineNo: number): LogfmtLine {
  const fields: LogfmtField[] = [];
  let warning: string | null = null;
  const len = raw.length;
  let i = 0;

  const skipSpaces = () => {
    while (i < len && raw[i] === ' ') i += 1;
  };

  while (i < len) {
    skipSpaces();
    if (i >= len) break;

    const start = i;
    // 读取键：直到空格或 =
    let key = '';
    while (i < len && raw[i] !== '=' && raw[i] !== ' ') {
      key += raw[i];
      i += 1;
    }
    if (key === '') {
      // 理论上 skipSpaces 后不会发生，防御性跳过
      i += 1;
      continue;
    }

    skipSpaces();
    if (i >= len || raw[i] !== '=') {
      // 裸键：视为布尔 true，不消费等号
      fields.push({ key, rawValue: 'true', type: 'boolean', value: true, start });
      continue;
    }

    // 消费 '='
    i += 1;
    let rawValue = '';
    if (i < len && raw[i] === '"') {
      // 引号值：状态机处理转义
      i += 1;
      let closed = false;
      while (i < len) {
        const ch = raw[i];
        if (ch === '\\') {
          const next = raw[i + 1];
          if (next === '"') rawValue += '"';
          else if (next === '\\') rawValue += '\\';
          else if (next === 'n') rawValue += '\n';
          else if (next === 't') rawValue += '\t';
          else if (next === undefined) {
            warning = `第 ${lineNo} 行：引号值以反斜杠结尾，转义不完整`;
            i += 1;
            break;
          } else rawValue += next;
          i += 2;
          continue;
        }
        if (ch === '"') {
          closed = true;
          i += 1;
          break;
        }
        rawValue += ch;
        i += 1;
      }
      if (!closed && warning === null) {
        warning = `第 ${lineNo} 行：引号未闭合，已按行尾截断`;
      }
    } else {
      // 裸值：直到首个空格截断（= 后立即空格则为空值）
      while (i < len && raw[i] !== ' ') {
        rawValue += raw[i];
        i += 1;
      }
    }

    const inferred = inferType(rawValue);
    fields.push({ key, rawValue, type: inferred.type, value: inferred.value, start });
  }

  return { lineNo, raw, fields, warning };
}

/** 解析多行 logfmt 文本，空行跳过，畸形行告警不中断 */
export function parseLogfmt(input: string): LogfmtParseResult {
  const lines: LogfmtLine[] = [];
  const warnings: string[] = [];
  const fieldNames: string[] = [];
  const seen = new Set<string>();
  let fieldCount = 0;

  const rawLines = input.split('\n');
  rawLines.forEach((raw, index) => {
    if (raw.trim() === '') return;
    const line = parseLogfmtLine(raw, index + 1);
    lines.push(line);
    fieldCount += line.fields.length;
    if (line.warning) warnings.push(line.warning);
    for (const field of line.fields) {
      if (!seen.has(field.key)) {
        seen.add(field.key);
        fieldNames.push(field.key);
      }
    }
  });

  return { lines, warnings, fieldCount, fieldNames };
}

/** 判断序列化时是否需要引号包裹 */
function needsQuoting(value: string): boolean {
  if (value === '') return true;
  return /[\s="\\]/.test(value);
}

/** 序列化单个值为 logfmt 词法单元 */
export function serializeValue(value: string | number | boolean | null): string {
  if (value === true) return ''; // 布尔 true 由调用方输出裸键
  if (value === false) return 'false';
  if (value === null) return 'null';
  const text = String(value);
  if (!needsQuoting(text)) return text;
  // 加引号并转义反斜杠与双引号
  const escaped = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/** 序列化单个键值对；布尔 true 输出裸键 */
export function serializeField(key: string, value: string | number | boolean | null): string {
  if (value === true) return key;
  return `${key}=${serializeValue(value)}`;
}

/** 把字段数组序列化为一行合规 logfmt */
export function serializeFields(fields: { key: string; value: string | number | boolean | null }[]): string {
  return fields.map((f) => serializeField(f.key, f.value)).join(' ');
}

/** 把多行字段集合序列化为多行 logfmt 文本 */
export function serializeLines(lines: { key: string; value: string | number | boolean | null }[][]): string {
  return lines.map(serializeFields).join('\n');
}
