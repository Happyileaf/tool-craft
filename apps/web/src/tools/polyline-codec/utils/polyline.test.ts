import { describe, it, expect } from 'vitest';
import {
  decodePolyline,
  encodePolyline,
  formatPointsText,
  normalizePrecision,
  parsePointsText,
} from './polyline';

describe('polyline 编码', () => {
  it('Google 官方向量（精度 5）', () => {
    const points = [
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ];
    expect(encodePolyline(points, 5).output).toBe('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
  });

  it('大数值单点：编码后可精确解码回原坐标', () => {
    const points = [{ lat: 0, lng: -179.9832104 }];
    const encoded = encodePolyline(points, 5).output as string;
    expect(encoded.length).toBeGreaterThan(0);
    const decoded = decodePolyline(encoded, 5).points;
    expect(decoded).toHaveLength(1);
    expect(decoded?.[0]?.lat).toBe(0);
    expect(decoded?.[0]?.lng).toBeCloseTo(-179.98321, 5);
  });

  it('精度 0 时坐标按整数处理', () => {
    const result = encodePolyline([{ lat: 0, lng: 0 }, { lat: 1, lng: -1 }], 0);
    expect(result.output).toBe('??A@');
  });

  it('精度 6 往返一致', () => {
    const points = [
      { lat: 31.230416, lng: 121.473701 },
      { lat: 31.232340, lng: 121.480123 },
      { lat: 31.240000, lng: 121.500001 },
    ];
    const encoded = encodePolyline(points, 6).output;
    expect(encoded).not.toBeNull();
    const decoded = decodePolyline(encoded as string, 6).points;
    expect(decoded).toHaveLength(3);
    decoded?.forEach((point, index) => {
      expect(point.lat).toBeCloseTo(points[index]?.lat ?? 0, 6);
      expect(point.lng).toBeCloseTo(points[index]?.lng ?? 0, 6);
    });
  });

  it('空点数组报错', () => {
    expect(encodePolyline([], 5)).toEqual({ output: null, error: expect.stringContaining('至少') });
  });

  it('纬度 / 经度越界报错', () => {
    expect(encodePolyline([{ lat: 91, lng: 0 }], 5).error).toContain('纬度');
    expect(encodePolyline([{ lat: 0, lng: -181 }], 5).error).toContain('经度');
    expect(encodePolyline([{ lat: NaN, lng: 0 }], 5).error).toContain('有效数字');
  });
});

describe('polyline 解码', () => {
  it('Google 官方向量（精度 5）', () => {
    const result = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@', 5);
    expect(result.error).toBeNull();
    expect(result.points).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]);
  });

  it('空串报错', () => {
    expect(decodePolyline('', 5).error).toContain('为空');
  });

  it('编码不完整（数值中途结束）报错', () => {
    // chunk 低 5 位为 0 且续位标志置位（ASCII 95），但后面没有任何字符
    const result = decodePolyline(String.fromCharCode(63 + 0x20));
    expect(result.error).toContain('不完整');
  });

  it('非法字符报错', () => {
    const result = decodePolyline('中文', 5);
    expect(result.error).toContain('非法');
  });

  it('精度不匹配导致坐标越界时报错', () => {
    // 官方向量按精度 5 解码正常；按精度 1 解码会放大 10^4 倍而越界
    const result = decodePolyline('_p~iF~ps|U', 1);
    expect(result.error).toContain('精度');
  });
});

describe('坐标文本解析', () => {
  it('逗号 / 空白 / 分号分隔均可解析，空行忽略', () => {
    const text = '38.5, -120.2\n\n40.7 -120.95\n43.252;\t-126.453\n';
    const { points } = parsePointsText(text);
    expect(points).toHaveLength(3);
    expect(points?.[2]).toEqual({ lat: 43.252, lng: -126.453 });
  });

  it('空白文本返回空而非错误', () => {
    expect(parsePointsText('  \n ')).toEqual({ points: null, error: null });
  });

  it('字段数错误报错并定位行号', () => {
    expect(parsePointsText('1,2\n3').error).toContain('第 2 行');
    expect(parsePointsText('a,b').error).toContain('第 1 行');
  });

  it('格式化与解析互逆', () => {
    const points = [
      { lat: 1.5, lng: 2.5 },
      { lat: -3, lng: -4 },
    ];
    expect(parsePointsText(formatPointsText(points)).points).toEqual(points);
  });
});

describe('精度归一化', () => {
  it('越界值收敛到允许范围', () => {
    expect(normalizePrecision(-5)).toBe(0);
    expect(normalizePrecision(99)).toBe(13);
    expect(normalizePrecision(5.4)).toBe(5);
    expect(normalizePrecision(Number.NaN)).toBe(0);
  });
});
