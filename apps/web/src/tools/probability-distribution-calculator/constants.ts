/** 概率分布计算器的静态常量与默认参数 */

export type DistributionId = 'normal' | 'binomial' | 'poisson';

export const DISTRIBUTION_OPTIONS: Array<{
  id: DistributionId;
  name: string;
  nameEn: string;
  discrete: boolean;
}> = [
  { id: 'normal', name: '正态分布', nameEn: 'Normal', discrete: false },
  { id: 'binomial', name: '二项分布', nameEn: 'Binomial', discrete: true },
  { id: 'poisson', name: '泊松分布', nameEn: 'Poisson', discrete: true },
];

export interface DistributionConfig {
  kind: DistributionId;
  /** 正态：均值 μ */
  mean?: number;
  /** 正态：标准差 σ */
  stdDev?: number;
  /** 二项：试验次数 n */
  trials?: number;
  /** 二项：单次成功概率 p */
  prob?: number;
  /** 泊松：发生率 λ */
  lambda?: number;
  /** 求值点 x（连续分布）或 k（离散分布） */
  x: number;
}

export const DEFAULT_DISTRIBUTION: DistributionConfig = {
  kind: 'normal',
  mean: 0,
  stdDev: 1,
  trials: 20,
  prob: 0.5,
  lambda: 4,
  x: 1.96,
};

/** 分位函数二分求解的最大迭代次数 */
export const QUANTILE_MAX_ITER = 80;

/** 分位函数收敛容差（CDF 空间） */
export const QUANTILE_TOLERANCE = 1e-10;

/** 离散分布概率质量表的最大展示点数 */
export const PMF_TABLE_LIMIT = 60;
