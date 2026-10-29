/**
 * HKDF 计算器常量定义
 */
import type { HkdfHash, InputEncoding } from './utils/hkdf';

/** 底层哈希算法选项 */
export const HASH_OPTIONS: Array<{ label: string; value: HkdfHash }> = [
  { label: 'SHA-256', value: 'SHA-256' },
  { label: 'SHA-384', value: 'SHA-384' },
  { label: 'SHA-512', value: 'SHA-512' },
];

/** 输入载体编码选项 */
export const ENCODING_OPTIONS: Array<{ label: string; value: InputEncoding }> = [
  { label: '文本（UTF-8）', value: 'text' },
  { label: 'Hex', value: 'hex' },
  { label: 'Base64', value: 'base64' },
];

/** 默认 IKM（输入密钥材料） */
export const DEFAULT_IKM = 'my-secret-key-material';

/** 默认 salt（空 = 使用 HashLen 个全零字节，RFC 5869 §2.2） */
export const DEFAULT_SALT = '';

/** 默认 info（上下文与应用特定信息） */
export const DEFAULT_INFO = '';

/** 默认哈希算法 */
export const DEFAULT_HASH: HkdfHash = 'SHA-256';

/** 默认 OKM 输出长度（字节） */
export const DEFAULT_OUTPUT_LENGTH = 32;

/**
 * RFC 5869 Test Case 1 官方向量，
 * 一键载入后可与 RFC 文档中的 PRK / OKM 逐字节对照
 */
export const RFC_SAMPLE: {
  ikm: string;
  salt: string;
  info: string;
  hash: HkdfHash;
  outputLength: number;
} = {
  ikm: '0b'.repeat(22),
  salt: '000102030405060708090a0b0c',
  info: 'f0f1f2f3f4f5f6f7f8f9',
  hash: 'SHA-256',
  outputLength: 42,
};
