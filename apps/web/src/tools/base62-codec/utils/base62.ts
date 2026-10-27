/**
 * Base62 编解码纯逻辑集合。
 * Base62 使用 0-9、A-Z、a-z 共 62 个字符，字符集 URL-safe、无填充符，
 * 广泛用于短链 token、URL slug、数据库短 ID 等场景。本模块同时覆盖
 * 两种主流语义：把非负整数按 62 进制表示（整数模式），以及把任意字节
 * 串按大整数换算并保留前导零字节（字节模式，做法与 Base58 一致）。
 * 仅使用 BigInt 与 TextEncoder / TextDecoder，不触碰 DOM / React。
 */

/** GMP / PHP 风格字母表：数字 → 大写 → 小写 */
export const GMP_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** 替代风格字母表：数字 → 小写 → 大写 */
export const ALTERNATE_ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** 支持的字母表标识 */
export const BASE62_ALPHABETS = ['gmp', 'alternate'] as const;

/** 字母表标识类型，取自 BASE62_ALPHABETS 的元素 */
export type Base62AlphabetKind = (typeof BASE62_ALPHABETS)[number];

/** 字母表标识到实际字符表的映射 */
const ALPHABET_MAP: Record<Base62AlphabetKind, string> = {
  gmp: GMP_ALPHABET,
  alternate: ALTERNATE_ALPHABET,
};

const ZERO = BigInt(0);
const RADIX = BigInt(62);
const BYTE_RADIX = BigInt(256);

/** 编码 / 解码选项 */
export interface Base62Options {
  /** 字母表，默认 gmp（0-9A-Za-z） */
  alphabet?: Base62AlphabetKind;
}

/** 整数解析结果 */
export interface IntegerResult {
  /** 解析成功时的大整数，失败为 null */
  value: bigint | null;
  /** 失败时的错误信息 */
  error: string | null;
}

/** 字符串解码结果 */
export interface DecodeResult {
  /** 解码出的文本（整数模式为十进制文本，字节模式为 UTF-8 文本） */
  text: string | null;
  /** 失败时的错误信息 */
  error: string | null;
}

/**
 * 把非负整数编码为 Base62 字符串
 *
 * @param value - 非负 BigInt
 * @param options - 编码选项
 * @returns Base62 字符串（0 编码为字母表首字符 "0"）
 */
export function encodeInteger(
  value: bigint,
  options: Base62Options = {},
): string {
  const alphabet = ALPHABET_MAP[options.alphabet ?? 'gmp'];
  if (value < ZERO) {
    throw new Error('Base62 整数模式仅支持非负整数');
  }
  if (value === ZERO) {
    return alphabet[0] as string;
  }

  let number = value;
  let output = '';
  while (number > ZERO) {
    const remainder = Number(number % RADIX);
    number /= RADIX;
    output = (alphabet[remainder] ?? '') + output;
  }
  return output;
}

/**
 * 解析十进制或十六进制（0x 前缀）非负整数文本
 *
 * @param input - 整数文本，允许首尾空白与千分位逗号
 * @returns BigInt 或错误信息
 */
export function parseInteger(input: string): IntegerResult {
  const cleaned = input.trim().replace(/[_,]/g, '');
  if (cleaned === '') {
    return { value: null, error: '请输入要编码的非负整数' };
  }

  const isHex = /^0[xX][0-9a-fA-F]+$/.test(cleaned);
  const isDecimal = /^[0-9]+$/.test(cleaned);
  if (!isHex && !isDecimal) {
    if (/^[+-]/.test(cleaned)) {
      return { value: null, error: '整数模式仅支持非负整数，不支持正负号' };
    }
    return {
      value: null,
      error: '无法识别的整数：请输入十进制数字，或使用 0x 前缀的十六进制',
    };
  }

  try {
    return { value: BigInt(cleaned), error: null };
  } catch {
    return { value: null, error: '整数解析失败，请检查格式' };
  }
}

/**
 * 把 Base62 字符串解码为非负整数
 *
 * @param input - Base62 字符串，允许首尾空白
 * @param options - 解码选项（字母表）
 * @returns 大整数或带位置信息的错误
 */
