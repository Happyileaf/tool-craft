/**
 * Java .properties（java.util.Properties 行格式）与扁平 JSON 对象双向转换纯函数，
 * 不依赖 DOM 与 React、零新增依赖。
 *
 * 解析方向（properties → JSON）支持：
 * - `=`、`:`、空白三类键值分隔符，键 / 值首尾自然空白被丢弃；
 * - 行尾反斜杠续行（continuation），续行起首空白一并折叠；
 * - 转义序列：\\ \t \n \r \uXXXX，键中可转义空白与分隔符；
 * - `#` / `!` 注释行与空白行；重复键后者覆盖前者；
 * - 畸形 \uXXXX、缺键等返回中文错误，不抛异常。
 *
 * 序列化方向（JSON → properties）输出扁平 key=value：
 * - 键与值按规则转义，自然换行以反斜杠续行表示；
 * - 逻辑行超过 72 字符按 Properties.store 风格插入续行。
 */

/** 逻辑行允许的最大自然长度（与 java.util.Properties 一致，超出即续行） */
const MAX_LINE_LENGTH = 72;

/** 属性键值对 */
export type PropertiesRecord = Record<string, string>;

/** 解析结果 */
export interface PropertiesParseResult {
  /** 成功时的扁平键值对象，失败为 null */
  data: PropertiesRecord | null;
  /** 失败时的错误信息（含逻辑行号） */
  error: string | null;
}

/**
 * 解码转义字符
 *
 * @param char - 反斜杠后的字符
 * @returns 转义后的字符
 */
function decodeSimpleEscape(char: string): string {
  switch (char) {
    case 't':
      return '\t';
    case 'n':
      return '\n';
    case 'r':
      return '\r';
    case 'f':
      return '\f';
    case 'u':
      // \uXXXX 由调用方处理，此处不应到达
      return '';
    default:
      // \\、\=、\:、\空格 等一律还原为字符本身
      return char;
  }
}

/**
 * 解码 properties 转义文本（同时用于键与值）
 *
 * @param raw - 原始文本
 * @param lineNumber - 当前逻辑行号（用于报错）
 * @returns 解码文本或错误
 */
function unescape(raw: string, lineNumber: number): { value: string } | { error: string } {
  let result = '';
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i] ?? '';
    if (char !== '\\') {
      result += char;
      continue;
    }
    const next = raw[i + 1];
    if (next === undefined) {
      // 行尾单独反斜杠由续行预处理消费；残留反斜杠按字面处理
      result += '\\';
      continue;
    }
    if (next === 'u') {
      const hex = raw.slice(i + 2, i + 6);
      if (!/^[0-9A-Fa-f]{4}$/.test(hex)) {
        return {
          error: `第 ${lineNumber} 行存在畸形 Unicode 转义 "\\u${hex}"，\\u 后必须紧跟 4 位十六进制数`,
        };
      }
      result += String.fromCharCode(parseInt(hex, 16));
      i += 5;
      continue;
    }
    result += decodeSimpleEscape(next);
    i += 1;
  }
  return { value: result };
}

/**
 * 把物理行拼接为逻辑行：行尾奇数个反斜杠表示续行，
 * 续行起首的空白（空格 / 制表 / 换页）按规则折叠
 *
 * @param input - 完整 properties 文本
 * @returns 逻辑行数组（每项附带首个物理行号，从 1 起）
 */
function joinLogicalLines(input: string): { text: string; lineNumber: number }[] {
  const physicalLines = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const logical: { text: string; lineNumber: number }[] = [];

  let buffer = '';
  let startLine = 1;

  physicalLines.forEach((line, index) => {
    const physicalLineNumber = index + 1;
    const hasPending = buffer.length > 0;
    if (!hasPending) {
      startLine = physicalLineNumber;
    }
    buffer += line;

    // 统计行尾连续反斜杠数量：奇数表示续行
    let trailing = 0;
    for (let i = buffer.length - 1; i >= 0 && buffer[i] === '\\'; i -= 1) {
      trailing += 1;
    }
    if (trailing % 2 === 1) {
      // 去掉续行反斜杠，接换行占位（下一物理行起首空白将被折叠）
      buffer = buffer.slice(0, -1);
      if (index < physicalLines.length - 1) {
        buffer += '\n';
      }
      return;
    }

    if (hasPending) {
      // 续行：去掉逻辑行内嵌换行后的前导空白
      buffer = buffer.replace(/\n[ \t\f]*/g, '');
    }
    logical.push({ text: buffer, lineNumber: startLine });
    buffer = '';
  });

  if (buffer.length > 0) {
    logical.push({ text: buffer.replace(/\n[ \t\f]*/g, ''), lineNumber: startLine });
  }
  return logical;
}

/**
 * 在逻辑行中定位未转义的键值分隔符（= / : / 空白）
 *
 * @param line - 已去注释与首尾空白的逻辑行
 * @returns 分隔符位置；不存在返回 -1
 */
