/** ACME dns-01 挑战生成器的常量与示例（RFC 8555） */

export const DEFAULT_DOMAIN = 'example.com';

export const DEFAULT_TOKEN = 'KQqLsiS5j0CONR_eUXTUSUDNVaHODtc-0p646g';

export const DEFAULT_THUMBPRINT = 'evaGxfADs6pSRb2LAv9IZf17Dt4Ke5Pl2T-t6bPEJqA';

/** 与上面输入对应的完整 key authorization，校验模式示例 */
export const DEFAULT_KEY_AUTHORIZATION = `${DEFAULT_TOKEN}.${DEFAULT_THUMBPRINT}`;

/** DNS 记录建议 TTL（秒），ACME 验证场景推荐 300 以内 */
export const SUGGESTED_TTL = 300;

export const MODE_OPTIONS = [
  { value: 'generate', label: '生成挑战记录' },
  { value: 'verify', label: '校验已有 key authorization' },
];

export const INPUT_MODE_OPTIONS = [
  { value: 'manual', label: '手动填写 token / thumbprint' },
  { value: 'keypair', label: '生成 P-256 密钥对并计算 thumbprint' },
];
