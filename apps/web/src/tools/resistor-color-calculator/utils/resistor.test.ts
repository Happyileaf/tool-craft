import { describe, it, expect } from 'vitest';
import {
  COLORS,
  decodeBands,
  encodeOhms,
  formatOhms,
  nearestStandard,
  suggestSeries,
  eSeriesBase,
} from './resistor';

describe('decodeBands fixed vectors', () => {
  it('decodes 棕黑红金 = 1 kΩ ±5%', () => {
    const r = decodeBands(4, ['brown', 'black', 'red', 'gold']);
    expect(r.error).toBeNull();
    expect(r.significant).toBe(10);
    expect(r.multiplier).toBe(100);
    expect(r.ohms).toBe(1000);
    expect(r.tolerancePercent).toBe(5);
    expect(r.minOhms).toBeCloseTo(950, 6);
    expect(r.maxOhms).toBeCloseTo(1050, 6);
    expect(r.display).toBe('1 kΩ');
  });

  it('decodes 红红橙金 = 22 kΩ ±5%', () => {
    const r = decodeBands(4, ['red', 'red', 'orange', 'gold']);
    expect(r.error).toBeNull();
    expect(r.ohms).toBe(22000);
    expect(r.tolerancePercent).toBe(5);
    expect(r.display).toBe('22 kΩ');
    expect(r.minOhms).toBeCloseTo(20900, 6);
    expect(r.maxOhms).toBeCloseTo(23100, 6);
  });

  it('decodes 棕黑黑棕棕 = 1 kΩ ±1% (5-band precision)', () => {
    const r = decodeBands(5, ['brown', 'black', 'black', 'brown', 'brown']);
    expect(r.error).toBeNull();
    expect(r.significant).toBe(100);
    expect(r.multiplier).toBe(10);
    expect(r.ohms).toBe(1000);
    expect(r.tolerancePercent).toBe(1);
    expect(r.minOhms).toBeCloseTo(990, 6);
    expect(r.maxOhms).toBeCloseTo(1010, 6);
  });

  it('decodes a 6-band resistor with temperature coefficient', () => {
    // 棕黑黑红棕红 = 100 × 100 = 10 kΩ ±1%, 50 ppm/K
    const r = decodeBands(6, ['brown', 'black', 'black', 'red', 'brown', 'red']);
    expect(r.error).toBeNull();
    expect(r.ohms).toBe(10000);
    expect(r.tolerancePercent).toBe(1);
    expect(r.tempColor).toBe('red');
    expect(r.tempCoeff).toBe(50);
  });

  it('decodes sub-ohm values with gold/silver multiplier', () => {
    // 绿黑金 = 50 × 0.1 = 5 Ω ±5%
    expect(decodeBands(4, ['green', 'black', 'gold', 'gold']).ohms).toBeCloseTo(5, 9);
    // 绿黑银金 = 50 × 0.01 = 0.5 Ω ±5%
    expect(decodeBands(4, ['green', 'black', 'silver', 'gold']).ohms).toBeCloseTo(0.5, 9);
  });

  it('rejects illegal band sequences', () => {
    // 金色不能作首位有效数字
    expect(decodeBands(4, ['gold', 'black', 'red', 'gold']).error).toMatch(/有效数字/);
    // 黑色不能作误差环
    expect(decodeBands(4, ['brown', 'black', 'red', 'black']).error).toMatch(/误差环/);
    // 长度不符
    expect(decodeBands(5, ['brown', 'black', 'red', 'gold']).error).toMatch(/需要 5/);
    // 灰色不能作温度系数环
    expect(decodeBands(6, ['brown', 'black', 'black', 'red', 'brown', 'gray']).error).toMatch(
      /温度系数/,
    );
  });
});

