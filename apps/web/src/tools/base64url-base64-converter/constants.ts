import type { Base64Variant } from './utils/base64url';

export interface VariantOption {
  value: Base64Variant;
  label: string;
  hint: string;
}

/** 目标变体选项 */
export const TARGET_OPTIONS: VariantOption[] = [
  {
    value: 'standard',
    label: '标准 Base64（RFC 4648 §4）',
    hint: '字母表含 + /，以 = 填充到 4 的倍数',
  },
  {
    value: 'base64url',
    label: 'Base64URL（RFC 4648 §5）',
    hint: '以 - _ 替换 + /，省略填充，可安全用于 URL 与 JWT',
  },
];

export const DEFAULT_INPUT = 'eyJzdWIiOiIxMjM0NTY3ODkwIn0\nZg==\nZm9vYg';

export const DEFAULT_TARGET: Base64Variant = 'standard';
