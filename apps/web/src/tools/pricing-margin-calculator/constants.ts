/**
 * 定价计算器的静态配置。
 */

/** 毛利率 / 加价率互转对照表使用的常见毛利率档位（小数） */
export const REFERENCE_MARGINS = [0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6];

/** 折扣保本分析的默认折扣率档位（小数，0.2 表示让利 20%，即打 8 折） */
export const DEFAULT_DISCOUNT_RATES = [0, 0.1, 0.2, 0.3, 0.4, 0.5];

/** 批量模式的示例输入（每行：成本,毛利率百分比） */
export const DEFAULT_BATCH_INPUT = `80,20
50,40
120,30
36,50`;

/** 单笔核算的成本快捷输入 */
export const COST_PRESETS = [50, 80, 100, 200];
