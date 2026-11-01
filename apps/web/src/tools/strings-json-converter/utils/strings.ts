/**
 * Apple .strings（NextStep 文本 plist）↔ JSON 双向转换。
 * 纯函数、零依赖，不触碰 DOM。
 */

/** 转换方向 */
export type StringsDirection = 'strings-to-json' | 'json-to-strings';

/** 解析选项 */
export interface ParseStringsOptions {
  /** 重复键处理：error 抛错；last 取后者；first 保留前者 */
  duplicateKey: 'error' | 'last' | 'first';
}

/** 解析结果 */
export interface ParsedStrings {
  /** 键值对（按文件中首次出现顺序） */
  entries: Record<string, string>;
  /** 被剥离的 C 风格注释（按出现顺序） */
  comments: string[];
  /** 键值对数量 */
  count: number;
}

/** 生成 .strings 的选项 */
export interface GenerateStringsOptions {
  /** 是否按键的 Unicode 码点排序 */
  sortKeys: boolean;
  /** 是否输出两格缩进 */
  indent: boolean;
}

/** JSON 转 .strings 的结果 */
export interface GeneratedStrings {
  /** .strings 文本 */
  text: string;
  /** 键值对数量 */
  count: number;
}

const HIGH_SURROGATE_MIN = 0xd800;
const HIGH_SURROGATE_MAX = 0xdbff;
const LOW_SURROGATE_MIN = 0xdc00;
const LOW_SURROGATE_MAX = 0xdfff;

/**
 * 解析 .strings 转义序列。
 *
 * @param raw - 引号内原始内容（不含外层引号）
 * @returns 解码后的字符串
 * @throws 非法转义或畸形代理对时抛出中文错误
 */
export function decodeStringsValue(raw: string): string {
  let output = '';
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (char !== '\\') {
      output += char;
      continue;
    }
    const next = raw[i + 1];
    switch (next) {
      case 'n':
        output += '\n';
        i += 1;
        break;
      case 't':
        output += '\t';
        i += 1;
        break;
      case 'r':
        output += '\r';
        i += 1;
        break;
      case '"':
        output += '"';
        i += 1;
        break;
      case '\\':
        output += '\\';
        i += 1;
        break;
      case '0':
        output += '\0';
        i += 1;
        break;
      case 'U': {
        const eight = raw.slice(i + 2, i + 10);
        const four = raw.slice(i + 2, i + 6);
        if (/^[0-9a-fA-F]{8}$/.test(eight)) {
          const codePoint = parseInt(eight, 16);
          output += String.fromCodePoint(codePoint);
          i += 9;
        } else if (/^[0-9a-fA-F]{4}$/.test(four)) {
          output += String.fromCharCode(parseInt(four, 16));
          i += 5;
        } else {
          throw new Error('\\U 后必须是 4 位或 8 位十六进制数');
        }
        break;
      }
      default:
        throw new Error(`不支持的转义序列：\\${next ?? '（结尾）'}`);
    }
  }
  return output;
}

/**
 * 编码为 .strings 字符串字面量内容（含必要转义，未转义中文 / emoji 原样保留）。
 *
 * @param value - 原始字符串
 * @returns 可放入引号的转义文本
 */
export function encodeStringsValue(value: string): string {
  let output = '';
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    const char = value[i] as string;
    if (char === '\\') output += '\\\\';
    else if (char === '"') output += '\\"';
    else if (char === '\n') output += '\\n';
    else if (char === '\r') output += '\\r';
    else if (char === '\t') output += '\\t';
    else if (char === '\0') output += '\\0';
    else if (code >= HIGH_SURROGATE_MIN && code <= HIGH_SURROGATE_MAX) {
      const low = value.charCodeAt(i + 1);
      if (low >= LOW_SURROGATE_MIN && low <= LOW_SURROGATE_MAX) {
        output += `\\U${((0x10000 + ((code - HIGH_SURROGATE_MIN) << 10) + (low - LOW_SURROGATE_MIN)).toString(
          16,
        )).padStart(8, '0')}`;
        i += 1;
      } else {
        output += `\\U${code.toString(16).padStart(4, '0')}`;
      }
    } else if (code >= LOW_SURROGATE_MIN && code <= LOW_SURROGATE_MAX) {
      // 孤立的低代理
      output += `\\U${code.toString(16).padStart(4, '0')}`;
    } else {
      output += char;
    }
  }
  return output;
}

/** 扫描结果：跳过空白与注释后的位置与注释集合 */
interface ScanResult {
  pos: number;
  comments: string[];
}

/**
 * 从 pos 起跳过空白与 C 风格注释。
 *
 * @param text - 全文
 * @param pos - 起始位置
 * @param comments - 收集注释内容
 * @returns 下一个有效字符位置
 */
function skipWhitespaceAndComments(text: string, pos: number, comments: string[]): ScanResult {
  let index = pos;
  for (;;) {
    while (index < text.length && /\s/.test(text[index] as string)) index += 1;
    if (text[index] === '/' && text[index + 1] === '/') {
      const end = text.indexOf('\n', index);
      const stop = end === -1 ? text.length : end;
      comments.push(text.slice(index + 2, stop).trim());
      index = stop;
      continue;
    }
    if (text[index] === '/' && text[index + 1] === '*') {
      const end = text.indexOf('*/', index + 2);
      if (end === -1) {
        throw new Error(`第 ${lineOf(text, index)} 行：块注释 /* 未闭合`);
      }
      comments.push(text.slice(index + 2, end).trim());
      index = end + 2;
      continue;
    }
    return { pos: index, comments };
  }
}

