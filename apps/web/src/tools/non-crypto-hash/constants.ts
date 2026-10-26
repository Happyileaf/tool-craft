/**
 * 非加密哈希工具内常量
 */

/** 默认示例文本 */
export const DEFAULT_TEXT = 'The quick brown fox jumps over the lazy dog';

/** MurmurHash3 常用种子选项 */
export const SEED_OPTIONS: { label: string; value: number }[] = [
  { label: '0（默认）', value: 0 },
  { label: '1', value: 1 },
  { label: '42', value: 42 },
  { label: '0x9747b28c', value: 0x9747b28c },
];
