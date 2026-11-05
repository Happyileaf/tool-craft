import { describe, it, expect } from 'vitest';
import {
  solveLc,
  suggestCombinations,
  formatInductance,
  formatCapacitance,
  formatFrequency,
  formatReactance,
  formatAngularFrequency,
} from './lc';

describe('solveLc lc mode (L + C -> f₀)', () => {
  it('matches the idea acceptance vector L=100µH, C=100pF -> f₀≈1.5915 MHz', () => {
    const result = solveLc({
      mode: 'lc',
      L: { value: 100, factor: 1e-6 },
      C: { value: 100, factor: 1e-12 },
    });
    // f = 1/(2π√(1e-4 · 1e-10)) = 1/(2π·1e-7) ≈ 1591549.43 Hz
    expect(result.f).toBeCloseTo(1591549.43, 2);
    expect(result.omega).toBeCloseTo(1e7, 4);
    expect(result.formula).toBe('f₀ = 1 / (2π√(LC))');
  });

  it('keeps L and C in base units and Xl equals Xc at resonance', () => {
    const result = solveLc({
      mode: 'lc',
      L: { value: 1, factor: 1e-3 },
      C: { value: 1, factor: 1e-6 },
    });
    expect(result.L).toBe(1e-3);
    expect(result.C).toBe(1e-6);
    expect(result.f).toBeCloseTo(5032.921, 3);
    expect(result.Xl).not.toBeNull();
    expect(result.Xc).not.toBeNull();
    expect(result.Xl ?? 0).toBeCloseTo(result.Xc ?? 0, 9);
  });
});

describe('solveLc inverse modes', () => {
  it('lf mode derives C = 1/(4π²f²L)', () => {
    const result = solveLc({
      mode: 'lf',
      L: { value: 100, factor: 1e-6 },
      f: { value: 1591549.43, factor: 1 },
    });
    expect(result.C ?? 0).toBeCloseTo(1e-10, 18);
  });

  it('cf mode derives L = 1/(4π²f²C)', () => {
    const result = solveLc({
      mode: 'cf',
      C: { value: 100, factor: 1e-12 },
      f: { value: 1591549.43, factor: 1 },
    });
    expect(result.L ?? 0).toBeCloseTo(1e-4, 12);
  });

  it('inverse round-trips the forward resonance frequency', () => {
    const forward = solveLc({
      mode: 'lc',
      L: { value: 10, factor: 1e-6 },
      C: { value: 220, factor: 1e-12 },
    });
    const back = solveLc({
      mode: 'cf',
      C: { value: 220, factor: 1e-12 },
      f: { value: forward.f, factor: 1 },
    });
    expect(back.L ?? 0).toBeCloseTo(1e-5, 12);
  });
});

describe('solveLc reactance modes', () => {
  it('xl mode: Xl = 2πfL', () => {
    const result = solveLc({
      mode: 'xl',
      L: { value: 10, factor: 1e-3 },
      f: { value: 1, factor: 1e3 },
    });
    // 2π · 1000 · 0.01 ≈ 62.8319 Ω
    expect(result.Xl ?? 0).toBeCloseTo(62.8319, 4);
    expect(result.Xc).toBeNull();
    expect(result.C).toBeNull();
    expect(result.formula).toBe('Xl = 2πfL');
  });

  it('xc mode: Xc = 1/(2πfC)', () => {
    const result = solveLc({
      mode: 'xc',
      C: { value: 100, factor: 1e-9 },
      f: { value: 1, factor: 1e3 },
    });
    // 1/(2π · 1000 · 1e-7) ≈ 1591.55 Ω
    expect(result.Xc ?? 0).toBeCloseTo(1591.549, 2);
    expect(result.Xl).toBeNull();
    expect(result.L).toBeNull();
  });
});

describe('solveLc validation', () => {
  it('throws on zero or negative values', () => {
    expect(() =>
      solveLc({ mode: 'lc', L: { value: 0, factor: 1e-6 }, C: { value: 100, factor: 1e-12 } }),
    ).toThrow(/必须为正数/);
    expect(() =>
      solveLc({ mode: 'xc', C: { value: -1, factor: 1e-9 }, f: { value: 1, factor: 1e3 } }),
    ).toThrow(/必须为正数/);
  });

  it('throws on missing inputs with the quantity name', () => {
    expect(() => solveLc({ mode: 'lf', L: { value: 1, factor: 1e-6 } })).toThrow(/谐振频率/);
    expect(() => solveLc({ mode: 'xl', f: { value: 1, factor: 1e3 } })).toThrow(/电感/);
  });
});

describe('suggestCombinations', () => {
  it('returns one inductance per standard capacitance, each retuning to the target', () => {
    const target = 1e6;
    const list = suggestCombinations(target);
    expect(list).toHaveLength(13);
    for (const { capacitance, inductance } of list) {
      expect(inductance).toBeGreaterThan(0);
      const retuned = 1 / (2 * Math.PI * Math.sqrt(inductance * capacitance));
      expect(retuned).toBeCloseTo(target, 6);
    }
  });

  it('rejects non-positive target frequencies', () => {
    expect(() => suggestCombinations(0)).toThrow(/必须为正数/);
  });
});

describe('formatters', () => {
  it('picks adaptive prefixes for each quantity', () => {
    const indNano = formatInductance(1e-7);
    expect(indNano.unit).toBe('nH');
    expect(indNano.value).toBeCloseTo(100, 9);
    const indMicro = formatInductance(1e-4);
    expect(indMicro.unit).toBe('µH');
    expect(indMicro.value).toBeCloseTo(100, 9);
    const capPico = formatCapacitance(1e-10);
    expect(capPico.unit).toBe('pF');
    expect(capPico.value).toBeCloseTo(100, 9);
    const capNano = formatCapacitance(4.7e-9);
    expect(capNano.unit).toBe('nF');
    expect(capNano.value).toBeCloseTo(4.7, 9);
    expect(formatFrequency(1591549.43).unit).toBe('MHz');
    expect(formatFrequency(1591549.43).value).toBeCloseTo(1.59154943, 5);
    expect(formatReactance(1591.55)).toEqual({ value: 1.59155, unit: 'kΩ' });
    expect(formatAngularFrequency(1e7)).toEqual({ value: 10, unit: 'Mrad/s' });
  });
});
