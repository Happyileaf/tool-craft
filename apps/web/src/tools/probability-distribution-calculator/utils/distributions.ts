import { QUANTILE_MAX_ITER, QUANTILE_TOLERANCE } from '../constants';

/** 数值计算中把超出浮点分辨能力的结果钳制到 [0, 1] */
function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return Number.NaN;
  }
  return Math.min(1, Math.max(0, value));
}

/** 对数阶乘缓存，避免大 n 时重复求和 */
const logFactorialCache: number[] = [0];

function logFactorial(n: number): number {
  if (n < logFactorialCache.length) {
    return logFactorialCache[n] ?? 0;
  }
  let value = logFactorialCache[logFactorialCache.length - 1] ?? 0;
  for (let k = logFactorialCache.length; k <= n; k += 1) {
    value += Math.log(k);
    logFactorialCache[k] = value;
  }
  return value;
}

function logBinomial(n: number, k: number): number {
  if (k < 0 || k > n) {
    return Number.NEGATIVE_INFINITY;
  }
  return logFactorial(n) - logFactorial(k) - logFactorial(n - k);
}

/* ------------------------------------------------------------------ */
/* 正态分布（连续）                                                      */
/* ------------------------------------------------------------------ */

const SQRT_2PI = Math.sqrt(2 * Math.PI);

/** 标准正态概率密度 φ(z) */
function standardNormalPdf(z: number): number {
  return Math.exp(-0.5 * z * z) / SQRT_2PI;
}

/**
 * 标准正态累积分布 Φ(z)，使用 Abramowitz & Stegun 7.1.26 有理逼近，
 * 绝对误差小于 7.5e-8。
 */
function standardNormalCdf(z: number): number {
  if (z < -8) {
    return 0;
  }
  if (z > 8) {
    return 1;
  }
  const absZ = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * absZ);
  const d = 0.3989422804014327; // 1 / sqrt(2π)
  const poly =
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  // 正半轴：1 - φ(z)·poly(t)；负半轴利用 Φ(-z) = 1 - Φ(z)
  const positiveCdf = 1 - d * Math.exp(-0.5 * absZ * absZ) * poly;
  return clamp01(z >= 0 ? positiveCdf : 1 - positiveCdf);
}

/** 正态分布概率密度函数 PDF */
export function normalPdf(x: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) {
    throw new Error('正态分布的标准差必须大于 0');
  }
  const z = (x - mean) / stdDev;
  return standardNormalPdf(z) / stdDev;
}

/** 正态分布累积分布函数 CDF */
export function normalCdf(x: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) {
    throw new Error('正态分布的标准差必须大于 0');
  }
  return standardNormalCdf((x - mean) / stdDev);
}

/**
 * 正态分布分位函数（逆 CDF）：用二分法在 [μ - 40σ, μ + 40σ] 上求解。
 *
 * @param p - 目标累积概率，需在 (0, 1) 内
 */
