/**
 * 描述性统计纯函数：数值解析与指标计算，不接触 DOM / React
 */

export interface ParseResult {
  /** 成功解析出的数值（保持输入顺序） */
  values: number[];
  /** 无法解析的 token 列表 */
  invalidTokens: string[];
}

/**
 * 按任意空白与常见标点（逗号、分号、顿号、斜杠、竖线）切分文本并解析数值。
 * 支持负数与小数、科学计数法（Number 原生语法）；NaN / Infinity 视为非法。
 *
 * @param text - 原始文本
 * @returns 解析结果
 */
export function parseNumbers(text: string): ParseResult {
  const values: number[] = [];
  const invalidTokens: string[] = [];
  const tokens = text.split(/[\s,;，；、/|]+/).filter((token) => token.length > 0);
  for (const token of tokens) {
    const value = Number(token);
    if (Number.isFinite(value)) {
      values.push(value);
    } else {
      invalidTokens.push(token);
    }
  }
  return { values, invalidTokens };
}

/**
 * 线性插值分位数（与 Excel PERCENTILE.INC / numpy linear 方法一致）：
 * 排序后位置 h = (n - 1) * p，按 h 两侧值线性插值
 *
 * @param sorted - 已升序排序的数值数组
 * @param p - 分位点（0–1）
 */
export function quantileSorted(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) {
    return Number.NaN;
  }
  if (n === 1) {
    return sorted[0] as number;
  }
  const h = (n - 1) * p;
  const lower = Math.floor(h);
  const upper = Math.ceil(h);
  const lowValue = sorted[lower] as number;
  if (lower === upper) {
    return lowValue;
  }
  const highValue = sorted[upper] as number;
  return lowValue + (highValue - lowValue) * (h - lower);
}

export interface StatsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  /** 众数（可多个，按首次出现顺序） */
  mode: number[];
  min: number;
  max: number;
  range: number;
  /** 总体方差 */
  populationVariance: number;
  /** 总体标准差 */
  populationStdDev: number;
  /** 样本方差；n < 2 时为 null */
  sampleVariance: number | null;
  /** 样本标准差；n < 2 时为 null */
  sampleStdDev: number | null;
  q1: number;
  q2: number;
  q3: number;
  /** 升序排序后的数据 */
  sorted: number[];
}

/**
 * 对一组数值计算完整描述性统计指标
 *
 * @param input - 数值数组（空数组返回 null）
 */
export function computeStats(input: number[]): StatsResult | null {
  if (input.length === 0) {
    return null;
  }
  const sorted = [...input].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((total, value) => total + value, 0);
  const mean = sum / n;

  const squaredDiffs = sorted.map((value) => {
    const diff = value - mean;
    return diff * diff;
  });
  const squaredSum = squaredDiffs.reduce((total, value) => total + value, 0);
  const populationVariance = squaredSum / n;
  const sampleVariance = n >= 2 ? squaredSum / (n - 1) : null;

  // 众数：统计频次，取最高频；最高频为 1（全部唯一）时无众数
  const frequency = new Map<number, number>();
  const firstIndex = new Map<number, number>();
  input.forEach((value, index) => {
    frequency.set(value, (frequency.get(value) ?? 0) + 1);
    if (!firstIndex.has(value)) {
      firstIndex.set(value, index);
    }
  });
  let maxFrequency = 0;
  frequency.forEach((count) => {
    if (count > maxFrequency) {
      maxFrequency = count;
    }
  });
  const mode =
    maxFrequency > 1
      ? [...frequency.entries()]
          .filter(([, count]) => count === maxFrequency)
          .map(([value]) => value)
          .sort((a, b) => (firstIndex.get(a) ?? 0) - (firstIndex.get(b) ?? 0))
      : [];

  const median = quantileSorted(sorted, 0.5);

  return {
    count: n,
    sum,
    mean,
    median,
    mode,
    min: sorted[0] as number,
    max: sorted[n - 1] as number,
    range: (sorted[n - 1] as number) - (sorted[0] as number),
    populationVariance,
    populationStdDev: Math.sqrt(populationVariance),
    sampleVariance,
    sampleStdDev: sampleVariance === null ? null : Math.sqrt(sampleVariance),
    q1: quantileSorted(sorted, 0.25),
    q2: median,
    q3: quantileSorted(sorted, 0.75),
    sorted,
  };
}

/**
 * 将数值格式化为最多保留 fixed 位小数的字符串，去掉多余尾零
 *
 * @param value - 数值
 * @param fixed - 最多保留小数位
 */
export function formatNumber(value: number, fixed = 6): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const rounded = Number(value.toFixed(fixed));
  return String(rounded);
}
