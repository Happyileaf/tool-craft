import { describe, expect, it } from 'vitest';
import {
  PolygonError,
  arithmeticCentroid,
  dedupeVertices,
  measureGeoJsonCollection,
  measurePolygon,
  measureRing,
  parseCoordinateText,
  parseGeoJson,
  ringPerimeter,
  shoelaceSignedArea,
} from './polygon';

describe('parseCoordinateText', () => {
  it('按行解析逗号 / 空格 / 制表符 / 中文逗号分隔', () => {
    expect(parseCoordinateText('0, 0\n1 0\n1\t1\n0，1')).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]);
  });

  it('空行跳过', () => {
    expect(parseCoordinateText('0,0\n\n1,1\n')).toHaveLength(2);
  });

  it('非数字坐标带行号报错', () => {
    expect(() => parseCoordinateText('0,0\na,b')).toThrowError(PolygonError);
    expect(() => parseCoordinateText('0,0\na,b')).toThrow('第 2 行');
  });

  it('每行不是两段时报错并带行号', () => {
    expect(() => parseCoordinateText('0 0 0')).toThrow('第 1 行');
  });
});

describe('dedupeVertices', () => {
  it('移除相邻重复点', () => {
    const { vertices, removed } = dedupeVertices([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);
    expect(vertices).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);
    expect(removed).toBe(1);
  });

  it('移除显式闭合点（末点等于首点）', () => {
    const { vertices, removed } = dedupeVertices([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 0 },
    ]);
    expect(vertices).toHaveLength(3);
    expect(removed).toBe(1);
  });
});

describe('shoelaceSignedArea', () => {
  it('单位正方形面积为 1', () => {
    const signed = shoelaceSignedArea([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]);
    expect(signed).toBeCloseTo(1, 10);
  });

  it('CCW 为正、CW 为负', () => {
    const ccw = shoelaceSignedArea([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ]);
    const cw = shoelaceSignedArea([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
    ]);
    expect(ccw).toBeGreaterThan(0);
    expect(cw).toBeLessThan(0);
    expect(Math.abs(ccw)).toBeCloseTo(Math.abs(cw), 10);
  });
});

describe('ringPerimeter', () => {
  it('单位正方形周长为 4（自动计入闭合边）', () => {
    const perimeter = ringPerimeter([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]);
    expect(perimeter).toBeCloseTo(4, 10);
  });
});

describe('arithmeticCentroid', () => {
  it('顶点算术平均', () => {
    expect(
      arithmeticCentroid([
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 0, y: 3 },
      ]),
    ).toEqual({ x: 4 / 3, y: 1 });
  });
});

describe('measureRing - 验收固定向量', () => {
  it('单位正方形：面积 1、周长 4', () => {
    const metrics = measureRing([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]);
    expect(metrics.area).toBeCloseTo(1, 10);
    expect(metrics.perimeter).toBeCloseTo(4, 10);
    expect(metrics.vertexCount).toBe(4);
    expect(metrics.direction).toBe('ccw');
  });

  it('未显式闭合输入结果与闭合输入一致', () => {
    const open = measureRing([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]);
    const closed = measureRing([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
    ]);
    expect(closed.vertexCount).toBe(open.vertexCount);
    expect(closed.area).toBeCloseTo(open.area, 10);
    expect(closed.perimeter).toBeCloseTo(open.perimeter, 10);
  });

  it('直角三角形 (0,0)(4,0)(0,3)：面积 6、周长 12', () => {
    const metrics = measureRing([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 3 },
    ]);
    expect(metrics.area).toBeCloseTo(6, 10);
    expect(metrics.perimeter).toBeCloseTo(12, 10);
    expect(metrics.direction).toBe('ccw');
  });

  it('少于 3 个不重复顶点报错', () => {
    expect(() =>
      measureRing([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ]),
    ).toThrowError(PolygonError);
  });

  it('共线退化多边形方向为 degenerate', () => {
    const metrics = measureRing([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
    expect(metrics.direction).toBe('degenerate');
    expect(metrics.area).toBeCloseTo(0, 10);
  });
});

describe('measurePolygon - 带孔', () => {
  it('净面积 = 外环 − 内环，周长仅计外环', () => {
    const metrics = measurePolygon(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
      [
        [
          { x: 2, y: 2 },
          { x: 4, y: 2 },
          { x: 4, y: 4 },
          { x: 2, y: 4 },
        ],
      ],
    );
    expect(metrics.netArea).toBeCloseTo(96, 10);
    expect(metrics.area).toBeCloseTo(100, 10);
    expect(metrics.perimeter).toBeCloseTo(40, 10);
    expect(metrics.holeCount).toBe(1);
  });
});

describe('parseGeoJson', () => {
  it('解析 Polygon（含 Feature 包装）', () => {
    const geojson = JSON.stringify({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      },
    });
    const items = parseGeoJson(geojson);
    expect(items).toHaveLength(1);
    expect(items[0]!.outer).toHaveLength(5);
    expect(items[0]!.holes).toHaveLength(0);
  });

  it('带孔 Polygon：外环减内环', () => {
    const geojson = JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
        [
          [2, 2],
          [4, 2],
          [4, 4],
          [2, 4],
          [2, 2],
        ],
      ],
    });
    const { metrics, totalNetArea } = measureGeoJsonCollection(parseGeoJson(geojson));
    expect(metrics).toHaveLength(1);
    expect(metrics[0]!.netArea).toBeCloseTo(96, 10);
    expect(totalNetArea).toBeCloseTo(96, 10);
  });

  it('MultiPolygon 逐多边形度量并汇总', () => {
    const geojson = JSON.stringify({
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
        [
          [
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
            [0, 0],
          ],
        ],
      ],
    });
    const { metrics, totalNetArea, totalPerimeter } = measureGeoJsonCollection(
      parseGeoJson(geojson),
    );
    expect(metrics).toHaveLength(2);
    expect(totalNetArea).toBeCloseTo(5, 10);
    expect(totalPerimeter).toBeCloseTo(12, 10);
  });

  it('非法 JSON 报错', () => {
    expect(() => parseGeoJson('{not json')).toThrowError(PolygonError);
  });

  it('不支持的类型报错', () => {
    expect(() =>
      parseGeoJson(JSON.stringify({ type: 'Point', coordinates: [0, 0] })),
    ).toThrow('不支持的 GeoJSON 类型');
  });

  it('位置缺少数值报错', () => {
    expect(() =>
      parseGeoJson(
        JSON.stringify({ type: 'Polygon', coordinates: [[[0]]] }),
      ),
    ).toThrowError(PolygonError);
  });
});
