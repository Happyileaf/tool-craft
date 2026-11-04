import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUT } from '../constants';
import {
  clampedFontSizeAtViewport,
  fontSizeAtViewport,
  generateClamp,
  roundNumber,
  validateClampInput,
} from './clamp';

describe('roundNumber', () => {
  it('按指定小数位四舍五入', () => {
    expect(roundNumber(1.234567, 2)).toBe(1.23);
    expect(roundNumber(1.235, 2)).toBe(1.24);
    expect(roundNumber(2, 4)).toBe(2);
  });
});

describe('validateClampInput', () => {
  it('默认参数合法', () => {
    expect(validateClampInput(DEFAULT_INPUT)).toBeNull();
  });

  it('拒绝非有限数字与非正数', () => {
    expect(
      validateClampInput({ ...DEFAULT_INPUT, minFontSize: Number.NaN }),
    ).toContain('有效数字');
    expect(
      validateClampInput({ ...DEFAULT_INPUT, minFontSize: 0 }),
    ).toContain('最小字号');
    expect(
      validateClampInput({ ...DEFAULT_INPUT, minViewport: -10 }),
    ).toContain('最小视口宽度');
  });

  it('要求最大字号严格大于最小字号', () => {
    expect(
      validateClampInput({ ...DEFAULT_INPUT, maxFontSize: 16 }),
    ).toContain('最大字号必须严格大于');
  });

  it('要求最大视口严格大于最小视口', () => {
    expect(
      validateClampInput({ ...DEFAULT_INPUT, maxViewport: 375 }),
    ).toContain('最大视口宽度必须严格大于');
  });
});

describe('generateClamp', () => {
  it('默认参数下斜率与截距计算正确', () => {
    const result = generateClamp(DEFAULT_INPUT);
    // slope = (32 - 16) / (1280 - 375) = 16 / 905 ≈ 0.0176796
    expect(result.slope).toBeCloseTo(0.01768, 4);
    // vw 系数 = slope * 100 ≈ 1.76796
    expect(result.slopeInViewportUnit).toBeCloseTo(1.768, 3);
    // intercept = 16 - slope * 375 ≈ 9.3702
    expect(result.intercept).toBeCloseTo(9.3702, 3);
  });

  it('生成的表达式包含 min、max 与视口单位', () => {
    const result = generateClamp(DEFAULT_INPUT);
    expect(result.clampExpression.startsWith('clamp(16px,')).toBe(true);
    expect(result.clampExpression).toContain('vw');
    expect(result.clampExpression.endsWith('32px)')).toBe(true);
    expect(result.cssDeclaration).toBe(`font-size: ${result.clampExpression};`);
  });

  it('cqw 单位写入表达式', () => {
    const result = generateClamp({ ...DEFAULT_INPUT, viewportUnit: 'cqw' });
    expect(result.clampExpression).toContain('cqw');
    expect(result.clampExpression).not.toContain('vw,');
  });

  it('截距为负时保留负号', () => {
    // 截距 = minFont - slope * minVw；斜率足够大时截距为负：
    // slope = (100 - 16) / (1200 - 320) ≈ 0.0955，截距 ≈ -14.55
    const result = generateClamp({
      minFontSize: 16,
      maxFontSize: 100,
      minViewport: 320,
      maxViewport: 1200,
      viewportUnit: 'vw',
    });
    expect(result.intercept).toBeLessThan(0);
    expect(result.clampExpression).toMatch(/-\d/);
  });

  it('非法输入抛错', () => {
    expect(() =>
      generateClamp({ ...DEFAULT_INPUT, maxFontSize: 1 }),
    ).toThrow();
  });
});

describe('fontSizeAtViewport', () => {
  it('在两个端点精确等于边界字号', () => {
    expect(fontSizeAtViewport(DEFAULT_INPUT, 375)).toBe(16);
    expect(fontSizeAtViewport(DEFAULT_INPUT, 1280)).toBe(32);
  });

  it('中点视口字号约为两端字号的中点', () => {
    const mid = (375 + 1280) / 2;
    expect(fontSizeAtViewport(DEFAULT_INPUT, mid)).toBeCloseTo(24, 1);
  });
});

describe('clampedFontSizeAtViewport', () => {
  it('低于最小视口时钳制为最小字号', () => {
    expect(clampedFontSizeAtViewport(DEFAULT_INPUT, 200)).toBe(16);
  });

  it('高于最大视口时钳制为最大字号', () => {
    expect(clampedFontSizeAtViewport(DEFAULT_INPUT, 2000)).toBe(32);
  });

  it('区间内与线性插值一致', () => {
    const linear = fontSizeAtViewport(DEFAULT_INPUT, 800);
    expect(clampedFontSizeAtViewport(DEFAULT_INPUT, 800)).toBe(linear);
  });

  it('字号随视口单调不减', () => {
    let previous = 0;
    for (let vw = 300; vw <= 1400; vw += 50) {
      const current = clampedFontSizeAtViewport(DEFAULT_INPUT, vw);
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });
});
