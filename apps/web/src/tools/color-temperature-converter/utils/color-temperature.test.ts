import { describe, it, expect } from 'vitest';
import {
  colorInputToCct,
  kelvinToRgb,
  MAX_KELVIN,
  MIN_KELVIN,
  parseColor,
  rgbToCct,
  rgbToHex,
} from './color-temperature';

describe('kelvinToRgb', () => {
  it('produces warm orange light at low temperature', () => {
    // 1900K 烛光：红通道接近满值，蓝通道为 0
    const warm = kelvinToRgb(1900);
    expect(warm.r).toBe(255);
    expect(warm.g).toBeGreaterThan(100);
    expect(warm.g).toBeLessThan(180);
    expect(warm.b).toBe(0);
  });

  it('produces cool blue-biased light at high temperature', () => {
    const cool = kelvinToRgb(10000);
    expect(cool.b).toBe(255);
    expect(cool.r).toBeGreaterThan(140);
    expect(cool.r).toBeLessThan(230);
  });

  it('is monotonic: blue grows and red falls past 6600K', () => {
    const at7k = kelvinToRgb(7000);
    const at12k = kelvinToRgb(12000);
    expect(at12k.b).toBeGreaterThanOrEqual(at7k.b);
    expect(at12k.r).toBeLessThanOrEqual(at7k.r);
  });

  it('clamps out-of-range temperatures to 1000K–40000K', () => {
    expect(kelvinToRgb(100)).toEqual(kelvinToRgb(MIN_KELVIN));
    expect(kelvinToRgb(99999)).toEqual(kelvinToRgb(MAX_KELVIN));
  });

  it('returns integer channels in 0–255', () => {
    for (const k of [1000, 2500, 5000, 6600, 15000, 40000]) {
      const { r, g, b } = kelvinToRgb(k);
      for (const c of [r, g, b]) {
        expect(Number.isInteger(c)).toBe(true);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(255);
      }
    }
  });
});

describe('rgbToHex', () => {
  it('formats uppercase zero-padded hex', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF');
    expect(rgbToHex({ r: 10, g: 160, b: 255 })).toBe('#0AA0FF');
  });
});

describe('parseColor', () => {
  it('parses hex and rgb() forms', () => {
    expect(parseColor('#ff8800')).toEqual({ r: 255, g: 136, b: 0 });
    expect(parseColor('#f80')).toEqual({ r: 255, g: 136, b: 0 });
    expect(parseColor('rgb(255, 136, 0)')).toEqual({ r: 255, g: 136, b: 0 });
    expect(parseColor('RGB(1,2,3)')).toEqual({ r: 1, g: 2, b: 3 });
  });

  it('rejects malformed or out-of-range input', () => {
    expect(parseColor('#gg0000')).toBeNull();
    expect(parseColor('rgb(256,0,0)')).toBeNull();
    expect(parseColor('orange')).toBeNull();
  });
});

describe('rgbToCct', () => {
  it('round-trips a mid-range Kelvin value approximately', () => {
    // McCamy 近似，允许 8% 误差
    const rgb = kelvinToRgb(5000);
    const cct = rgbToCct(rgb);
    expect(cct).toBeGreaterThan(4600);
    expect(cct).toBeLessThan(5400);
  });

  it('orders warm and cool colors correctly', () => {
    const warmCct = rgbToCct(kelvinToRgb(2700));
    const coolCct = rgbToCct(kelvinToRgb(8000));
    expect(coolCct).toBeGreaterThan(warmCct);
  });

  it('throws on pure black', () => {
    expect(() => rgbToCct({ r: 0, g: 0, b: 0 })).toThrow(/纯黑/);
  });
});

describe('colorInputToCct', () => {
  it('returns an error object instead of throwing', () => {
    expect(colorInputToCct('not-a-color').error).toContain('无法识别');
    expect(colorInputToCct('#000000').error).toContain('纯黑');
    const result = colorInputToCct('#FFFFFF');
    expect(result.error).toBeNull();
    expect(result.cct).not.toBeNull();
  });
});
