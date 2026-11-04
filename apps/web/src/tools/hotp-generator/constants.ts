import type { HotpAlgorithm, SecretFormat } from './utils/hotp';

/** 哈希算法选项 */
export const ALGORITHM_OPTIONS: { value: HotpAlgorithm; label: string }[] = [
  { value: 'SHA-1', label: 'SHA-1（RFC 4226 默认）' },
  { value: 'SHA-256', label: 'SHA-256' },
  { value: 'SHA-512', label: 'SHA-512' },
];

/** 密钥格式选项 */
export const SECRET_FORMAT_OPTIONS: { value: SecretFormat; label: string }[] = [
  { value: 'base32', label: 'Base32' },
  { value: 'hex', label: 'Hex（0x 可选）' },
  { value: 'text', label: '原始文本（UTF-8）' },
];

/** 位数选项 */
export const DIGITS_OPTIONS = [6, 7, 8].map((value) => ({
  value,
  label: `${value} 位`,
}));
