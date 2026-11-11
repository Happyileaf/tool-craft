/** 可选总位宽 */
export const BITS_OPTIONS = [
  { label: '8 位', value: 8 },
  { label: '16 位', value: 16 },
  { label: '32 位', value: 32 },
];

/** 默认位宽与小数位数（Q15） */
export const DEFAULT_BITS = 16;
export const DEFAULT_FRAC_BITS = 15;

/** 默认输入小数 */
export const DEFAULT_DECIMAL_INPUT = '0.5';

/** 舍入模式选项 */
export const ROUNDING_OPTIONS = [
  { label: '四舍五入（最近值）', value: 'nearest' as const },
  { label: '截断（向零取整）', value: 'truncate' as const },
];

/** 运算区默认操作数 */
export const DEFAULT_OP_A = '0.5';
export const DEFAULT_OP_B = '0.25';
