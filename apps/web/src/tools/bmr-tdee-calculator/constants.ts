import type { BmrFormula, Sex } from './utils/bmr';

export interface FormulaOption {
  value: BmrFormula;
  label: string;
  hint: string;
}

export const FORMULA_OPTIONS: FormulaOption[] = [
  {
    value: 'mifflin',
    label: 'Mifflin-St Jeor',
    hint: '1990 年发表，对现代人群精度更好，推荐默认',
  },
  {
    value: 'harris-benedict',
    label: 'Harris-Benedict 修订版',
    hint: 'Roza & Shizgal 1984 年修订系数，便于与旧资料对照',
  },
];

export interface SexOption {
  value: Sex;
  label: string;
}

export const SEX_OPTIONS: SexOption[] = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
];

/** 示例预设：男性 180cm/80kg/30 岁（Mifflin BMR = 1780 kcal） */
export const SAMPLE_PROFILE = {
  sex: 'male' as Sex,
  age: 30,
  height: 180,
  weight: 80,
};
