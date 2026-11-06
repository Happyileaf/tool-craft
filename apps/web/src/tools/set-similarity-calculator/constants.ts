/**
 * 集合相似度计算器工具内常量
 */

/** 默认集合文本：首词为集合名，其余为元素 */
export const DEFAULT_SET_TEXTS: string[] = [
  ['tagsA', 'python', 'java', 'go', 'rust', 'sql'].join('\n'),
  ['tagsB', 'java', 'go', 'kotlin', 'sql'].join('\n'),
  ['tagsC', 'rust', 'sql', 'c++', 'zig'].join('\n'),
];

/** 输入框默认行数 */
export const INPUT_ROWS = 7;

/** 最多支持的集合数量 */
export const MAX_SETS = 6;

/** 最少参与计算的集合数量 */
export const MIN_SETS = 2;

/** 系数保留的小数位数 */
export const DECIMAL_DIGITS = 4;
