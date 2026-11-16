import { describe, it, expect } from 'vitest';
import {
  calcBmi,
  navyBodyFat,
  bmiBodyFat,
  classifyAce,
  classifyWhr,
  type BodyMeasurements,
} from './bodyFat';

const maleMetric: BodyMeasurements = {
  sex: 'male',
  age: 30,
  height: 180,
  weight: 80,
  neck: 38,
  waist: 85,
  unitSystem: 'metric',
};

const femaleMetric: BodyMeasurements = {
  sex: 'female',
  age: 30,
  height: 165,
  weight: 60,
  neck: 32,
  waist: 70,
  hip: 95,
  unitSystem: 'metric',
};

describe('calcBmi', () => {
  it('male 180cm / 80kg → BMI ≈ 24.7 (24.6914)', () => {
    expect(calcBmi(80, 180)).toBeCloseTo(24.6914, 3);
  });

  it('female 165cm / 60kg → BMI ≈ 22.0', () => {
    expect(calcBmi(60, 165)).toBeCloseTo(22.0386, 3);
  });
});

describe('navyBodyFat (US Navy 围度法)', () => {
  it('acceptance: male 180/80/neck38/waist85 → BF% ≈ 16.1, BMI ≈ 24.7', () => {
    const result = navyBodyFat(maleMetric);
    expect(result.bodyFatPercent).toBeCloseTo(16.1, 1);
    expect(result.bmi).toBeCloseTo(24.7, 1);
    // 脂肪重量 = 0.1611 × 80 ≈ 12.9 kg；瘦体重 ≈ 67.1 kg
    expect(result.fatMassKg).toBeGreaterThan(12);
    expect(result.fatMassKg).toBeLessThan(14);
    expect(result.leanMassKg).toBeCloseTo(80 - result.fatMassKg, 5);
    expect(result.aceCategory).toBe('fitness');
  });

  it('acceptance: female 165/60/neck32/waist70/hip95 → BF% ≈ 24.9', () => {
    const result = navyBodyFat(femaleMetric);
    expect(result.bodyFatPercent).toBeCloseTo(24.9, 1);
    expect(result.aceCategory).toBe('fitness');
  });

  it('female result includes WHR = waist / hip = 70 / 95 ≈ 0.74', () => {
    const result = navyBodyFat(femaleMetric);
    expect(result.whr).toBeCloseTo(0.74, 2);
  });

  it('throws a clear error when waist <= neck (male)', () => {
    expect(() =>
      navyBodyFat({ ...maleMetric, waist: 38, neck: 38 }),
    ).toThrow(/腰围严格大于颈围/);
    expect(() =>
      navyBodyFat({ ...maleMetric, waist: 36, neck: 38 }),
    ).toThrow(/腰围严格大于颈围/);
  });

  it('throws when female combined term waist + hip - neck <= 0', () => {
    expect(() =>
      navyBodyFat({ ...femaleMetric, waist: 20, hip: 10, neck: 32 }),
    ).toThrow(/腰围 \+ 臀围 > 颈围/);
  });

  it('throws when required circumference fields are missing', () => {
    const { neck: _neck, ...withoutNeck } = maleMetric;
    expect(() => navyBodyFat(withoutNeck)).toThrow(/颈围/);
    expect(() => navyBodyFat({ ...femaleMetric, hip: undefined })).toThrow(/臀围/);
  });

  it('imperial inputs (in/lb) match metric inputs within ±0.1%', () => {
    // 180 cm = 70.8661 in；80 kg = 176.3698 lb；38 cm = 14.9606 in；85 cm = 33.4646 in
    const maleImperial: BodyMeasurements = {
      sex: 'male',
      age: 30,
      height: 180 / 2.54,
      weight: 80 / 0.45359237,
      neck: 38 / 2.54,
      waist: 85 / 2.54,
      unitSystem: 'imperial',
    };
    const metricResult = navyBodyFat(maleMetric);
    const imperialResult = navyBodyFat(maleImperial);
    const relativeDiff =
      Math.abs(imperialResult.bodyFatPercent - metricResult.bodyFatPercent) /
      metricResult.bodyFatPercent;
    expect(relativeDiff).toBeLessThan(0.001);
    expect(imperialResult.bmi).toBeCloseTo(metricResult.bmi, 1);
  });

  it('rejects non-positive height/weight with explicit errors', () => {
    expect(() => navyBodyFat({ ...maleMetric, height: 0 })).toThrow(/身高/);
    expect(() => navyBodyFat({ ...maleMetric, weight: -5 })).toThrow(/体重/);
  });
});

