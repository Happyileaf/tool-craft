/**
 * RSA 非对称密钥对生成器与加解密工具内常量
 */

/** 支持的 RSA 算法：RSA-OAEP 用于加解密，RSA-PSS 用于签名验签 */
export const RSA_ALGORITHMS = ['RSA-OAEP', 'RSA-PSS'] as const;

/** RSA 算法类型 */
export type RsaAlgorithm = (typeof RSA_ALGORITHMS)[number];

/** 固定哈希算法 */
export const RSA_HASH = 'SHA-256' as const;

/** SHA-256 摘要长度（字节），用于计算 OAEP 最大明文长度 */
export const SHA256_HASH_BYTES = 32;

/** 固定公钥指数 65537（RSA 公钥标准取值） */
export const RSA_PUBLIC_EXPONENT = new Uint8Array([1, 0, 1]);

/** 可选模长（位） */
export const MODULUS_LENGTH_OPTIONS: number[] = [2048, 3072, 4096];

/** 默认模长（位），2048 兼顾安全与生成速度 */
export const DEFAULT_MODULUS_LENGTH = 2048;

/** 默认算法 */
export const DEFAULT_ALGORITHM: RsaAlgorithm = 'RSA-OAEP';

/** PSS 签名盐值长度（字节），固定 32 与 SHA-256 等长 */
export const PSS_SALT_LENGTH = 32;

/** PEM 每行 Base64 字符数（RFC 7468 规定 64 列折行） */
export const PEM_LINE_LENGTH = 64;

/** SPKI 公钥 PEM 头尾标识 */
export const PUBLIC_KEY_PEM_LABEL = 'PUBLIC KEY';

/** PKCS8 私钥 PEM 头尾标识 */
export const PRIVATE_KEY_PEM_LABEL = 'PRIVATE KEY';

/** 算法选择项数据源 */
export const ALGORITHM_OPTIONS: { label: string; value: RsaAlgorithm }[] = [
  { label: 'RSA-OAEP（公钥加密 / 私钥解密）', value: 'RSA-OAEP' },
  { label: 'RSA-PSS（私钥签名 / 公钥验签）', value: 'RSA-PSS' },
];

/** 工作台示例短文本（含中英文） */
export const SAMPLE_TEXT = 'Hello, RSA 你好';
