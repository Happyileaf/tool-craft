import { describe, it, expect } from 'vitest';
import {
  solveRc,
  formatResistance,
  formatCapacitance,
  formatFrequency,
  formatTime,
  formatAngularFrequency,
} from './rc';

describe('solveRc rc mode (R + C -> fc)', () => {
  it('matches the textbook vector R=1kΩ, C=1µF -> fc≈159.15 Hz, τ=1 ms', () => {
    const result = solveRc({
      mode: 'rc',
      R: { value: 1, factor: 1e3 },
      C: { value: 1, factor: 1e-6 },
    });
    expect(result.fc).toBeCloseTo(159.154943, 5);
    expect(result.tau).toBeCloseTo(0.001, 12);
    expect(result.omega).toBeCloseTo(1000, 5);
    expect(result.formula).toBe('fc = 1 / (2πRC)');
  });

  it('keeps R and C in base units', () => {
    const result = solveRc({
      mode: 'rc',
      R: { value: 10, factor: 1e3 },
      C: { value: 100, factor: 1e-9 },
    });
    expect(result.R).toBe(10000);
    expect(result.C).toBeCloseTo(1e-7, 20);
    expect(result.fc).toBeCloseTo(159.154943, 5);
  });
});

describe('solveRc rf mode (R + fc -> C)', () => {
  it('derives C = 1/(2π·fc·R)', () => {
    const result = solveRc({
      mode: 'rf',
      R: { value: 1, factor: 1e3 },
      fc: { value: 159.154943, factor: 1 },
    });
    expect(result.C).toBeCloseTo(1e-6, 9);
    expect(result.tau).toBeCloseTo(0.001, 8);
  });
});

describe('solveRc cf mode (C + fc -> R)', () => {
  it('derives R = 1/(2π·fc·C)', () => {
    const result = solveRc({
      mode: 'cf',
      C: { value: 1, factor: 1e-6 },
      fc: { value: 159.154943, factor: 1 },
    });
    expect(result.R).toBeCloseTo(1000, 2);
  });

  it('audio example: 10 nF at 1 kHz needs ~15.9 kΩ', () => {
    const result = solveRc({
      mode: 'cf',
      C: { value: 10, factor: 1e-9 },
      fc: { value: 1, factor: 1e3 },
    });
    expect(result.R).toBeCloseTo(15915.494, 2);
  });
});

describe('solveRc input validation', () => {
  it('throws on zero or negative values', () => {
    expect(() =>
      solveRc({ mode: 'rc', R: { value: 0, factor: 1 }, C: { value: 1, factor: 1e-6 } }),
    ).toThrow(/必须为正数/);
    expect(() =>
      solveRc({ mode: 'rf', R: { value: -1, factor: 1e3 }, fc: { value: 1, factor: 1 } }),
    ).toThrow(/必须为正数/);
  });

  it('throws on missing inputs', () => {
    expect(() => solveRc({ mode: 'cf', C: { value: 1, factor: 1e-6 } })).toThrow(/截止频率/);
  });
});

describe('adaptive unit formatting', () => {
  it('formats resistance with kΩ/MΩ prefixes', () => {
    expect(formatResistance(470)).toEqual({ value: 470, unit: 'Ω' });
    expect(formatResistance(15915).value).toBeCloseTo(15.915, 3);
    expect(formatResistance(15915).unit).toBe('kΩ');
    expect(formatResistance(2.2e6).unit).toBe('MΩ');
  });

  it('formats capacitance with pF/nF/µF prefixes', () => {
    expect(formatCapacitance(1e-6).unit).toBe('µF');
    expect(formatCapacitance(1e-6).value).toBeCloseTo(1, 9);
    expect(formatCapacitance(10e-9)).toEqual({ value: 10, unit: 'nF' });
    expect(formatCapacitance(220e-12)).toEqual({ value: 220, unit: 'pF' });
    expect(formatCapacitance(2.2)).toEqual({ value: 2.2, unit: 'F' });
  });

  it('formats frequency and time', () => {
    expect(formatFrequency(159.15).unit).toBe('Hz');
    expect(formatFrequency(159.15).value).toBeCloseTo(159.15, 2);
    expect(formatFrequency(10000).unit).toBe('kHz');
    expect(formatTime(0.001)).toEqual({ value: 1, unit: 'ms' });
    expect(formatTime(2.2e-6).value).toBeCloseTo(2.2, 9);
    expect(formatTime(2.2e-6).unit).toBe('µs');
  });

  it('formats angular frequency', () => {
    expect(formatAngularFrequency(1000)).toEqual({ value: 1, unit: 'krad/s' });
    expect(formatAngularFrequency(314).unit).toBe('rad/s');
  });
});
