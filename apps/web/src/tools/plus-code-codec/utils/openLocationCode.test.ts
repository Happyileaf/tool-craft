import { describe, it, expect } from 'vitest';
import {
  encode,
  decode,
  isValid,
  isShortCode,
  isFull,
  shorten,
  recoverNearest,
  computeLatitudePrecision,
} from './openLocationCode';

// 向量来源：Google Open Location Code 官方 test_data/encoding.csv
// [纬度, 经度, 码长, 期望 code]
const ENCODE_VECTORS: Array<[number, number, number, string]> = [
  [20.375, 2.775, 6, '7FG49Q00+'],
  [20.3700625, 2.7821875, 10, '7FG49QCJ+2V'],
  [20.3701125, 2.782234375, 11, '7FG49QCJ+2VX'],
  [20.3701135, 2.78223535156, 13, '7FG49QCJ+2VXGJ'],
  [47.0000625, 8.0000625, 10, '8FVC2222+22'],
  [-41.2730625, 174.7859375, 10, '4VCPPQGP+Q9'],
  [0.5, -179.5, 4, '62G20000+'],
  [-89.5, -179.5, 4, '22220000+'],
  [20.5, 2.5, 4, '7FG40000+'],
  [-89.9999375, -179.9999375, 10, '22222222+22'],
  [0.5, 179.5, 4, '6VGX0000+'],
  [1, 1, 11, '6FH32222+222'],
  [90, 1, 4, 'CFX30000+'],
  [92, 1, 4, 'CFX30000+'],
  [90, 1, 10, 'CFX3X2X2+X2'],
  [1, 180, 4, '62H20000+'],
  [1, 181, 4, '62H30000+'],
  // 经度超出 ±180 时按 360 度回绕，结果与归一化坐标一致
  [20.3701135, 362.78223535156, 13, '7FG49QCJ+2VXGJ'],
  [47.0000625, 728.0000625, 10, '8FVC2222+22'],
  [-41.2730625, 1254.7859375, 10, '4VCPPQGP+Q9'],
];

// 向量来源：官方 test_data/validityTests.csv
// [code, isValid, isShort, isFull]
const VALIDITY_VECTORS: Array<[string, boolean, boolean, boolean]> = [
  ['8FWC2345+G6', true, false, true],
  ['8FWC2345+G6G', true, false, true],
  ['8fwc2345+', true, false, true],
  ['8FWCX400+', true, false, true],
  ['84000000+', true, false, true],
  ['WC2345+G6g', true, true, false],
  ['2345+G6', true, true, false],
  ['45+G6', true, true, false],
  ['+G6', true, true, false],
  ['G+', false, false, false],
  ['+', false, false, false],
  ['8FWC2345+G', false, false, false],
  ['8FWC2_45+G6', false, false, false],
  ['8FWC2η45+G6', false, false, false],
  ['8FWC2345+G6+', false, false, false],
  ['8FWC2345G6+', false, false, false],
  ['8FWC2300+G6', false, false, false],
  ['WC2300+G6g', false, false, false],
  ['WC2345+G', false, false, false],
  ['WC2300+', false, false, false],
  ['84900000+', false, false, false],
  ['849VGJQF+VX7QR3J', true, false, true],
  ['849VGJQF+VX7QR3U', false, false, false],
  ['849VGJQF+VX7QR3JW', true, false, true],
  ['849VGJQF+VX7QR3JU', false, false, false],
];

// 向量来源：官方 test_data/shortCodeTests.csv
// [完整 code, 参考纬度, 参考经度, 期望短码, 测试类型 B=双向 R=仅恢复]
const SHORT_CODE_VECTORS: Array<[string, number, number, string, 'B' | 'R']> = [
  ['9C3W9QCJ+2VX', 51.3701125, -1.217765625, '+2VX', 'B'],
  ['9C3W9QCJ+2VX', 51.3708675, -1.217765625, 'CJ+2VX', 'B'],
  ['9C3W9QCJ+2VX', 51.3693575, -1.217765625, 'CJ+2VX', 'B'],
  ['9C3W9QCJ+2VX', 51.3701125, -1.218520625, 'CJ+2VX', 'B'],
  ['9C3W9QCJ+2VX', 51.3701125, -1.217010625, 'CJ+2VX', 'B'],
  ['9C3W9QCJ+2VX', 51.3852125, -1.217765625, '9QCJ+2VX', 'B'],
  ['9C3W9QCJ+2VX', 51.3550125, -1.217765625, '9QCJ+2VX', 'B'],
  ['9C3W9QCJ+2VX', 51.3701125, -1.232865625, '9QCJ+2VX', 'B'],
  ['9C3W9QCJ+2VX', 51.3701125, -1.202665625, '9QCJ+2VX', 'B'],
  ['8FJFW222+', 42.899, 9.012, '22+', 'B'],
  ['796RXG22+', 14.95125, -23.5001, '22+', 'B'],
  ['8FVC2GGG+GG', 46.976, 8.526, '2GGG+GG', 'B'],
  ['8FRCXGGG+GG', 47.026, 8.526, 'XGGG+GG', 'B'],
  ['8FR9GXGG+GG', 46.526, 8.026, 'GXGG+GG', 'B'],
  ['8FRCG2GG+GG', 46.526, 7.976, 'G2GG+GG', 'B'],
  ['CFX22222+22', 89.6, 0.0, '2222+22', 'R'],
  ['2CXXXXXX+XX', -81.0, 0.0, 'XXXXXX+XX', 'R'],
  ['8FRCG2GG+GG', 46.526, 7.976, '8FRCG2GG+GG', 'R'],
  ['8FRCG2GG+GG', 46.526, 7.976, '8frCG2GG+gG', 'R'],
];

