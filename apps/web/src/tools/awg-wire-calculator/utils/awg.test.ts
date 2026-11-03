import { describe, it, expect } from 'vitest';
import { calculateAwg, formatAwg, nearestAwgByDiameter, parseAwg } from './awg';

describe('parseAwg 线号解析', () => {
  it('普通整数线号', () => {
    expect(parseAwg('12')).toBe(12);
    expect(parseAwg('0')).toBe(0);
    expect(parseAwg('40')).toBe(40);
  });

  it('支持空格与大小写：" 2/0 " -> -1', () => {
    expect(parseAwg(' 2/0 ')).toBe(-1);
  });

  it('aught 线号 4/0..1/0 -> -3..0', () => {
    expect(parseAwg('4/0')).toBe(-3);
    expect(parseAwg('3/0')).toBe(-2);
    expect(parseAwg('2/0')).toBe(-1);
    expect(parseAwg('1/0')).toBe(0);
  });

  it('多零写法 0000/000/00', () => {
    expect(parseAwg('0000')).toBe(-3);
    expect(parseAwg('000')).toBe(-2);
    expect(parseAwg('00')).toBe(-1);
  });

  it('非法输入返回 null', () => {
    expect(parseAwg('')).toBeNull();
    expect(parseAwg('5/0')).toBeNull();
    expect(parseAwg('41')).toBeNull();
    expect(parseAwg('abc')).toBeNull();
  });
});

describe('formatAwg 显示', () => {
  it('aught 与普通线号', () => {
    expect(formatAwg(-3)).toBe('4/0 AWG');
    expect(formatAwg(-1)).toBe('2/0 AWG');
    expect(formatAwg(0)).toBe('0 AWG');
    expect(formatAwg(12)).toBe('12 AWG');
  });
});

describe('calculateAwg 标准向量（ASTM B258）', () => {
  it('36 AWG 直径恰为 0.127 mm', () => {
    const r = calculateAwg('36');
    expect(r.ok).toBe(true);
    expect(r.diameterMm).toBeCloseTo(0.127, 6);
  });

  it('12 AWG：直径 2.0525 mm，面积 3.310 mm²', () => {
    const r = calculateAwg('12');
    expect(r.diameterMm).toBeCloseTo(2.0525, 3);
    expect(r.areaMm2).toBeCloseTo(3.31, 2);
    expect(r.diameterIn).toBeCloseTo(0.0808, 4);
  });

  it('24 AWG：直径 0.511 mm，面积 0.2047 mm²', () => {
    const r = calculateAwg('24');
    expect(r.diameterMm).toBeCloseTo(0.5106, 3);
    expect(r.areaMm2).toBeCloseTo(0.2047, 3);
  });

  it('4/0 AWG：直径 11.684 mm，面积 107.22 mm²，211.6 kcmil', () => {
    const r = calculateAwg('4/0');
    expect(r.diameterMm).toBeCloseTo(11.684, 2);
    expect(r.areaMm2).toBeCloseTo(107.22, 1);
    expect(r.kcmil).toBeCloseTo(211.6, 1);
  });

  it('10 AWG 电阻 ≈ 3.277 Ω/km（20 ℃ 铜）', () => {
    const r = calculateAwg('10');
    expect(r.ohmsPerKm).toBeCloseTo(3.277, 1);
    expect(r.ohmsPer1000Ft).toBeCloseTo(0.9989, 1);
  });

  it('线号每减 3 面积翻倍（直径乘 √2）；减 6 直径约翻倍（10 AWG 基准）', () => {
    const g10 = calculateAwg('10');
    const g13 = calculateAwg('13');
    const g16 = calculateAwg('16');
    expect(g10.diameterMm! / g13.diameterMm!).toBeCloseTo(Math.SQRT2, 2);
    expect(g10.areaMm2! / g13.areaMm2!).toBeCloseTo(2.005, 2);
    expect(g10.diameterMm! / g16.diameterMm!).toBeCloseTo(2.01, 2);
  });

  it('每 10 个线号面积约为 10.16 倍：10 AWG 对 20 AWG', () => {
    const g10 = calculateAwg('10');
    const g20 = calculateAwg('20');
    expect(g10.areaMm2! / g20.areaMm2!).toBeCloseTo(10.16, 1);
  });

  it('线号越大载流量越小', () => {
    const thick = calculateAwg('10');
    const thin = calculateAwg('20');
    expect(thick.ampacityA!).toBeGreaterThan(thin.ampacityA!);
  });

  it('非法输入给出中文原因', () => {
    const r = calculateAwg('99');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/线号/);
  });
});

describe('nearestAwgByDiameter 反查', () => {
  it('2.05 mm 反查到 12 AWG', () => {
    const r = nearestAwgByDiameter(2.0525);
    expect(r?.gauge).toBe(12);
    expect(r?.deviationPct).toBeLessThan(0.1);
  });

  it('0.51 mm 反查到 24 AWG', () => {
    expect(nearestAwgByDiameter(0.511)?.gauge).toBe(24);
  });

  it('11.7 mm 反查到 4/0（序号 -3）', () => {
    const r = nearestAwgByDiameter(11.7);
    expect(r?.gauge).toBe(-3);
  });

  it('非正数返回 null', () => {
    expect(nearestAwgByDiameter(0)).toBeNull();
    expect(nearestAwgByDiameter(-1)).toBeNull();
    expect(nearestAwgByDiameter(Number.NaN)).toBeNull();
  });
});
