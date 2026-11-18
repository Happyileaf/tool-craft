import { describe, expect, it } from 'vitest';
import { decodeMaidenhead, encodeMaidenhead } from './maidenhead';

describe('encodeMaidenhead 编码', () => {
  it('典型城市坐标编码为手工核算的网格', () => {
    // 下列期望值由独立参考实现按 ARRL 层级规则核算并与本实现交叉验证
    expect(encodeMaidenhead(48.14863, 11.60889, 3)).toBe('JN58TD'); // 慕尼黑
    expect(encodeMaidenhead(41.714775, -74.005544, 3)).toBe('FN21XR'); // 纽约
    expect(encodeMaidenhead(39.9042, 116.4074, 3)).toBe('OM89EV'); // 北京
    expect(encodeMaidenhead(50.8949, 4.3415, 3)).toBe('JO20EV'); // 布鲁塞尔原子塔
  });

  it('支持 2/4/6/8/10 字符精度，且高精度以低精度为前缀', () => {
    const base = encodeMaidenhead(48.14863, 11.60889, 1);
    expect(base).toHaveLength(2);
    expect(encodeMaidenhead(48.14863, 11.60889, 2)).toHaveLength(4);
    expect(encodeMaidenhead(48.14863, 11.60889, 3)).toHaveLength(6);
    expect(encodeMaidenhead(48.14863, 11.60889, 4)).toHaveLength(8);
    expect(encodeMaidenhead(48.14863, 11.60889, 5)).toHaveLength(10);
    expect(encodeMaidenhead(48.14863, 11.60889, 5).startsWith(base)).toBe(true);
  });

  it('默认输出 6 字符（3 对字段）', () => {
    expect(encodeMaidenhead(0, 0)).toBe('JJ00AA');
  });

  it('边界坐标：经度 -180、两极', () => {
    // 经度 -180 落在最西 field A；纬度 0 在赤道，对应纬度 field J（-90 起每 10° 一格）
    expect(encodeMaidenhead(0, -180, 1)).toBe('AJ');
    expect(encodeMaidenhead(90, 0, 1)).toBe('JR'); // 北极：纬度 field 末格 R
    expect(encodeMaidenhead(-90, 0, 1)).toBe('JA'); // 南极：纬度 field 首格 A
    expect(() => encodeMaidenhead(0, 180, 1)).toThrow('经度');
  });

  it('非法参数抛错', () => {
    expect(() => encodeMaidenhead(91, 0)).toThrow('纬度');
    expect(() => encodeMaidenhead(0, -181)).toThrow('经度');
    expect(() => encodeMaidenhead(0, 0, 0)).toThrow('字段对');
    expect(() => encodeMaidenhead(0, 0, 6)).toThrow('字段对');
    expect(() => encodeMaidenhead(NaN, 0)).toThrow('有限数值');
  });
});

describe('decodeMaidenhead 解码', () => {
  it('FN31pr 中心与边界按层级规则核算', () => {
    const bounds = decodeMaidenhead('FN31pr');
    expect(bounds.locator).toBe('FN31PR');
    expect(bounds.pairs).toBe(3);
    // 6 字符格：经度 5′、纬度 2.5′
    expect(bounds.east - bounds.west).toBeCloseTo(5 / 60, 6);
    expect(bounds.north - bounds.south).toBeCloseTo(2.5 / 60, 6);
    // 与独立参考实现核算的中心坐标一致
    expect(bounds.centerLat).toBeCloseTo(41.7291667, 4);
    expect(bounds.centerLon).toBeCloseTo(-72.7083333, 4);
  });

  it('JN58TD 中心落在慕尼黑附近', () => {
    const bounds = decodeMaidenhead('JN58TD');
    expect(bounds.centerLat).toBeCloseTo(48.1458333, 4);
    expect(bounds.centerLon).toBeCloseTo(11.625, 4);
  });

  it('2 字符 field 跨度为 20° × 10°', () => {
    const aa = decodeMaidenhead('AA');
    expect(aa.east - aa.west).toBeCloseTo(20, 10);
    expect(aa.north - aa.south).toBeCloseTo(10, 10);
    expect(aa.west).toBeCloseTo(-180, 10);
    expect(aa.south).toBeCloseTo(-90, 10);
    const rr = decodeMaidenhead('RR');
    expect(rr.east).toBeCloseTo(180, 10);
    expect(rr.north).toBeCloseTo(90, 10);
  });

  it('大小写与空白容错', () => {
    expect(decodeMaidenhead('  fn31pr ').locator).toBe('FN31PR');
  });

  it('非法输入抛错', () => {
    expect(() => decodeMaidenhead('')).toThrow('不能为空');
    expect(() => decodeMaidenhead('abc')).toThrow('偶数');
    expect(() => decodeMaidenhead('ZZ11aa')).toThrow('取值范围');
    expect(() => decodeMaidenhead('1A11aa')).toThrow('字母');
    expect(() => decodeMaidenhead('FNabpr')).toThrow('数字');
    expect(() => decodeMaidenhead('FN31pr00aa11bb')).toThrow('最多支持');
  });
});

describe('编解码往返一致性', () => {
  it('解码中心坐标重新编码回到同一网格（3 对）', () => {
    const samples: Array<[number, number]> = [
      [39.9042, 116.4074],
      [-33.8688, 151.2093],
      [1.3521, 103.8198],
      [55.7558, 37.6173],
      [-54.8, -68.3],
    ];
    samples.forEach(([lat, lon]) => {
      const locator = encodeMaidenhead(lat, lon, 3);
      const bounds = decodeMaidenhead(locator);
      expect(encodeMaidenhead(bounds.centerLat, bounds.centerLon, 3)).toBe(locator);
    });
  });

  it('原坐标落在解码出的网格边界内', () => {
    const lat = 35.6762;
    const lon = 139.6503;
    const bounds = decodeMaidenhead(encodeMaidenhead(lat, lon, 4));
    expect(lon).toBeGreaterThanOrEqual(bounds.west);
    expect(lon).toBeLessThan(bounds.east);
    expect(lat).toBeGreaterThanOrEqual(bounds.south);
    expect(lat).toBeLessThan(bounds.north);
  });

  it('2/4/6/8/10 字符解码跨度逐级缩小 10 或 24 倍', () => {
    const r2 = decodeMaidenhead('JN');
    const r4 = decodeMaidenhead('JN58');
    const r6 = decodeMaidenhead('JN58TD');
    expect((r2.east - r2.west) / (r4.east - r4.west)).toBeCloseTo(10, 6);
    expect((r4.east - r4.west) / (r6.east - r6.west)).toBeCloseTo(24, 6);
  });
});
