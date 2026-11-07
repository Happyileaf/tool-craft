import { describe, expect, it } from 'vitest';
import {
  CODE_ALPHABET,
  CODE_PRECISION_NORMAL,
  clipLatitude,
  decode,
  encode,
  isFull,
  isShort,
  isValid,
  normalizeCode,
  normalizeLongitude,
  recoverLongCode,
  shorten,
  validateCode,
} from './plus-code';

/**
 * 以下固定向量取自 Google open-location-code 官方测试数据集
 * （test_data/encoding.csv、decoding.csv、shortCodeTests.csv、validityTests.csv），
 * 用于保证实现与官方参考算法逐位一致。
 */
// 期望值取自 Google open-location-code 官方 test_data/encoding.csv，
// 并经官方参考实现以相同浮点坐标复核（边界坐标以实际 floor 结果为准）。
const ENCODING_VECTORS: Array<[number, number, number, string]> = [
  [-48, -111, 2, '45000000+'],
  [70.49, 104.87, 2, 'CP000000+'],
  [20.375, 2.775, 6, '7FG49Q00+'],
  [-34.45, -93.719, 6, '46Q8G700+'],
  [37.1, -195.4, 12, '8V964J22+2222'],
  [10.767, -62.787, 13, '772VQ687+R6222'],
  [-54.487237091, -142.497673509, 15, '33QVGG72+4W4FHRG'],
  [30.760710361, 5.623188694, 12, '8F27QJ6F+77PC'],
];

const DECODING_VECTORS: Array<{
  code: string;
  length: number;
  latLo: number;
  lngLo: number;
  latHi: number;
  lngHi: number;
}> = [
  { code: '7FG49Q00+', length: 6, latLo: 20.35, lngLo: 2.75, latHi: 20.4, lngHi: 2.8 },
  { code: '7FG49QCJ+2V', length: 10, latLo: 20.37, lngLo: 2.782125, latHi: 20.370125, lngHi: 2.78225 },
  { code: '7FG49QCJ+2VX', length: 11, latLo: 20.3701, lngLo: 2.78221875, latHi: 20.370125, lngHi: 2.78225 },
  { code: '783GF800+', length: 6, latLo: 11.45, lngLo: -49.7, latHi: 11.5, lngHi: -49.65 },
  { code: '6M9QQV9V+RFF74', length: 13, latLo: -2.230445, lngLo: 95.89366796875, latHi: -2.230444, lngHi: 95.893669921875 },
  { code: '3R8WMCRC+29Q7J', length: 13, latLo: -63.309917, lngLo: 158.4209765625, latHi: -63.309916, lngHi: 158.420978515625 },
  { code: '93G66JCP+', length: 8, latLo: 60.22, lngLo: -155.365, latHi: 60.2225, lngHi: -155.3625 },
];

/** 官方 shortCodeTests.csv 全量 19 行：fullCode, lat, lng, expectedShort, B=both/R=recover */
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

/** 官方 validityTests.csv 全量 25 行：code, isValid, isShort, isFull */
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

