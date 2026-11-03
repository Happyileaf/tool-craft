import { describe, expect, it } from 'vitest';
import { decodePolyline, encodePolyline, parsePointsText } from './polyline';

describe('encodePolyline', () => {
  it('编码 Google 官方精度 5 示例', () => {
    const points = [
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ];
    const result = encodePolyline(points, 5);
    expect(result.error).toBeNull();
    expect(result.output).toBe('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
  });

  it('空数组返回空字符串', () => {
    expect(encodePolyline([], 5)).toEqual({ output: '', error: null });
  });

  it('单点编码并往返一致', () => {
    const result = encodePolyline([{ lat: 39.9042, lng: 116.4074 }], 6);
    expect(result.error).toBeNull();
    const decoded = decodePolyline(result.output, 6);
    expect(decoded.error).toBeNull();
    expect(decoded.points[0].lat).toBeCloseTo(39.9042, 6);
    expect(decoded.points[0].lng).toBeCloseTo(116.4074, 6);
  });

  it('拒绝越界纬度', () => {
    const result = encodePolyline([{ lat: 91, lng: 0 }], 5);
    expect(result.output).toBe('');
    expect(result.error).toContain('纬度');
  });

  it('拒绝 NaN 坐标', () => {
    const result = encodePolyline([{ lat: NaN, lng: 1 }], 5);
    expect(result.error).toContain('非数字');
  });
});

describe('decodePolyline', () => {
  it('解码 Google 官方精度 5 示例', () => {
    const result = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@', 5);
    expect(result.error).toBeNull();
    expect(result.points).toHaveLength(3);
    expect(result.points[0]).toEqual({ lat: 38.5, lng: -120.2 });
    expect(result.points[1]).toEqual({ lat: 40.7, lng: -120.95 });
    expect(result.points[2].lat).toBeCloseTo(43.252, 5);
    expect(result.points[2].lng).toBeCloseTo(-126.453, 5);
  });

  it('解码精度 6 的短折线', () => {
    // 38.5,-120.2 -> 40.7,-120.95 在精度 6 下编码
    const encoded = encodePolyline(
      [
        { lat: 38.5, lng: -120.2 },
        { lat: 40.7, lng: -120.95 },
      ],
      6,
    ).output;
    const decoded = decodePolyline(encoded, 6);
    expect(decoded.points).toHaveLength(2);
    expect(decoded.points[1].lat).toBeCloseTo(40.7, 6);
  });

  it('空字符串返回空数组', () => {
    expect(decodePolyline('   ', 5)).toEqual({ points: [], error: null });
  });

  it('截断字符串给出定位错误', () => {
    const result = decodePolyline('_p~iF~ps|U_ulLnnq', 5);
    expect(result.points).toEqual([]);
    expect(result.error).toContain('截断');
  });

  it('非法字符给出字符位置错误', () => {
    const result = decodePolyline('!!!', 5);
    expect(result.error).toContain('不是合法');
  });

  it('精度选错时越界坐标给出提示', () => {
    // 用精度 6 编码、精度 5 解码大概率越界或失真
    const encoded = encodePolyline(
      [
        { lat: 38.5, lng: -120.2 },
        { lat: 40.7, lng: -120.95 },
      ],
      6,
    ).output;
    const result = decodePolyline(encoded, 5);
    expect(result.error).not.toBeNull();
  });
});

describe('parsePointsText', () => {
  it('解析逗号与空白分隔的多行坐标', () => {
    const result = parsePointsText('38.5, -120.2\n40.7,-120.95\n  \n');
    expect(result.error).toBeNull();
    expect(result.points).toHaveLength(2);
    expect(result.points[1].lng).toBe(-120.95);
  });

  it('字段数错误时报错', () => {
    const result = parsePointsText('1,2,3');
    expect(result.error).toContain('第 1 行');
  });
});
