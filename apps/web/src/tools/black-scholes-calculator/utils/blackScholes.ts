/**
 * Black-Scholes-Merton 欧式期权定价与 Greeks 计算
 *
 * 输入标的现价 S、行权价 K、无风险利率 r、年化波动率 sigma、剩余期限 T（年）
 * 与连续股息率 q，用闭式公式计算欧式看涨/看跌期权理论价格及 Delta、Gamma、
 * Vega、Theta、Rho 希腊字母，并提供买卖平价（put-call parity）校验。
 * 全部基于 Math.exp / Math.log / Math.sqrt 的零依赖纯函数运算，不触碰 DOM。
 */

/** 期限输入单位：年 / 月 / 日 */
export type TimeUnit = 'year' | 'month' | 'day';

/** Black-Scholes-Merton 定价输入（利率、波动率、股息率均为小数，如 0.05） */
export interface BsmInputs {
  /** 标的现价 S（正数） */
  S: number;
  /** 行权价 K（正数） */
  K: number;
  /** 年化无风险利率 r（非负小数，如 0.05） */
  r: number;
  /** 年化波动率 sigma（正数，如 0.2） */
  sigma: number;
  /** 剩余期限 T（正数，单位：年） */
  T: number;
  /** 连续股息率 q（非负小数，默认 0） */
  q?: number;
}

/** 希腊字母（Greeks）集合 */
export interface BsmGreeks {
  /** 看涨期权 Delta：e^(−qT)·N(d1) */
  deltaCall: number;
  /** 看跌期权 Delta：e^(−qT)·(N(d1) − 1) */
  deltaPut: number;
  /** Gamma（看涨/看跌共用）：e^(−qT)·φ(d1) / (S·σ·√T) */
  gamma: number;
  /** Vega 原始值（波动率每变动 1 个单位，即 100%）：S·e^(−qT)·φ(d1)·√T */
  vega: number;
  /** Vega 每 1% 口径：vega / 100 */
  vegaPer1pct: number;
  /** 看涨期权年化 Theta */
  thetaCallAnnual: number;
  /** 看跌期权年化 Theta */
  thetaPutAnnual: number;
  /** 看涨期权日历日 Theta（年化 / 365） */
  thetaCallDaily: number;
  /** 看跌期权日历日 Theta（年化 / 365） */
  thetaPutDaily: number;
  /** 看涨期权 Rho（利率每变动 1% 口径）：K·T·e^(−rT)·N(d2) / 100 */
  rhoCall: number;
  /** 看跌期权 Rho（利率每变动 1% 口径）：−K·T·e^(−rT)·N(−d2) / 100 */
  rhoPut: number;
}

/** Black-Scholes-Merton 定价结果 */
export interface BsmResult {
  /** 欧式看涨期权理论价格 */
  call: number;
  /** 欧式看跌期权理论价格 */
  put: number;
  /** d1 = (ln(S/K) + (r − q + σ²/2)·T) / (σ·√T) */
  d1: number;
  /** d2 = d1 − σ·√T */
  d2: number;
  /** Greeks 集合 */
  greeks: BsmGreeks;
  /** 买卖平价残差 C − P − (S·e^(−qT) − K·e^(−rT)) */
  parityResidual: number;
}

/** Abramowitz & Stegun 7.1.26 erf 近似五次多项式系数 */
const P = [
  0.254829592,
  -0.284496736,
  1.421413741,
  -1.453152027,
  1.061405429,
] as const;

/** erf 近似中的常数 p=0.3275911 */
const ERF_P = 0.3275911;

/** 1 / √2，用于标准正态 CDF 与 erf 的参数换算 */
const INV_SQRT2 = 1 / Math.SQRT2;

/**
 * 标准正态概率密度函数 φ(x)
 *
 * @param x - 自变量
 * @returns φ(x) = (1 / √(2π))·e^(−x²/2)
 */
export function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * 标准正态累积分布函数 N(x)
 *
 * 基于 erf 的 Abramowitz & Stegun 7.1.26 多项式近似：
 * t = 1 / (1 + 0.3275911·|x/√2|)，erf 用五次多项式逼近，
 * 再由 N(x) = 0.5·(1 + erf(x/√2)) 换算；x < 0 时按 N(−x) = 1 − N(x) 对称处理。
 *
 * @param x - 自变量
 * @returns N(x)，取值范围 (0, 1)
 */
export function normalCdf(x: number): number {
  if (x === 0) {
    return 0.5;
  }
  const z = Math.abs(x) * INV_SQRT2;
  const t = 1 / (1 + ERF_P * z);
  // erf(z) ≈ 1 − (P1·t + P2·t² + … + P5·t⁵)·e^(−z²)
  const polynomial =
    ((((P[4] * t + P[3]) * t + P[2]) * t + P[1]) * t + P[0]) * t;
  const erf = 1 - polynomial * Math.exp(-z * z);
  const cdf = 0.5 * (1 + erf);
  return x < 0 ? 1 - cdf : cdf;
}

