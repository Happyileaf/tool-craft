/**
 * 电阻串并联等效电阻与公差累积纯函数模块
 *
 * 支持工程简写解析（10k / 4k7 / 2R2 / 1M）、纯串 / 纯并两种拓扑的
 * 标称等效、最坏情况公差界、方和根（RSS）公差与 E24 标准阻值推荐。
 * 全部为确定性纯函数，便于用固定网络向量做单测验收。
 */

/** 连接拓扑：纯串联或纯并联 */
export type NetworkTopology = 'series' | 'parallel';

/** 单个电阻录入（阻值单位欧姆，公差为百分比数值，如 5 表示 ±5%） */
export interface ResistorInput {
  /** 标称阻值（Ω），必须为正数 */
  resistance: number;
  /** 公差百分比（如 5 表示 ±5%），必须为非负数；缺省按 5% */
  tolerancePercent?: number;
}

/** E24 标准阻值推荐结果 */
export interface E24Recommendation {
  /** 最接近的 E24 标准阻值（Ω） */
  value: number;
  /** 与目标阻值的绝对偏差（Ω） */
  delta: number;
  /** 相对偏差百分比 */
  deltaPercent: number;
}

/** 电阻网络计算结果 */
export interface NetworkResult {
  /** 拓扑 */
  topology: NetworkTopology;
  /** 标称等效电阻（Ω） */
  equivalent: number;
  /** 最坏情况下限阻值（Ω） */
  minResistance: number;
  /** 最坏情况上限阻值（Ω） */
  maxResistance: number;
  /** 最坏情况公差百分比（相对标称） */
  worstCaseTolerancePercent: number;
  /** 方和根 RSS 公差百分比 */
  rssTolerancePercent: number;
  /** 最接近的 E24 标准阻值推荐 */
  e24: E24Recommendation;
}

/** 默认公差百分比（E24 常见 5%） */
export const DEFAULT_TOLERANCE_PERCENT = 5;

/**
 * E24 基础数列（1.0–9.1，每十倍频 24 个值）
 * 标准值 = 基数 × 10^n，覆盖任意数量级
 */
export const E24_BASE: readonly number[] = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
  3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
];

/** 工程简写支持的量级后缀（大小写不敏感） */
const SUFFIX_FACTOR: Record<string, number> = {
  R: 1,
  K: 1_000,
  M: 1_000_000,
};

/** 数值四舍五入到指定小数位，并消除 -0 */
function round(value: number, digits = 6): number {
  const factor = 10 ** digits;
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * 解析电阻工程简写为欧姆数值
 *
 * 规则：
 * - 纯数字按欧姆处理（`100` → 100）
 * - 后缀 R/K/M 作为量级与小数点（`10k` → 10000、`1M` → 1000000）
 * - 后缀嵌在数字中间视为小数点（`4k7` → 4700、`2R2` → 2.2、`R22` → 0.22）
 * - 容忍 Ω 单位、空白与逗号
 *
 * @param raw 原始输入文本
 * @returns 阻值（Ω）
 */
export function parseResistance(raw: string): number {
  if (typeof raw !== 'string') {
    throw new Error('电阻输入必须为文本');
  }
  const cleaned = raw
    .replace(/[Ωω\s,]/gi, '')
    .toUpperCase();
  if (cleaned === '') {
    throw new Error('电阻值不能为空');
  }
  const match = /^(\d*)([RKM]?)(\d*)$/.exec(cleaned);
  if (!match) {
    throw new Error(`无法解析电阻值「${raw}」，请使用如 100、10k、4k7、2R2 的写法`);
  }
  const [, integerPart, suffix, fractionalPart] = match;
  const left = integerPart ?? '';
  const right = fractionalPart ?? '';
  if (left === '' && right === '') {
    throw new Error(`无法解析电阻值「${raw}」，缺少数字部分`);
  }
  const factor = suffix ? (SUFFIX_FACTOR[suffix] ?? 1) : 1;
  // 后缀位于中间（right 非空）时充当小数点；否则左侧整数直接乘量级
  const numeric = suffix && right !== ''
    ? Number(`${left || '0'}.${right}`) * factor
    : Number(`${left}${right ? `.${right}` : ''}`) * (suffix ? factor : 1);
  if (!Number.isFinite(numeric)) {
    throw new Error(`电阻值「${raw}」解析结果非有效数字`);
  }
  if (numeric < 0) {
    throw new Error(`电阻值不能为负：「${raw}」`);
  }
  return numeric;
}

/** 校验单个电阻录入，不合法时抛出带中文说明的错误 */
function validateResistor(resistor: ResistorInput, index: number): void {
  const label = `第 ${index + 1} 个电阻`;
  if (!Number.isFinite(resistor.resistance) || resistor.resistance < 0) {
    throw new Error(`${label}阻值必须为非负有限数值，当前为 ${String(resistor.resistance)}`);
  }
  const tolerance = resistor.tolerancePercent ?? DEFAULT_TOLERANCE_PERCENT;
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error(`${label}公差必须为非负百分比，当前为 ${String(tolerance)}`);
  }
}

/** 串联标称等效：R = ΣRi */
export function seriesEquivalent(resistors: ResistorInput[]): number {
  return resistors.reduce((sum, item) => sum + item.resistance, 0);
}

