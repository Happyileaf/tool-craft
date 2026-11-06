/**
 * 骰子投掷与概率分布工具内常量
 */

/** 默认表达式 */
export const DEFAULT_EXPRESSION = '3d6+2';

/** 表达式示例 chips */
export const EXPRESSION_EXAMPLES: string[] = ['d20', '3d6+2', '2d20kh1', '4d6dl1', '2d6+1d4', 'd100'];

/** 输入框行数 */
export const INPUT_ROWS = 2;

/** 直方图最大柱条数，超出时等距抽样展示（分布表仍完整） */
export const MAX_HISTOGRAM_BARS = 40;

/** 概率保留小数位数 */
export const PROBABILITY_DIGITS = 4;
