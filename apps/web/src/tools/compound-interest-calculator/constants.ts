/**
 * 复利与定投收益计算器工具内常量
 */

import type { CompoundFrequency, ContributionTiming } from './utils/compound';

/**
 * 顶部提示文案
 */
export const HINT =
  '输入初始本金、年化收益率与期限，选择复利频率并可设置每期定投（期初 / 期末），实时测算终值、累计投入与收益，并与同等条件单利对比。全部在浏览器本地完成。';

/** 默认初始本金 */
export const DEFAULT_PRINCIPAL = 10_000;

/** 默认年化收益率（百分数界面值，8 表示 8%） */
export const DEFAULT_ANNUAL_RATE_PERCENT = 8;

/** 默认投资年数 */
export const DEFAULT_YEARS = 10;

/** 默认每期定投金额 */
export const DEFAULT_CONTRIBUTION = 0;

/** 复利频率选项 */
export const FREQUENCY_OPTIONS: { label: string; value: CompoundFrequency }[] = [
  { label: '年复利', value: 'yearly' },
  { label: '季复利', value: 'quarterly' },
  { label: '月复利', value: 'monthly' },
  { label: '日复利', value: 'daily' },
];

/** 复利频率对应每期的中文称谓（用于界面提示） */
export const FREQUENCY_PERIOD_LABEL: Record<CompoundFrequency, string> = {
  yearly: '每年',
  quarterly: '每季',
  monthly: '每月',
  daily: '每日',
};

/** 定投时点选项 */
export const TIMING_OPTIONS: { label: string; value: ContributionTiming }[] = [
  { label: '期初投入', value: 'begin' },
  { label: '期末投入', value: 'end' },
];

/** 增长明细表列标题 */
export const SCHEDULE_COLUMN_TITLES = {
  PERIOD: '期次',
  START: '期初余额',
  CONTRIBUTION: '本期定投',
  INTEREST: '本期收益',
  END: '期末余额',
} as const;
