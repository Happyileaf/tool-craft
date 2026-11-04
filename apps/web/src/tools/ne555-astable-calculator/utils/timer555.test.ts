import { describe, it, expect } from 'vitest';
import {
  solveAstable,
  formatTime,
  formatFrequency,
  formatPercent,
} from './timer555';

const k = 1e3;
const u = 1e-6;

describe('solveAstable classic mode', () => {
  it('matches textbook vector R1=1kΩ, R2=1kΩ, C=1µF (t1≈1.386ms, t2≈0.693ms, f≈481Hz, D≈66.7%)', () => {
    const r = solveAstable({
      mode: 'classic',
      R1: { value: 1, factor: k },
      R2: { value: 1, factor: k },
      C: { value: 1, factor: u },
    });
    expect(r.tHigh).toBeCloseTo(1.386294e-3, 8);
    expect(r.tLow).toBeCloseTo(0.693147e-3, 8);
    expect(r.period).toBeCloseTo(2.079442e-3, 8);
    expect(r.frequency).toBeCloseTo(480.899, 2);
    expect(r.dutyCycle).toBeCloseTo(2 / 3, 6);
  });

  it('always yields duty cycle above 50% in classic mode', () => {
    const r = solveAstable({
      mode: 'classic',
      R1: { value: 1, factor: 1 },
      R2: { value: 1, factor: 1e6 },
      C: { value: 1, factor: 1e-9 },
    });
    expect(r.dutyCycle).toBeGreaterThan(0.5);
    expect(r.dutyCycle).toBeLessThan(0.501);
  });

  it('handles MΩ × pF unit combinations', () => {
    const r = solveAstable({
      mode: 'classic',
      R1: { value: 1, factor: 1e6 },
      R2: { value: 1, factor: 1e6 },
      C: { value: 100, factor: 1e-12 },
    });
    expect(r.period).toBeCloseTo(2.079442e-4, 9);
  });
});

describe('solveAstable diode mode', () => {
  it('t1 uses R1 only and R1=R2 gives ~50% duty cycle', () => {
    const r = solveAstable({
      mode: 'diode',
      R1: { value: 10, factor: k },
      R2: { value: 10, factor: k },
      C: { value: 100, factor: 1e-9 },
    });
    expect(r.tHigh).toBeCloseTo(r.tLow, 12);
    expect(r.dutyCycle).toBeCloseTo(0.5, 9);
    expect(r.tHigh).toBeCloseTo(Math.LN2 * 10 * k * 100e-9, 12);
  });

  it('duty cycle equals R1/(R1+R2)', () => {
    const r = solveAstable({
      mode: 'diode',
      R1: { value: 3, factor: k },
      R2: { value: 1, factor: k },
      C: { value: 1, factor: u },
    });
    expect(r.dutyCycle).toBeCloseTo(0.75, 9);
  });
});

describe('input validation', () => {
  it('throws on zero / negative / non-finite values', () => {
    const base = { mode: 'classic' as const };
    expect(() =>
      solveAstable({ ...base, R1: { value: 0, factor: 1 }, R2: { value: 1, factor: 1 }, C: { value: 1, factor: 1 } }),
    ).toThrowError('R1');
    expect(() =>
      solveAstable({ ...base, R1: { value: 1, factor: 1 }, R2: { value: -2, factor: 1 }, C: { value: 1, factor: 1 } }),
    ).toThrowError('R2');
    expect(() =>
      solveAstable({ ...base, R1: { value: 1, factor: 1 }, R2: { value: 1, factor: 1 }, C: { value: NaN, factor: 1 } }),
    ).toThrowError('C');
  });
});

describe('formatters', () => {
  it('formats time with adaptive prefixes', () => {
    expect(formatTime(2)).toEqual({ value: 2, unit: 's' });
    expect(formatTime(5e-3).unit).toBe('ms');
    expect(formatTime(5e-6).unit).toBe('µs');
    expect(formatTime(5e-9).unit).toBe('ns');
  });

  it('formats frequency with adaptive prefixes', () => {
    expect(formatFrequency(480.9)).toEqual({ value: 480.9, unit: 'Hz' });
    expect(formatFrequency(1500)).toEqual({ value: 1.5, unit: 'kHz' });
    expect(formatFrequency(3.2e6).unit).toBe('MHz');
  });

  it('formats duty cycle percent', () => {
    expect(formatPercent(2 / 3)).toBe('66.666667%');
    expect(formatPercent(0.5)).toBe('50%');
  });
});
