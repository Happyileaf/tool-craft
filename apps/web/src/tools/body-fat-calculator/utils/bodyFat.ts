/**
 * 体脂率估算（零依赖纯函数）
 *
 * 方法一：US Navy 围度法（厘米制）
 *   男性 BF% = 495 / (1.0324 − 0.19077·log10(腰 − 颈) + 0.15456·log10(身高)) − 450
 *   女性 BF% = 495 / (1.29579 − 0.35004·log10(腰 + 臀 − 颈) + 0.22100·log10(身高)) − 450
 *
 * 方法二：Deurenberg BMI 推导
 *   BF% = 1.20·BMI + 0.23·年龄 − 10.8·性别系数 − 5.4（男 = 1，女 = 0）
 *
 * 参考：U.S. Navy body circumference method；Deurenberg P. et al. (1991)。
 * 全部结果为估算值，不构成医学诊断。
 */

export type Sex = 'male' | 'female';
export type UnitSystem = 'metric' | 'imperial';

const CM_PER_INCH = 2.54;
const KG_PER_LB = 0.45359237;

export interface BodyMeasurements {
  sex: Sex;
  /** 年龄（岁，15–100） */
  age: number;
  /** 身高（随 unitSystem：cm 或 in） */
  height: number;
  /** 体重（随 unitSystem：kg 或 lb） */
  weight: number;
  /** 颈围（随 unitSystem：cm 或 in） */
  neck?: number;
  /** 腰围（随 unitSystem：cm 或 in） */
  waist?: number;
  /** 臀围（女性围度法必填，随 unitSystem） */
  hip?: number;
  unitSystem: UnitSystem;
}

export interface BodyFatResult {
  /** 体脂率（%，一位小数） */
  bodyFatPercent: number;
  /** 脂肪重量（kg） */
  fatMassKg: number;
  /** 瘦体重（kg） */
  leanMassKg: number;
  /** BMI（kg/m²） */
  bmi: number;
  /** 腰臀比 WHR（仅围度数据齐全时给出） */
  whr?: number;
  /** ACE 五档分级 key */
  aceCategory: AceCategoryKey;
}

export type AceCategoryKey = 'essential' | 'athletes' | 'fitness' | 'average' | 'obese';

export interface AceCategoryInfo {
  key: AceCategoryKey;
  label: string;
  /** 该性别下的体脂率区间（%），[下限, 上限)，obese 为 [下限, ∞) */
  range: [number, number | null];
}

/** ACE（美国运动委员会）体脂分级区间 */
export const ACE_CATEGORIES: Record<Sex, AceCategoryInfo[]> = {
  male: [
    { key: 'essential', label: '必需脂肪', range: [2, 6] },
    { key: 'athletes', label: '运动员', range: [6, 14] },
    { key: 'fitness', label: '健身', range: [14, 18] },
    { key: 'average', label: '平均', range: [18, 25] },
    { key: 'obese', label: '肥胖', range: [25, null] },
  ],
  female: [
    { key: 'essential', label: '必需脂肪', range: [10, 14] },
    { key: 'athletes', label: '运动员', range: [14, 21] },
    { key: 'fitness', label: '健身', range: [21, 25] },
    { key: 'average', label: '平均', range: [25, 32] },
    { key: 'obese', label: '肥胖', range: [32, null] },
  ],
};

/** WHO 腰臀比（WHR）心血管风险阈值 */
export const WHR_RISK: Record<Sex, { threshold: number; label: string }[]> = {
  male: [
    { threshold: 0.85, label: '低风险' },
    { threshold: 0.9, label: '中等风险' },
    { threshold: Number.POSITIVE_INFINITY, label: '高风险' },
  ],
  female: [
    { threshold: 0.75, label: '低风险' },
    { threshold: 0.8, label: '中等风险' },
    { threshold: Number.POSITIVE_INFINITY, label: '高风险' },
  ],
};

function requirePositive(value: number | undefined, name: string): number {
  if (value === undefined || !Number.isFinite(value)) {
    throw new Error(`${name} 不是有效数字`);
  }
  if (value <= 0) {
    throw new Error(`${name} 必须为正数`);
  }
  return value;
}

