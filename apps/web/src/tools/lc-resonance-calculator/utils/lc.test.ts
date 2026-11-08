import { describe, it, expect } from 'vitest';
import {
  toSi,
  resonantFrequency,
  inductanceForFrequency,
  capacitanceForFrequency,
  inductiveReactance,
  capacitiveReactance,
  pickEngineeringUnit,
  INDUCTANCE_UNITS,
  CAPACITANCE_UNITS,
  FREQUENCY_UNITS,
  STANDARD_LC_PAIRS,
} from './lc';

describe('unit conversion', () => {
  it('converts engineering units to SI base', () => {
    expect(toSi(100, 'µH', INDUCTANCE_UNITS)).toBeCloseTo(1e-4, 12);
    expect(toSi(100, 'pF', CAPACITANCE_UNITS)).toBeCloseTo(1e-10, 18);
    expect(toSi(1.5, 'MHz', FREQUENCY_UNITS)).toBe(1.5e6);
    expect(toSi(2.2, 'nF', CAPACITANCE_UNITS)).toBeCloseTo(2.2e-9, 15);
  });

  it('rejects unknown units and non-finite values', () => {
    expect(() => toSi(1, 'xH', INDUCTANCE_UNITS)).toThrow('不支持的单位');
    expect(() => toSi(Number.NaN, 'H', INDUCTANCE_UNITS)).toThrow('有限数');
  });
});

describe('resonantFrequency', () => {
  it('matches the spec case 100µH / 100pF ≈ 1.5915 MHz', () => {
    const f0 = resonantFrequency(100e-6, 100e-12);
    expect(f0).toBeCloseTo(1.591549e6, -2);
  });

  it('rejects non-positive L or C', () => {
    expect(() => resonantFrequency(0, 1e-9)).toThrow('正数');
    expect(() => resonantFrequency(1e-6, -1)).toThrow('正数');
  });
});

describe('reverse solving L and C', () => {
  it('round trips f0 -> L -> f0', () => {
    const f0 = resonantFrequency(100e-6, 100e-12);
    const solvedL = inductanceForFrequency(f0, 100e-12);
    expect(solvedL).toBeCloseTo(100e-6, 12);
    expect(resonantFrequency(solvedL, 100e-12)).toBeCloseTo(f0, 6);
  });

  it('round trips f0 -> C -> f0', () => {
    const f0 = resonantFrequency(10e-6, 1e-9);
    const solvedC = capacitanceForFrequency(f0, 10e-6);
    expect(solvedC).toBeCloseTo(1e-9, 15);
  });

  it('rejects non-positive inputs', () => {
    expect(() => inductanceForFrequency(0, 1e-9)).toThrow('正数');
    expect(() => capacitanceForFrequency(1e6, 0)).toThrow('正数');
  });
});

describe('reactance', () => {
  it('computes inductive and capacitive reactance', () => {
    // Xl = 2π × 1kHz × 10mH ≈ 62.83 Ω
    expect(inductiveReactance(1000, 10e-3)).toBeCloseTo(62.8319, 3);
    // Xc = 1 / (2π × 1kHz × 1µF) ≈ 159.15 Ω
    expect(capacitiveReactance(1000, 1e-6)).toBeCloseTo(159.1549, 3);
  });

  it('satisfies Xl = Xc at resonance', () => {
    const l = 100e-6;
    const c = 100e-12;
    const f0 = resonantFrequency(l, c);
    expect(inductiveReactance(f0, l)).toBeCloseTo(capacitiveReactance(f0, c), 6);
  });
});

describe('pickEngineeringUnit', () => {
  it('selects the largest fitting unit', () => {
    const freq = pickEngineeringUnit(1.5e6, FREQUENCY_UNITS);
    expect(freq.unit).toBe('MHz');
    expect(freq.value).toBeCloseTo(1.5, 10);
    const inductance = pickEngineeringUnit(100e-6, INDUCTANCE_UNITS);
    expect(inductance.unit).toBe('µH');
    expect(inductance.value).toBeCloseTo(100, 10);
    expect(pickEngineeringUnit(100e-12, CAPACITANCE_UNITS)).toMatchObject({ unit: 'pF' });
  });

  it('falls back to the smallest unit for tiny values', () => {
    expect(pickEngineeringUnit(1e-15, CAPACITANCE_UNITS).unit).toBe('pF');
  });
});

describe('standard pair reference table', () => {
  it('every reference pair has positive L and C', () => {
    for (const pair of STANDARD_LC_PAIRS) {
      expect(pair.inductanceH).toBeGreaterThan(0);
      expect(pair.capacitanceF).toBeGreaterThan(0);
      expect(Number.isFinite(resonantFrequency(pair.inductanceH, pair.capacitanceF))).toBe(true);
    }
  });
});
