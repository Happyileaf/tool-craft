/** 文本行号工具的内置常量与样例 */

export const DEFAULT_SAMPLE_TEXT = `第一行内容
第二行内容

第四行保持为空行
第五行是结尾`;

export const SEPARATOR_OPTIONS = [
  { label: '冒号 + 空格 ": "', value: ': ' },
  { label: '句点 + 空格 ". "', value: '. ' },
  { label: '右括号 + 空格 ") "', value: ') ' },
  { label: '竖线 " | "', value: ' | ' },
  { label: '制表符 Tab', value: '\t' },
  { label: '单个空格', value: ' ' },
];

export const MIN_START = 0;
export const MAX_START = 999999;
export const MIN_STEP = 1;
export const MAX_STEP = 9999;
export const MAX_PAD_WIDTH = 12;