function toMetric(input: BodyMeasurements) {
  const factorLength = input.unitSystem === 'imperial' ? CM_PER_INCH : 1;
  const factorWeight = input.unitSystem === 'imperial' ? KG_PER_LB : 1;
  return {
    heightCm: requirePositive(input.height, '身高') * factorLength,
    weightKg: requirePositive(input.weight, '体重') * factorWeight,
    neckCm: input.neck === undefined ? undefined : requirePositive(input.neck, '颈围') * factorLength,
    waistCm: input.waist === undefined ? undefined : requirePositive(input.waist, '腰围') * factorLength,
    hipCm: input.hip === undefined ? undefined : requirePositive(input.hip, '臀围') * factorLength,
  };
}

function validateAge(age: number): number {
  if (!Number.isFinite(age) || !Number.isInteger(age) || age < 15 || age > 100) {
    throw new Error('年龄必须是 15–100 之间的整数');
  }
  return age;
}

/** BMI = 体重(kg) / 身高(m)² */
export function calcBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * US Navy 围度法体脂率（%）
 */
export function navyBodyFat(input: BodyMeasurements): BodyFatResult {
  const metric = toMetric(input);
  const neck = requirePositive(metric.neckCm, '颈围');
  const waist = requirePositive(metric.waistCm, '腰围');
  let density: number;

  if (input.sex === 'male') {
    if (waist <= neck) {
      throw new Error('围度法要求腰围严格大于颈围（腰 − 颈 > 0），否则对数项无意义，请核对测量值');
    }
    density =
      1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(metric.heightCm);
  } else {
    const hip = requirePositive(metric.hipCm, '臀围（女性围度法必填）');
    const combined = waist + hip - neck;
    if (combined <= 0) {
      throw new Error('围度法要求 腰围 + 臀围 > 颈围，否则对数项无意义，请核对测量值');
    }
    density =
      1.29579 - 0.35004 * Math.log10(combined) + 0.22100 * Math.log10(metric.heightCm);
  }

  const bodyFatPercent = 495 / density - 450;
  if (!Number.isFinite(bodyFatPercent) || bodyFatPercent <= 0 || bodyFatPercent >= 80) {
    throw new Error('围度法计算结果超出合理范围（0–80%），请核对输入的测量值');
  }
  return assembleResult(input, metric, bodyFatPercent, true);
}

/**
 * Deurenberg BMI 推导法体脂率（%）
 */
export function bmiBodyFat(input: BodyMeasurements): BodyFatResult {
  validateAge(input.age);
  const metric = toMetric(input);
  const bmi = calcBmi(metric.weightKg, metric.heightCm);
  const sexCoefficient = input.sex === 'male' ? 1 : 0;
  const bodyFatPercent = 1.2 * bmi + 0.23 * input.age - 10.8 * sexCoefficient - 5.4;
  if (!Number.isFinite(bodyFatPercent) || bodyFatPercent <= 0 || bodyFatPercent >= 80) {
    throw new Error('BMI 法计算结果超出合理范围（0–80%），请核对身高 / 体重 / 年龄');
  }
  return assembleResult(input, metric, bodyFatPercent, false);
}

function assembleResult(
  input: BodyMeasurements,
  metric: { weightKg: number; heightCm: number; neckCm?: number; waistCm?: number; hipCm?: number },
  bodyFatPercent: number,
  includeWhr: boolean,
): BodyFatResult {
  const bmi = calcBmi(metric.weightKg, metric.heightCm);
  const fatMassKg = (bodyFatPercent / 100) * metric.weightKg;
  let whr: number | undefined;
  if (includeWhr && metric.waistCm !== undefined && metric.hipCm !== undefined && metric.hipCm > 0) {
    whr = metric.waistCm / metric.hipCm;
  }
  return {
    bodyFatPercent: round1(bodyFatPercent),
    fatMassKg: round1(fatMassKg),
    leanMassKg: round1(metric.weightKg - fatMassKg),
    bmi: round1(bmi),
    whr: whr === undefined ? undefined : round2(whr),
    aceCategory: classifyAce(input.sex, bodyFatPercent),
  };
}

export function classifyAce(sex: Sex, bodyFatPercent: number): AceCategoryKey {
  const categories = ACE_CATEGORIES[sex];
  for (const category of categories) {
    const [lower, upper] = category.range;
    if (bodyFatPercent >= lower && (upper === null || bodyFatPercent < upper)) {
      return category.key;
    }
  }
  // 低于 essential 下限归入 essential
  return 'essential';
}

/** WHR 风险分级（WHO） */
export function classifyWhr(sex: Sex, whr: number): string {
  const bands = WHR_RISK[sex];
  for (const band of bands) {
    if (whr < band.threshold) return band.label;
  }
  return bands[bands.length - 1]?.label ?? '高风险';
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
