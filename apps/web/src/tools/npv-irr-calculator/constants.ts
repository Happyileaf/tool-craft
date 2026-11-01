/**
 * NPV / IRR 投资现金流计算器工具内常量
 */

/**
 * 投资判定结论枚举
 */
export enum NpvDecisionEnum {
  /** 值得投资 */
  INVEST = 'invest',
  /** 不建议投资 */
  REJECT = 'reject',
}

/**
 * 顶部提示文案
 */
export const HINT =
  '按时间顺序输入各期现金流：第 0 期通常为初始投资（负数）且不折现，之后各期为现金流入 / 流出。NPV 为正且 IRR 高于门槛率时项目值得投资；全同号现金流没有 IRR。全部在浏览器本地完成。';

/**
 * 默认现金流：初始投入 1000，未来两期各回收 600
 */
export const DEFAULT_CASH_FLOWS: number[] = [-1000, 600, 600];

/**
 * 默认贴现率（百分数界面值，10 表示 10%）
 */
export const DEFAULT_DISCOUNT_RATE_PERCENT = 10;

/**
 * 默认门槛收益率（百分数界面值，8 表示 8%）
 */
export const DEFAULT_HURDLE_RATE_PERCENT = 8;

/**
 * 新增一期时的默认金额
 */
export const NEW_ROW_CASH_FLOW = 0;

/**
 * 折现明细表列标题
 */
export const DETAIL_COLUMN_TITLES = {
  PERIOD: '期次 t',
  CASH_FLOW: '现金流',
  DISCOUNT_FACTOR: '折现因子',
  PRESENT_VALUE: '折现值',
} as const;

/**
 * 判定结果文案
 */
export const DECISION_TEXT = {
  INVEST: '值得投资',
  REJECT: '不建议投资',
  IRR_NONE: '不存在',
} as const;
