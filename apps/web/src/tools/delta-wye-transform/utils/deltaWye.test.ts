import { describe, it, expect } from 'vitest';
import {
  deltaToWye,
  wyeToDelta,
  isBalanced,
  transform,
  parseResistance,
} from './deltaWye';

describe('deltaToWye (Δ → Y)', () => {
  it('balanced delta 30/30/30 Ω → wye 10/10/10 Ω (R_Y = R_Δ/3)', () => {
    const wye = deltaToWye({ rab: 30, rbc: 30, rca: 30 });
    expect(wye.ra).toBeCloseTo(10, 10);
    expect(wye.rb).toBeCloseTo(10, 10);
    expect(wye.rc).toBeCloseTo(10, 10);
  });

  it('textbook vector R_AB=150, R_BC=50, R_CA=100 Ω (sum=300)', () => {
    // R_A = 150·100/300 = 50；R_B = 150·50/300 = 25；R_C = 50·100/300 ≈ 16.6667
    const wye = deltaToWye({ rab: 150, rbc: 50, rca: 100 });
    expect(wye.ra).toBeCloseTo(50, 10);
    expect(wye.rb).toBeCloseTo(25, 10);
    expect(wye.rc).toBeCloseTo(50 / 3, 10);
  });

  it('acceptance vector R_AB=20, R_BC=30, R_CA=50 Ω (S=100) → R_A=10, R_B=6, R_C=15', () => {
    const wye = deltaToWye({ rab: 20, rbc: 30, rca: 50 });
    expect(wye.ra).toBeCloseTo(10, 10);
    expect(wye.rb).toBeCloseTo(6, 10);
    expect(wye.rc).toBeCloseTo(15, 10);
  });

  it('port-pair equivalence: wye two-arm series equals delta edge || (other two series)', () => {
    const delta = { rab: 20, rbc: 30, rca: 50 };
    const wye = deltaToWye(delta);
    const parallel = (a: number, b: number) => (a * b) / (a + b);
    // A-B 端口：Y 侧 R_A+R_B；Δ 侧 R_AB ∥ (R_BC+R_CA)
    expect(wye.ra + wye.rb).toBeCloseTo(parallel(delta.rab, delta.rbc + delta.rca), 9);
    expect(wye.rb + wye.rc).toBeCloseTo(parallel(delta.rbc, delta.rab + delta.rca), 9);
    expect(wye.rc + wye.ra).toBeCloseTo(parallel(delta.rca, delta.rab + delta.rbc), 9);
  });

  it('rejects non-positive or non-finite inputs with explicit errors', () => {
    expect(() => deltaToWye({ rab: 0, rbc: 10, rca: 10 })).toThrow('R_AB 必须为正数');
    expect(() => deltaToWye({ rab: -5, rbc: 10, rca: 10 })).toThrow('R_AB 必须为正数');
    expect(() => deltaToWye({ rab: Number.NaN, rbc: 10, rca: 10 })).toThrow('R_AB 不是有效数字');
    expect(() => deltaToWye({ rab: 10, rbc: Number.POSITIVE_INFINITY, rca: 10 })).toThrow();
  });
});

describe('wyeToDelta (Y → Δ)', () => {
  it('balanced wye 10/10/10 Ω → delta 30/30/30 Ω (R_Δ = 3·R_Y)', () => {
    const delta = wyeToDelta({ ra: 10, rb: 10, rc: 10 });
    expect(delta.rab).toBeCloseTo(30, 10);
    expect(delta.rbc).toBeCloseTo(30, 10);
    expect(delta.rca).toBeCloseTo(30, 10);
  });

  it('acceptance vector R_A=10, R_B=6, R_C=15 Ω → R_AB=20, R_BC=30, R_CA=50 (pair sum=300)', () => {
    const delta = wyeToDelta({ ra: 10, rb: 6, rc: 15 });
    expect(delta.rab).toBeCloseTo(20, 10);
    expect(delta.rbc).toBeCloseTo(30, 10);
    expect(delta.rca).toBeCloseTo(50, 10);
  });

  it('rejects non-positive or non-finite inputs with explicit errors', () => {
    expect(() => wyeToDelta({ ra: 0, rb: 10, rc: 10 })).toThrow('R_A 必须为正数');
    expect(() => wyeToDelta({ ra: 10, rb: -1, rc: 10 })).toThrow('R_B 必须为正数');
    expect(() => wyeToDelta({ ra: 10, rb: 10, rc: Number.NaN })).toThrow('R_C 不是有效数字');
  });
});

describe('round-trip equivalence', () => {
  it('delta → wye → delta restores the original resistors', () => {
    const original = { rab: 120, rbc: 47, rca: 82 };
    const back = wyeToDelta(deltaToWye(original));
    expect(back.rab).toBeCloseTo(original.rab, 9);
    expect(back.rbc).toBeCloseTo(original.rbc, 9);
    expect(back.rca).toBeCloseTo(original.rca, 9);
  });

  it('wye → delta → wye restores the original resistors', () => {
    const original = { ra: 33, rb: 22, rc: 11 };
    const back = deltaToWye(wyeToDelta(original));
    expect(back.ra).toBeCloseTo(original.ra, 9);
    expect(back.rb).toBeCloseTo(original.rb, 9);
    expect(back.rc).toBeCloseTo(original.rc, 9);
  });
});

describe('parseResistance unit suffix normalization', () => {
  it('parses plain numbers and k/M suffixes', () => {
    expect(parseResistance('330', 'R')).toBe(330);
    expect(parseResistance('1k', 'R')).toBe(1000);
    expect(parseResistance('2.2k', 'R')).toBe(2200);
    expect(parseResistance('2.2kΩ', 'R')).toBe(2200);
    expect(parseResistance('4.7M', 'R')).toBe(4.7e6);
    expect(parseResistance('100 Ω', 'R')).toBe(100);
  });

  it('rejects empty, malformed and non-positive inputs', () => {
    expect(() => parseResistance('', 'R')).toThrow('R 不能为空');
    expect(() => parseResistance('abc', 'R')).toThrow('R 格式无效');
    expect(() => parseResistance('0', 'R')).toThrow('R 必须为正数');
    expect(() => parseResistance('-5k', 'R')).toThrow('R 格式无效');
  });
});

describe('isBalanced / transform entry', () => {
  it('detects balanced and unbalanced networks', () => {
    expect(isBalanced([30, 30, 30])).toBe(true);
    expect(isBalanced([30, 30, 30.0001])).toBe(false);
    expect(isBalanced([])).toBe(false);
  });

  it('transform dispatches by direction', () => {
    expect(transform('delta-to-wye', { rab: 30, rbc: 30, rca: 30 })).toEqual({
      ra: 10,
      rb: 10,
      rc: 10,
    });
    expect(transform('wye-to-delta', { ra: 10, rb: 10, rc: 10 })).toEqual({
      rab: 30,
      rbc: 30,
      rca: 30,
    });
  });
});
