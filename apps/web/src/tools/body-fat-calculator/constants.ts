import type { Sex, UnitSystem, AceCategoryKey } from './utils/bodyFat';

export type CalcMethod = 'navy' | 'bmi' | 'both';

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
];

export const UNIT_OPTIONS: {
  value: UnitSystem;
  label: string;
  lengthUnit: string;
  weightUnit: string;
}[] = [
  { value: 'metric', label: '公制（cm / kg）', lengthUnit: 'cm', weightUnit: 'kg' },
  { value: 'imperial', label: '英制（in / lb）', lengthUnit: 'in', weightUnit: 'lb' },
];

export const METHOD_OPTIONS: { value: CalcMethod; label: string; hint: string }[] = [
  { value: 'navy', label: '围度法（US Navy）', hint: '由颈 / 腰 / 臀围与身高估算，需软尺测量数据' },
  { value: 'bmi', label: 'BMI 推导法（Deurenberg）', hint: '仅需身高、体重与年龄，无围度时使用' },
  { value: 'both', label: '两法对比', hint: '并列展示两种估算结果与差值' },
];

export const ACE_TAG_COLOR: Record<AceCategoryKey, string> = {
  essential: 'blue',
  athletes: 'green',
  fitness: 'cyan',
  average: 'gold',
  obese: 'red',
};

export const ACE_TAG_LABEL: Record<AceCategoryKey, string> = {
  essential: '必需脂肪',
  athletes: '运动员',
  fitness: '健身',
  average: '平均',
  obese: '肥胖',
};

/** 默认输入：男性 180cm / 80kg / 颈 38 / 腰 85（验收向量 1） */
export const DEFAULT_INPUTS = {
  sex: 'male' as Sex,
  age: 30,
  height: 180,
  weight: 80,
  neck: 38,
  waist: 85,
  hip: 95,
  unitSystem: 'metric' as UnitSystem,
  method: 'both' as CalcMethod,
};
