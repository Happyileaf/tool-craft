/**
 * PBKDF2 计算器常量定义
 */
import type { Pbkdf2Hash, SaltEncoding } from './utils/pbkdf2';

/** 底层哈希算法选项 */
export const HASH_OPTIONS: Array<{ label: string; value: Pbkdf2Hash }> = [
  { label: 'SHA-1', value: 'SHA-1' },
  { label: 'SHA-256', value: 'SHA-256' },
  { label: 'SHA-384', value: 'SHA-384' },
  { label: 'SHA-512', value: 'SHA-512' },
];

/** salt 载体编码选项 */
export const SALT_ENCODING_OPTIONS: Array<{
  label: string;
  value: SaltEncoding;
}> = [
  { label: '文本（UTF-8）', value: 'text' },
  { label: 'Hex', value: 'hex' },
];

/** 默认口令 */
export const DEFAULT_PASSWORD = 'password';

/** 默认 salt */
export const DEFAULT_SALT = 'salt';

/** 默认哈希算法 */
export const DEFAULT_HASH: Pbkdf2Hash = 'SHA-256';

/** 默认迭代次数（OWASP 2023 对 PBKDF2-HMAC-SHA-256 的最低建议） */
export const DEFAULT_ITERATIONS = 600000;

/** 默认派生密钥长度（字节） */
export const DEFAULT_DKLEN = 32;

/**
 * RFC 8018 §B.1 测试向量 3：P="password"、S="salt"、c=4096、dkLen=20、SHA-1，
 * 一键载入后可与 RFC 文档中的 DK 逐字节对照
 */
export const RFC_SAMPLE: {
  password: string;
  salt: string;
  hash: Pbkdf2Hash;
  iterations: number;
  dkLen: number;
} = {
  password: 'password',
  salt: 'salt',
  hash: 'SHA-1',
  iterations: 4096,
  dkLen: 20,
};
