/**
 * CSS 选择器权重计算器工具内常量
 */

/** 单冒号写法的旧式伪元素，权重按类型（c 列）计 */
export const LEGACY_PSEUDO_ELEMENTS: readonly string[] = [
  'before',
  'after',
  'first-line',
  'first-letter',
];

/** 参数权重取参数列表中最高权重的函数型伪类：:is() / :not() / :has() */
export const MAX_ARG_PSEUDO_CLASSES: readonly string[] = ['is', 'not', 'has'];

/** 支持 `of S` 过滤语法、过滤选择器权重叠加的伪类 */
export const NTH_OF_PSEUDO_CLASSES: readonly string[] = ['nth-child', 'nth-last-child'];

/** 权重三元组的列中文标签（a / b / c） */
export const SPECIFICITY_COLUMN_LABELS = {
  a: 'ID',
  b: '类 / 属性 / 伪类',
  c: '类型 / 伪元素',
} as const;

/** 默认对比输入：每行一个选择器 */
export const DEFAULT_SELECTORS = ['.button', '#submit.button', '#form #submit.button:hover'].join(
  '\n',
);
