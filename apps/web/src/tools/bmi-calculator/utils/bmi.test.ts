import { describe, expect, it } from 'vitest';
import {
  CHINA_THRESHOLDS,
  WHO_THRESHOLDS,
} from '../constants';
import {
  calcBmi,
  evaluateBmi,
  gradeChina,
  gradeWho,
  imperialHeightToCm,
  poundsToKg,
  validateMetric,
  weightAtBmi,
} from './bmi';

describe('validateMetric', () => {
  it('接受合法公制输入', () => {
    expect(() => validateMetric(170, 65)).not.toThrow();
  });

  it('拒绝零 / 负数 / 非有限值', () => {
    expect(() => validateMetric(0, 65)).toThrow();
    expect(() => validateMetric(170, -1)).toThrow();
    expect(() => validateMetric(Number.NaN, 65)).toThrow();
  });

  it('拒绝超出合理范围的输入', () => {
    expect(() => validateMetric(40, 65)).toThrow('身高');
    expect(() => validateMetric(170, 2000)).toThrow('体重');
  });
});

describe('calcBmi', () => {
  it('170cm / 65kg 的 BMI 约为 22.49', () => {
    expect(calcBmi(65, 170)).toBeCloseTo(22.49, 1);
  });

  it('165cm / 82kg 的 BMI 约为 30.12', () => {
    expect(calcBmi(82, 165)).toBeCloseTo(30.12, 1);
  });
});

describe('中国标准分级 gradeChina', () => {
  it('边界 18.5 归入正常（含下限）', () => {
    expect(gradeChina(CHINA_THRESHOLDS.underweight).category).toBe('normal');
  });

  it('边界 24 归入超重', () => {
    expect(gradeChina(CHINA_THRESHOLDS.overweight).category).toBe('overweight');
  });

  it('边界 28 归入肥胖（含下限）', () => {
    expect(gradeChina(CHINA_THRESHOLDS.obese).category).toBe('obese');
  });

  it('17.6 为偏瘦，25.6 为超重', () => {
    expect(gradeChina(17.6).category).toBe('underweight');
    expect(gradeChina(25.6).category).toBe('overweight');
  });
});

describe('WHO 标准分级 gradeWho', () => {
  it('WHO 超重起点为 25（中国标准为 24）', () => {
    expect(gradeWho(WHO_THRESHOLDS.normal).category).toBe('overweight');
    expect(gradeChina(WHO_THRESHOLDS.normal).category).toBe('overweight');
  });

  it('BMI 24.5：中国判超重，WHO 仍为正常', () => {
    expect(gradeChina(24.5).category).toBe('overweight');
    expect(gradeWho(24.5).category).toBe('normal');
  });

  it('WHO 肥胖起点为 30', () => {
    expect(gradeWho(WHO_THRESHOLDS.overweight).category).toBe('obese');
  });
});

describe('英制换算', () => {
  it('5 英尺 7 英寸 = 170.18 cm', () => {
    expect(imperialHeightToCm(5, 7)).toBeCloseTo(170.18, 2);
  });

  it('143 磅 ≈ 64.86 kg', () => {
    expect(poundsToKg(143)).toBeCloseTo(64.86, 1);
  });

  it('英制换算后 BMI 与同体型公制一致', () => {
    const heightCm = imperialHeightToCm(5, 7);
    const weightKg = poundsToKg(143);
    expect(calcBmi(weightKg, heightCm)).toBeCloseTo(22.4, 1);
  });

  it('拒绝负英尺 / 非正磅数', () => {
    expect(() => imperialHeightToCm(-1, 7)).toThrow();
    expect(() => poundsToKg(0)).toThrow();
  });
});

describe('weightAtBmi', () => {
  it('170cm 在 BMI 18.5 时体重为 53.465kg', () => {
    expect(weightAtBmi(170, 18.5)).toBeCloseTo(53.465, 2);
  });

  it('170cm 在 BMI 24 时体重为 69.36kg', () => {
    expect(weightAtBmi(170, 24)).toBeCloseTo(69.36, 2);
  });
});

describe('evaluateBmi', () => {
  it('正常体重给出双标准正常与健康区间', () => {
    const result = evaluateBmi(170, 65);
    expect(result.bmi).toBeCloseTo(22.49, 1);
    expect(result.chinaGrade.category).toBe('normal');
    expect(result.whoGrade.category).toBe('normal');
    expect(result.healthyRange.minKg).toBeCloseTo(53.465, 2);
    expect(result.healthyRange.maxKg).toBeCloseTo(69.36, 2);
    expect(Math.abs(result.deltaToNormalKg)).toBeLessThan(10);
  });

  it('超重时 deltaToNormalKg 为负（需减重）', () => {
    const result = evaluateBmi(170, 74);
    expect(result.chinaGrade.category).toBe('overweight');
    expect(result.deltaToNormalKg).toBeLessThan(0);
  });

  it('偏瘦时 deltaToNormalKg 为正（需增重）', () => {
    const result = evaluateBmi(175, 54);
    expect(result.chinaGrade.category).toBe('underweight');
    expect(result.deltaToNormalKg).toBeGreaterThan(0);
  });

  it('极端 BMI 抛出范围错误', () => {
    // 身高 300cm、体重 30kg 通过公制校验但 BMI ≈ 3.33 低于合理下限
    expect(() => evaluateBmi(300, 30)).toThrow('BMI 超出合理范围');
  });
});
