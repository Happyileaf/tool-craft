export type BitWidth = 16 | 32 | 64;
export type Endian = 'be' | 'le';
export type Signedness = 'unsigned' | 'signed';

export interface ByteParseResult {
  ok: boolean;
  bytes: number[];
  warnings: string[];
  error?: string;
}

export interface IntegerParseResult {
  ok: boolean;
  value?: bigint;
  error?: string;
}

/** 解析十六进制字节串：忽略空白、逗号、下划线与 0x 前缀，奇数位补前导 0。 */
export function parseHexBytes(input: string): ByteParseResult {
  const warnings: string[] = [];
  if (input.trim() === '') {
    return { ok: true, bytes: [], warnings };
  }

  let digits = '';
  let index = 0;
  while (index < input.length) {
    const ch = input.charAt(index);
    if (/\s/.test(ch) || ch === ',' || ch === '_') {
      index += 1;
      continue;
    }
    if (ch === '0' && (input.charAt(index + 1) === 'x' || input.charAt(index + 1) === 'X')) {
      index += 2;
      continue;
    }
    if (/[0-9a-fA-F]/.test(ch)) {
      digits += ch;
      index += 1;
      continue;
    }
    return {
      ok: false,
      bytes: [],
      warnings,
      error: `非法字符 "${ch}"（第 ${index + 1} 个字符），仅支持十六进制数字、空白、逗号与 0x 前缀`,
    };
  }

  if (digits === '') {
    return { ok: false, bytes: [], warnings, error: '未找到有效的十六进制数字' };
  }
  if (digits.length % 2 === 1) {
    digits = `0${digits}`;
    warnings.push('十六进制位数为奇数，已在最前面补 0');
  }

  const bytes: number[] = [];
  for (let i = 0; i < digits.length; i += 2) {
    bytes.push(parseInt(digits.slice(i, i + 2), 16));
  }
  return { ok: true, bytes, warnings };
}

/** 把字节序列按指定端序解释为无符号 BigInt。 */
export function bytesToBigInt(bytes: number[], endian: Endian): bigint {
  let value = BigInt(0);
  const list = endian === 'be' ? bytes : [...bytes].reverse();
  for (const byte of list) {
    value = (value << BigInt(8)) | BigInt(byte & 0xff);
  }
  return value;
}

/** 按补码规则把无符号值转为有符号值。 */
export function applySigned(value: bigint, width: BitWidth): bigint {
  const modulus = BigInt(1) << BigInt(width);
  const half = BigInt(1) << BigInt(width - 1);
  return value >= half ? value - modulus : value;
}

/** 解释字节序列：同时给出大端与小端（有符号时按补码）。 */
export function interpretBytes(
  bytes: number[],
  width: BitWidth,
  signedness: Signedness,
): { bigEndian: bigint; littleEndian: bigint } {
  const bigEndian = bytesToBigInt(bytes, 'be');
  const littleEndian = bytesToBigInt(bytes, 'le');
  if (signedness === 'signed') {
    return {
      bigEndian: applySigned(bigEndian, width),
      littleEndian: applySigned(littleEndian, width),
    };
  }
  return { bigEndian, littleEndian };
}

/** 解析十进制 / 0x 十六进制整数，并校验目标位宽的范围。 */
export function parseInteger(
  input: string,
  width: BitWidth,
  signedness: Signedness,
): IntegerParseResult {
  const text = input.trim();
  if (text === '') return { ok: false, error: '请输入要转换的整数' };

  let negative = false;
  let body = text;
  if (body.startsWith('-')) {
    negative = true;
    body = body.slice(1);
  } else if (body.startsWith('+')) {
    body = body.slice(1);
  }

  let value: bigint;
  try {
    if (/^0[xX][0-9a-fA-F]+$/.test(body)) {
      value = BigInt(body);
    } else if (/^[0-9]+$/.test(body)) {
      value = BigInt(body);
    } else {
      return {
        ok: false,
        error: '仅支持十进制整数或以 0x 开头的十六进制整数，且不接受小数点与指数',
      };
    }
  } catch {
    return { ok: false, error: '整数解析失败，请检查输入格式' };
  }
  if (negative) value = -value;

  const bits = BigInt(width);
  const min = signedness === 'signed' ? -(BigInt(1) << BigInt(width - 1)) : BigInt(0);
  const max =
    signedness === 'signed'
      ? (BigInt(1) << BigInt(width - 1)) - BigInt(1)
      : (BigInt(1) << bits) - BigInt(1);
  if (value < min || value > max) {
    return {
      ok: false,
      error: `${width} 位${signedness === 'signed' ? '有符号' : '无符号'}整数的取值范围是 ${min} ~ ${max}，输入已越界`,
    };
  }
  return { ok: true, value };
}

/** 把整数按补码编码为指定端序的字节序列。 */
export function intToBytes(value: bigint, width: BitWidth, endian: Endian): number[] {
  const modulus = BigInt(1) << BigInt(width);
  let normalized = value % modulus;
  if (normalized < BigInt(0)) normalized += modulus;

  const count = width / 8;
  const bytes: number[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    bytes.push(Number((normalized >> BigInt(i * 8)) & BigInt(0xff)));
  }
  return endian === 'be' ? bytes : [...bytes].reverse();
}

/** 整串字节反转。 */
export function reverseBytes(bytes: number[]): number[] {
  return [...bytes].reverse();
}

/** 按 16 位半字交换（如 CDAB 风格），末尾不足半字时保留原样。 */
export function swapHalfwords(bytes: number[]): number[] {
  const result = [...bytes];
  for (let i = 0; i + 1 < result.length; i += 2) {
    const first = result[i];
    const second = result[i + 1];
    if (first === undefined || second === undefined) break;
    result[i] = second;
    result[i + 1] = first;
  }
  return result;
}

/** 按位宽把字节序列切分为多个元素，返回完整元素与末尾余量。 */
export function splitElements(
  bytes: number[],
  width: BitWidth,
): { elements: number[][]; remainder: number[] } {
  const size = width / 8;
  const elements: number[][] = [];
  for (let i = 0; i + size <= bytes.length; i += size) {
    elements.push(bytes.slice(i, i + size));
  }
  return { elements, remainder: bytes.slice(elements.length * size) };
}

/** 格式化为无前后导的十六进制大写字符串。 */
export function toHexDigits(value: bigint): string {
  return value.toString(16).toUpperCase();
}

/** 格式化为按位宽补齐的 0x 十六进制字符串。 */
export function toHexLiteral(value: bigint, width: BitWidth): string {
  return `0x${toHexDigits(value).padStart(width / 4, '0')}`;
}

/** 字节序列格式化为两位大写十六进制、空格分隔。 */
export function formatBytes(bytes: number[]): string {
  return bytes.map((byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

/** 十进制定点字符串（BigInt 直接 toString 不丢精度）。 */
export function formatDecimal(value: bigint): string {
  return value.toString(10);
}
