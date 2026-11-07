/**
 * Black-Scholes-Merton 期权定价与 Greeks 纯函数
 *
 * 约定：
 * - 期权类型 call / put；标的现价 S、行权价 K、无风险利率 r、年化波动率 sigma、期限 T（年）、连续股息率 q
 * - 正态分布 CDF 使用 Abramowitz & Stegun 7.1.26 erf 近似（绝对误差 < 1.5e-7）
 * - 到期或零波动等退化情形回退到内在价值，避免 0/0
 * - 隐含波动率采用对模型价格的二分法反解，不依赖外部数值库
 */

export type OptionType = 'call' | 'put';

export interface BsInput {
  spot: number;
  strike: number;
  rate: number;
  volatility: number;
  maturity: number;
  dividend: number;
}

export interface BsResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  d1: number;
  d2: number;
}

/** 标准正态概率密度函数 */
export function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/** 误差函数 erf，Abramowitz & Stegun 7.1.26 */
export function erf(x: number): number {
  if (x === 0) {
    return 0;
  }
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absX);
  const y =
    1 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

/** 标准正态累积分布函数 */
export function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/**
 * 校验输入，返回错误信息数组（空数组表示通过）
 */
export function validateInput(input: BsInput): string[] {
  const errors: string[] = [];
  if (input.spot <= 0) {
    errors.push('标的现价必须为正数');
  }
  if (input.strike <= 0) {
    errors.push('行权价必须为正数');
  }
  if (input.volatility < 0) {
    errors.push('波动率不能为负数');
  }
  if (input.maturity < 0) {
    errors.push('期限不能为负数');
  }
  return errors;
}

function intrinsic(input: BsInput, type: OptionType): BsResult {
  const { spot, strike, rate, maturity, dividend } = input;
  const callPayoff = Math.max(spot * Math.exp(-dividend * maturity) - strike * Math.exp(-rate * maturity), 0);
  const price = type === 'call' ? callPayoff : callPayoff - spot * Math.exp(-dividend * maturity) + strike * Math.exp(-rate * maturity);
  // 退化情形 Greeks：用阶跃近似 delta，其余置 0
  const itm = type === 'call' ? spot > strike : spot < strike;
  return {
    price,
    delta: itm ? (type === 'call' ? 1 : -1) * Math.exp(-dividend * maturity) : 0,
    gamma: 0,
    theta: 0,
    vega: 0,
    rho: 0,
    d1: Number.NaN,
    d2: Number.NaN,
  };
}

/**
 * 计算 Black-Scholes 价格与五项 Greeks
 */
export function priceBlackScholes(input: BsInput, type: OptionType): BsResult | { error: string } {
  const errors = validateInput(input);
  if (errors.length > 0) {
    return { error: errors[0] as string };
  }

  const { spot: S, strike: K, rate: r, volatility: sigma, maturity: T, dividend: q } = input;

  // 到期或零波动：回退内在价值
  if (T === 0 || sigma === 0) {
    return intrinsic(input, type);
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const discountR = Math.exp(-r * T);
  const discountQ = Math.exp(-q * T);
  const pdfD1 = normalPdf(d1);

  let price: number;
  let delta: number;
  let theta: number;
  let rho: number;

  if (type === 'call') {
    price = S * discountQ * normalCdf(d1) - K * discountR * normalCdf(d2);
    delta = discountQ * normalCdf(d1);
    theta =
      (-(S * discountQ * pdfD1 * sigma) / (2 * sqrtT) -
        r * K * discountR * normalCdf(d2) +
        q * S * discountQ * normalCdf(d1)) /
      365;
    rho = (K * T * discountR * normalCdf(d2)) / 100;
  } else {
    price = K * discountR * normalCdf(-d2) - S * discountQ * normalCdf(-d1);
    delta = -discountQ * normalCdf(-d1);
    theta =
      (-(S * discountQ * pdfD1 * sigma) / (2 * sqrtT) +
        r * K * discountR * normalCdf(-d2) -
        q * S * discountQ * normalCdf(-d1)) /
      365;
    rho = (-K * T * discountR * normalCdf(-d2)) / 100;
  }

  const gamma = (discountQ * pdfD1) / (S * sigma * sqrtT);
  // vega 对 1% 波动率变动的敏感度
  const vega = (S * discountQ * pdfD1 * sqrtT) / 100;

  return { price, delta, gamma, theta, vega, rho, d1, d2 };
}

/**
 * 由市场价格反解隐含波动率（年化小数），二分法
 *
 * @returns 隐含波动率；无法收敛或价格违反无套利下界时返回错误
 */
export function impliedVolatility(
  input: Omit<BsInput, 'volatility'>,
  type: OptionType,
  marketPrice: number,
): { impliedVolatility: number } | { error: string } {
  if (marketPrice < 0) {
    return { error: '市场价格不能为负数' };
  }

  const base: BsInput = { ...input, volatility: 0 };
  const floor = priceBlackScholes(base, type);
  if ('error' in floor) {
    return { error: floor.error };
  }
  if (marketPrice < floor.price - 1e-10) {
    return { error: '市场价格低于内在价值下界，无正隐含波动率解' };
  }
  if (Math.abs(marketPrice - floor.price) < 1e-10) {
    return { impliedVolatility: 0 };
  }

  let low = 0;
  let high = 5; // 500% 作为搜索上界
  // 若上界处模型价仍低于市价，继续扩张上界
  let highPrice = priceBlackScholes({ ...base, volatility: high }, type);
  if ('error' in highPrice) {
    return { error: highPrice.error };
  }
  let guard = 0;
  while (highPrice.price < marketPrice && guard < 20) {
    high *= 2;
    highPrice = priceBlackScholes({ ...base, volatility: high }, type);
    if ('error' in highPrice) {
      return { error: highPrice.error };
    }
    guard += 1;
  }
  if (highPrice.price < marketPrice) {
    return { error: '隐含波动率超出可收敛范围（> 极大值）' };
  }

  for (let i = 0; i < 100; i += 1) {
    const mid = (low + high) / 2;
    const midResult = priceBlackScholes({ ...base, volatility: mid }, type);
    if ('error' in midResult) {
      return { error: midResult.error };
    }
    if (Math.abs(midResult.price - marketPrice) < 1e-8) {
      return { impliedVolatility: mid };
    }
    if (midResult.price < marketPrice) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return { impliedVolatility: (low + high) / 2 };
}

/**
 * 数字格式化：保留至多 6 位小数并去除尾随 0
 */
export function formatNum(value: number, digits = 6): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}
