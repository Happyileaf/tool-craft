import { describe, expect, it } from 'vitest';
import { CoordinateSystemEnum } from '../constants';
import {
  bd09ToGcj02,
  convert,
  convertBatch,
  gcj02ToBd09,
  gcj02ToWgs84,
  outOfChina,
  wgs84ToGcj02,
} from './coordinate';

describe('outOfChina 境外判断', () => {
  it('中国境内为 false', () => {
    expect(outOfChina(116.404, 39.915)).toBe(false);
    expect(outOfChina(121.4737, 31.2304)).toBe(false);
  });

  it('纽约等境外为 true', () => {
    expect(outOfChina(-74.006, 40.7128)).toBe(true);
    expect(outOfChina(0, 0)).toBe(true);
  });

  it('边界矩形外为 true', () => {
    expect(outOfChina(72.0, 30)).toBe(true);
    expect(outOfChina(138, 30)).toBe(true);
    expect(outOfChina(100, 0.5)).toBe(true);
    expect(outOfChina(100, 56)).toBe(true);
  });
});

describe('固定坐标向量', () => {
  it('天安门 WGS-84 → GCJ-02 与通行 coordtransform 参考一致', () => {
    const result = wgs84ToGcj02(116.397428, 39.90923);
    expect(result.lng).toBeCloseTo(116.403671626, 5);
    expect(result.lat).toBeCloseTo(39.910633506, 5);
    expect(result.lng).toBeCloseTo(116.404, 2);
    expect(result.outOfChina).toBe(false);
  });

  it('GCJ-02 (116.404, 39.915) → BD-09 约为 (116.410, 39.921)', () => {
    const result = gcj02ToBd09(116.404, 39.915);
    expect(result.lng).toBeCloseTo(116.41, 3);
    expect(result.lat).toBeCloseTo(39.921, 3);
    expect(result.outOfChina).toBe(false);
  });

  it('上海点 WGS→GCJ 偏移为正且量级合理', () => {
    const result = wgs84ToGcj02(121.4737, 31.2304);
    expect(result.lng - 121.4737).toBeGreaterThan(0.001);
    expect(Math.abs(result.lat - 31.2304)).toBeLessThan(0.01);
  });
});

describe('境外不偏移', () => {
  it('纽约 WGS→GCJ 原样返回并标记境外', () => {
    const result = wgs84ToGcj02(-74.006, 40.7128);
    expect(result).toEqual({ lng: -74.006, lat: 40.7128, outOfChina: true });
  });

  it('纽约 GCJ→BD 原样返回', () => {
    const result = gcj02ToBd09(-74.006, 40.7128);
    expect(result).toEqual({ lng: -74.006, lat: 40.7128, outOfChina: true });
  });

  it('纽约任意转换均原样返回', () => {
    const systems = Object.values(CoordinateSystemEnum);
    systems.forEach((from) => {
      systems.forEach((to) => {
        const result = convert(-74.006, 40.7128, from, to);
        expect(result.lng).toBe(-74.006);
        expect(result.lat).toBe(40.7128);
        expect(result.outOfChina).toBe(true);
      });
    });
  });
});

describe('往返与中转', () => {
  it('GCJ→BD→GCJ 回到原值附近', () => {
    const bd = gcj02ToBd09(116.404, 39.915);
    const back = bd09ToGcj02(bd.lng, bd.lat);
    expect(back.lng).toBeCloseTo(116.404, 6);
    expect(back.lat).toBeCloseTo(39.915, 6);
  });

  it('WGS→GCJ→WGS 近似反算偏差小于 1e-4 度', () => {
    const gcj = wgs84ToGcj02(116.397428, 39.90923);
    const wgs = gcj02ToWgs84(gcj.lng, gcj.lat);
    expect(Math.abs(wgs.lng - 116.397428)).toBeLessThan(1e-4);
    expect(Math.abs(wgs.lat - 39.90923)).toBeLessThan(1e-4);
  });

  it('WGS→BD（经 GCJ 中转）与分步结果一致', () => {
    const direct = convert(
      116.397428,
      39.90923,
      CoordinateSystemEnum.WGS84,
      CoordinateSystemEnum.BD09,
    );
    const gcj = wgs84ToGcj02(116.397428, 39.90923);
    const stepwise = gcj02ToBd09(gcj.lng, gcj.lat);
    expect(direct.lng).toBeCloseTo(stepwise.lng, 10);
    expect(direct.lat).toBeCloseTo(stepwise.lat, 10);
  });

  it('同系转换原样返回', () => {
    const result = convert(
      116.404,
      39.915,
      CoordinateSystemEnum.GCJ02,
      CoordinateSystemEnum.GCJ02,
    );
    expect(result).toEqual({ lng: 116.404, lat: 39.915, outOfChina: false });
  });

  it('BD→WGS（经 GCJ 中转）往返偏差小于 1e-4 度', () => {
    const wgsPoint = { lng: 116.397428, lat: 39.90923 };
    const bd = convert(wgsPoint.lng, wgsPoint.lat, CoordinateSystemEnum.WGS84, CoordinateSystemEnum.BD09);
    const back = convert(bd.lng, bd.lat, CoordinateSystemEnum.BD09, CoordinateSystemEnum.WGS84);
    expect(Math.abs(back.lng - wgsPoint.lng)).toBeLessThan(1e-4);
    expect(Math.abs(back.lat - wgsPoint.lat)).toBeLessThan(1e-4);
  });
});

describe('convertBatch 批量解析', () => {
  it('多行输入顺序一致、空行跳过', () => {
    const rows = convertBatch(
      '116.404,39.915\n\n121.4737,31.2304\n',
      CoordinateSystemEnum.GCJ02,
      CoordinateSystemEnum.BD09,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]!.ok).toBe(true);
    expect(rows[0]!.lng).toBeCloseTo(116.41, 3);
    expect(rows[1]!.lat).toBeCloseTo(31.236, 2);
  });

  it('支持中文逗号与空白分隔', () => {
    const rows = convertBatch(
      '116.404，39.915',
      CoordinateSystemEnum.GCJ02,
      CoordinateSystemEnum.WGS84,
    );
    expect(rows[0]!.ok).toBe(true);
  });

  it('字段缺失仅该行报错', () => {
    const rows = convertBatch(
      '116.404\nabc,def\n121.4,31.2',
      CoordinateSystemEnum.WGS84,
      CoordinateSystemEnum.GCJ02,
    );
    expect(rows).toHaveLength(3);
    expect(rows[0]!.ok).toBe(false);
    expect(rows[1]!.ok).toBe(false);
    expect(rows[2]!.ok).toBe(true);
  });

  it('越界经纬度报错', () => {
    const rows = convertBatch(
      '200,30\n100,100',
      CoordinateSystemEnum.WGS84,
      CoordinateSystemEnum.GCJ02,
    );
    expect(rows[0]!.ok).toBe(false);
    expect(rows[1]!.ok).toBe(false);
  });

  it('空文本返回空数组', () => {
    expect(convertBatch('\n  \n', CoordinateSystemEnum.WGS84, CoordinateSystemEnum.GCJ02)).toEqual([]);
  });

  it('字段过多报错', () => {
    const rows = convertBatch('1,2,3', CoordinateSystemEnum.WGS84, CoordinateSystemEnum.GCJ02);
    expect(rows[0]!.ok).toBe(false);
  });
});
