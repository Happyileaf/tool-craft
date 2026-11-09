import type { InputMode } from './utils/huffman';

export const DEFAULT_INPUT = 'AAAAABBBCCD';

export interface ModeOption {
  value: InputMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'text', label: '文本输入', hint: '自动统计每个字符的出现频次' },
  { value: 'table', label: '频次表', hint: '每行一条「符号,频次」，手动指定权重' },
];

/** 频次表模式的示例，与默认文本的统计结果一致，便于两种模式对照。 */
export const DEFAULT_TABLE = 'A,5\nB,3\nC,2\nD,1';

export const TABLE_PAGE_SIZE = 12;

/** 统计数值保留的小数位数。 */
export const METRIC_PRECISION = 4;

export interface SampleText {
  label: string;
  text: string;
}

export const SAMPLE_TEXTS: SampleText[] = [
  { label: '经典教学向量', text: 'AAAAABBBCCD' },
  { label: '单字符边界', text: 'AAAAAAAA' },
  { label: '中英混排', text: '哈夫曼编码 huffman coding 编码编码' },
  { label: '等权重示例', text: 'ABCD' },
];
