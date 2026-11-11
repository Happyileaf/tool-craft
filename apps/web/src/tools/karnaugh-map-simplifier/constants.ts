/**
 * 卡诺图化简器常量
 */

/** 可选变量数 */
export const VAR_COUNTS = [2, 3, 4] as const;

/**
 * 格雷码顺序（反射二进制码），长度 4 覆盖 2–4 变量的行列索引
 * 相邻两项（含首尾环绕）恰好相差 1 个二进制位
 */
export const GRAY_ORDER = [0, 1, 3, 2] as const;

/** 单元格循环点击的取值顺序：0 → 1 → X → 0 */
export const CELL_CYCLE = [0, 1, 'x'] as const;

/** 乘积项高亮分组的 CSS module 类名与说明色，最多 6 组 */
export const GROUP_STYLES = [
  { className: 'group0', label: '分组 1' },
  { className: 'group1', label: '分组 2' },
  { className: 'group2', label: '分组 3' },
  { className: 'group3', label: '分组 4' },
  { className: 'group4', label: '分组 5' },
  { className: 'group5', label: '分组 6' },
] as const;

/** Σm 输入框的示例与占位提示 */
export const MINTERM_PLACEHOLDER = '如 Σm(1,3,5,7)+d(4,6)';

/** 预设示例，点击后填充 Σm 输入框 */
export const EXAMPLE_INPUTS: string[] = [
  'Σm(2,3,4,5,6,7)',
  "Σm(1,3)+d(0,2,4,6)",
  'Σm(0,1,2,5,8,10,15)+d(6)',
];