describe('encode 官方编码向量', () => {
  it.each(ENCODING_VECTORS)(
    'encode(%s, %s, %s) === %s',
    (latitude, longitude, codeLength, expected) => {
      expect(encode(latitude, longitude, codeLength)).toBe(expected);
    },
  );

  it('默认码长为 10（标准精度）', () => {
    expect(encode(47.36559, 8.52499)).toHaveLength(CODE_PRECISION_NORMAL + 1);
  });

  it('前缀性质：低精度码是高精度码的前缀', () => {
    const full = encode(-54.487237091, -142.497673509, 15);
    expect(encode(-54.487237091, -142.497673509, 8)).toBe(`${full.slice(0, 8)}+`);
    expect(encode(-54.487237091, -142.497673509, 10)).toBe(full.slice(0, 11));
  });

  it('超出范围的纬度被钳制到 ±90，经度被归一化', () => {
    expect(encode(95, 10, 10)).toBe(encode(90, 10, 10));
    expect(encode(-95, 10, 10)).toBe(encode(-90, 10, 10));
    expect(encode(20, 370, 10)).toBe(encode(20, 10, 10));
    expect(encode(20, -350, 10)).toBe(encode(20, 10, 10));
  });

  it('非法码长抛出错误（小于 2 或 10 位以下的奇数长度）', () => {
    expect(() => encode(10, 10, 0)).toThrow();
    expect(() => encode(10, 10, 1)).toThrow();
    expect(() => encode(10, 10, 3)).toThrow();
  });

  it('超长码长被钳制到 15 位上限而不报错', () => {
    expect(encode(10, 10, 16)).toBe(encode(10, 10, 15));
  });

  it('非有限数值抛出错误', () => {
    expect(() => encode(Number.NaN, 10)).toThrow();
    expect(() => encode(10, Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe('decode 官方解码向量', () => {
  it.each(DECODING_VECTORS)(
    'decode($code) 边界框与码长匹配',
    ({ code, length, latLo, lngLo, latHi, lngHi }) => {
      const area = decode(code);
      expect(area.codeLength).toBe(length);
      // 官方整数算法换算回浮点时存在 1e-15 量级舍入，统一用 1e-9 容差
      expect(area.latitudeLo).toBeCloseTo(latLo, 9);
      expect(area.longitudeLo).toBeCloseTo(lngLo, 9);
      expect(area.latitudeHi).toBeCloseTo(latHi, 9);
      expect(area.longitudeHi).toBeCloseTo(lngHi, 9);
      expect(area.latitudeCenter).toBeCloseTo((latLo + latHi) / 2, 9);
      expect(area.longitudeCenter).toBeCloseTo((lngLo + lngHi) / 2, 9);
      expect(area.latitudePrecision).toBeCloseTo(latHi - latLo, 9);
      expect(area.longitudePrecision).toBeCloseTo(lngHi - lngLo, 9);
    },
  );

  it('编码→解码→再编码往返一致', () => {
    for (const [lat, lng, length, expected] of ENCODING_VECTORS) {
      const area = decode(expected);
      expect(encode(area.latitudeCenter, area.longitudeCenter, length)).toBe(expected);
    }
  });

  it('解码短码或非法码抛出错误', () => {
    expect(() => decode('CJ+2VX')).toThrow();
    expect(() => decode('G+')).toThrow();
    expect(() => decode('8FWC2_45+G6')).toThrow();
  });

  it('字母表恰为 20 个字符且不含元音与易混字符', () => {
    expect(CODE_ALPHABET).toHaveLength(20);
    for (const char of 'AEIOU01') {
      expect(CODE_ALPHABET).not.toContain(char);
    }
  });
});

describe('shorten / recoverLongCode 官方短码向量', () => {
  it.each(SHORT_CODE_VECTORS)(
    'shortCode[%#] %s @(%s,%s) => %s (%s)',
    (fullCode, lat, lng, expected, mode) => {
      if (mode === 'B') {
        expect(shorten(fullCode, lat, lng)).toBe(expected);
      }
      expect(recoverLongCode(expected, lat, lng)).toBe(normalizeCode(fullCode));
    },
  );

  it('完整码传入 recover 时规范化后原样返回', () => {
    expect(recoverLongCode('8frcg2gg+gg', 46.526, 7.976)).toBe('8FRCG2GG+GG');
  });

  it('含零填充的码不能 shorten', () => {
    expect(() => shorten('7FG49Q00+', 20.375, 2.775)).toThrow();
  });

  it('recover 非法输入抛出错误', () => {
    expect(() => recoverLongCode('G+', 10, 10)).toThrow();
  });

  it('非有限参考点抛出错误', () => {
    expect(() => shorten('9C3W9QCJ+2VX', Number.NaN, 1)).toThrow();
    expect(() => recoverLongCode('CJ+2VX', 1, Number.NaN)).toThrow();
  });
});

describe('isValid / isShort / isFull 官方法性向量', () => {
  it.each(VALIDITY_VECTORS)(
    'validity[%#] %s => valid=%s short=%s full=%s',
    (code, valid, short, full) => {
      expect(isValid(code)).toBe(valid);
      expect(isShort(code)).toBe(short);
      expect(isFull(code)).toBe(full);
    },
  );

  it('大小写不敏感', () => {
    expect(isValid('8fwc2345+')).toBe(true);
    expect(isFull('8fwc2345+')).toBe(true);
  });
});

describe('辅助函数与用户侧校验', () => {
  it('clipLatitude 钳制到 ±90', () => {
    expect(clipLatitude(120)).toBe(90);
    expect(clipLatitude(-120)).toBe(-90);
    expect(clipLatitude(45)).toBe(45);
  });

  it('normalizeLongitude 归一化到 [-180, 180)', () => {
    expect(normalizeLongitude(190)).toBe(-170);
    expect(normalizeLongitude(-190)).toBe(170);
    expect(normalizeLongitude(360)).toBe(0);
  });

  it('normalizeCode 去空白并转大写', () => {
    expect(normalizeCode('  8fwc2345+g6 ')).toBe('8FWC2345+G6');
  });

  it('validateCode 对合法码返回 null，对非法码返回中文原因', () => {
    expect(validateCode('8FWC2345+G6')).toBeNull();
    expect(validateCode('WC2345+G6')).toBeNull();
    expect(validateCode('G+')).not.toBeNull();
    expect(validateCode('8FWC2_45+G6')).toContain('字母表');
    expect(validateCode('8FWC2345+G')).toContain('1 个字符');
    expect(validateCode('')).toContain('空');
  });
});
