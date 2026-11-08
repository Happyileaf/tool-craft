/**
 * Base-N 任意进制整数互转纯函数（基于 BigInt，超出 2^53 不丢精度）
 */

/** radix 2–36 使用的标准字母表 */
export const DEFAULT_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/** Crockford Base32 字母表（排除 I/L/O/U，易混淆字符归一） */
export const CROCKFORD_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

/** 输入归一化时识别的进制前缀 */
const RADIX_PREFIX: ReadonlyArray<{ prefix: string; radix: number }> = [
  { prefix: '0x', radix: 16 },
  { prefix: '0o', radix: 8 },
  { prefix: '0b', radix: 2 },
];

/**
 * 校验自定义字母表：长度须 ≥2 且字符唯一
 *
 * @param alphabet - 自定义字母表
 * @returns 校验通过返回 true
 */
export function validateAlphabet(alphabet: string): boolean {
  if (alphabet.length < 2) {
    return false;
  }
  return new Set(alphabet).size === alphabet.length;
}

/**
 * 解析输入文本：识别 0x/0o/0b 前缀、下划线分隔与负号，归一为小写
 *
 * @param raw - 原始输入
 * @param fallbackRadix - 无前缀时使用的进制
 * @returns 负号、实际进制与清洗后的数字串
 */
export function normalizeInput(
  raw: string,
  fallbackRadix: number,
): { negative: boolean; radix: number; digits: string } {
  let text = raw.trim().toLowerCase();
  let negative = false;
  if (text.startsWith('-')) {
    negative = true;
    text = text.slice(1);
  } else if (text.startsWith('+')) {
    text = text.slice(1);
  }
  let radix = fallbackRadix;
  const hit = RADIX_PREFIX.find((item) => text.startsWith(item.prefix));
  if (hit) {
    radix = hit.radix;
    text = text.slice(hit.prefix.length);
  }
  const digits = text.replace(/_/g, '');
  return { negative, radix, digits };
}

/**
 * 将任意进制数字串解析为 BigInt
 *
 * @param value - 已清洗的数字串（不含符号 / 前缀 / 下划线）
 * @param radix - 源进制（2–36 或与自定义字母表等长）
 * @param alphabet - 字母表，默认 0-9a-z
 * @returns 对应的 BigInt（非负）
 */
export function parseBigInt(value: string, radix: number, alphabet: string = DEFAULT_ALPHABET): bigint {
  if (!validateAlphabet(alphabet)) {
    throw new Error('字母表非法：长度须 ≥2 且字符唯一');
  }
  if (radix < 2 || radix > alphabet.length) {
    throw new Error(`进制 ${radix} 超出字母表范围（2–${alphabet.length}）`);
  }
  if (value === '') {
    throw new Error('输入为空');
  }
  const base = BigInt(radix);
  let result = BigInt(0);
  for (const char of value) {
    const index = alphabet.indexOf(char);
    if (index < 0 || index >= radix) {
      throw new Error(`字符 "${char}" 不是合法的 ${radix} 进制数字`);
    }
    result = result * base + BigInt(index);
  }
  return result;
}

/**
 * 将 BigInt 编码为任意进制字符串
 *
 * @param value - 非负 BigInt
 * @param radix - 目标进制
 * @param alphabet - 字母表，默认 0-9a-z
 * @returns 进制表示字符串
 */
export function formatBigInt(value: bigint, radix: number, alphabet: string = DEFAULT_ALPHABET): string {
  if (!validateAlphabet(alphabet)) {
    throw new Error('字母表非法：长度须 ≥2 且字符唯一');
  }
  if (radix < 2 || radix > alphabet.length) {
    throw new Error(`进制 ${radix} 超出字母表范围（2–${alphabet.length}）`);
  }
  if (value < BigInt(0)) {
    return `-${formatBigInt(-value, radix, alphabet)}`;
  }
  if (value === BigInt(0)) {
    return alphabet[0]!;
  }
  const base = BigInt(radix);
  let current = value;
  let output = '';
  while (current > BigInt(0)) {
    const remainder = Number(current % base);
    output = alphabet[remainder]! + output;
    current /= base;
  }
  return output;
}

