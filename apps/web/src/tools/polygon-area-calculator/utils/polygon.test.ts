import { describe, it, expect } from 'vitest';
import {
  dedupeClosingPoint,
  ringPerimeter,
  isSelfIntersecting,
  measureRing,
  measurePolygon,
  parseCoordinateText,
  parseGeoJson,
  type Ring,
} from './polygon';

describe('鞋带公式面积与周长', () => {
  it('单位正方形面积为 1、周长为 4', () => {
    const square: Ring = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const result = measureRing(square, 0);
    expect(result.area).toBe(1);
    expect(result.perimeter).toBe(4);
    expect(result.vertexCount).toBe(4);
  });

  it('直角三角形 (0,0)(3,0)(0,4) 面积为 6、周长为 12', () => {
    const triangle: Ring = [
      [0, 0],
      [3, 0],
      [0, 4],
    ];
    const result = measureRing(triangle, 0);
    expect(result.area).toBe(6);
    expect(result.perimeter).toBe(12);
  });

  it('周长计算正确（含闭合边）', () => {
    const rect: Ring = [
      [0, 0],
      [2, 0],
      [2, 3],
      [0, 3],
    ];
    expect(ringPerimeter(rect)).toBe(10);
  });
});

describe('环方向判定', () => {
  it('逆时针顶点 signed area 为正，标记 ccw', () => {
    const ccw: Ring = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const result = measureRing(ccw, 0);
    expect(result.signedArea).toBe(1);
    expect(result.orientation).toBe('ccw');
  });

  it('顺时针顶点 signed area 为负，标记 cw', () => {
    const cw: Ring = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ];
    const result = measureRing(cw, 0);
    expect(result.signedArea).toBe(-1);
    expect(result.orientation).toBe('cw');
  });
});

describe('闭合点去重', () => {
  it('首尾点重复时自动去重，结果与不重复写法一致', () => {
    const closed: Ring = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ];
    expect(dedupeClosingPoint(closed)).toHaveLength(4);
    const result = measureRing(closed, 0);
    expect(result.vertexCount).toBe(4);
    expect(result.area).toBe(1);
    expect(result.perimeter).toBe(4);
  });
});

describe('自相交检测', () => {
  it('简单多边形不相交', () => {
    const square: Ring = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    expect(isSelfIntersecting(square)).toBe(false);
  });

  it('蝴蝶结（bowtie）自相交被检出', () => {
    const bowtie: Ring = [
      [0, 0],
      [2, 2],
      [2, 0],
      [0, 2],
    ];
    expect(isSelfIntersecting(bowtie)).toBe(true);
    expect(measureRing(bowtie, 0).selfIntersecting).toBe(true);
  });
});

describe('孔洞与净面积', () => {
  it('外环减孔洞得到净面积', () => {
    // 外 4×4 正方形（面积 16），内 2×2 孔洞（面积 4）
    const outer: Ring = [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ];
    const hole: Ring = [
      [1, 1],
      [3, 1],
      [3, 3],
      [1, 3],
    ];
    const result = measurePolygon([outer, hole]);
    expect(result.netArea).toBe(12);
    expect(result.rings).toHaveLength(2);
    expect(result.outerPerimeter).toBe(16);
    expect(result.totalVertices).toBe(8);
  });
});

describe('坐标文本解析', () => {
  it('解析每行 x,y 顶点', () => {
    const ring = parseCoordinateText('0, 0\n1, 0\n1, 1');
    expect(ring).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
    ]);
  });

  it('容忍中文逗号、制表符与多余空白', () => {
    const ring = parseCoordinateText('0，0\n\t1，0\n1 ， 1');
    expect(ring).toHaveLength(3);
  });

  it('非数字坐标报错', () => {
    expect(() => parseCoordinateText('0,a\n1,2')).toThrow(/非数字/);
  });

  it('字段不足报错', () => {
    expect(() => parseCoordinateText('0\n1,2')).toThrow(/无法解析/);
  });

  it('顶点不足 3 个量算时报错', () => {
    expect(() => measureRing(parseCoordinateText('0,0\n1,1'), 0)).toThrow(/不足 3 个/);
  });
});

describe('GeoJSON 解析', () => {
  it('解析 Polygon 的外环与孔洞并计算净面积', () => {
    const geojson = JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4],
          [0, 0],
        ],
        [
          [1, 1],
          [3, 1],
          [3, 3],
          [1, 3],
          [1, 1],
        ],
      ],
    });
    const polygons = parseGeoJson(geojson);
    expect(polygons).toHaveLength(1);
    const measurement = measurePolygon(polygons[0]!);
    expect(measurement.netArea).toBe(12);
  });

  it('解析 MultiPolygon 为多个多边形', () => {
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
            [2, 2],
            [3, 2],
            [3, 3],
            [2, 3],
            [2, 2],
          ],
        ],
      ],
    });
    const polygons = parseGeoJson(geojson);
    expect(polygons).toHaveLength(2);
    expect(measurePolygon(polygons[1]!).netArea).toBe(1);
  });

  it('非法 JSON 报错', () => {
    expect(() => parseGeoJson('{not json')).toThrow(/合法 JSON/);
  });

  it('不支持的类型报错', () => {
    expect(() => parseGeoJson(JSON.stringify({ type: 'Point', coordinates: [0, 0] }))).toThrow(
      /仅支持 Polygon/,
    );
  });

  it('结构损坏报错', () => {
    expect(() => parseGeoJson(JSON.stringify({ type: 'Polygon', coordinates: [] }))).toThrow(
      /缺少环数据/,
    );
    expect(() =>
      parseGeoJson(JSON.stringify({ type: 'Polygon', coordinates: [[['x', 0]]] })),
    ).toThrow(/非数字/);
  });
});
