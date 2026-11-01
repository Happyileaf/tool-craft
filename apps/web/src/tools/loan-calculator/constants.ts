/**
 * 贷款 / 月供计算器工具内常量
 */

import type { RepaymentMethod } from './utils/loan';

/**
 * 顶部提示文案
 */
export const HINT =
  '输入贷款本金、年利率与期限，按等额本息或等额本金计算月供、总利息与逐月还款计划。全部计算在浏览器本地完成，不上传任何数据。';

/**
 * 默认贷款本金（元）
 */
export const DEFAULT_PRINCIPAL = 1_000_000;

/**
 * 默认年利率（百分数界面值，3.1 表示 3.1%）
 */
export const DEFAULT_ANNUAL_RATE_PERCENT = 3.1;

/**
 * 默认期限（月）
 */
export const DEFAULT_MONTHS = 360;

/**
 * 还款方式选项
 */
export const METHOD_OPTIONS: { label: string; value: RepaymentMethod }[] = [
  { label: '等额本息', value: 'equal-payment' },
  { label: '等额本金', value: 'equal-principal' },
];

/**
 * 还款方式说明
 */
export const METHOD_DESCRIPTIONS: Record<RepaymentMethod, string> = {
  'equal-payment': '每月还款额固定，前期利息占比高、本金占比低。',
  'equal-principal': '每月偿还本金固定，月供逐月递减，总利息更少。',
};

/**
 * 还款计划表列标题
 */
export const SCHEDULE_COLUMN_TITLES = {
  MONTH: '期次',
  PAYMENT: '月供',
  PRINCIPAL: '本金',
  INTEREST: '利息',
  REMAINING: '剩余本金',
} as const;