describe('encode', () => {
  it('matches all Google official encoding vectors', () => {
    for (const [lat, lng, len, expected] of ENCODE_VECTORS) {
      expect(encode(lat, lng, { codeLength: len })).toBe(expected);
    }
  });

  it('defaults to code length 10 and always places "+" after 8 chars', () => {
    const code = encode(47.36559, 8.524997);
    expect(code).toHaveLength(11);
    expect(code[8]).toBe('+');
  });

  it('clamps polar latitude into the valid grid', () => {
    expect(() => encode(90, 0)).not.toThrow();
    expect(() => encode(-90, 0)).not.toThrow();
  });

  it('rejects unsupported code lengths', () => {
    expect(() => encode(0, 0, { codeLength: 3 })).toThrow(/非法/);
    expect(() => encode(0, 0, { codeLength: 1 })).toThrow(/非法/);
  });
});

describe('decode', () => {
  it('round-trips every official vector back to a region containing the point', () => {
    for (const [rawLat, rawLng, len, expected] of ENCODE_VECTORS) {
      // 编码前官方会裁剪纬度、回绕经度，断言需使用归一化后的输入
      const lat = Math.min(Math.max(rawLat, -90), 90);
      const lng = ((((rawLng + 180) % 360) + 360) % 360) - 180;
      const area = decode(expected);
      expect(area.latitudeLo).toBeLessThanOrEqual(lat + 1e-9);
      expect(area.latitudeHi).toBeGreaterThanOrEqual(lat - 1e-9);
      expect(area.longitudeLo).toBeLessThanOrEqual(lng + 1e-9);
      expect(area.longitudeHi).toBeGreaterThanOrEqual(lng - 1e-9);
      expect(area.codeLength).toBe(Math.min(len, 15));
    }
  });

  it('decodes 4VCPPQGP+Q9 to the official region', () => {
    // 官方解码：latLo=-41.273125, lngLo=174.785875, latHi=-41.273, lngHi=174.786
    const area = decode('4VCPPQGP+Q9');
    expect(area.latitudeLo).toBeCloseTo(-41.273125, 10);
    expect(area.longitudeLo).toBeCloseTo(174.785875, 10);
    expect(area.latitudeHi).toBeCloseTo(-41.273, 10);
    expect(area.longitudeHi).toBeCloseTo(174.786, 10);
    expect(area.latitudeCenter).toBeCloseTo(-41.2730625, 10);
    expect(area.longitudeCenter).toBeCloseTo(174.7859375, 10);
  });

  it('reports shrinking precision for shorter codes', () => {
    const fine = decode(encode(20.3701135, 2.782235351562, { codeLength: 11 }));
    const coarse = decode(encode(20.3701135, 2.782235351562, { codeLength: 6 }));
    expect(fine.latitudeHi - fine.latitudeLo).toBeLessThan(coarse.latitudeHi - coarse.latitudeLo);
  });

  it('throws on characters outside the Plus Code alphabet', () => {
    expect(() => decode('4VCPPQGP+A9')).toThrow(/非法/);
  });

  it('throws when decoding a short code instead of a full code', () => {
    expect(() => decode('9QCJ+2VX')).toThrow();
  });
});

describe('isValid / isShortCode / isFull', () => {
  it('matches every official validity vector', () => {
    for (const [code, valid, short, full] of VALIDITY_VECTORS) {
      expect(isValid(code)).toBe(valid);
      if (valid) {
        expect(isShortCode(code)).toBe(short);
        expect(isFull(code)).toBe(full);
      }
    }
  });

  it('rejects empty input and non-string values', () => {
    expect(isValid('')).toBe(false);
  });
});

describe('shorten / recoverNearest', () => {
  it('matches all official short-code vectors', () => {
    for (const [full, lat, lng, short, type] of SHORT_CODE_VECTORS) {
      // 恢复：短码（含小写输入）经参考点还原为完整大写 code
      expect(recoverNearest(short, lat, lng)).toBe(full);
      if (type === 'B') {
        expect(shorten(full, lat, lng)).toBe(short);
      }
    }
  });

  it('shorten and recoverNearest are inverse operations near the reference', () => {
    const full = '9C3W9QCJ+2VX';
    const short = shorten(full, 51.3701125, -1.217765625);
    expect(short).toBe('+2VX');
    expect(recoverNearest(short, 51.3701125, -1.217765625)).toBe(full);
  });

  it('refuses to shorten padded low-precision codes', () => {
    expect(() => shorten('9C3X0000+', 51.5, -0.1)).toThrow(/填充/);
  });

  it('recoverNearest on an already-full code returns it uppercased', () => {
    expect(recoverNearest('8frcg2gg+gg', 46.526, 7.976)).toBe('8FRCG2GG+GG');
  });
});

describe('computeLatitudePrecision', () => {
  it('follows the official precision table for pair codes', () => {
    expect(computeLatitudePrecision(2)).toBeCloseTo(20, 10);
    expect(computeLatitudePrecision(4)).toBeCloseTo(1, 10);
    expect(computeLatitudePrecision(6)).toBeCloseTo(0.05, 12);
    expect(computeLatitudePrecision(8)).toBeCloseTo(0.0025, 12);
    expect(computeLatitudePrecision(10)).toBeCloseTo(0.000125, 12);
  });

  it('refines by a factor of 5 per grid digit beyond length 10', () => {
    expect(computeLatitudePrecision(11)).toBeCloseTo(0.000125 / 5, 12);
    expect(computeLatitudePrecision(15)).toBeCloseTo(0.000125 / 5 ** 5, 12);
  });
});
