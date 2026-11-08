import { describe, it, expect } from 'vitest';
import {
  alcoholGramsForDrink,
  calculateBac,
  bacToPermille,
  formatDurationHours,
  DEFAULT_R_FACTOR,
  type BacInput,
} from './bac';

const baseInput: BacInput = {
  weightKg: 70,
  gender: 'male',
  elapsedHours: 0,
  drinks: [
    { name: '啤酒', volumeMl: 500, abvPercent: 5, quantity: 2 },
    { name: '红酒', volumeMl: 150, abvPercent: 12, quantity: 1 },
  ],
};

describe('alcoholGramsForDrink', () => {
  it('computes pure ethanol mass with density 0.789', () => {
    // 500mL × 5% = 25mL ethanol × 0.789 = 19.725g
    expect(
      alcoholGramsForDrink({ name: 'beer', volumeMl: 500, abvPercent: 5, quantity: 1 }),
    ).toBeCloseTo(19.725, 6);
  });

  it('multiplies by quantity', () => {
    expect(
      alcoholGramsForDrink({ name: 'beer', volumeMl: 500, abvPercent: 5, quantity: 3 }),
    ).toBeCloseTo(59.175, 6);
  });

  it('rejects negative inputs', () => {
    expect(() =>
      alcoholGramsForDrink({ name: 'x', volumeMl: -1, abvPercent: 5, quantity: 1 }),
    ).toThrow('非负');
  });
});

describe('calculateBac', () => {
  it('matches the Widmark formula at peak (elapsed = 0)', () => {
    const result = calculateBac(baseInput);
    // 50mL + 18mL = 68mL ethanol × 0.789 = 53.652g
    expect(result.totalAlcoholGrams).toBeCloseTo(53.652, 6);
    // 53.652 / (70 × 0.68 × 10) ≈ 0.1127
    expect(result.peakBac).toBeCloseTo(0.1127, 4);
    expect(result.currentBac).toBeCloseTo(result.peakBac, 6);
    expect(result.rFactor).toBe(DEFAULT_R_FACTOR.male);
  });

  it('deducts elimination linearly and never goes below zero', () => {
    const afterTwo = calculateBac({ ...baseInput, elapsedHours: 2 });
    expect(afterTwo.currentBac).toBeCloseTo(0.1127 - 0.03, 4);
    const longAfter = calculateBac({ ...baseInput, elapsedHours: 100 });
    expect(longAfter.currentBac).toBe(0);
    expect(longAfter.hoursToSober).toBe(0);
  });

  it('uses the female r factor by default and supports custom r', () => {
    const female = calculateBac({ ...baseInput, gender: 'female' });
    expect(female.rFactor).toBe(0.55);
    expect(female.peakBac).toBeCloseTo(53.652 / (70 * 0.55 * 10), 4);

    const custom = calculateBac({ ...baseInput, rFactor: 0.6 });
    expect(custom.rFactor).toBe(0.6);
  });

  it('counts standard drinks at 14g each', () => {
    const result = calculateBac(baseInput);
    expect(result.totalStandardDrinks).toBeCloseTo(53.652 / 14, 6);
    expect(result.details[0]!.standardDrinks).toBeCloseTo(39.45 / 14, 6);
  });

  it('rejects invalid weight, elapsed time and r factor', () => {
    expect(() => calculateBac({ ...baseInput, weightKg: 0 })).toThrow('体重');
    expect(() => calculateBac({ ...baseInput, elapsedHours: -1 })).toThrow('经过时长');
    expect(() => calculateBac({ ...baseInput, rFactor: 0 })).toThrow('r 因子');
  });
});

describe('formatting helpers', () => {
  it('converts BAC g/100mL to permille', () => {
    expect(bacToPermille(0.08)).toBe(0.8);
  });

  it('formats fractional hours in Chinese', () => {
    expect(formatDurationHours(0)).toBe('0 分钟');
    expect(formatDurationHours(0.5)).toBe('30 分钟');
    expect(formatDurationHours(2)).toBe('2 小时');
    expect(formatDurationHours(2.5)).toBe('2 小时 30 分钟');
  });
});
