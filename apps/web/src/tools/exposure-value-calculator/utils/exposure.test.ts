import { describe, expect, it } from 'vitest';
import {
  applyNdFilter,
  calculateExposure,
  densityToStops,
  equivalentExposures,
  formatLongExposure,
  formatShutter,
  parseShutter,
  requiredNdStops,
  shutterFromEv,
} from './exposure';

describe('calculateExposure', () => {
  it('f/16、1/125、ISO 100 时 EV100 约为 14.97', () => {
    const result = calculateExposure({ aperture: 16, shutterSeconds: 1 / 125, iso: 100 });
    expect(result.ev100).toBeCloseTo(14.966, 2);
    expect(result.evIso).toBeCloseTo(14.966, 2);
  });

  it('ISO 400 时当前 EV 比 EV100 高 2 档', () => {
    const result = calculateExposure({ aperture: 8, shutterSeconds: 1 / 500, iso: 400 });
    expect(result.ev100).toBeCloseTo(14.966, 2);
    expect(result.evIso).toBeCloseTo(16.966, 2);
  });

  it('光圈或快门非法时抛出错误', () => {
    expect(() => calculateExposure({ aperture: 0, shutterSeconds: 1 / 125, iso: 100 })).toThrow(
      '光圈值必须大于 0',
    );
    expect(() => calculateExposure({ aperture: 8, shutterSeconds: 0, iso: 100 })).toThrow(
      '快门时间必须大于 0',
    );
    expect(() => calculateExposure({ aperture: 8, shutterSeconds: 1 / 125, iso: 0 })).toThrow(
      'ISO 必须大于 0',
    );
  });
});

describe('shutterFromEv 与等效组合', () => {
  it('EV100=14.966、f/16 反推快门约为 1/125', () => {
    expect(shutterFromEv(14.966, 16)).toBeCloseTo(1 / 125, 3);
  });

  it('等效组合保持曝光量一致', () => {
    const pairs = equivalentExposures(12, 'third');
    expect(pairs.length).toBeGreaterThan(0);
    for (const pair of pairs) {
      const ev = Math.log2((pair.aperture * pair.aperture) / pair.shutterSeconds);
      expect(ev).toBeCloseTo(12, 6);
    }
  });

  it('1/3 档与 1/2 档序列都包含 f/8', () => {
    expect(equivalentExposures(12, 'third').some((pair) => pair.aperture === 8)).toBe(true);
    expect(equivalentExposures(12, 'half').some((pair) => pair.aperture === 8)).toBe(true);
  });
});

describe('parseShutter 与 formatShutter', () => {
  it('解析分数与秒数写法', () => {
    expect(parseShutter('1/125')).toBeCloseTo(0.008, 6);
    expect(parseShutter('2s')).toBe(2);
    expect(parseShutter('0.5')).toBe(0.5);
  });

  it('非法写法抛出错误', () => {
    expect(() => parseShutter('')).toThrow('请输入快门时间');
    expect(() => parseShutter('1/0')).toThrow('快门分数格式无效');
  });

  it('格式化快门与长曝光计时', () => {
    expect(formatShutter(1 / 125)).toBe('1/125');
    expect(formatShutter(8)).toBe('8s');
    expect(formatLongExposure(125.5)).toBe('02:05.5');
  });
});

describe('ND 滤镜换算', () => {
  it('ND8（3 档）把 1/125 延长到 1/15.6 秒', () => {
    expect(applyNdFilter(1 / 125, 3)).toBeCloseTo(1 / 15.625, 6);
  });

  it('由 1/125 到 30 秒反推约 11.87 档', () => {
    expect(requiredNdStops(1 / 125, 30)).toBeCloseTo(11.87, 2);
  });

  it('目标快门更短或档数为负时报错', () => {
    expect(() => requiredNdStops(1 / 125, 1 / 250)).toThrow('目标快门时间应不小于原快门时间');
    expect(() => applyNdFilter(1, -1)).toThrow('ND 减光档数必须为不小于 0 的数值');
  });

  it('光学密度 0.9 对应 3 档', () => {
    expect(densityToStops(0.9)).toBeCloseTo(3, 6);
  });
});
