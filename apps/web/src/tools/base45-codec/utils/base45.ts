/**
 * Base45（RFC 9285）文本编解码纯函数实现，不依赖 DOM 与 React。
 * 字符集为 0–9、A–Z 与 " $%*+-./:"（共 45 个字符）；
 * 每 2 个字节编码为 3 个字符，末尾剩 1 个字节编码为 2 个字符。
 * 典型场景为欧盟数字健康证书（DCC）二维码承载内容。
 */

/** Base45 字符表（RFC 9285 第 4 节），下标即对应数值 */
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

/** 字符 → 数值反查表，未收录字符为 undefined */
const CHAR_TO_VALUE: Record<string, number> = Object.fromEntries(
  [...ALPHABET].map((char, index) => [char, index]),
);

/** 解码结果 */
export interface DecodeResult {
  /** 解码成功时的文本，失败为 null */
  text: string | null;
  /** 失败时的错误信息 */
  error: string | null;
}

/**
 * 把 UTF-8 文本编码为 Base45 字符串
 *
 * @param text - 待编码文本
 * @returns Base45 字符串
 */
export function encodeBase45(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let output = '';
  for (let offset = 0; offset < bytes.length; offset += 2) {
    if (offset + 1 < bytes.length) {
      const value = (bytes[offset] ?? 0) * 256 + (bytes[offset + 1] ?? 0);
      output += ALPHABET[value % 45];
      output += ALPHABET[Math.floor(value / 45) % 45];
      output += ALPHABET[Math.floor(value / (45 * 45))];
    } else {
      const value = bytes[offset] ?? 0;
      output += ALPHABET[value % 45];
      output += ALPHABET[Math.floor(value / 45)];
    }
  }
  return output;
}

/**
 * 把 Base45 字符串解码为 UTF-8 文本，严格校验非法字符、长度与数值溢出
 *
 * @param input - 待解码的 Base45 字符串
 * @returns 解码结果，失败时 error 给出具体位置与原因
 */
export function decodeBase45(input: string): DecodeResult {
  const bytes: number[] = [];
  for (let offset = 0; offset < input.length; offset += 3) {
    const remaining = input.length - offset;
    if (remaining === 1) {
      return {
        text: null,
        error: `第 ${offset + 1} 个字符为非法尾序列：Base45 末尾只允许 2 或 3 个字符一组，单独字符无法解码`,
      };
    }

    const triplet = input.slice(offset, offset + 3);
    const values: number[] = [];
    for (const [inner, char] of [...triplet].entries()) {
      const value = CHAR_TO_VALUE[char];
      if (value === undefined) {
        const shown = char === ' ' ? '空格' : `"${char}"`;
        return {
          text: null,
          error: `第 ${offset + inner + 1} 个字符 ${shown} 不在 Base45 字符集（0-9、A-Z、空格与 $ % * + - . / :）内`,
        };
      }
      values.push(value);
    }

    if (remaining === 2) {
      const value = (values[0] ?? 0) + (values[1] ?? 0) * 45;
      if (value > 255) {
        return {
          text: null,
          error: `第 ${offset + 1}-${offset + 2} 个字符解码值 ${value} 超出单字节范围（0–255），输入不是合法的 Base45 尾序列`,
        };
      }
      bytes.push(value);
    } else {
      const value = (values[0] ?? 0) + (values[1] ?? 0) * 45 + (values[2] ?? 0) * 45 * 45;
      if (value > 65535) {
        return {
          text: null,
          error: `第 ${offset + 1}-${offset + 3} 个字符解码值 ${value} 超出双字节范围（0–65535）`,
        };
      }
      bytes.push(Math.floor(value / 256));
      bytes.push(value % 256);
    }
  }

  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes)), error: null };
  } catch {
    return { text: null, error: '解码所得字节不是合法的 UTF-8 序列，无法还原为文本' };
  }
}

/**
 * 校验字符串是否为合法 Base45（可成功解码）
 *
 * @param input - 待校验字符串
 * @returns 合法返回 true
 */
export function validateBase45(input: string): boolean {
  return decodeBase45(input).error === null;
}