/** 一次转换的完整入参 */
export interface RadixConvertInput {
  /** 原始输入文本 */
  input: string;
  /** 源进制（无前缀时生效） */
  fromRadix: number;
  /** 目标进制 */
  toRadix: number;
  /** 源字母表，默认标准 0-9a-z */
  fromAlphabet?: string;
  /** 目标字母表，默认标准 0-9a-z */
  toAlphabet?: string;
}

/** 转换结果 */
export interface RadixConvertResult {
  /** 目标进制字符串 */
  output: string;
  /** 解析得到的 BigInt 十进制值（带符号） */
  decimalValue: bigint;
  /** 实际采用的源进制（前缀可能覆盖） */
  effectiveRadix: number;
  /** 是否为负数 */
  negative: boolean;
}

/**
 * 任意进制整数互转主入口
 *
 * @param params - 转换入参
 * @returns 目标进制表示与中间十进制值
 */
export function convertRadix(params: RadixConvertInput): RadixConvertResult {
  const { input, fromRadix, toRadix, fromAlphabet = DEFAULT_ALPHABET, toAlphabet = DEFAULT_ALPHABET } = params;
  if (fromRadix < 2 || toRadix < 2) {
    throw new Error('进制必须不小于 2');
  }
  if (fromRadix > fromAlphabet.length || toRadix > toAlphabet.length) {
    throw new Error('进制不能超过对应字母表长度');
  }
  const { negative, radix: effectiveRadix, digits } = normalizeInput(input, fromRadix);
  if (effectiveRadix > fromAlphabet.length) {
    throw new Error(`前缀声明的进制 ${effectiveRadix} 超出源字母表范围`);
  }
  const magnitude = parseBigInt(digits, effectiveRadix, fromAlphabet);
  const signed = negative ? -magnitude : magnitude;
  const output = formatBigInt(signed, toRadix, toAlphabet);
  return {
    output,
    decimalValue: signed,
    effectiveRadix,
    negative,
  };
}

/**
 * 一次生成二 / 八 / 十 / 十六进制一览
 *
 * @param input - 原始输入
 * @param fromRadix - 源进制
 * @param alphabet - 源字母表
 * @returns 四种常用进制表示
 */
export function convertToCommonBases(
  input: string,
  fromRadix: number,
  alphabet: string = DEFAULT_ALPHABET,
): Array<{ radix: number; label: string; value: string }> {
  const { negative, radix: effectiveRadix, digits } = normalizeInput(input, fromRadix);
  const magnitude = parseBigInt(digits, effectiveRadix, alphabet);
  const signed = negative ? -magnitude : magnitude;
  return [
    { radix: 2, label: '二进制 (BIN)', value: formatBigInt(signed, 2) },
    { radix: 8, label: '八进制 (OCT)', value: formatBigInt(signed, 8) },
    { radix: 10, label: '十进制 (DEC)', value: formatBigInt(signed, 10) },
    { radix: 16, label: '十六进制 (HEX)', value: formatBigInt(signed, 16) },
  ];
}

/**
 * 按固定位宽分组（用于二进制 / 十六进制位视图），从右向左每 groupSize 位插入空格
 *
 * @param value - 数字串
 * @param groupSize - 分组位宽
 * @returns 分组后的字符串
 */
export function groupDigits(value: string, groupSize: number): string {
  const negative = value.startsWith('-');
  const body = negative ? value.slice(1) : value;
  const grouped = body.replace(new RegExp(`\\B(?=(\\d{${groupSize}})+(?!\\d))`, 'g'), ' ');
  return negative ? `-${grouped}` : grouped;
}
