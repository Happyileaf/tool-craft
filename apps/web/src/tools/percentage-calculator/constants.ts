/**
 * 百分比计算器工具内常量
 */

/** 百分比运算模式 */
export enum PercentageModeEnum {
  /** X 的 Y% 是多少 */
  PERCENT_OF = 'percentOf',
  /** X 是 Y 的百分之几 */
  RATIO = 'ratio',
  /** X 较 Y 变化百分之几 */
  CHANGE = 'change',
}

/** 运算模式中文标签 */
export const PERCENTAGE_MODE_LABELS: Record<PercentageModeEnum, string> = {
  [PercentageModeEnum.PERCENT_OF]: 'X 的 Y% 是多少',
  [PercentageModeEnum.RATIO]: 'X 是 Y 的百分之几',
  [PercentageModeEnum.CHANGE]: 'X 较 Y 变化百分之几',
};

/** 模式一默认 X（基数） */
export const DEFAULT_BASE = '200';

/** 模式一默认 Y（百分比） */
export const DEFAULT_PERCENT = '25';

/** 模式二、三默认 X */
export const DEFAULT_X = '50';

/** 模式二、三默认 Y */
export const DEFAULT_Y = '200';

/** 变化模式默认的变化前值 */
export const DEFAULT_FROM = '120';

/** 变化模式默认的变化后值 */
export const DEFAULT_TO = '150';
