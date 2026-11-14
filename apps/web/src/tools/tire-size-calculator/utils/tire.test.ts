import { describe, expect, it } from 'vitest';
import { compareTires, parseTireSize, tireGeometry } from './tire';

describe('parseTireSize', () => {
  it('解析常见规格 205/55R16', () => {
    const spec = parseTireSize('205/55R16');
    expect(spec.widthMm).toBe(205);
    expect(spec.aspectPercent).toBe(55);
    expect(spec.construction).toBe('R');
    expect(spec.rimInches).toBe(16);
    expect(spec.loadIndex).toBeNull();
    expect(spec.speedRating).toBeNull();
    expect(spec.prefix).toBeNull();
    expect(spec.extraMarking).toBeNull();
  });

  it('解析带附加标记、载重指数与速度级别 225/45ZR17 91W', () => {
    const spec = parseTireSize('225/45ZR17 91W');
    expect(spec.widthMm).toBe(225);
    expect(spec.aspectPercent).toBe(45);
    expect(spec.extraMarking).toBe('Z');
    expect(spec.construction).toBe('R');
    expect(spec.rimInches).toBe(17);
    expect(spec.loadIndex).toBe(91);
    expect(spec.speedRating).toBe('W');
  });

  it('解析带 LT 前缀的轻卡规格 LT265/70R17', () => {
    const spec = parseTireSize('lt265/70r17');
    expect(spec.prefix).toBe('LT');
    expect(spec.widthMm).toBe(265);
    expect(spec.aspectPercent).toBe(70);
    expect(spec.rimInches).toBe(17);
  });

  it('拒绝空输入与无法识别的格式', () => {
    expect(() => parseTireSize('')).toThrow();
    expect(() => parseTireSize('abc')).toThrow();
    expect(() => parseTireSize('205/55')).toThrow();
  });

  it('拒绝超出物理范围的参数', () => {
    expect(() => parseTireSize('205/5R16')).toThrow();
    expect(() => parseTireSize('205/55R2')).toThrow();
    expect(() => parseTireSize('205/55R16 999')).toThrow();
  });
});

describe('tireGeometry', () => {
  it('计算 205/55R16 的胎侧、外径与周长', () => {
    const geometry = tireGeometry(parseTireSize('205/55R16'));
    expect(geometry.sidewallMm).toBeCloseTo(112.75, 5);
    expect(geometry.overallDiameterMm).toBeCloseTo(631.9, 5);
    expect(geometry.circumferenceM).toBeCloseTo(1.9852, 4);
    expect(geometry.revsPerKm).toBeCloseTo(503.73, 1);
  });
});

describe('compareTires', () => {
  it('同规格对比误差为零且处于容差内', () => {
    const same = parseTireSize('205/55R16');
    const comparison = compareTires(same, same, 100);
    expect(comparison.diameterDeltaMm).toBe(0);
    expect(comparison.diameterDeltaPercent).toBe(0);
    expect(comparison.speedErrorPercent).toBe(0);
    expect(comparison.actualSpeedKmh).toBe(100);
    expect(comparison.withinTolerance).toBe(true);
  });

  it('205/55R16 升级到 225/45R17 的误差约 +0.38%', () => {
    const comparison = compareTires(
      parseTireSize('205/55R16'),
      parseTireSize('225/45R17'),
      100,
    );
    expect(comparison.diameterDeltaMm).toBeCloseTo(2.4, 5);
    expect(comparison.diameterDeltaPercent).toBeCloseTo(0.3798, 3);
    expect(comparison.actualSpeedKmh).toBeCloseTo(100.38, 2);
    expect(comparison.clearanceDeltaMm).toBeCloseTo(1.2, 5);
    expect(comparison.withinTolerance).toBe(true);
  });

  it('215/60R17 相比 205/55R16 超出 ±3% 容差', () => {
    const comparison = compareTires(
      parseTireSize('205/55R16'),
      parseTireSize('215/60R17'),
      100,
    );
    expect(comparison.diameterDeltaPercent).toBeGreaterThan(3);
    expect(comparison.withinTolerance).toBe(false);
  });

  it('拒绝非正的表显车速', () => {
    const spec = parseTireSize('205/55R16');
    expect(() => compareTires(spec, spec, 0)).toThrow();
    expect(() => compareTires(spec, spec, Number.NaN)).toThrow();
  });
});
