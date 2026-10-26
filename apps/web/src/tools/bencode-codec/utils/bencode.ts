/**
 * Bencode（BitTorrent 序列化格式）编解码纯函数实现，不依赖 DOM 与 React。
 * 支持四种结构：整数 i<数字>e、字节串 <长度>:<原始字节>、列表 l..e、字典 d..e；
 * 字典键强制为字节串并按字节序升序排列。
 *
 * 由于 Bencode 字节串是二进制安全的，未必是合法 UTF-8 文本，
 * 这里以 Uint8Array 承载原始字节；isValidUtf8 为 true 的字节串在 TS 侧还原为字符串。
 */

/** Bencode 值：number 为整数，string 为合法 UTF-8 字节串，Uint8Array 为原始字节串 */
export type BencodeValue = number | string | Uint8Array | BencodeValue[] | BencodeDict;

/** Bencode 字典：键为 UTF-8 文本（Bencode 键恒为字节串，键几乎都是 ASCII） */
export interface BencodeDict {
  [key: string]: BencodeValue;
}

/** 解码结果 */
export interface DecodeResult {
  /** 解码成功时的值，失败为 null */
  value: BencodeValue | null;
  /** 失败时的错误信息（含位置） */
  error: string | null;
}

/** 带位置信息的解析错误 */
class BencodeParseError extends Error {
  constructor(message: string, readonly position: number) {
    super(`${message}（位置 ${position}）`);
    this.name = 'BencodeParseError';
  }
}

/** 检查字节序列是否为合法 UTF-8（fatal 解码） */
function isValidUtf8(bytes: Uint8Array): boolean {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

/** 字节序列转 UTF-8 文本（调用前应先通过 isValidUtf8） */
function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * 把 Bencode 值编码为字节序列
 *
 * @param value - Bencode 值
 * @returns 编码后的字节
 */
export function encodeBencode(value: BencodeValue): Uint8Array {
  const chunks: number[] = [];
  writeValue(value, chunks);
  return Uint8Array.from(chunks);
}

/**
 * 把 Bencode 值追加写入字节数组
 *
 * @param value - Bencode 值
 * @param output - 累积的字节数组
 */
function writeValue(value: BencodeValue, output: number[]): void {
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Error('Bencode 只支持整数，不支持小数或非有限数值');
    }
    output.push(...new TextEncoder().encode(`i${value}e`));
    return;
  }

  if (typeof value === 'string') {
    writeByteString(new TextEncoder().encode(value), output);
    return;
  }

  if (value instanceof Uint8Array) {
    writeByteString(value, output);
    return;
  }

  if (Array.isArray(value)) {
    output.push('l'.charCodeAt(0));
    for (const item of value) {
      writeValue(item, output);
    }
    output.push('e'.charCodeAt(0));
    return;
  }

  if (typeof value === 'object' && value !== null) {
    output.push('d'.charCodeAt(0));
    const encoder = new TextEncoder();
    const sortedEntries = Object.entries(value)
      .map(([key, item]) => ({ key, keyBytes: encoder.encode(key), item }))
      .sort((left, right) => compareBytes(left.keyBytes, right.keyBytes));
    for (const { keyBytes, item } of sortedEntries) {
      writeByteString(keyBytes, output);
      writeValue(item, output);
    }
    output.push('e'.charCodeAt(0));
    return;
  }

  throw new Error('不支持的值类型：仅允许整数、字符串、Uint8Array、数组与普通对象');
}

/**
 * 写入一个字节串：长度前缀 + 冒号 + 原始字节
 *
 * @param bytes - 字节串内容
 * @param output - 累积的字节数组
 */
function writeByteString(bytes: Uint8Array, output: number[]): void {
  output.push(...new TextEncoder().encode(`${bytes.length}:`));
  output.push(...bytes);
}

