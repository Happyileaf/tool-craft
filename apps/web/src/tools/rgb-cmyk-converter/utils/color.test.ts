import { describe, expect, it } from 'vitest';
import {
  assertValidCmyk,
  assertValidRgb,
  cmykToRgb,
  fromCmyk,
  fromRgb,
  parseHex,
  rgbToCmyk,
  rgbToHex,
  rgbToHsl,
} from './color';

describe('rgbToCmyk 边界向量', () => {
  it('白色 (255,255,255) → 0/0/0/0', () => {
    expect(rgbToCmyk({ r: 255, g: 255, b: 255 })).toEqual({
      c: 0,
      m: 0,
      y: 0,
      k: 0,
    });
  });

  it('黑色 (0,0,0) → 0/0/0/100', () => {
    expect(rgbToCmyk({ r: 0, g: 0, b: 0 })).toEqual({
      c: 0,
      m: 0,
      y: 0,
      k: 100,
    });
  });

  it('纯红 (255,0,0) → 0/100/100/0', () => {
    expect(rgbToCmyk({ r: 255, g: 0, b: 0 })).toEqual({
      c: 0,
      m: 100,
      y: 100,
      k: 0,
    });
  });

  it('纯绿 (0,255,0) → 100/0/100/0', () => {
    expect(rgbToCmyk({ r: 0, g: 255, b: 0 })).toEqual({
      c: 100,
      m: 0,
      y: 100,
      k: 0,
    });
  });

  it('纯蓝 (0,0,255) → 100/100/0/0', () => {
    expect(rgbToCmyk({ r: 0, g: 0, b: 255 })).toEqual({
      c: 100,
      m: 100,
      y: 0,
      k: 0,
    });
  });

  it('中灰 (128,128,128) → 0/0/0/≈49.8', () => {
    const result = rgbToCmyk({ r: 128, g: 128, b: 128 });
    expect(result.c).toBe(0);
    expect(result.m).toBe(0);
    expect(result.y).toBe(0);
    // K = 1 − 128/255 ≈ 0.4980
    expect(result.k).toBeCloseTo(49.8, 1);
  });

  it('所有输出通道都在 0–100 之间', () => {
    const samples = [
      { r: 12, g: 200, b: 88 },
      { r: 200, g: 30, b: 150 },
      { r: 99, g: 99, b: 201 },
      { r: 1, g: 254, b: 130 },
    ];
    for (const rgb of samples) {
      const cmyk = rgbToCmyk(rgb);
      for (const value of Object.values(cmyk)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('cmykToRgb 边界向量', () => {
  it('0/0/0/0 → 白色', () => {
    expect(cmykToRgb({ c: 0, m: 0, y: 0, k: 0 })).toEqual({
      r: 255,
      g: 255,
      b: 255,
    });
  });

  it('0/0/0/100 → 黑色', () => {
    expect(cmykToRgb({ c: 0, m: 0, y: 0, k: 100 })).toEqual({
      r: 0,
      g: 0,
      b: 0,
    });
  });

  it('0/100/100/0 → 纯红', () => {
    expect(cmykToRgb({ c: 0, m: 100, y: 100, k: 0 })).toEqual({
      r: 255,
      g: 0,
      b: 0,
    });
  });

  it('所有输出通道都在 0–255 整数范围内', () => {
    const samples = [
      { c: 12.5, m: 30, y: 80, k: 10 },
      { c: 100, m: 0, y: 50, k: 20 },
      { c: 33.3, m: 66.6, y: 0, k: 5 },
      { c: 0, m: 0, y: 0, k: 49.8 },
    ];
    for (const cmyk of samples) {
      const rgb = cmykToRgb(cmyk);
      for (const value of Object.values(rgb)) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(255);
      }
    }
  });
});

describe('RGB ↔ CMYK 往返一致性', () => {
  const roundTripCases = [
    { r: 255, g: 255, b: 255 },
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 0, b: 0 },
    { r: 12, g: 200, b: 88 },
    { r: 200, g: 30, b: 150 },
    { r: 100, g: 100, b: 100 },
  ];

  for (const rgb of roundTripCases) {
    it(`RGB ${rgb.r},${rgb.g},${rgb.b} 经 CMYK 往返误差 ≤ 2/通道`, () => {
      const back = cmykToRgb(rgbToCmyk(rgb));
      expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(2);
    });
  }

  it('CMYK 百分比经 RGB 再回 CMYK：派生 black-generation 对 8 位量化敏感，允许固有漂移', () => {
    const original = { c: 30, m: 60, y: 10, k: 25 };
    // 固定向量：30/60/10/25 → R≈133.9 G≈76.5 B≈172.1，四舍五入为 134/77/172
    expect(cmykToRgb(original)).toEqual({ r: 134, g: 77, b: 172 });

    // 反向时 K 由 max(R,G,B) 派生，通道取整会放大为黑场漂移（10pp 内），
    // 这是经 8 位 RGB 中转的固有现象；严格往返由 RGB→CMYK→RGB 用例保证
    const back = rgbToCmyk(cmykToRgb(original));
    expect(back).toEqual({ c: 22.1, m: 55.2, y: 0, k: 32.5 });
    expect(Math.abs(back.c - original.c)).toBeLessThanOrEqual(10);
    expect(Math.abs(back.m - original.m)).toBeLessThanOrEqual(10);
    expect(Math.abs(back.y - original.y)).toBeLessThanOrEqual(10);
    expect(Math.abs(back.k - original.k)).toBeLessThanOrEqual(10);
  });
});

describe('HEX 与 HSL 同步输出', () => {
  it('rgbToHex 输出大写 #RRGGBB', () => {
    expect(rgbToHex({ r: 59, g: 130, b: 246 })).toBe('#3B82F6');
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF');
  });

  it('parseHex 支持 6 位与 3 位、可省略 #、大小写不敏感', () => {
    expect(parseHex('#3b82f6')).toEqual({ r: 59, g: 130, b: 246 });
    expect(parseHex('3B82F6')).toEqual({ r: 59, g: 130, b: 246 });
    expect(parseHex('#f00')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseHex('FFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('parseHex 拒绝非法格式', () => {
    expect(() => parseHex('#12345')).toThrow();
    expect(() => parseHex('#GGGGGG')).toThrow();
    expect(() => parseHex('')).toThrow();
    expect(() => parseHex('red')).toThrow();
  });

  it('rgbToHsl 基准向量', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 });
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, l: 50 });
  });
});

describe('非法输入报错', () => {
  it('RGB 越界抛错', () => {
    expect(() => assertValidRgb({ r: 256, g: 0, b: 0 })).toThrow();
    expect(() => assertValidRgb({ r: -1, g: 0, b: 0 })).toThrow();
    expect(() => assertValidRgb({ r: 0, g: NaN, b: 0 })).toThrow();
    expect(() => rgbToCmyk({ r: 999, g: 0, b: 0 })).toThrow();
  });

  it('CMYK 越界百分比抛错', () => {
    expect(() => assertValidCmyk({ c: 101, m: 0, y: 0, k: 0 })).toThrow();
    expect(() => assertValidCmyk({ c: -5, m: 0, y: 0, k: 0 })).toThrow();
    expect(() => cmykToRgb({ c: 0, m: 0, y: 0, k: 200 })).toThrow();
  });
});

describe('fromRgb / fromCmyk 聚合输出', () => {
  it('fromRgb 返回 RGB/CMYK/HEX/HSL 四套表示', () => {
    const result = fromRgb({ r: 255, g: 0, b: 0 });
    expect(result.rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(result.cmyk).toEqual({ c: 0, m: 100, y: 100, k: 0 });
    expect(result.hex).toBe('#FF0000');
    expect(result.hsl).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('fromCmyk 纯黑返回 RGB 全 0 与 HEX #000000', () => {
    const result = fromCmyk({ c: 0, m: 0, y: 0, k: 100 });
    expect(result.rgb).toEqual({ r: 0, g: 0, b: 0 });
    expect(result.hex).toBe('#000000');
    expect(result.cmyk).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });
});
