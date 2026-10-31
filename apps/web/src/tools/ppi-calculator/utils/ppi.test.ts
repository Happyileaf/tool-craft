import { describe, expect, it } from 'vitest';
import {
  MM_PER_INCH,
  calculatePpi,
  densityTier,
  describeAspectRatio,
  formatMm,
  nearestAspectRatio,
  validateScreenInputs,
} from './ppi';

describe('validateScreenInputs', () => {
  it('接受合法的正整数分辨率与正对角线', () => {
    expect(() => validateScreenInputs(1920, 1080, 24)).not.toThrow();
  });

  it('拒绝非整数像素', () => {
    expect(() => validateScreenInputs(1920.5, 1080, 24)).toThrow('正整数');
  });

  it('拒绝零或负像素', () => {
    expect(() => validateScreenInputs(0, 1080, 24)).toThrow();
    expect(() => validateScreenInputs(1920, -1, 24)).toThrow();
  });

  it('拒绝非正数对角线', () => {
    expect(() => validateScreenInputs(1920, 1080, 0)).toThrow();
    expect(() => validateScreenInputs(1920, 1080, -5)).toThrow();
  });

  it('拒绝 NaN / Infinity', () => {
    expect(() => validateScreenInputs(Number.NaN, 1080, 24)).toThrow();
    expect(() => validateScreenInputs(1920, 1080, Number.POSITIVE_INFINITY)).toThrow();
  });

  it('拒绝超过 100000 的单边分辨率', () => {
    expect(() => validateScreenInputs(100_001, 1080, 24)).toThrow('合理范围');
  });
});

describe('calculatePpi', () => {
  it('1920×1080 @24" 的 PPI 约为 91.79', () => {
    const result = calculatePpi(1920, 1080, 24);
    expect(result.ppi).toBeCloseTo(91.79, 1);
  });

  it('对角线像素符合勾股定理', () => {
    const result = calculatePpi(1920, 1080, 24);
    expect(result.diagonalPixels).toBeCloseTo(Math.sqrt(1920 ** 2 + 1080 ** 2), 6);
  });

  it('PPCM = PPI / 25.4 × 10', () => {
    const result = calculatePpi(1920, 1080, 24);
    expect(result.ppcm).toBeCloseTo((result.ppi / MM_PER_INCH) * 10, 6);
  });

  it('点距 = 25.4 / PPI', () => {
    const result = calculatePpi(1920, 1080, 24);
    expect(result.pitchMm).toBeCloseTo(MM_PER_INCH / result.ppi, 6);
  });

  it('物理宽高与对角线满足勾股守恒', () => {
    const result = calculatePpi(2560, 1440, 27);
    expect(Math.hypot(result.widthMm, result.heightMm)).toBeCloseTo(result.diagonalMm, 4);
    expect(result.widthMm).toBeCloseTo((2560 / result.ppi) * MM_PER_INCH, 4);
    expect(result.heightMm).toBeCloseTo((1440 / result.ppi) * MM_PER_INCH, 4);
  });

  it('面积 = 物理宽 × 物理高', () => {
    const result = calculatePpi(3840, 2160, 27);
    expect(result.areaMm2).toBeCloseTo(result.widthMm * result.heightMm, 4);
  });

  it('总像素与宽高比正确', () => {
    const result = calculatePpi(1920, 1080, 24);
    expect(result.totalPixels).toBe(1920 * 1080);
    expect(result.aspectRatio).toBeCloseTo(16 / 9, 6);
  });

  it('27" 4K 约 163 PPI，27" 1440p 约 109 PPI', () => {
    expect(calculatePpi(3840, 2160, 27).ppi).toBeCloseTo(163, 0);
    expect(calculatePpi(2560, 1440, 27).ppi).toBeCloseTo(109, 0);
  });

  it('手机竖屏（iPhone 15, 6.1"）约 460 PPI', () => {
    const result = calculatePpi(1179, 2556, 6.1);
    expect(result.ppi).toBeGreaterThan(440);
    expect(result.ppi).toBeLessThan(480);
  });

  it('非法输入向上抛出错误', () => {
    expect(() => calculatePpi(0, 0, 0)).toThrow();
  });
});

describe('nearestAspectRatio', () => {
  it('识别 16:9', () => {
    expect(nearestAspectRatio(1920 / 1080)).toBe('16:9');
  });

  it('识别 4:3、16:10 与 21:9', () => {
    expect(nearestAspectRatio(1024 / 768)).toBe('4:3');
    expect(nearestAspectRatio(1920 / 1200)).toBe('16:10');
    expect(nearestAspectRatio(21 / 9)).toBe('21:9');
  });

  it('实际超宽屏 2560×1080 与标称 21:9 相差约 1.6%，超阈值返回 null', () => {
    expect(nearestAspectRatio(2560 / 1080)).toBeNull();
  });

  it('奇异比例返回 null', () => {
    expect(nearestAspectRatio(1.23456)).toBeNull();
  });
});

describe('describeAspectRatio', () => {
  it('横屏返回带方向的标准比例', () => {
    expect(describeAspectRatio(1920, 1080)).toBe('16:9（横屏）');
  });

  it('竖屏自动取倒数并翻转写法', () => {
    expect(describeAspectRatio(1179, 2556)).toBe('9:19.5（竖屏）');
  });

  it('正方形识别为横屏写法', () => {
    expect(describeAspectRatio(1000, 1000)).toBeNull();
  });
});

describe('densityTier', () => {
  it('不同密度返回非空中文档位说明', () => {
    expect(densityTier(92)).toContain('标准密度');
    expect(densityTier(109)).toContain('中高密度');
    expect(densityTier(163)).toContain('HiDPI');
    expect(densityTier(460)).toContain('超高密度');
  });
});

describe('formatMm', () => {
  it('默认保留 2 位小数并带单位', () => {
    expect(formatMm(309.432)).toBe('309.43 mm');
  });

  it('支持自定义小数位数', () => {
    expect(formatMm(309.432, 0)).toBe('309 mm');
  });
});
