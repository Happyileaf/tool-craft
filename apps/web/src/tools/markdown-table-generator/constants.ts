import type { ColumnAlign, DelimiterKind } from './utils/markdown-table';

/** 默认示例：模拟从 Excel 复制的 TSV 数据 */
export const DEFAULT_SAMPLE = `名称\t分类\t评分
JSON 格式化器\t开发\t4.8
图片压缩器\t媒体\t4.6
正则测试器\t开发\t4.9`;

/** 默认输入分隔格式 */
export const DEFAULT_DELIMITER: DelimiterKind = 'auto';

/** 默认各列对齐 */
export const DEFAULT_ALIGN: ColumnAlign[] = ['left', 'left', 'left'];

/** 分隔格式选项 */
export const DELIMITER_OPTIONS: { label: string; value: DelimiterKind }[] = [
  { label: '自动识别（CSV / TSV / Excel）', value: 'auto' },
  { label: '逗号分隔 CSV（,）', value: 'csv' },
  { label: '制表符 TSV（Excel 粘贴）', value: 'tsv' },
];

/** 对齐方式选项 */
export const ALIGN_OPTIONS: { label: string; value: ColumnAlign }[] = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' },
];

/** 对齐方式中文标签 */
export const ALIGN_LABEL: Record<ColumnAlign, string> = {
  left: '左对齐',
  center: '居中',
  right: '右对齐',
};
