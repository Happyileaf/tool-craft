import { describe, expect, it } from 'vitest';
import {
  backBearing,
  calculateGreatCircle,
  compassPoint,
  finalBearing,
  greatCircleDistance,
  initialBearing,
  toRadians,
  type LatLon,
} from './geo';

/** 断言浮点数近似相等 */
function expectClose(actual: number, expected: number, tolerance = 1e-6): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

const ORIGIN: LatLon = { lat: 0, lon: 0 };
const ONE_DEGREE_EAST: LatLon = { lat: 0, lon: 1 };
const LONDON: LatLon = { lat: 51.5074, lon: -0.1278 };
const NEW_YORK: LatLon = { lat: 40.7128, lon: -74.006 };

describe('toRadians', () => {
  it('角度转弧度', () => {
    expect(toRadians(0)).toBe(0);
    expectClose(toRadians(180), Math.PI);
    expectClose(toRadians(90), Math.PI / 2);
  });
});

describe('greatCircleDistance', () => {
  it('赤道上 1 度经度约为 111.195 km', () => {
    expectClose(greatCircleDistance(ORIGIN, ONE_DEGREE_EAST), 111.19508, 1e-3);
  });

  it('支持英里与海里单位换算', () => {
    expectClose(greatCircleDistance(ORIGIN, ONE_DEGREE_EAST, 'mi'), 69.09342, 1e-3);
    expectClose(greatCircleDistance(ORIGIN, ONE_DEGREE_EAST, 'nmi'), 60.04054, 1e-3);
  });

  it('伦敦到纽约约 5570 km', () => {
    expectClose(greatCircleDistance(LONDON, NEW_YORK), 5570.23, 0.01);
    expectClose(greatCircleDistance(LONDON, NEW_YORK, 'mi'), 3461.18, 0.01);
    expectClose(greatCircleDistance(LONDON, NEW_YORK, 'nmi'), 3007.68, 0.01);
  });

  it('距离具有对称性且重合点距离为 0', () => {
    expectClose(greatCircleDistance(LONDON, NEW_YORK), greatCircleDistance(NEW_YORK, LONDON));
    expect(greatCircleDistance(LONDON, LONDON)).toBe(0);
  });

  it('经纬度越界或为 NaN 时抛错', () => {
    expect(() => greatCircleDistance({ lat: 91, lon: 0 }, ORIGIN)).toThrow('纬度');
    expect(() => greatCircleDistance(ORIGIN, { lat: 0, lon: -181 })).toThrow('经度');
    expect(() => greatCircleDistance({ lat: NaN, lon: 0 }, ORIGIN)).toThrow('数字');
  });
});

describe('initialBearing', () => {
  it('赤道上正东方向初始方位角为 90°', () => {
    expectClose(initialBearing(ORIGIN, ONE_DEGREE_EAST), 90);
  });

  it('正北方向为 0°，正西为 270°', () => {
    expectClose(initialBearing(ORIGIN, { lat: 1, lon: 0 }), 0);
    expectClose(initialBearing(ORIGIN, { lat: 0, lon: -1 }), 270);
  });

  it('伦敦到纽约初始方位角约 288.33°', () => {
    expectClose(initialBearing(LONDON, NEW_YORK), 288.3297, 1e-3);
  });

  it('两点重合时返回 0', () => {
    expect(initialBearing(LONDON, LONDON)).toBe(0);
  });
});

describe('finalBearing / backBearing', () => {
  it('伦敦到纽约终点方位角约 231.21°', () => {
    expectClose(finalBearing(LONDON, NEW_YORK), 231.2126, 1e-3);
  });

  it('反方位角为返程初始方位角，约 51.21°', () => {
    expectClose(backBearing(LONDON, NEW_YORK), 51.2126, 1e-3);
    expectClose(backBearing(LONDON, NEW_YORK), initialBearing(NEW_YORK, LONDON));
  });

  it('终点方位角与返程初始方位角相差 180°', () => {
    const diff = Math.abs(finalBearing(LONDON, NEW_YORK) - backBearing(LONDON, NEW_YORK));
    expectClose(diff, 180);
  });
});

describe('calculateGreatCircle', () => {
  it('一次返回三种单位距离与全部方位角', () => {
    const result = calculateGreatCircle(LONDON, NEW_YORK);
    expectClose(result.km, 5570.23, 0.01);
    expectClose(result.mi, 3461.18, 0.01);
    expectClose(result.nmi, 3007.68, 0.01);
    expectClose(result.initialBearing, 288.3297, 1e-3);
    expectClose(result.finalBearing, 231.2126, 1e-3);
    expectClose(result.backBearing, 51.2126, 1e-3);
  });
});

describe('compassPoint', () => {
  it('八个主方位与中间方位', () => {
    expect(compassPoint(0)).toBe('N');
    expect(compassPoint(45)).toBe('NE');
    expect(compassPoint(90)).toBe('E');
    expect(compassPoint(180)).toBe('S');
    expect(compassPoint(270)).toBe('W');
  });

  it('16 方位边界按就近原则舍入并循环', () => {
    expect(compassPoint(11.25)).toBe('NNE');
    expect(compassPoint(348.75)).toBe('N');
    expect(compassPoint(-90)).toBe('W');
    expect(compassPoint(360)).toBe('N');
    expect(compassPoint(22.5)).toBe('NNE');
  });
});
