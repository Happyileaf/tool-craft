import { describe, expect, it } from 'vitest';
import {
  decode,
  encode,
  encodeSteps,
  isValidHash,
  normalizeHash,
} from './geohash';

describe('encode 固定向量', () => {
  it('Wikipedia 标准示例 57.64911,10.40744 精度 11', () => {
    expect(encode(57.64911, 10.40744, 11)).toBe('u4pruydqqvj');
  });

  it('前缀性质：低精度结果是高精度结果的前缀', () => {
    const full = encode(57.64911, 10.40744, 11);
    expect(encode(57.64911, 10.40744, 1)).toBe(full.slice(0, 1));
    expect(encode(57.64911, 10.40744, 6)).toBe('u4pruy');
    expect(encode(57.64911, 10.40744, 11)).toBe(full);
  });

  it('ezs42 所在区域编码一致', () => {
    const result = decode('ezs42');
    expect(encode(result.latitude, result.longitude, 5)).toBe('ezs42');
  });

  it('极点与边界经纬度可正常编码', () => {
    expect(() => encode(90, 180, 12)).not.toThrow();
    expect(() => encode(-90, -180, 12)).not.toThrow();
    expect(encode(0, 0, 1)).toHaveLength(1);
  });
});

describe('decode 固定向量', () => {
  it('ezs42 中心点与独立参考实现一致', () => {
    const result = decode('ezs42');
    expect(result.latitude).toBe(42.60498046875);
    expect(result.longitude).toBe(-5.60302734375);
  });

  it('中心点位于边界框内部（含边界）', () => {
    const result = decode('ezs42');
    expect(result.latitude).toBeGreaterThanOrEqual(result.bbox.minLat);
    expect(result.latitude).toBeLessThanOrEqual(result.bbox.maxLat);
    expect(result.longitude).toBeGreaterThanOrEqual(result.bbox.minLng);
    expect(result.longitude).toBeLessThanOrEqual(result.bbox.maxLng);
    expect(result.error.lat).toBeCloseTo(
      (result.bbox.maxLat - result.bbox.minLat) / 2,
      12,
    );
    expect(result.error.lng).toBeCloseTo(
      (result.bbox.maxLng - result.bbox.minLng) / 2,
      12,
    );
  });

  it('u4pruydqqvj 解码中心与原坐标偏差不超过该精度误差', () => {
    const result = decode('u4pruydqqvj');
    expect(Math.abs(result.latitude - 57.64911)).toBeLessThanOrEqual(result.error.lat);
    expect(Math.abs(result.longitude - 10.40744)).toBeLessThanOrEqual(result.error.lng);
  });

  it('精度越高误差越小', () => {
    const low = decode('u');
    const high = decode('u4pruydqqvj');
    expect(high.error.lat).toBeLessThan(low.error.lat);
    expect(high.error.lng).toBeLessThan(low.error.lng);
  });
});

describe('encodeSteps 逐字符过程', () => {
  it('每字符 5 bit，区间严格收窄且始终包含原坐标', () => {
    const steps = encodeSteps(57.64911, 10.40744, 11);
    expect(steps).toHaveLength(11);
    expect(steps.map((step) => step.char).join('')).toBe('u4pruydqqvj');
    steps.forEach((step) => {
      expect(step.bits).toHaveLength(5);
      expect(/^[01]{5}$/.test(step.bits)).toBe(true);
      expect(57.64911).toBeGreaterThanOrEqual(step.latRange[0]);
      expect(57.64911).toBeLessThanOrEqual(step.latRange[1]);
      expect(10.40744).toBeGreaterThanOrEqual(step.lngRange[0]);
      expect(10.40744).toBeLessThanOrEqual(step.lngRange[1]);
    });
    for (let i = 1; i < steps.length; i += 1) {
      const current = steps[i]!;
      const previous = steps[i - 1]!;
      expect(current.latRange[1] - current.latRange[0]).toBeLessThan(
        previous.latRange[1] - previous.latRange[0],
      );
      expect(current.lngRange[1] - current.lngRange[0]).toBeLessThan(
        previous.lngRange[1] - previous.lngRange[0],
      );
    }
  });
});

describe('往返一致性', () => {
  const points: Array<[number, number]> = [
    [39.9042, 116.4074],
    [-33.8688, 151.2093],
    [0, 0],
    [89.999, -179.999],
  ];

  it.each(points)('encode→decode 中心偏差不超过格子误差 (%p, %p)', (lat, lng) => {
    const hash = encode(lat, lng, 10);
    const result = decode(hash);
    expect(Math.abs(result.latitude - lat)).toBeLessThanOrEqual(result.error.lat);
    expect(Math.abs(result.longitude - lng)).toBeLessThanOrEqual(result.error.lng);
  });
});

describe('非法输入', () => {
  it('越界经纬度抛错', () => {
    expect(() => encode(91, 0, 8)).toThrow();
    expect(() => encode(0, 181, 8)).toThrow();
    expect(() => encode(NaN, 0, 8)).toThrow();
    expect(() => encode(0, Infinity, 8)).toThrow();
  });

  it('非法精度抛错', () => {
    expect(() => encode(0, 0, 0)).toThrow();
    expect(() => encode(0, 0, 13)).toThrow();
    expect(() => encode(0, 0, 1.5)).toThrow();
  });

  it('非法字符与空串解码抛错', () => {
    expect(() => decode('abc')).toThrow();
    expect(() => decode('hello')).toThrow();
    expect(() => decode('ezs!42')).toThrow();
    expect(() => decode('   ')).toThrow();
  });
});

describe('isValidHash / normalizeHash', () => {
  it('接受合法小写与大写输入', () => {
    expect(isValidHash('ezs42')).toBe(true);
    expect(isValidHash('EZS42')).toBe(true);
    expect(isValidHash('  u4pruy ')).toBe(true);
  });

  it('拒绝字母表外字符与空串', () => {
    expect(isValidHash('ai')).toBe(false);
    expect(isValidHash('lo')).toBe(false);
    expect(isValidHash('')).toBe(false);
  });

  it('归一化去空白并转小写', () => {
    expect(normalizeHash('  EZS42 ')).toBe('ezs42');
    expect(() => normalizeHash('abc')).toThrow();
    expect(() => normalizeHash('')).toThrow();
  });
});