describe('encodeOhms reverse direction', () => {
  it('encodes 1 kΩ with 2 significant digits → 棕黑红金', () => {
    const r = encodeOhms(1000, 2, 5);
    expect(r.error).toBeNull();
    expect(r.bands).toEqual(['brown', 'black', 'red', 'gold']);
  });

  it('encodes 22 kΩ → 红红橙金', () => {
    const r = encodeOhms(22000, 2, 5);
    expect(r.error).toBeNull();
    expect(r.bands).toEqual(['red', 'red', 'orange', 'gold']);
  });

  it('encodes 1 kΩ with 3 significant digits → 棕黑黑棕棕', () => {
    const r = encodeOhms(1000, 3, 1);
    expect(r.error).toBeNull();
    expect(r.bands).toEqual(['brown', 'black', 'black', 'brown', 'brown']);
  });

  it('round-trips decode(encode(x)) for E24 samples', () => {
    const samples: Array<[number, 2 | 3]> = [
      [4700, 2],
      [4700, 3],
      [680, 2],
      [91000, 2],
      [100000, 2],
    ];
    samples.forEach(([ohms, sig]) => {
      const enc = encodeOhms(ohms, sig, sig === 2 ? 5 : 1);
      expect(enc.error).toBeNull();
      const bandCount = (sig === 2 ? 4 : 5) as 4 | 5;
      const dec = decodeBands(bandCount, enc.bands);
      expect(dec.error).toBeNull();
      expect(dec.ohms).toBe(ohms);
    });
  });

  it('rejects 0 Ω and non-representable values', () => {
    expect(encodeOhms(0, 2).error).toMatch(/跨接/);
    expect(encodeOhms(1055, 3, 1).error).toMatch(/无法/);
    expect(encodeOhms(-10, 2).error).toMatch(/非负/);
  });
});

describe('formatOhms', () => {
  it('picks unit and trims zeros', () => {
    expect(formatOhms(0)).toBe('0 Ω');
    expect(formatOhms(4.7)).toBe('4.7 Ω');
    expect(formatOhms(1000)).toBe('1 kΩ');
    expect(formatOhms(4700)).toBe('4.7 kΩ');
    expect(formatOhms(22000)).toBe('22 kΩ');
    expect(formatOhms(2200000)).toBe('2.2 MΩ');
    expect(formatOhms(1000000000)).toBe('1 GΩ');
  });
});

describe('E series nearest standard', () => {
  it('finds exact E12/E24/E96 values', () => {
    const e12 = nearestStandard(4700, 'E12');
    expect('error' in e12).toBe(false);
    if (!('error' in e12)) {
      expect(e12.isStandard).toBe(true);
      expect(e12.nearest).toBe(4700);
    }
    const e24 = nearestStandard(910, 'E24');
    if (!('error' in e24)) expect(e24.isStandard).toBe(true);
    const e96 = nearestStandard(4750, 'E96');
    if (!('error' in e96)) {
      expect(e96.isStandard).toBe(true);
      expect(e96.nearest).toBe(4750);
    }
  });

  it('suggests nearest E12 value for a non-standard input', () => {
    const r = nearestStandard(1050, 'E12');
    if ('error' in r) throw new Error('unexpected error');
    expect(r.nearest).toBe(1000);
    expect(r.isStandard).toBe(false);
    expect(r.deviationPercent).toBeCloseTo(-4.7619, 2);
  });

  it('rejects non-positive input', () => {
    expect(nearestStandard(0, 'E12')).toEqual({ error: '阻值必须为正数' });
  });

  it('has correct base series counts', () => {
    expect(eSeriesBase('E12')).toHaveLength(12);
    expect(eSeriesBase('E24')).toHaveLength(24);
    expect(eSeriesBase('E96')).toHaveLength(96);
  });
});

describe('suggestSeries', () => {
  it('maps tolerance to series', () => {
    expect(suggestSeries(5)).toBe('E12');
    expect(suggestSeries(2)).toBe('E24');
    expect(suggestSeries(1)).toBe('E96');
  });
});

describe('COLORS table integrity', () => {
  it('assigns digits 0-9 to black..white uniquely', () => {
    const digits = COLORS.map((c) => c.digit).filter((d): d is number => d !== null);
    expect(digits).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
