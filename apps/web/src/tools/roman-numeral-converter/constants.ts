export const DEFAULT_INPUT = '1994';

export const DIRECTION_OPTIONS = [
  { label: '自动识别', value: 'auto' },
  { label: '整数 → 罗马', value: 'toRoman' },
  { label: '罗马 → 整数', value: 'toInteger' },
] as const;

export type RomanDirection = (typeof DIRECTION_OPTIONS)[number]['value'];

export const DEFAULT_BATCH_INPUT = '2024\nMCMXCIV\n42\niv\n3999';
