import type { CompoundingPeriod } from './utils/rate';

/** 默认名义年利率百分数 */
export const DEFAULT_APR = 12;

/** 默认复利频次 */
export const DEFAULT_PERIOD: CompoundingPeriod = 'monthly';

/** 默认贷款本金与手续费 */
export const DEFAULT_PRINCIPAL = 10000;
export const DEFAULT_FEE = 200;

/** 对比方案数量上限 */
export const MAX_PLANS = 3;