export function decodeInteger(
  input: string,
  options: Base62Options = {},
): IntegerResult {
  const alphabet = ALPHABET_MAP[options.alphabet ?? 'gmp'];
  const trimmed = input.trim();
  if (trimmed === '') {
    return { value: null, error: '请输入要解码的 Base62 字符串' };
  }

  let number = ZERO;
  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index] ?? '';
    const value = alphabet.indexOf(char);
    if (value === -1) {
      return {
        value: null,
        error: `非法 Base62 字符 “${char}”（位置 ${index + 1}）`,
      };
    }
    number = number * RADIX + BigInt(value);
  }

  return { value: number, error: null };
}

/**
 * 把字节数组编码为 Base62 字符串
 *
 * 以 BigInt 逐字节累积数值后反复对 62 取模；前导零字节映射为字母表
 * 首字符（即 "0"），与 Base58 的前导零保留做法一致，保证往返一致。
 *
 * @param bytes - 待编码字节
 * @param options - 编码选项
 * @returns Base62 字符串
 */
export function encodeBytes(
  bytes: Uint8Array,
  options: Base62Options = {},
): string {
  const alphabet = ALPHABET_MAP[options.alphabet ?? 'gmp'];

  if (bytes.length === 0) {
    return '';
  }

  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros += 1;
  }

  let number = ZERO;
  for (const byte of bytes) {
    number = number * BYTE_RADIX + BigInt(byte);
  }

  let output = '';
  while (number > ZERO) {
    const remainder = Number(number % RADIX);
    number /= RADIX;
    output = (alphabet[remainder] ?? '') + output;
  }

  return (alphabet[0] as string).repeat(leadingZeros) + output;
}

/**
 * 把 Base62 字符串解码为字节数组
 *
 * @param input - Base62 字符串，允许首尾空白
 * @param options - 解码选项（字母表）
 * @returns 字节数组或带位置信息的错误
 */
export function decodeToBytes(
  input: string,
  options: Base62Options = {},
): { bytes: Uint8Array | null; error: string | null } {
  const alphabet = ALPHABET_MAP[options.alphabet ?? 'gmp'];
  const trimmed = input.trim();
  if (trimmed === '') {
    return { bytes: new Uint8Array(), error: null };
  }

  let leadingZeros = 0;
  while (
    leadingZeros < trimmed.length &&
    trimmed[leadingZeros] === alphabet[0]
  ) {
    leadingZeros += 1;
  }

  let number = ZERO;
  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index] ?? '';
    const value = alphabet.indexOf(char);
    if (value === -1) {
      return {
        bytes: null,
        error: `非法 Base62 字符 “${char}”（位置 ${index + 1}）`,
      };
    }
    number = number * RADIX + BigInt(value);
  }

  const tail: number[] = [];
  while (number > ZERO) {
    tail.push(Number(number % BYTE_RADIX));
    number /= BYTE_RADIX;
  }

  const bytes = new Uint8Array(leadingZeros + tail.length);
  tail.forEach((byte, offset) => {
    bytes[leadingZeros + tail.length - 1 - offset] = byte;
  });

  return { bytes, error: null };
}

/**
 * 将 UTF-8 文本编码为 Base62（字节模式）
 *
 * @param text - 待编码文本
 * @param options - 编码选项
 * @returns Base62 字符串
 */
export function encodeTextToBase62(
  text: string,
  options?: Base62Options,
): string {
  return encodeBytes(new TextEncoder().encode(text), options);
}

/**
 * 将 Base62 解码为 UTF-8 文本（字节模式）
 *
 * @param input - Base62 字符串
 * @param options - 解码选项
 * @returns 文本或错误信息
 */
export function decodeBase62ToText(
  input: string,
  options?: Base62Options,
): DecodeResult {
  const decoded = decodeToBytes(input, options);
  if (decoded.error || !decoded.bytes) {
    return { text: null, error: decoded.error };
  }
  try {
    return {
      text: new TextDecoder('utf-8', { fatal: true }).decode(decoded.bytes),
      error: null,
    };
  } catch {
    return {
      text: null,
      error: '解码字节不是合法的 UTF-8 文本，可尝试按十六进制查看',
    };
  }
}

/**
 * 把字节数组转为小写十六进制字符串
 *
 * @param bytes - 字节数组
 * @returns 十六进制字符串
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
