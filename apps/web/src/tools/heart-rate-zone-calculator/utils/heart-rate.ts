/** 最大心率估算与 Karvonen 训练区间的纯函数 */

/** 性别 */
export type Sex = 'male' | 'female';

/** 最大心率估算公式 */
export type MaxHrFormula = 'auto' | 'fox' | 'tanaka' | 'gulati';

/** 计算输入 */
export interface HeartRateInput {
  /** 年龄（10–100） */
  age: number;
  /** 静息心率（30–120 bpm） */
  restingHr: number;
  /** 性别 */
  sex: Sex;
  /** 公式选择 */
  formula: MaxHrFormula;
  /** 实测最大心率，填写后优先使用 */
  measuredMaxHr?: number | null;
}

/** 单个训练区间 */
export interface HeartRateZone {
  /** 区间序号 1–5 */
  index: number;
  /** 区间名称 */
  name: string;
  /** 强度说明 */
  purpose: string;
  /** 储备心率百分比下限 */
  lowerPercent: number;
  /** 储备心率百分比上限 */
  upperPercent: number;
  /** Karvonen 法 bpm 下限 */
  lowerBpm: number;
  /** Karvonen 法 bpm 上限 */
  upperBpm: number;
  /** 最大心率百分比法 bpm 下限 */
  lowerBpmMaxPercent: number;
  /** 最大心率百分比法 bpm 上限 */
  upperBpmMaxPercent: number;
}

/** 计算结果 */
export interface HeartRateResult {
  /** 采用的估算最大心率 */
  maxHr: number;
  /** 储备心率 */
  heartRateReserve: number;
  /** 实际采用的公式 */
  formulaUsed: 'fox' | 'tanaka' | 'gulati' | 'measured';
  /** 五级训练区间 */
  zones: HeartRateZone[];
}

const ZONE_DEFINITIONS = [
  {
    index: 1,
    name: 'Z1 恢复区',
    purpose: '热身、冷身与轻松恢复，可长时间持续',
    lowerPercent: 50,
    upperPercent: 60,
  },
  {
    index: 2,
    name: 'Z2 有氧基础',
    purpose: '提升有氧耐力与脂肪利用，日常轻松跑',
    lowerPercent: 60,
    upperPercent: 70,
  },
  {
    index: 3,
    name: 'Z3 有氧耐力',
    purpose: '提高有氧能力与配速，节奏跑区间',
    lowerPercent: 70,
    upperPercent: 80,
  },
  {
    index: 4,
    name: 'Z4 阈值区',
    purpose: '提升乳酸阈值与速度耐力，接近 10 公里比赛强度',
    lowerPercent: 80,
    upperPercent: 90,
  },
  {
    index: 5,
    name: 'Z5 最大摄氧区',
    purpose: '提升最大摄氧量与冲刺能力，短时间高强度',
    lowerPercent: 90,
    upperPercent: 100,
  },
] as const;

/**
 * 按公式估算最大心率，Gulati 仅适用于女性，男性选择时回退到 Tanaka
 */
export function estimateMaxHr(
  age: number,
  sex: Sex,
  formula: MaxHrFormula,
): { value: number; used: 'fox' | 'tanaka' | 'gulati' } {
  if (formula === 'fox') {
    return { value: 220 - age, used: 'fox' };
  }
  if (formula === 'gulati' && sex === 'female') {
    return { value: 206 - 0.88 * age, used: 'gulati' };
  }
  return { value: 208 - 0.7 * age, used: 'tanaka' };
}

/**
 * 计算最大心率、储备心率与五级 Karvonen 训练区间
 */
export function calculateHeartRateZones(input: HeartRateInput): HeartRateResult {
  const { age, restingHr, sex, formula, measuredMaxHr } = input;

  if (!Number.isInteger(age) || age < 10 || age > 100) {
    throw new Error('年龄需为 10–100 的整数');
  }
  if (!Number.isFinite(restingHr) || restingHr < 30 || restingHr > 120) {
    throw new Error('静息心率需在 30–120 bpm 之间');
  }

  let maxHr: number;
  let formulaUsed: HeartRateResult['formulaUsed'];
  if (measuredMaxHr !== null && measuredMaxHr !== undefined) {
    if (!Number.isFinite(measuredMaxHr) || measuredMaxHr <= restingHr || measuredMaxHr > 240) {
      throw new Error('实测最大心率需大于静息心率且不超过 240 bpm');
    }
    maxHr = measuredMaxHr;
    formulaUsed = 'measured';
  } else {
    const estimate = estimateMaxHr(age, sex, formula);
    maxHr = estimate.value;
    formulaUsed = estimate.used;
  }

  if (maxHr <= restingHr) {
    throw new Error('最大心率必须大于静息心率');
  }

  const heartRateReserve = maxHr - restingHr;
  const zones = ZONE_DEFINITIONS.map((zone) => ({
    index: zone.index,
    name: zone.name,
    purpose: zone.purpose,
    lowerPercent: zone.lowerPercent,
    upperPercent: zone.upperPercent,
    lowerBpm: Math.round(restingHr + (heartRateReserve * zone.lowerPercent) / 100),
    upperBpm: Math.round(restingHr + (heartRateReserve * zone.upperPercent) / 100),
    lowerBpmMaxPercent: Math.round((maxHr * zone.lowerPercent) / 100),
    upperBpmMaxPercent: Math.round((maxHr * zone.upperPercent) / 100),
  }));

  return {
    maxHr: Number(maxHr.toFixed(1)),
    heartRateReserve: Number(heartRateReserve.toFixed(1)),
    formulaUsed,
    zones,
  };
}
