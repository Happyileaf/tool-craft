import { describe, it, expect } from 'vitest';
import {
  computeBmr,
  buildEnergyPlan,
  getActivityFactor,
  ACTIVITY_LEVELS,
  type BodyProfile,
} from './bmr';

const male: BodyProfile = { sex: 'male', age: 30, height: 180, weight: 80 };
const female: BodyProfile = { sex: 'female', age: 30, height: 165, weight: 60 };

describe('computeBmr Mifflin-St Jeor', () => {
  it('matches the standard male vector (80kg/180cm/30y -> 1780)', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(computeBmr(male, 'mifflin')).toBe(1780);
  });

  it('matches the standard female vector (60kg/165cm/30y -> 1381.25)', () => {
    // 600 + 1031.25 - 150 - 161 = 1320.25
    expect(computeBmr(female, 'mifflin')).toBeCloseTo(1320.25, 6);
  });

  it('defaults to Mifflin-St Jeor', () => {
    expect(computeBmr(male)).toBe(1780);
  });
});

describe('computeBmr Harris-Benedict revised', () => {
  it('matches the published male formula', () => {
    // 88.362 + 13.397*80 + 4.799*180 - 5.677*30 = 1853.632
    expect(computeBmr(male, 'harris-benedict')).toBeCloseTo(1853.632, 6);
  });

  it('matches the published female formula', () => {
    // 447.593 + 9.247*60 + 3.098*165 - 4.33*30 = 1383.683
    expect(computeBmr(female, 'harris-benedict')).toBeCloseTo(1383.683, 6);
  });
});

describe('input validation', () => {
  it('rejects out-of-range age, height and weight', () => {
    expect(() => computeBmr({ ...male, age: 0 })).toThrow(/年龄/);
    expect(() => computeBmr({ ...male, age: 200 })).toThrow(/年龄/);
    expect(() => computeBmr({ ...male, height: 10 })).toThrow(/身高/);
    expect(() => computeBmr({ ...male, weight: 5 })).toThrow(/体重/);
  });

  it('rejects non-finite numbers', () => {
    expect(() =>
      computeBmr({ sex: 'male', age: NaN, height: 180, weight: 80 }),
    ).toThrow(/有效数字/);
  });
});

describe('activity levels', () => {
  it('provides five factors from 1.2 to 1.9', () => {
    expect(ACTIVITY_LEVELS.map((level) => level.factor)).toEqual([
      1.2, 1.375, 1.55, 1.725, 1.9,
    ]);
  });

  it('looks up factors by key', () => {
    expect(getActivityFactor('sedentary')).toBe(1.2);
    expect(getActivityFactor('extra')).toBe(1.9);
    expect(() => getActivityFactor('unknown' as never)).toThrow(/未知活动水平/);
  });
});

describe('buildEnergyPlan', () => {
  it('computes TDEE and rounded calorie goals for the male vector', () => {
    const plan = buildEnergyPlan(male, 'mifflin', 'moderately');
    expect(plan.bmr).toBe(1780);
    expect(plan.tdee).toBeCloseTo(1780 * 1.55, 6);
    expect(plan.maintain).toBe(Math.round(1780 * 1.55));
    expect(plan.cut.min).toBe(Math.round(1780 * 1.55 * 0.75));
    expect(plan.cut.max).toBe(Math.round(1780 * 1.55 * 0.85));
    expect(plan.gain.min).toBe(Math.round(1780 * 1.55 * 1.05));
    expect(plan.gain.max).toBe(Math.round(1780 * 1.55 * 1.15));
  });

  it('orders the goals: cut < maintain < gain', () => {
    const plan = buildEnergyPlan(female, 'mifflin', 'lightly');
    expect(plan.cut.max).toBeLessThan(plan.maintain);
    expect(plan.maintain).toBeLessThan(plan.gain.min);
  });

  it('defaults to Mifflin + moderately active', () => {
    const plan = buildEnergyPlan(male);
    expect(plan.activityFactor).toBe(1.55);
    expect(plan.bmr).toBe(1780);
  });

  it('exposes a human-readable formula text', () => {
    expect(buildEnergyPlan(male).bmrFormulaText).toMatch(/10×体重/);
    expect(buildEnergyPlan(male, 'harris-benedict').bmrFormulaText).toMatch(/88\.362/);
    expect(buildEnergyPlan(female).bmrFormulaText).toMatch(/− 161/);
  });

  it('propagates validation errors', () => {
    expect(() => buildEnergyPlan({ ...male, age: 0 })).toThrow();
  });
});
