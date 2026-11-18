/** Erlang B 计算器的固定文案与默认值 */

export const DEFAULT_TRAFFIC = 10;
export const DEFAULT_CHANNELS = 10;
export const DEFAULT_GOS = 0.01;

/** 灵敏度对照表的服务等级档位 */
export const GOS_LEVELS = [0.001, 0.01, 0.05] as const;

/** 二分查找精度与上限 */
export const BISECTION_TOLERANCE = 1e-9;
export const BISECTION_MAX_ITERATIONS = 200;

/** 话务量反算上限（Erlang），覆盖常见工程区间 */
export const MAX_TRAFFIC = 1_000_000;
