/**
 * Base-N 任意进制互转器常量
 */

/** 常用快捷进制 */
export const QUICK_RADIXES: ReadonlyArray<{ label: string; value: number }> = Object.freeze([
  { label: '2 进制', value: 2 },
  { label: '8 进制', value: 8 },
  { label: '10 进制', value: 10 },
  { label: '16 进制', value: 16 },
  { label: '32 进制', value: 32 },
  { label: '36 进制', value: 36 },
]);

/** 内置字母表预设 */
export const ALPHABET_PRESETS: ReadonlyArray<{ label: string; value: string }> = Object.freeze([
  { label: '标准 0-9a-z（radix 2–36）', value: '0123456789abcdefghijklmnopqrstuvwxyz' },
  { label: 'Crockford Base32（防混淆）', value: '0123456789abcdefghjkmnpqrstvwxyz' },
]);

/** 示例输入 */
export const RADIX_PRESETS: ReadonlyArray<{ label: string; input: string; fromRadix: number }> =
  Object.freeze([
    { label: '255（十进制）', input: '255', fromRadix: 10 },
    { label: '0xFF（十六进制前缀）', input: '0xFF', fromRadix: 10 },
    { label: '2^64−1 大整数', input: '18446744073709551615', fromRadix: 10 },
    { label: '带下划线的二进制', input: '1111_0000_1010', fromRadix: 2 },
  ]);
