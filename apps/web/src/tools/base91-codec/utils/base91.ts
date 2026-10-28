/**
 * basE91（Joachim Henke 提出的二进制转文本编码）纯函数实现，不依赖 DOM 与 React。
 * 使用 91 个可打印 ASCII 字符（除 -、\、' 外的全部可见 ASCII），
 * 以可变的 13/14 bit 分组承载数据：13 bit 值 > 88 时消费 13 bit，
 * 否则消费 14 bit，因此编码体积比 Base64 再小约 8%–10%。
 */

/** basE91 字符表（Joachim Henke 原版 de facto 字母表），下标即对应数值 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';

/** 字符 → 数值反查表，未收录字符为 -1 */
const CHAR_TO_VALUE: number[] = new Array(256).fill(-1);
[...ALPHABET].forEach((char, index) => {
  CHAR_TO_VALUE[char.charCodeAt(0)] = index;
});

/** 解码时需要剥离的空白字符（空格、制表、换行、回车） */
const WHITESPACE_CHARS = new Set([' ', '\t', '\n', '\r', '\f', '\v']);

/** 编码结果 */
export interface EncodeResult {
  /** 编码成功时的 basE91 字符串，失败为 null */
  text: string | null;
  /** 失败时的错误信息 */
  error: string | null;
}

/**
 * 把字节序列编码为 basE91 字符串
 *
 * @param bytes - 待编码字节
 * @returns basE91 字符串
 */
export function encodeBytesBase91(bytes: Uint8Array): string {
  let queue = 0;
  let bitCount = 0;
  let output = '';

  for (const unsignedByte of bytes) {
    queue |= unsignedByte << bitCount;
    bitCount += 8;
    let value: number;
    if (bitCount > 13) {
      value = queue & 8191;
      if (value > 88) {
        queue >>= 13;
        bitCount -= 13;
      } else {
        value = queue & 16383;
        queue >>= 14;
        bitCount -= 14;
      }
    } else {
      continue;
    }
    output += ALPHABET[value % 91];
    output += ALPHABET[(value / 91) | 0];
  }

  if (bitCount > 0) {
    output += ALPHABET[queue % 91];
    if (bitCount > 7 || queue > 90) {
      output += ALPHABET[(queue / 91) | 0];
    }
  }

  return output;
}

/**
 * 把 UTF-8 文本编码为 basE91 字符串
 *
 * @param text - 待编码文本
 * @returns basE91 字符串
 */
export function encodeBase91(text: string): string {
  return encodeBytesBase91(new TextEncoder().encode(text));
}

/**
 * 把十六进制字符串规范化为字节序列
 *
 * @param hex - 十六进制字符串，允许含 0x 前缀与空白分隔
 * @returns 字节序列；非法时返回 null
 */
export function hexToBytes(hex: string): Uint8Array | null {
  const normalized = hex.trim().replace(/^0x/i, '').replace(/\s+/g, '');
  if (normalized.length === 0) {
    return new Uint8Array(0);
  }
  if (normalized.length % 2 !== 0 || /[^0-9a-fA-F]/.test(normalized)) {
    return null;
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let offset = 0; offset < normalized.length; offset += 2) {
    bytes[offset / 2] = parseInt(normalized.slice(offset, offset + 2), 16);
  }
  return bytes;
}

/**
 * 把字节序列转换为大写十六进制字符串
 *
 * @param bytes - 字节序列
 * @returns 十六进制字符串
 */
export function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join('');
}

/**
 * 把 basE91 字符串解码为字节序列，严格校验非法字符
 *
 * @param input - 待解码的 basE91 字符串
 * @param ignoreWhitespace - 是否忽略其中的空白字符，默认 true
 * @returns 解码结果，失败时 error 给出具体位置与原因
 */
export function decodeBase91ToBytes(
  input: string,
  ignoreWhitespace = true,
): { bytes: Uint8Array | null; error: string | null } {
  let queue = 0;
  let bitCount = 0;
  let value = -1;
  let offset = 0;
  const output: number[] = [];

  for (const char of input) {
    offset += 1;
    if (ignoreWhitespace && WHITESPACE_CHARS.has(char)) {
      continue;
    }
    const code = char.charCodeAt(0);
    const unsignedValue: number = code < 256 ? (CHAR_TO_VALUE[code] ?? -1) : -1;
    if (unsignedValue < 0) {
      const shown = char === ' ' ? '空格' : `"${char}"`;
      return {
        bytes: null,
        error: `第 ${offset} 个字符 ${shown} 不在 basE91 字符集（除 -、\\、' 外的可打印 ASCII）内`,
      };
    }

    if (value < 0) {
      value = unsignedValue;
    } else {
      value += unsignedValue * 91;
      queue |= value << bitCount;
      if ((value & 8191) > 88) {
        bitCount += 13;
      } else {
        bitCount += 14;
      }
      do {
        output.push(queue & 255);
        queue >>= 8;
        bitCount -= 8;
      } while (bitCount > 7);
      value = -1;
    }
  }

  if (value >= 0) {
    output.push((queue | (value << bitCount)) & 255);
  }

  return { bytes: Uint8Array.from(output), error: null };
}

/**
 * 把 basE91 字符串解码为 UTF-8 文本，严格校验非法字符与 UTF-8 合法性
 *
 * @param input - 待解码的 basE91 字符串
 * @param ignoreWhitespace - 是否忽略其中的空白字符，默认 true
 * @returns 解码结果，失败时 error 给出具体位置与原因
 */
export function decodeBase91(input: string, ignoreWhitespace = true): EncodeResult {
  const { bytes, error } = decodeBase91ToBytes(input, ignoreWhitespace);
  if (error || !bytes) {
    return { text: null, error };
  }
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), error: null };
  } catch {
    return { text: null, error: '解码所得字节不是合法的 UTF-8 序列，无法还原为文本' };
  }
}

/**
 * 校验字符串是否为合法 basE91（可成功解码）
 *
 * @param input - 待校验字符串
 * @returns 合法返回 true
 */
export function validateBase91(input: string): boolean {
  return decodeBase91ToBytes(input).error === null;
}
