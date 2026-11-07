/**
 * 定价计算器的固定选项与默认值，不含任何动态状态
 */

/** 单工具求解模式 */
export enum PricingMode {
  /** 已知成本与售价，推导毛利额、毛利率与加价率 */
  INSPECT = 'inspect',
  /** 已知成本与目标毛利率/加价率，求售价 */
  PRICE_FROM_COST = 'price-from-cost',
  /** 已知售价与目标毛利率/加价率，反推成本 */
  COST_FROM_PRICE = 'cost-from-price',
}

/** 比率口径：毛利率（分母售价）或加价率（分母成本） */
export enum RateBasis {
  MARGIN = 'margin',
  MARKUP = 'markup',
}

export const PRICING_MODE_OPTIONS: { label: string; value: PricingMode }[] = [
  { label: '成本 + 售价 → 利润率', value: PricingMode.INSPECT },
  { label: '成本 + 目标利润率 → 售价', value: PricingMode.PRICE_FROM_COST },
  { label: '售价 + 目标利润率 → 成本', value: PricingMode.COST_FROM_PRICE },
];

export const RATE_BASIS_OPTIONS: { label: string; value: RateBasis }[] = [
  { label: '毛利率（÷售价）', value: RateBasis.MARGIN },
  { label: '加价率（÷成本）', value: RateBasis.MARKUP },
];

export const DEFAULT_BATCH_INPUT = '80,20%\n120,25%\n200,30%';

export const DEFAULT_BATCH_MARGIN = 0.2;

export const DEFAULT_DISCOUNT_INPUT = '0.9\n0.8\n0.7';