/**
 * 按无符号字节序比较两个字节序列（短者为前缀时短者在前）
 *
 * @param left - 左侧字节
 * @param right - 右侧字节
 * @returns 负数表示 left 在前，正数表示 right 在前，0 表示相等
 */
function compareBytes(left: Uint8Array, right: Uint8Array): number {
  const minLength = Math.min(left.length, right.length);
  for (let index = 0; index < minLength; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return left.length - right.length;
}

/**
 * 解码 Bencode 字节序列
 *
 * @param input - Bencode 字节
 * @returns 解码结果，失败时 error 含具体位置
 */
export function decodeBencode(input: Uint8Array): DecodeResult {
  try {
    const parser = new Parser(input);
    const value = parser.parseValue();
    if (!parser.atEnd()) {
      throw new BencodeParseError('根元素结束后仍有多余字节，输入不是单一 Bencode 值', parser.position);
    }
    return { value, error: null };
  } catch (caught) {
    if (caught instanceof BencodeParseError) {
      return { value: null, error: caught.message };
    }
    return { value: null, error: caught instanceof Error ? caught.message : '解析失败' };
  }
}

/** Bencode 流式解析器 */
class Parser {
  /** 当前读取位置 */
  position = 0;

  constructor(private readonly data: Uint8Array) {}

  /** 是否已读完 */
  atEnd(): boolean {
    return this.position >= this.data.length;
  }

  /**
   * 解析一个任意类型的值
   *
   * @returns Bencode 值
   */
  parseValue(): BencodeValue {
    const byte = this.peek();
    if (byte === null) {
      throw new BencodeParseError('意外的输入结尾，期待一个 Bencode 值', this.position);
    }
    if (byte === 'i'.charCodeAt(0)) {
      return this.parseInteger();
    }
    if (byte === 'l'.charCodeAt(0)) {
      return this.parseList();
    }
    if (byte === 'd'.charCodeAt(0)) {
      return this.parseDictionary();
    }
    if (byte >= '0'.charCodeAt(0) && byte <= '9'.charCodeAt(0)) {
      return this.parseByteString();
    }
    throw new BencodeParseError(`非法起始字符 "${String.fromCharCode(byte)}"，期待 i/l/d 或数字`, this.position);
  }

  /** 查看当前字节，越界返回 null */
  private peek(): number | null {
    return this.position < this.data.length ? (this.data[this.position] ?? 0) : null;
  }

  /** 读取并前进一个字节 */
  private readByte(expected?: number): number {
    const byte = this.data[this.position];
    if (byte === undefined) {
      throw new BencodeParseError('意外的输入结尾', this.position);
    }
    if (expected !== undefined && byte !== expected) {
      throw new BencodeParseError(
        `期待字符 "${String.fromCharCode(expected)}"，实际为 "${String.fromCharCode(byte)}"`,
        this.position,
      );
    }
    this.position += 1;
    return byte;
  }

  /** 解析整数 i<digits>e */
  private parseInteger(): number {
    const start = this.position;
    this.readByte('i'.charCodeAt(0));
    let digits = '';
    if (!this.atEnd() && this.peek() === '-'.charCodeAt(0)) {
      digits += '-';
      this.position += 1;
    }
    let digitCount = 0;
    while (!this.atEnd() && this.peek() !== 'e'.charCodeAt(0)) {
      const byte = this.readByte();
      if (byte < '0'.charCodeAt(0) || byte > '9'.charCodeAt(0)) {
        throw new BencodeParseError(`整数中出现非法字符 "${String.fromCharCode(byte)}"，只允许 0-9`, this.position - 1);
      }
      digits += String.fromCharCode(byte);
      digitCount += 1;
    }
    if (digitCount === 0) {
      throw new BencodeParseError('整数内容为空，i 与 e 之间至少需要一个数字', start);
    }
    if ((digits.startsWith('0') && digitCount > 1) || digits === '-0') {
      throw new BencodeParseError('整数不允许前导零（-0 同样非法）', start);
    }
    this.readByte('e'.charCodeAt(0));
    const value = Number(digits);
    if (!Number.isSafeInteger(value)) {
      throw new BencodeParseError(`整数 ${digits} 超出 JavaScript 安全整数范围`, start);
    }
    return value;
  }

  /** 解析字节串 <length>:<bytes> */
  private parseByteString(): BencodeValue {
    const start = this.position;
    let lengthDigits = '';
    while (!this.atEnd() && this.peek() !== ':'.charCodeAt(0)) {
      const byte = this.readByte();
      if (byte < '0'.charCodeAt(0) || byte > '9'.charCodeAt(0)) {
        throw new BencodeParseError(`字节串长度前缀出现非法字符 "${String.fromCharCode(byte)}"，只允许 0-9`, this.position - 1);
      }
      lengthDigits += String.fromCharCode(byte);
    }
    if (lengthDigits === '') {
      throw new BencodeParseError('字节串缺少长度前缀', start);
    }
    if (lengthDigits.startsWith('0') && lengthDigits !== '0') {
      throw new BencodeParseError('字节串长度不允许前导零', start);
    }
    this.readByte(':'.charCodeAt(0));
    const length = Number(lengthDigits);
    if (this.position + length > this.data.length) {
      throw new BencodeParseError(
        `字节串声明长度为 ${length} 字节，但剩余输入只有 ${this.data.length - this.position} 字节`,
        start,
      );
    }
    const bytes = this.data.slice(this.position, this.position + length);
    this.position += length;
    return isValidUtf8(bytes) ? bytesToText(bytes) : bytes;
  }

  /** 解析列表 l...e */
  private parseList(): BencodeValue[] {
    const start = this.position;
    this.readByte('l'.charCodeAt(0));
    const items: BencodeValue[] = [];
    while (true) {
      if (this.atEnd()) {
        throw new BencodeParseError('列表缺少结束符 e（输入被截断）', start);
      }
      if (this.peek() === 'e'.charCodeAt(0)) {
        this.position += 1;
        return items;
      }
      items.push(this.parseValue());
    }
  }

  /** 解析字典 d...e，并校验键为字节串、按字节序升序、无重复 */
  private parseDictionary(): BencodeDict {
    const start = this.position;
    this.readByte('d'.charCodeAt(0));
    const dict: BencodeDict = {};
    let previousKey: Uint8Array | null = null;
    while (true) {
      if (this.atEnd()) {
        throw new BencodeParseError('字典缺少结束符 e（输入被截断）', start);
      }
      if (this.peek() === 'e'.charCodeAt(0)) {
        this.position += 1;
        return dict;
      }
      const keyStart = this.position;
      const keyByte = this.peek();
      if (keyByte === null || keyByte < '0'.charCodeAt(0) || keyByte > '9'.charCodeAt(0)) {
        throw new BencodeParseError('字典键必须是字节串（以长度前缀数字开头）', keyStart);
      }
      const keyValue = this.parseByteString();
      if (!(typeof keyValue === 'string')) {
        throw new BencodeParseError(
          `字典键不是合法 UTF-8 文本${
            keyValue instanceof Uint8Array ? `（原始字节十六进制：${bytesToHex(keyValue)}）` : ''
          }，Bencode 字典键必须是文本字节串`,
          keyStart,
        );
      }
      const keyBytes = new TextEncoder().encode(keyValue);
      if (previousKey !== null) {
        const order = compareBytes(previousKey, keyBytes);
        if (order === 0) {
          throw new BencodeParseError(`字典键 "${keyValue}" 重复`, keyStart);
        }
        if (order > 0) {
          throw new BencodeParseError(
            `字典键未按字节序升序排列："${new TextDecoder().decode(previousKey)}" 应排在 "${keyValue}" 之后`,
            keyStart,
          );
        }
      }
      previousKey = keyBytes;
      dict[keyValue] = this.parseValue();
    }
  }
}

/** 字节序列转小写十六进制 */
function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
