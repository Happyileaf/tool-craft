/**
 * 调查抽样样本量与误差范围计算纯函数（Cochran 公式 + 有限总体校正 FPC）
 *
 * 所有函数均为确定性纯函数，不依赖 DOM，可直接在 Vitest 中验证。
 */

/** 常用置信水平对应的双侧标准正态分位数 z */
export const Z_SCORES: Readonly<Record<number, number>> = Object.freeze({
  0.8: 1.2816,
  0.85: 1.4395,
  0.9: 1.6449,
  0.95: 1.959964,
  0.99: 2.575829,
});

/** 样本量计算入参 */
export interface SampleSizeInput {
  /** 置信水平，取值 (0,1)，如 0.95 */
  confidenceLevel: number;
  /** 误差幅度（比例），取值 (0,1)，如 0.05 表示 ±5% */
  marginOfError: number;
  /** 预期总体比例 p，取值 [0,1]，默认 0.5（最保守） */
  proportion?: number;
  /** 总体规模 N，不传或为 0 表示无限总体，不做 FPC */
  populationSize?: number;
}

/** 样本量计算结果 */
export interface SampleSizeResult {
  /** 无限总体下的 Cochran 原始样本量 n0（未取整） */
  rawSampleSize: number;
  /** 有限总体校正后的样本量（未取整）；无限总体时等于 rawSampleSize */
  adjustedSampleSize: number;
  /** 实际建议样本量（向上取整的整数） */
  requiredSampleSize: number;
  /** 计算所用 z 分位数 */
  zScore: number;
  /** 是否应用了有限总体校正 */
  finiteCorrectionApplied: boolean;
}

/** 误差范围反推入参 */
export interface MarginInput {
  /** 已确定的样本量 n（正整数） */
  sampleSize: number;
  /** 置信水平，取值 (0,1) */
  confidenceLevel: number;
  /** 预期总体比例 p，取值 [0,1]，默认 0.5 */
  proportion?: number;
  /** 总体规模 N，不传或为 0 表示无限总体 */
  populationSize?: number;
}

/**
 * 取置信水平对应的 z 分位数；内置表未覆盖时按有理逼近（Acklam 算法）计算
 *
 * @param confidenceLevel - 置信水平 (0,1)
 * @returns 双侧 z 分位数（正数）
 */
export function getZScore(confidenceLevel: number): number {
  if (!(confidenceLevel > 0 && confidenceLevel < 1)) {
    throw new Error('置信水平必须在 0 与 1 之间（不含端点）');
  }
  const hit = Z_SCORES[confidenceLevel];
  if (hit !== undefined) {
    return hit;
  }
  return inverseNormalCdf(1 - (1 - confidenceLevel) / 2);
}

/**
 * 标准正态分布逆 CDF（Acklam 有理逼近，相对误差约 1.15e-9）
 *
 * @param p - 累积概率 (0,1)
 * @returns 对应的 z 值
 */
export function inverseNormalCdf(p: number): number {
  if (!(p > 0 && p < 1)) {
    throw new Error('累积概率必须在 0 与 1 之间（不含端点）');
  }
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q: number;
  let result: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    result =
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    const r = q * q;
    result =
      ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
      (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    result =
      -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  return result;
}

/**
 * Cochran 样本量计算（含可选有限总体校正）
 *
 * 无限总体：n0 = z²·p·(1-p) / e²
 * 有限总体：n = n0 / (1 + (n0-1)/N)
 *
 * @param input - 样本量入参
 * @returns 原始、校正后与取整后的样本量
 */
export function calculateSampleSize(input: SampleSizeInput): SampleSizeResult {
  const { confidenceLevel, marginOfError, proportion = 0.5, populationSize = 0 } = input;
  if (!(marginOfError > 0 && marginOfError < 1)) {
    throw new Error('误差幅度必须在 0 与 1 之间（不含端点）');
  }
  if (!(proportion >= 0 && proportion <= 1)) {
    throw new Error('预期比例 p 必须在 0 与 1 之间');
  }
  if (populationSize < 0 || !Number.isFinite(populationSize)) {
    throw new Error('总体规模必须为非负有限数值');
  }
  const z = getZScore(confidenceLevel);
  const n0 = (z * z * proportion * (1 - proportion)) / (marginOfError * marginOfError);
  const applyFpc = populationSize > 0;
  const adjusted = applyFpc ? n0 / (1 + (n0 - 1) / populationSize) : n0;
  return {
    rawSampleSize: n0,
    adjustedSampleSize: adjusted,
    requiredSampleSize: Math.ceil(adjusted),
    zScore: z,
    finiteCorrectionApplied: applyFpc,
  };
}

/**
 * 由给定样本量反推误差幅度（Cochran 公式的逆运算，含 FPC）
 *
 * 无限总体：e = z·sqrt(p(1-p)/n)
 * 有限总体先对 FPC 求逆得到 n0 = n·N / (N - n + 1)，再代入上式
 *
 * @param input - 误差范围入参
 * @returns 误差幅度（比例）
 */
export function calculateMarginOfError(input: MarginInput): number {
  const { sampleSize, confidenceLevel, proportion = 0.5, populationSize = 0 } = input;
  if (!Number.isInteger(sampleSize) || sampleSize <= 0) {
    throw new Error('样本量必须为正整数');
  }
  if (!(proportion >= 0 && proportion <= 1)) {
    throw new Error('预期比例 p 必须在 0 与 1 之间');
  }
  if (populationSize < 0 || !Number.isFinite(populationSize)) {
    throw new Error('总体规模必须为非负有限数值');
  }
  if (populationSize > 0 && sampleSize >= populationSize) {
    return 0;
  }
  const z = getZScore(confidenceLevel);
  const n0 =
    populationSize > 0
      ? (sampleSize * populationSize) / (populationSize - sampleSize + 1)
      : sampleSize;
  return z * Math.sqrt((proportion * (1 - proportion)) / n0);
}

/** 设计效应与应答率校正入参 */
export interface EffectiveSampleInput {
  /** 基础样本量 n */
  baseSampleSize: number;
  /** 设计效应 deff，默认 1（简单随机抽样） */
  designEffect?: number;
  /** 预期应答率，取值 (0,1]，默认 1 */
  responseRate?: number;
}

/**
 * 按设计效应与应答率调整实际需接触的样本量
 *
 * 先乘设计效应，再除以应答率，结果向上取整。
 *
 * @param input - 校正入参
 * @returns 调整后需招募/接触的样本量（整数）
 */
export function adjustForDesignAndResponse(input: EffectiveSampleInput): number {
  const { baseSampleSize, designEffect = 1, responseRate = 1 } = input;
  if (!Number.isInteger(baseSampleSize) || baseSampleSize <= 0) {
    throw new Error('基础样本量必须为正整数');
  }
  if (!(designEffect >= 1)) {
    throw new Error('设计效应必须不小于 1');
  }
  if (!(responseRate > 0 && responseRate <= 1)) {
    throw new Error('应答率必须在 0 与 1 之间（不含 0）');
  }
  return Math.ceil((baseSampleSize * designEffect) / responseRate);
}

/**
 * 将比例格式化为百分比文本
 *
 * @param ratio - 比例值
 * @param digits - 保留小数位数
 * @returns 如 0.05 → "5.00%"
 */
export function formatPercent(ratio: number, digits = 2): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}