export function normalQuantile(p: number, mean: number, stdDev: number): number {
  if (p <= 0 || p >= 1) {
    throw new Error('分位概率 p 必须在开区间 (0, 1) 内');
  }
  if (stdDev <= 0) {
    throw new Error('正态分布的标准差必须大于 0');
  }
  let low = mean - 40 * stdDev;
  let high = mean + 40 * stdDev;
  for (let i = 0; i < QUANTILE_MAX_ITER; i += 1) {
    const mid = (low + high) / 2;
    const cdf = normalCdf(mid, mean, stdDev);
    if (Math.abs(cdf - p) < QUANTILE_TOLERANCE) {
      return mid;
    }
    if (cdf < p) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

/* ------------------------------------------------------------------ */
/* 二项分布（离散）                                                      */
/* ------------------------------------------------------------------ */

function validateBinomial(trials: number, prob: number): void {
  if (!Number.isInteger(trials) || trials <= 0) {
    throw new Error('二项分布的试验次数 n 必须是正整数');
  }
  if (prob <= 0 || prob >= 1) {
    throw new Error('二项分布的成功概率 p 必须在开区间 (0, 1) 内');
  }
}

/** 二项分布概率质量函数 PMF：P(X = k) */
export function binomialPmf(k: number, trials: number, prob: number): number {
  validateBinomial(trials, prob);
  if (!Number.isInteger(k) || k < 0 || k > trials) {
    return 0;
  }
  const logP =
    logBinomial(trials, k) + k * Math.log(prob) + (trials - k) * Math.log(1 - prob);
  return clamp01(Math.exp(logP));
}

/** 二项分布累积分布函数 CDF：P(X ≤ k)，对 k 向下取整后逐项求和 */
export function binomialCdf(k: number, trials: number, prob: number): number {
  validateBinomial(trials, prob);
  const upper = Math.floor(k);
  if (upper < 0) {
    return 0;
  }
  if (upper >= trials) {
    return 1;
  }
  // 取较短的一侧求和以减少运算量
  if (upper <= trials / 2) {
    let sum = 0;
    for (let i = 0; i <= upper; i += 1) {
      sum += binomialPmf(i, trials, prob);
    }
    return clamp01(sum);
  }
  let tail = 0;
  for (let i = upper + 1; i <= trials; i += 1) {
    tail += binomialPmf(i, trials, prob);
  }
  return clamp01(1 - tail);
}

/** 二项分布分位函数：最小的使 CDF(k) ≥ p 的整数 k */
export function binomialQuantile(p: number, trials: number, prob: number): number {
  validateBinomial(trials, prob);
  if (p <= 0 || p >= 1) {
    throw new Error('分位概率 p 必须在开区间 (0, 1) 内');
  }
  let cumulative = 0;
  for (let k = 0; k <= trials; k += 1) {
    cumulative += binomialPmf(k, trials, prob);
    if (cumulative >= p - Number.EPSILON) {
      return k;
    }
  }
  return trials;
}

/* ------------------------------------------------------------------ */
/* 泊松分布（离散）                                                      */
/* ------------------------------------------------------------------ */

function validatePoisson(lambda: number): void {
  if (lambda <= 0 || !Number.isFinite(lambda)) {
    throw new Error('泊松分布的发生率 λ 必须是正数');
  }
}

/** 泊松分布概率质量函数 PMF：P(X = k) = e^-λ · λ^k / k! */
export function poissonPmf(k: number, lambda: number): number {
  validatePoisson(lambda);
  if (!Number.isInteger(k) || k < 0) {
    return 0;
  }
  const logP = -lambda + k * Math.log(lambda) - logFactorial(k);
  return clamp01(Math.exp(logP));
}

/** 泊松分布累积分布函数 CDF：P(X ≤ k) */
export function poissonCdf(k: number, lambda: number): number {
  validatePoisson(lambda);
  const upper = Math.floor(k);
  if (upper < 0) {
    return 0;
  }
  let sum = 0;
  for (let i = 0; i <= upper; i += 1) {
    sum += poissonPmf(i, lambda);
  }
  return clamp01(sum);
}

/** 泊松分布分位函数：最小的使 CDF(k) ≥ p 的整数 k */
export function poissonQuantile(p: number, lambda: number): number {
  validatePoisson(lambda);
  if (p <= 0 || p >= 1) {
    throw new Error('分位概率 p 必须在开区间 (0, 1) 内');
  }
  let cumulative = 0;
  let k = 0;
  // 上限保护：λ 的若干倍以上累积概率已趋近 1
  const guard = Math.ceil(lambda * 40 + 100);
  while (k <= guard) {
    cumulative += poissonPmf(k, lambda);
    if (cumulative >= p - Number.EPSILON) {
      return k;
    }
    k += 1;
  }
  return k;
}

/* ------------------------------------------------------------------ */
/* 汇总指标                                                              */
/* ------------------------------------------------------------------ */

export interface DistributionSummary {
  mean: number;
  variance: number;
  stdDev: number;
  /** 求值点处的密度 / 质量 */
  densityAtX: number;
  /** 求值点处的累积概率 P(X ≤ x) */
  cdfAtX: number;
  /** 右尾概率 P(X > x) = 1 - CDF(x) */
  tailAtX: number;
}

/** 计算三种分布的均值、方差与求值点指标 */
export function summarize(
  kind: 'normal' | 'binomial' | 'poisson',
  params: { mean?: number; stdDev?: number; trials?: number; prob?: number; lambda?: number },
  x: number,
): DistributionSummary {
  if (kind === 'normal') {
    const mean = params.mean ?? 0;
    const stdDev = params.stdDev ?? 1;
    const cdf = normalCdf(x, mean, stdDev);
    return {
      mean,
      variance: stdDev * stdDev,
      stdDev,
      densityAtX: normalPdf(x, mean, stdDev),
      cdfAtX: cdf,
      tailAtX: 1 - cdf,
    };
  }
  if (kind === 'binomial') {
    const trials = params.trials ?? 1;
    const prob = params.prob ?? 0.5;
    const cdf = binomialCdf(x, trials, prob);
    const variance = trials * prob * (1 - prob);
    return {
      mean: trials * prob,
      variance,
      stdDev: Math.sqrt(variance),
      densityAtX: binomialPmf(Math.round(x), trials, prob),
      cdfAtX: cdf,
      tailAtX: 1 - cdf,
    };
  }
  const lambda = params.lambda ?? 1;
  const cdf = poissonCdf(x, lambda);
  return {
    mean: lambda,
    variance: lambda,
    stdDev: Math.sqrt(lambda),
    densityAtX: poissonPmf(Math.round(x), lambda),
    cdfAtX: cdf,
    tailAtX: 1 - cdf,
  };
}
