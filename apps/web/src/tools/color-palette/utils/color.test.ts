import { describe, expect, it } from 'vitest';
import {
  buildShades,
  createRandomRgb,
  formatRgbToHex,
  getContrastRatio,
  getRelativeLuminance,
  mixShade,
  parseHexToRgb,
} from './color';

describe('parseHexToRgb', () => {
  it('应正确解析六位 HEX 颜色', () => {
    expect(parseHexToRgb('#2563EB')).toEqual({ r: 37, g: 99, b: 235 });
  });

  it('应支持省略井号且忽略大小写', () => {
    expect(parseHexToRgb('2563eb')).toEqual({ r: 37, g: 99, b: 235 });
  });

  it('应将三位写法展开为六位', () => {
    expect(parseHexToRgb('#ABC')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('非法输入应返回 null', () => {
    expect(parseHexToRgb('#12')).toBeNull();
    expect(parseHexToRgb('#GGGGGG')).toBeNull();
    expect(parseHexToRgb('')).toBeNull();
  });
});

describe('formatRgbToHex', () => {
  it('应输出大写井号开头的 HEX', () => {
    expect(formatRgbToHex({ r: 37, g: 99, b: 235 })).toBe('#2563EB');
  });

  it('应对越界通道做截断处理', () => {
    expect(formatRgbToHex({ r: -20, g: 300, b: 0 })).toBe('#00FF00');
  });

  it('应与解析函数互为逆运算', () => {
    const hex = '#7C3AED';
    const rgb = parseHexToRgb(hex);
    expect(rgb).not.toBeNull();
    expect(formatRgbToHex(rgb ?? { r: 0, g: 0, b: 0 })).toBe(hex);
  });
});

describe('getRelativeLuminance', () => {
  it('纯黑亮度为 0', () => {
    expect(getRelativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  it('纯白亮度为 1', () => {
    expect(getRelativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });
});

describe('getContrastRatio', () => {
  it('黑白对比度应为 21', () => {
    const ratio = getContrastRatio(
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 },
    );
    expect(ratio).toBeCloseTo(21, 5);
  });

  it('相同颜色对比度应为 1', () => {
    const color = { r: 37, g: 99, b: 235 };
    expect(getContrastRatio(color, color)).toBeCloseTo(1, 5);
  });
});

describe('mixShade', () => {
  it('系数为 1 时返回基准色', () => {
    const base = { r: 100, g: 120, b: 140 };
    expect(mixShade(base, 1)).toEqual(base);
  });

  it('系数为 0 时返回纯白', () => {
    expect(mixShade({ r: 100, g: 120, b: 140 }, 0)).toEqual({
      r: 255,
      g: 255,
      b: 255,
    });
  });

  it('系数大于 1 时应压暗通道', () => {
    const shade = mixShade({ r: 100, g: 120, b: 140 }, 1.5);
    expect(shade.r).toBe(50);
    expect(shade.g).toBe(60);
    expect(shade.b).toBe(70);
  });
});

describe('buildShades', () => {
  it('应生成十个档位且按顺序排列', () => {
    const shades = buildShades({ r: 37, g: 99, b: 235 });
    expect(shades).toHaveLength(10);
    expect(shades.map((shade) => shade.level)).toEqual([
      '50',
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
    ]);
  });

  it('600 档应与基准色完全一致', () => {
    const shades = buildShades({ r: 37, g: 99, b: 235 });
    expect(shades[6]?.hex).toBe('#2563EB');
  });

  it('档位越低颜色应越亮', () => {
    const shades = buildShades({ r: 37, g: 99, b: 235 });
    const firstLuminance = getRelativeLuminance(shades[0]!.rgb);
    const lastLuminance = getRelativeLuminance(shades[9]!.rgb);
    expect(firstLuminance).toBeGreaterThan(lastLuminance);
  });
});

describe('createRandomRgb', () => {
  it('生成的通道值应均在 0 至 255 之间', () => {
    for (let index = 0; index < 50; index += 1) {
      const rgb = createRandomRgb();
      expect(rgb.r).toBeGreaterThanOrEqual(0);
      expect(rgb.r).toBeLessThanOrEqual(255);
      expect(rgb.g).toBeGreaterThanOrEqual(0);
      expect(rgb.g).toBeLessThanOrEqual(255);
      expect(rgb.b).toBeGreaterThanOrEqual(0);
      expect(rgb.b).toBeLessThanOrEqual(255);
    }
  });
});