/**
 * 把按年 / 月 / 日输入的期限换算为年
 *
 * @param value - 期限数值（正数）
 * @param unit - 期限单位：year 原值、month 除以 12、day 除以 365
 * @returns 以年为单位的期限
 */
export function toYears(value: number, unit: TimeUnit): number {
  if (unit === 'month') {
    return value / 12;
  }
  if (unit === 'day') {
    return value / 365;
  }
  return value;
}

/**
 * 校验 Black-Scholes-Merton 输入合法性
 *
 * @param inputs - 定价输入
 * @returns 补齐默认股息率后的输入
 * @throws 当 S / K / sigma / T 任一不大于 0，或 r / q 为负、数值非有限时抛出含字段名的中文错误
 */
export function validateInputs(inputs: BsmInputs): Required<BsmInputs> {
  const { S, K, r, sigma, T } = inputs;
  const q = inputs.q ?? 0;
  if (!Number.isFinite(S) || S <= 0) {
    throw new Error(`标的现价 S 必须为正数，实际为 ${S}`);
  }
  if (!Number.isFinite(K) || K <= 0) {
    throw new Error(`行权价 K 必须为正数，实际为 ${K}`);
  }
  if (!Number.isFinite(r) || r < 0) {
    throw new Error(`无风险利率 r 不能为负数，实际为 ${r}`);
  }
  if (!Number.isFinite(sigma) || sigma <= 0) {
    throw new Error(`波动率 sigma 必须为正数，实际为 ${sigma}`);
  }
  if (!Number.isFinite(T) || T <= 0) {
    throw new Error(`剩余期限 T 必须为正数，实际为 ${T}`);
  }
  if (!Number.isFinite(q) || q < 0) {
    throw new Error(`股息率 q 不能为负数，实际为 ${q}`);
  }
  return { S, K, r, sigma, T, q };
}

/**
 * 计算买卖平价（put-call parity）残差
 *
 * 平价关系：C − P = S·e^(−qT) − K·e^(−rT)，残差为等式左右之差。
 *
 * @param call - 看涨期权价格
 * @param put - 看跌期权价格
 * @param inputs - 定价输入
 * @returns 平价残差（理论上绝对值接近 0）
 */
export function putCallParityResidual(
  call: number,
  put: number,
  inputs: BsmInputs,
): number {
  const { S, K, r, T } = validateInputs(inputs);
  const q = inputs.q ?? 0;
  return call - put - (S * Math.exp(-q * T) - K * Math.exp(-r * T));
}

/**
 * Black-Scholes-Merton 欧式期权定价与 Greeks
 *
 * @param inputs - 定价输入（r、sigma、q 为小数口径，T 以年计）
 * @returns 看涨/看跌价格、d1/d2、Greeks 与买卖平价残差
 * @throws 输入不合法时抛出含字段名的中文错误
 */
export function blackScholes(inputs: BsmInputs): BsmResult {
  const { S, K, r, sigma, T, q } = validateInputs(inputs);

  const sqrtT = Math.sqrt(T);
  const d1 =
    (Math.log(S / K) + (r - q + (sigma * sigma) / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const discountR = Math.exp(-r * T);
  const discountQ = Math.exp(-q * T);
  const nD1 = normalCdf(d1);
  const nD2 = normalCdf(d2);
  const nMinusD1 = normalCdf(-d1);
  const nMinusD2 = normalCdf(-d2);
  const pdfD1 = normalPdf(d1);

  const call = S * discountQ * nD1 - K * discountR * nD2;
  const put = K * discountR * nMinusD2 - S * discountQ * nMinusD1;

  const deltaCall = discountQ * nD1;
  const deltaPut = discountQ * (nD1 - 1);
  const gamma = (discountQ * pdfD1) / (S * sigma * sqrtT);
  const vega = S * discountQ * pdfD1 * sqrtT;
  const vegaPer1pct = vega / 100;

  const thetaCallAnnual =
    (-(S * discountQ * pdfD1 * sigma) / (2 * sqrtT)) -
    r * K * discountR * nD2 +
    q * S * discountQ * nD1;
  const thetaPutAnnual =
    (-(S * discountQ * pdfD1 * sigma) / (2 * sqrtT)) +
    r * K * discountR * nMinusD2 -
    q * S * discountQ * nMinusD1;

  const rhoCall = (K * T * discountR * nD2) / 100;
  const rhoPut = (-K * T * discountR * nMinusD2) / 100;

  const parityResidual = putCallParityResidual(call, put, {
    S,
    K,
    r,
    sigma,
    T,
    q,
  });

  return {
    call,
    put,
    d1,
    d2,
    greeks: {
      deltaCall,
      deltaPut,
      gamma,
      vega,
      vegaPer1pct,
      thetaCallAnnual,
      thetaPutAnnual,
      thetaCallDaily: thetaCallAnnual / 365,
      thetaPutDaily: thetaPutAnnual / 365,
      rhoCall,
      rhoPut,
    },
    parityResidual,
  };
}
