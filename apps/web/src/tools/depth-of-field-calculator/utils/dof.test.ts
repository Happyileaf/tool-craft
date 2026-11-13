import { describe, it, expect } from 'vitest';
import {
  APERTURE_STOPS,
  SENSOR_PRESETS,
  calculateDepthOfField,
  focusDistanceForNearLimit,
  formatDistance,
  hyperfocalDistance,
} from './dof';

// 经典案例：50mm f/8 全画幅（c=0.03mm），对焦 3000mm
const FOCAL = 50;
const APERTURE = 8;
const COC = 0.03;
const FOCUS = 3000;
// H = 50² / (8 × 0.03) = 10416.667 mm
const H = 10416.667;

describe('hyperfocalDistance', () => {
  it('50mm f/8 全画幅超焦距约 10.42 m', () => {
    expect(hyperfocalDistance(FOCAL, APERTURE, COC)).toBeCloseTo(H, 2);
  });

  it('光圈越小（f 值越大）超焦距越近', () => {
    // H = f²/(Nc)，N 越大 H 越小：f/16 的超焦距近于 f/2.8
    const f2_8 = hyperfocalDistance(50, 2.8, 0.03);
    const f16 = hyperfocalDistance(50, 16, 0.03);
    expect(f16).toBeLessThan(f2_8);
  });

  it('非法输入抛错', () => {
    expect(() => hyperfocalDistance(0, 8, 0.03)).toThrow();
    expect(() => hyperfocalDistance(50, 0, 0.03)).toThrow();
    expect(() => hyperfocalDistance(50, 8, 0)).toThrow();
  });
});

describe('calculateDepthOfField', () => {
  it('近界、远界与景深符合薄透镜公式', () => {
    const result = calculateDepthOfField(FOCAL, APERTURE, FOCUS, COC);
    // Dn = H × s / (H + s)
    const expectedNear = (H * FOCUS) / (H + FOCUS);
    // Df = H × s / (H − s)
    const expectedFar = (H * FOCUS) / (H - FOCUS);
    expect(result.hyperfocal).toBeCloseTo(H, 2);
    expect(result.nearLimit).toBeCloseTo(expectedNear, 1);
    expect(result.farLimit).toBeCloseTo(expectedFar, 1);
    expect(result.frontDepth).toBeCloseTo(FOCUS - expectedNear, 1);
    expect(result.rearDepth).toBeCloseTo(expectedFar - FOCUS, 1);
    expect(result.depthOfField).toBeCloseTo(expectedFar - expectedNear, 1);
    expect(result.atHyperfocalOrBeyond).toBe(false);
  });

  it('后景深大于前景深（非对称景深）', () => {
    const result = calculateDepthOfField(50, 2.8, 2000, 0.03);
    expect(result.rearDepth).toBeGreaterThan(result.frontDepth);
  });

  it('对焦达到超焦距时远界为无穷且近界恰为 H/2', () => {
    // 理论超焦距 H = f²/(Nc)，对焦在 H 处时 Dn = H/2、Df = ∞
    const h = (FOCAL * FOCAL) / (APERTURE * COC);
    const result = calculateDepthOfField(FOCAL, APERTURE, h, COC);
    expect(result.atHyperfocalOrBeyond).toBe(true);
    expect(result.farLimit).toBe(Number.POSITIVE_INFINITY);
    expect(result.depthOfField).toBe(Number.POSITIVE_INFINITY);
    expect(result.rearDepth).toBe(Number.POSITIVE_INFINITY);
    expect(result.nearLimit).toBeCloseTo(h / 2, 1);
  });

  it('对焦超过超焦距时远界同样为无穷', () => {
    const h = hyperfocalDistance(FOCAL, APERTURE, COC);
    const result = calculateDepthOfField(FOCAL, APERTURE, h * 2, COC);
    expect(result.atHyperfocalOrBeyond).toBe(true);
    expect(result.farLimit).toBe(Number.POSITIVE_INFINITY);
  });

  it('非法对焦距离抛错', () => {
    expect(() => calculateDepthOfField(50, 8, -1, 0.03)).toThrow();
    expect(() => calculateDepthOfField(50, 8, Number.NaN, 0.03)).toThrow();
  });
});

describe('focusDistanceForNearLimit 反推互求', () => {
  it('反推对焦距离后代回计算可还原目标近界', () => {
    const targetNear = 2000;
    const focus = focusDistanceForNearLimit(targetNear, FOCAL, APERTURE, COC);
    const check = calculateDepthOfField(FOCAL, APERTURE, focus, COC);
    expect(check.nearLimit).toBeCloseTo(targetNear, 0);
  });

  it('目标近界达到超焦距时报错', () => {
    const h = hyperfocalDistance(FOCAL, APERTURE, COC);
    expect(() => focusDistanceForNearLimit(h, FOCAL, APERTURE, COC)).toThrow('超焦距');
  });

  it('非法目标近界抛错', () => {
    expect(() => focusDistanceForNearLimit(-5, FOCAL, APERTURE, COC)).toThrow();
  });
});

describe('formatDistance', () => {
  it('毫米与米自适应展示，无穷远带符号', () => {
    expect(formatDistance(800)).toBe('800 mm');
    expect(formatDistance(1500)).toBe('1.50 m');
    expect(formatDistance(Number.POSITIVE_INFINITY)).toContain('∞');
  });
});

describe('预设数据', () => {
  it('画幅与光圈预设非空且单调合理', () => {
    expect(SENSOR_PRESETS.length).toBeGreaterThanOrEqual(5);
    expect(APERTURE_STOPS[0]).toBe(1.4);
    expect(APERTURE_STOPS[APERTURE_STOPS.length - 1]).toBe(32);
  });
});
