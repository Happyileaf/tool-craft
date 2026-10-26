export const DEFAULT_NUMBERS = '48, 18';

export const DEFAULT_SINGLE_NUMBER = '360';

export const CLASSIFICATION_META: Record<
  string,
  { label: string; color: string; hint: string }
> = {
  prime: { label: '质数', color: 'green', hint: '大于 1 且只有 1 与自身两个正因数' },
  composite: { label: '合数', color: 'orange', hint: '大于 1 且存在 1 与自身之外的正因数' },
  neutral: { label: '单位数', color: 'default', hint: '1 既不是质数也不是合数' },
  zero: { label: '零', color: 'default', hint: '0 既不是质数也不是合数' },
};
