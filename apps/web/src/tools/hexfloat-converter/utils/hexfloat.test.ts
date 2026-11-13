import { describe, expect, it } from 'vitest';

import { parseHexfloat, toHexfloat } from './hexfloat';

describe('parseHexfloat', () => {
  it('parses integer and fractional mantissa with binary exponent', () => {
    expect(parseHexfloat('0x1.8p+1').value).toBe(3);
    expect(parseHexfloat('0x1.8p+1').ok).toBe(true);
    expect(parseHexfloat('0x1p-4').value).toBe(0.0625);
    expect(parseHexfloat('-0x1.f4p+3').value).toBeCloseTo(-15.625, 10);
    expect(parseHexfloat('0X1P0').value).toBe(1);
  });

  it('parses exponent-less and leading-dot forms', () => {
    expect(parseHexfloat('0x1p0').value).toBe(1);
    expect(parseHexfloat('0x.8p1').value).toBe(1);
    expect(parseHexfloat('0x10').value).toBe(16);
    expect(parseHexfloat('+0x2p-1').value).toBe(1);
  });

  it('handles zero and signed zero', () => {
    expect(parseHexfloat('0x0p+0').value).toBe(0);
    const negZero = parseHexfloat('-0x0p0');
    expect(negZero.ok).toBe(true);
    expect(Object.is(negZero.value, -0)).toBe(true);
  });

  it('tolerates float suffixes', () => {
    expect(parseHexfloat('0x1.8p1f').value).toBe(3);
    expect(parseHexfloat('0x1p0L').value).toBe(1);
  });

  it('rejects malformed input with an error instead of throwing', () => {
    expect(parseHexfloat('').ok).toBe(false);
    expect(parseHexfloat('1.8p1').ok).toBe(false);
    expect(parseHexfloat('0x').ok).toBe(false);
    expect(parseHexfloat('0x1p').ok).toBe(false);
    expect(parseHexfloat('0x1.zz').ok).toBe(false);
    expect(parseHexfloat('0x1.8p+1abc').ok).toBe(false);
  });
});

describe('toHexfloat', () => {
  it('emits canonical 0x1.xxxp±n form', () => {
    expect(toHexfloat(3)).toBe('0x1.8000000000000p+1');
    expect(toHexfloat(1)).toBe('0x1.0000000000000p+0');
    expect(toHexfloat(0.1)).toBe('0x1.999999999999ap-4');
    expect(toHexfloat(0.0625)).toBe('0x1.0000000000000p-4');
  });

  it('handles sign, zeros and special values', () => {
    expect(toHexfloat(-15.625)).toBe('-0x1.f400000000000p+3');
    expect(toHexfloat(0)).toBe('0x0p+0');
    expect(toHexfloat(-0)).toBe('-0x0p+0');
    expect(toHexfloat(Infinity)).toBe('inf');
    expect(toHexfloat(-Infinity)).toBe('-inf');
    expect(toHexfloat(NaN)).toBe('nan');
  });

  it('handles subnormal numbers', () => {
    const smallest = Number.MIN_VALUE; // 5e-324, smallest positive subnormal
    const hex = toHexfloat(smallest);
    expect(hex.startsWith('0x1.')).toBe(true);
    expect(parseHexfloat(hex).value).toBe(smallest);
  });

  it('round-trips arbitrary finite values exactly', () => {
    const samples = [1, 2, 3.14159, -273.15, 1e100, 1 / 3, 65536, 0.5, -0.000123];
    for (const n of samples) {
      const back = parseHexfloat(toHexfloat(n));
      expect(back.ok).toBe(true);
      expect(back.value).toBe(n);
    }
  });
});
