/**
 * BMR 基础代谢率与 TDEE 每日总能量消耗计算（零依赖纯函数）
 *
 * 两套 BMR 公式：
 * - Mifflin-St Jeor（1990，默认，现代人群精度更好）：
 *   男性 BMR = 10W + 6.25H − 5A + 5；女性 BMR = 10W + 6.25H − 5A − 161
 * - Harris-Benedict 修订版（Roza & Shizgal, 1984）：
 *   男性 BMR = 88.362 + 13.397W + 4.799H − 5.677A
 *   女性 BMR = 447.593 + 9.247W + 3.098H − 4.330A
 * 身高 H 单位 cm，体重 W 单位 kg，年龄 A 单位岁，结果单位 kcal/日。
 * TDEE = BMR × 活动系数；减脂区间取 TDEE 的 75%–85%，增肌区间取 105%–115%。
 */

export type Sex = 'male' | 'female';

export type BmrFormula = 'mifflin' | 'harris-benedict';

/** 个人体征输入 */
export interface BodyProfile {
  sex: Sex;
  /** 年龄（岁） */
  age: number;
  /** 身高（cm） */
  height: number;
  /** 体重（kg） */
  weight: number;
}

/** 活动水平标识 */
export type ActivityKey =
  | 'sedentary'
  | 'lightly'
  | 'moderately'
  | 'very'
  | 'extra';

/** 活动水平定义：中文名 + TDEE 系数 */
export interface ActivityLevel {
  key: ActivityKey;
  label: string;
  factor: number;
  description: string;
}

/** 五档活动水平（久坐 → 极重体力），系数 1.2–1.9 */
export const ACTIVITY_LEVELS: ActivityLevel[] = [
  { key: 'sedentary', label: '久坐（几乎不运动）', factor: 1.2, description: '办公室工作，仅有日常起居活动' },
  { key: 'lightly', label: '轻度活动（每周 1–3 次）', factor: 1.375, description: '每周轻度运动或散步 1–3 次' },
  { key: 'moderately', label: '中度活动（每周 3–5 次）', factor: 1.55, description: '每周中等强度运动 3–5 次' },
  { key: 'very', label: '高度活动（每周 6–7 次）', factor: 1.725, description: '每周高强度运动 6–7 次' },
  { key: 'extra', label: '极重体力（体力劳动/专业训练）', factor: 1.9, description: '重体力劳动或每日专业级训练' },
];

/** 热量目标区间（kcal/日） */
export interface CalorieGoal {
  /** 区间下界（含） */
  min: number;
  /** 区间上界（含） */
  max: number;
}

/** 完整计算结果 */
export interface EnergyPlan {
  /** 基础代谢率（kcal/日，未取整） */
  bmr: number;
  /** 所用 BMR 公式的人类可读表达式 */
  bmrFormulaText: string;
  /** 每日总能量消耗（kcal/日，未取整） */
  tdee: number;
  /** 使用的活动系数 */
  activityFactor: number;
  /** 维持体重目标 */
  maintain: number;
  /** 减脂参考区间（TDEE 的 75%–85%） */
  cut: CalorieGoal;
  /** 增肌参考区间（TDEE 的 105%–115%） */
  gain: CalorieGoal;
}

/** 四舍五入到整数千卡 */
function roundKcal(value: number): number {
  return Math.round(value);
}

/**
 * 计算基础代谢率 BMR
 *
 * @param profile - 性别 / 年龄 / 身高 / 体重
 * @param formula - 公式选择，默认 Mifflin-St Jeor
 * @returns BMR（kcal/日）
 * @throws 输入缺失、非有限数或超出人体合理范围时抛出错误
 */
export function computeBmr(profile: BodyProfile, formula: BmrFormula = 'mifflin'): number {
  const { sex, age, height, weight } = profile;

  if (!Number.isFinite(age) || !Number.isFinite(height) || !Number.isFinite(weight)) {
    throw new Error('年龄、身高、体重必须为有效数字');
  }
  if (age < 1 || age > 120) {
    throw new Error('年龄必须在 1–120 岁之间');
  }
  if (height < 50 || height > 250) {
    throw new Error('身高必须在 50–250 cm 之间');
  }
  if (weight < 20 || weight > 500) {
    throw new Error('体重必须在 20–500 kg 之间');
  }

  if (formula === 'mifflin') {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return sex === 'male' ? base + 5 : base - 161;
  }

  if (sex === 'male') {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  }
  return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
}

/**
 * 取某档活动水平的系数
 *
 * @param key - 活动水平标识
 * @returns 活动系数（找不到时抛出）
 */
export function getActivityFactor(key: ActivityKey): number {
  const level = ACTIVITY_LEVELS.find((item) => item.key === key);
  if (!level) {
    throw new Error(`未知活动水平：${String(key)}`);
  }
  return level.factor;
}

/**
 * 一次性计算 BMR、TDEE 与三种热量目标区间
 *
 * @param profile - 性别 / 年龄 / 身高 / 体重
 * @param formula - BMR 公式
 * @param activity - 活动水平
 * @returns 完整能量计划（区间取整到整数千卡）
 */
export function buildEnergyPlan(
  profile: BodyProfile,
  formula: BmrFormula = 'mifflin',
  activity: ActivityKey = 'moderately',
): EnergyPlan {
  const bmr = computeBmr(profile, formula);
  const factor = getActivityFactor(activity);
  const tdee = bmr * factor;
  const formulaText =
    formula === 'mifflin'
      ? profile.sex === 'male'
        ? '10×体重 + 6.25×身高 − 5×年龄 + 5'
        : '10×体重 + 6.25×身高 − 5×年龄 − 161'
      : profile.sex === 'male'
        ? '88.362 + 13.397×体重 + 4.799×身高 − 5.677×年龄'
        : '447.593 + 9.247×体重 + 3.098×身高 − 4.330×年龄';

  return {
    bmr,
    bmrFormulaText: formulaText,
    tdee,
    activityFactor: factor,
    maintain: roundKcal(tdee),
    cut: { min: roundKcal(tdee * 0.75), max: roundKcal(tdee * 0.85) },
    gain: { min: roundKcal(tdee * 1.05), max: roundKcal(tdee * 1.15) },
  };
}
