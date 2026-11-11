/**
 * Black-Scholes-Merton 期权定价计算器常量
 */
import type { TimeUnit } from './utils/blackScholes';

/** 示例预设：平值欧式期权（百分数口径，内部再除以 100） */
export interface ExamplePreset {
  /** 标的现价 S */
  S: number;
  /** 行权价 K */
  K: number;
  /** 无风险利率（百分数） */
  rPercent: number;
  /** 年化波动率（百分数） */
  sigmaPercent: number;
  /** 期限数值（按 termUnit 单位） */
  term: number;
  /** 期限单位 */
  termUnit: TimeUnit;
  /** 连续股息率（百分数） */
  qPercent: number;
}

/** 期限单位切换选项 */
export const TERM_UNIT_OPTIONS: { label: string; value: TimeUnit }[] = [
  { label: '年', value: 'year' },
  { label: '月', value: 'month' },
  { label: '日', value: 'day' },
];

/** 示例填充：S=K=100、r=5%、σ=20%、T=1 年、q=0 */
export const EXAMPLE_PRESET: ExamplePreset = {
  S: 100,
  K: 100,
  rPercent: 5,
  sigmaPercent: 20,
  term: 1,
  termUnit: 'year',
  qPercent: 0,
};
