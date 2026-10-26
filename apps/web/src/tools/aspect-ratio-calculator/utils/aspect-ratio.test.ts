import { describe, it, expect } from 'vitest';
import {
  formatResult,
  gcd,
  matchStandardRatio,
  parsePositive,
  parseRatioText,
  resolveSide,
  scaleByFactor,
  scaleToHeight,
  scaleToWidth,
  simplifyRatio,
} from './aspect-ratio';

describe('parsePositive', () => {
  it('解析正数并容忍首尾空白', () => {
    expect(parsePositive('1920')).toBe(1920);
    expect(parsePositive('  16:9 ')).toBeNull();
    expect(parsePositive(' 3.5 ')).toBe(3.5);
  });

  it('空串、非数字、0、负数返回 null', () => {
    expect(parsePositive('')).toBeNull();
    expect(parsePositive('abc')).toBeNull();
    expect(parsePositive('0')).toBeNull();
    expect(parsePositive('-16')).toBeNull();
    expect(parsePositive('Infinity')).toBeNull();
  });
});

describe('gcd', () => {
  it('计算最大公约数', () => {
    expect(gcd(1920, 1080)).toBe(120);
    expect(gcd(16, 9)).toBe(1);
    expect(gcd(0, 9)).toBe(9);
  });
});

describe('simplifyRatio', () => {
  it('化简常见尺寸为最小整数比', () => {
    expect(simplifyRatio(1920, 1080)).toEqual({ width: 16, height: 9 });
    expect(simplifyRatio(1024, 768)).toEqual({ width: 4, height: 3 });
    expect(simplifyRatio(1, 1)).toEqual({ width: 1, height: 1 });
  });

  it('支持小数值的化简', () => {
    expect(simplifyRatio(1.6, 0.9)).toEqual({ width: 16, height: 9 });
  });
});

describe('parseRatioText', () => {
  it('解析合法比值文本', () => {
    expect(parseRatioText('16:9')).toEqual({ width: 16, height: 9 });
    expect(parseRatioText(' 4 : 3 ')).toEqual({ width: 4, height: 3 });
  });

  it('非法格式返回 null', () => {
    expect(parseRatioText('16')).toBeNull();
    expect(parseRatioText('a:9')).toBeNull();
    expect(parseRatioText('16:0')).toBeNull();
    expect(parseRatioText('-4:3')).toBeNull();
  });
});

describe('resolveSide', () => {
  it('已知高度按比值求宽度', () => {
    expect(resolveSide(16, 9, 'width', 1080)).toBeCloseTo(1920, 10);
  });

  it('已知宽度按比值求高度', () => {
    expect(resolveSide(16, 9, 'height', 1920)).toBeCloseTo(1080, 10);
  });

  it('比值含 0 返回 null', () => {
    expect(resolveSide(0, 9, 'width', 1080)).toBeNull();
  });
});

describe('scale 系列函数', () => {
  it('按倍数缩放', () => {
    expect(scaleByFactor(200, 100, 0.5)).toEqual({ width: 100, height: 50 });
    expect(scaleByFactor(200, 100, 0)).toBeNull();
  });

  it('按目标宽度等比缩放', () => {
    const result = scaleToWidth(1920, 1080, 1280);
    expect(result?.width).toBe(1280);
    expect(result?.height).toBeCloseTo(720, 10);
    expect(scaleToWidth(0, 1080, 1280)).toBeNull();
  });

  it('按目标高度等比缩放', () => {
    const result = scaleToHeight(1920, 1080, 720);
    expect(result?.width).toBeCloseTo(1280, 10);
    expect(result?.height).toBe(720);
    expect(scaleToHeight(1920, 0, 720)).toBeNull();
  });
});

describe('matchStandardRatio', () => {
  it('精确命中标准比例', () => {
    expect(matchStandardRatio(1920, 1080)?.name).toContain('16:9');
    expect(matchStandardRatio(1080, 1920)?.name).toContain('9:16');
    expect(matchStandardRatio(1024, 768)?.name).toContain('4:3');
    expect(matchStandardRatio(1, 1)?.name).toContain('1:1');
  });

  it('在 1% 容差内近似命中', () => {
    expect(matchStandardRatio(1928, 1080)?.name).toContain('16:9');
  });

  it('偏离过大时返回 null', () => {
    expect(matchStandardRatio(100, 1000)).toBeNull();
    expect(matchStandardRatio(0, 1080)).toBeNull();
  });
});

describe('formatResult', () => {
  it('至多保留 4 位小数并去除尾随 0', () => {
    expect(formatResult(720)).toBe('720');
    expect(formatResult(720.5)).toBe('720.5');
    expect(formatResult(1 / 3)).toBe('0.3333');
  });
});