/**
 * 从引号起点读取一个字符串字面量。
 *
 * @param text - 全文
 * @param pos - 开引号位置
 * @returns 解码后的字符串与闭引号后的位置
 */
function readQuotedString(
  text: string,
  pos: number,
): { value: string; next: number } {
  let index = pos + 1;
  let raw = '';
  while (index < text.length) {
    const char = text[index] as string;
    if (char === '\\') {
      raw += char + (text[index + 1] ?? '');
      index += 2;
      continue;
    }
    if (char === '"') {
      return { value: decodeStringsValue(raw), next: index + 1 };
    }
    raw += char;
    index += 1;
  }
  throw new Error(`第 ${lineOf(text, pos)} 行：字符串引号未闭合`);
}

/**
 * 计算偏移量所在行号（1-based）。
 *
 * @param text - 全文
 * @param pos - 字符偏移
 * @returns 行号
 */
function lineOf(text: string, pos: number): number {
  let line = 1;
  for (let i = 0; i < pos && i < text.length; i += 1) {
    if (text[i] === '\n') line += 1;
  }
  return line;
}

/**
 * 解析 Apple .strings 文本为键值对象。
 *
 * @param text - .strings 文本
 * @param options - 解析选项
 * @returns 键值对、注释与数量
 * @throws 语法错误、未闭合、缺分号 / 等号、重复键（按策略）时抛中文错误
 */
export function parseStrings(text: string, options?: Partial<ParseStringsOptions>): ParsedStrings {
  const duplicateKey = options?.duplicateKey ?? 'error';
  const entries: Record<string, string> = {};
  const order: string[] = [];
  const comments: string[] = [];
  let pos = 0;

  for (;;) {
    const skipped = skipWhitespaceAndComments(text, pos, comments);
    pos = skipped.pos;
    if (pos >= text.length) break;

    if (text[pos] !== '"') {
      throw new Error(`第 ${lineOf(text, pos)} 行：期望以引号开始的键，实际遇到「${text[pos]}」`);
    }
    const keyStart = pos;
    const keyRead = readQuotedString(text, pos);
    const key = keyRead.value;
    pos = keyRead.next;

    const afterKey = skipWhitespaceAndComments(text, pos, comments);
    pos = afterKey.pos;
    if (text[pos] !== '=') {
      throw new Error(`第 ${lineOf(text, pos)} 行：键「${key}」后缺少 = 号`);
    }
    pos += 1;

    const beforeValue = skipWhitespaceAndComments(text, pos, comments);
    pos = beforeValue.pos;
    if (text[pos] !== '"') {
      throw new Error(`第 ${lineOf(text, pos)} 行：键「${key}」的值缺少开引号`);
    }
    const valueRead = readQuotedString(text, pos);
    pos = valueRead.next;

    const afterValue = skipWhitespaceAndComments(text, pos, comments);
    pos = afterValue.pos;
    if (text[pos] !== ';') {
      throw new Error(`第 ${lineOf(text, pos)} 行：键「${key}」的条目末尾缺少分号`);
    }
    pos += 1;

    if (Object.prototype.hasOwnProperty.call(entries, key)) {
      if (duplicateKey === 'error') {
        throw new Error(`第 ${lineOf(text, keyStart)} 行：键「${key}」重复定义`);
      }
      if (duplicateKey === 'first') continue;
    }
    if (!Object.prototype.hasOwnProperty.call(entries, key)) order.push(key);
    entries[key] = valueRead.value;
  }

  return { entries, comments, count: order.length };
}

/**
 * 解析 .strings 并输出 JSON 字符串。
 *
 * @param text - .strings 文本
 * @param options - 解析选项
 * @returns 格式化后的 JSON
 */
export function stringsToJson(
  text: string,
  options?: Partial<ParseStringsOptions>,
): string {
  const parsed = parseStrings(text, options);
  return JSON.stringify(parsed.entries, null, 2);
}

/**
 * 把 JSON 对象文本转换为 .strings 文本。
 *
 * @param jsonText - JSON 文本（须为对象，值须为字符串）
 * @param options - 生成选项
 * @returns .strings 文本与数量
 * @throws JSON 非法、顶层非对象、值非字符串时抛中文错误
 */
export function jsonToStrings(
  jsonText: string,
  options?: Partial<GenerateStringsOptions>,
): GeneratedStrings {
  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`JSON 解析失败：${error instanceof Error ? error.message : String(error)}`);
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('JSON 顶层必须是对象（键值对），不能是数组或标量');
  }

  const record = data as Record<string, unknown>;
  let keys = Object.keys(record);
  for (const key of keys) {
    if (typeof record[key] !== 'string') {
      throw new Error(`键「${key}」的值必须是字符串，不支持数字 / 布尔 / 嵌套对象`);
    }
  }
  if (options?.sortKeys) {
    keys = [...keys].sort((a, b) => a.localeCompare(b));
  }

  const indent = options?.indent === false ? '' : '  ';
  const lines = keys.map(
    (key) =>
      `${indent}"${encodeStringsValue(key)}" = "${encodeStringsValue(record[key] as string)}";`,
  );
  return { text: lines.join('\n'), count: keys.length };
}