describe('bmiBodyFat (Deurenberg BMI 推导法)', () => {
  it('acceptance: male 180/80 age 30 → BF% ≈ 20.3', () => {
    // 1.2 × 24.6914 + 0.23 × 30 − 10.8 − 5.4 = 20.3296
    const result = bmiBodyFat(maleMetric);
    expect(result.bodyFatPercent).toBeCloseTo(20.3, 1);
    expect(result.bmi).toBeCloseTo(24.7, 1);
  });

  it('acceptance: female 165/60 age 30 → formula truth 27.95%', () => {
    // 标准 Deurenberg 公式：1.2 × 22.0386 + 6.9 − 5.4 = 27.9463
    // 注：原 Idea 所写 ≈30.4% 与公式不符（缺少性别系数 −10.8 时恰为 27.95，
    // 30.4 对应另一套经验口径），实现以标准公式真值 27.9% 为准
    const result = bmiBodyFat(femaleMetric);
    // 原始公式值 27.9463，UI 统一保留一位小数 → 27.9
    expect(result.bodyFatPercent).toBeCloseTo(27.9, 5);
  });

  it('sex coefficient takes effect: male result is lower than female at same BMI/age', () => {
    const male = bmiBodyFat(maleMetric);
    const female = bmiBodyFat(femaleMetric);
    // 同 BMI 同年龄时男性恰低 10.8 个百分点；这里两组 BMI 不同，仅断言男性不高于女性
    expect(male.bodyFatPercent).toBeLessThan(female.bodyFatPercent);
  });

  it('validates age range 15–100 integer', () => {
    expect(() => bmiBodyFat({ ...maleMetric, age: 14 })).toThrow(/年龄/);
    expect(() => bmiBodyFat({ ...maleMetric, age: 101 })).toThrow(/年龄/);
    expect(() => bmiBodyFat({ ...maleMetric, age: 30.5 })).toThrow(/年龄/);
  });
});

describe('classifyAce (ACE 五档分级)', () => {
  it('male bands: 2-6 essential, 6-14 athletes, 14-18 fitness, 18-25 average, 25+ obese', () => {
    expect(classifyAce('male', 4)).toBe('essential');
    expect(classifyAce('male', 10)).toBe('athletes');
    expect(classifyAce('male', 16.1)).toBe('fitness');
    expect(classifyAce('male', 20.3)).toBe('average');
    expect(classifyAce('male', 28)).toBe('obese');
  });

  it('female bands: 10-14 essential, 14-21 athletes, 21-25 fitness, 25-32 average, 32+ obese', () => {
    expect(classifyAce('female', 12)).toBe('essential');
    expect(classifyAce('female', 18)).toBe('athletes');
    expect(classifyAce('female', 24.9)).toBe('fitness');
    expect(classifyAce('female', 27.95)).toBe('average');
    expect(classifyAce('female', 35)).toBe('obese');
  });

  it('below essential floor falls back to essential', () => {
    expect(classifyAce('male', 1)).toBe('essential');
  });
});

describe('classifyWhr (WHO 腰臀比风险)', () => {
  it('male thresholds 0.85 / 0.90', () => {
    expect(classifyWhr('male', 0.8)).toBe('低风险');
    expect(classifyWhr('male', 0.88)).toBe('中等风险');
    expect(classifyWhr('male', 0.95)).toBe('高风险');
  });

  it('female thresholds 0.75 / 0.80', () => {
    expect(classifyWhr('female', 0.74)).toBe('低风险');
    expect(classifyWhr('female', 0.78)).toBe('中等风险');
    expect(classifyWhr('female', 0.85)).toBe('高风险');
  });
});