/** 并联标称等效：1/R = Σ(1/Ri)；任一电阻为 0 视为短路报错 */
export function parallelEquivalent(resistors: ResistorInput[]): number {
  const reciprocalSum = resistors.reduce((sum, item) => {
    if (item.resistance === 0) {
      throw new Error('并联电路中不能包含 0Ω 电阻（相当于短路，会导致除零）');
    }
    return sum + 1 / item.resistance;
  }, 0);
  return 1 / reciprocalSum;
}

/**
 * 生成给定数量级下的 E24 标准阻值序列
 *
 * @param decadeMin 目标阻值向下覆盖的最小数量级（10 的幂）
 * @param decadeMax 目标阻值向上覆盖的最大数量级
 */
export function e24Series(decadeMin: number, decadeMax: number): number[] {
  const values: number[] = [];
  for (let decade = decadeMin; decade <= decadeMax; decade += 1) {
    for (const base of E24_BASE) {
      values.push(round(base * 10 ** decade, 6));
    }
  }
  return values;
}

/** 推荐与目标阻值最接近的 E24 标准阻值 */
export function nearestE24(target: number): E24Recommendation {
  if (!Number.isFinite(target) || target <= 0) {
    throw new Error('E24 推荐需要正的目标阻值');
  }
  const decade = Math.floor(Math.log10(target));
  const candidates = e24Series(decade - 1, decade + 1);
  let best = candidates[0] as number;
  let bestDelta = Math.abs(best - target);
  for (const value of candidates.slice(1)) {
    const delta = Math.abs(value - target);
    if (delta < bestDelta) {
      best = value;
      bestDelta = delta;
    }
  }
  return {
    value: best,
    delta: round(bestDelta, 6),
    deltaPercent: round((bestDelta / target) * 100, 4),
  };
}

/**
 * 计算电阻网络的标称等效与公差累积
 *
 * @param resistors 电阻列表（公差缺省按 5%）
 * @param topology 串联或并联
 * @returns 标称值、最坏情况上下界、最坏情况与 RSS 公差百分比、E24 推荐
 */
export function calculateNetwork(
  resistors: ResistorInput[],
  topology: NetworkTopology,
): NetworkResult {
  const valid = resistors.filter((item) => item !== undefined && item !== null);
  if (valid.length === 0) {
    throw new Error('请先添加至少一个电阻再计算');
  }
  valid.forEach((item, index) => validateResistor(item, index));

  const withTolerance = valid.map((item) => ({
    resistance: item.resistance,
    tolerancePercent: item.tolerancePercent ?? DEFAULT_TOLERANCE_PERCENT,
  }));

  const equivalent = topology === 'series'
    ? seriesEquivalent(withTolerance)
    : parallelEquivalent(withTolerance);

  // 最坏情况：每个电阻分别取最小 / 最大后组合
  const minimums = withTolerance.map((item) =>
    item.resistance * (1 - item.tolerancePercent / 100),
  );
  const maximums = withTolerance.map((item) =>
    item.resistance * (1 + item.tolerancePercent / 100),
  );
  const minResistors = withTolerance.map((item, index) => ({
    resistance: minimums[index] as number,
  }));
  const maxResistors = withTolerance.map((item, index) => ({
    resistance: maximums[index] as number,
  }));

  const minResistance = topology === 'series'
    ? seriesEquivalent(minResistors)
    : parallelEquivalent(minResistors);
  const maxResistance = topology === 'series'
    ? seriesEquivalent(maxResistors)
    : parallelEquivalent(maxResistors);

  const worstCaseTolerancePercent = round(
    ((maxResistance - equivalent) / equivalent) * 100,
    4,
  );

  // RSS：串联灵敏度 wi=1；并联按等效对各电阻的偏导灵敏度加权
  // 并联 Req = 1/Σ(1/Ri)，∂Req/∂Ri = (Req/Ri)^2
  let rssSum = 0;
  if (topology === 'series') {
    for (const item of withTolerance) {
      const weighted = (item.resistance / equivalent) * (item.tolerancePercent / 100);
      rssSum += weighted ** 2;
    }
  } else {
    for (const item of withTolerance) {
      const sensitivity = (equivalent / item.resistance) ** 2;
      const weighted = sensitivity * (item.tolerancePercent / 100);
      rssSum += weighted ** 2;
    }
  }
  const rssTolerancePercent = round(Math.sqrt(rssSum) * 100, 4);

  return {
    topology,
    equivalent: round(equivalent, 6),
    minResistance: round(minResistance, 6),
    maxResistance: round(maxResistance, 6),
    worstCaseTolerancePercent,
    rssTolerancePercent,
    e24: nearestE24(equivalent),
  };
}

/** 自动选择 Ω/kΩ/MΩ 单位展示阻值 */
export function formatResistance(ohm: number): string {
  if (!Number.isFinite(ohm)) return String(ohm);
  const abs = Math.abs(ohm);
  if (abs >= 1_000_000) return `${round(ohm / 1_000_000, 4)} MΩ`;
  if (abs >= 1_000) return `${round(ohm / 1_000, 4)} kΩ`;
  return `${round(ohm, 4)} Ω`;
}
