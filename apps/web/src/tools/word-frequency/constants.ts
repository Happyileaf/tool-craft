import type { TokenizeMode, SortOrder } from './utils/frequency';

/** 默认文本样例 */
export const DEFAULT_TEXT = [
  'The quick brown fox jumps over the lazy dog.',
  'The dog barks, and the fox runs quickly through the woods.',
  'Quick thinking and fast running save the fox again.',
].join('\n');

/** 分词模式选项 */
export const MODE_OPTIONS: { label: string; value: TokenizeMode }[] = [
  { label: '拉丁/英文按词', value: 'latin' },
  { label: '中文按单字', value: 'cjk-chars' },
  { label: '中文按二元词', value: 'cjk-bigrams' },
];

/** 排序选项 */
export const SORT_OPTIONS: { label: string; value: SortOrder }[] = [
  { label: '次数从高到低', value: 'count-desc' },
  { label: '次数从低到高', value: 'count-asc' },
  { label: '字母序', value: 'alpha' },
];

/** 默认 Top N（0 = 全部） */
export const DEFAULT_TOP_N = 50;