function findSeparator(line: string): number {
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i] ?? '';
    if (char === '\\' && line[i + 1] !== undefined) {
      i += 1;
      continue;
    }
    if (char === '=' || char === ':' || char === ' ' || char === '\t' || char === '\f') {
      return i;
    }
  }
  return -1;
}

/**
 * 解析 .properties 文本为扁平字符串对象
 *
 * @param input - properties 文本
 * @returns 解析结果，重复键后者覆盖前者
 */
export function parseProperties(input: string): PropertiesParseResult {
  const data: PropertiesRecord = {};

  for (const { text, lineNumber } of joinLogicalLines(input)) {
    const trimmed = text.trim();
    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('!')) {
      continue;
    }

    const separatorIndex = findSeparator(trimmed);
    let rawKey: string;
    let rawValue: string;
    if (separatorIndex === -1) {
      rawKey = trimmed;
      rawValue = '';
    } else {
      rawKey = trimmed.slice(0, separatorIndex);
      const rest = trimmed.slice(separatorIndex);
      const explicit = rest.match(/^[ \t\f]*[=:][ \t\f]*/) ?? rest.match(/^[ \t\f]+/);
      rawValue = explicit ? rest.slice(explicit[0].length) : rest;
    }

    if (rawKey === '') {
      return { data: null, error: `第 ${lineNumber} 行缺少属性键（= / : 前必须有键名）` };
    }

    const keyResult = unescape(rawKey, lineNumber);
    if ('error' in keyResult) {
      return { data: null, error: keyResult.error };
    }
    const valueResult = unescape(rawValue, lineNumber);
    if ('error' in valueResult) {
      return { data: null, error: valueResult.error };
    }
    data[keyResult.value] = valueResult.value;
  }

  return { data, error: null };
}

/**
 * 序列化键（键中的空格、=、:、反斜杠等需转义）
 *
 * @param key - 原始键
 * @returns 转义后的键文本
 */
function escapeKey(key: string): string {
  let out = '';
  for (let i = 0; i < key.length; i += 1) {
    const char = key[i] ?? '';
    if (char === '\\') {
      out += '\\\\';
    } else if (char === ' ' || char === '=' || char === ':') {
      out += `\\${char}`;
    } else {
      out += char;
    }
  }
  return out;
}

/**
 * 序列化值（控制字符转义，前导空白转义以防被读取端折叠）
 *
 * @param value - 原始值
 * @returns 转义后的值文本（可含续行换行）
 */
function escapeValue(value: string): string {
  let out = '';
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i] ?? '';
    if (i === 0 && (char === ' ' || char === '\t')) {
      out += char === ' ' ? '\\ ' : '\\t';
      continue;
    }
    switch (char) {
      case '\\':
        out += '\\\\';
        break;
      case '\n':
        out += '\\n';
        break;
      case '\t':
        out += '\\t';
        break;
      case '\r':
        out += '\\r';
        break;
      case '\f':
        out += '\\f';
        break;
      default:
        out += char;
    }
  }
  return out;
}

/**
 * 按 java.util.Properties.store 风格对超长逻辑行续行：
 * 在不超过 72 个自然字符处插入反斜杠 + 换行 + 单个空格
 *
 * @param line - 完整逻辑行
 * @returns 续行后的文本
 */
function wrapLine(line: string): string {
  if (line.length <= MAX_LINE_LENGTH) {
    return line;
  }
  const chunks: string[] = [];
  let remaining = line;
  while (remaining.length > MAX_LINE_LENGTH) {
    let cut = MAX_LINE_LENGTH;
    // 不在转义序列中间断开（\uXXXX、\\、\n 等保持完整）
    const segment = remaining.slice(0, cut + 1);
    const backslashIndex = segment.lastIndexOf('\\', cut - 1);
    if (backslashIndex !== -1) {
      const escaped = remaining[backslashIndex + 1];
      const escapeLen = escaped === 'u' ? 6 : 2;
      if (backslashIndex + escapeLen > cut) {
        cut = backslashIndex;
      }
    }
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }
  chunks.push(remaining);
  return chunks.join('\\\n ');
}

/**
 * 把扁平 JSON 对象序列化为 .properties 文本
 *
 * @param obj - 键值对象；值须为字符串 / 数字 / 布尔 / null（null 转为空串），
 *   不接受嵌套对象或数组
 * @returns properties 文本或错误
 */
export function stringifyProperties(
  obj: Record<string, unknown>,
): { text: string | null; error: string | null } {
  const lines: string[] = [];
  const keys = Object.keys(obj);

  for (const key of keys) {
    const value = obj[key];
    if (value !== null && (typeof value === 'object' || Array.isArray(value))) {
      return {
        text: null,
        error: `键 "${key}" 的值是对象或数组，.properties 仅支持扁平字符串值，请先展平 JSON`,
      };
    }
    const textValue =
      typeof value === 'string' ? value : value === null ? '' : String(value);
    lines.push(wrapLine(`${escapeKey(key)}=${escapeValue(textValue)}`));
  }

  return { text: lines.join('\n'), error: null };
}
