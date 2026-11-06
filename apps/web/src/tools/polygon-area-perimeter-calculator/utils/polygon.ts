/**
 * 多边形几何纯函数集合：坐标解析、自动闭合、鞋带公式面积、
 * 周长、质心与环绕方向判定，并支持 GeoJSON Polygon / MultiPolygon 输入。
 * 全部为平面笛卡尔坐标运算；GeoJSON 经纬度仅做平面近似，不做球面修正。
 */

/** 二维点 */
export interface Point {
  x: number;
  y: number;
}

/** 输入模式 */
export type InputMode = 'coordinates' | 'geojson';

/** 环绕方向 */
export type WindingDirection = 'ccw' | 'cw' | 'degenerate';

/** 多边形解析与度量错误 */
export class PolygonError extends Error {}

/**
 * 单个环（多边形外环或孔内环）的度量结果
 */
export interface RingMetrics {
  /** 顶点数（自动闭合后的去重顶点） */
  vertexCount: number;
  /** 有向面积（鞋带公式，带符号；CCW 为正，CW 为负） */
  signedArea: number;
  /** 绝对面积 */
  area: number;
  /** 周长（逐边欧氏距离之和，闭合边自动计入） */
  perimeter: number;
  /** 顶点算术质心 */
  centroid: Point;
  /** 环绕方向 */
  direction: WindingDirection;
}

/**
 * 完整多边形度量（支持孔）
 */
export interface PolygonMetrics extends RingMetrics {
  /** 外环减去全部内环后的净面积（孔不影响周长口径，周长仅统计外环） */
  netArea: number;
  /** 孔的数量 */
  holeCount: number;
}

/**
 * 解析坐标文本：每行一个点，支持逗号 / 空格 / 制表符分隔的 x,y。
 *
 * @param text - 多行坐标文本
 * @returns 点数组
 * @throws 行格式错误或坐标非数字时抛出带行号的 PolygonError
 */
export function parseCoordinateText(text: string): Point[] {
  const lines = text.split(/\r?\n/);
  const points: Point[] = [];
  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }
    const parts = line.split(/[\s,，\t]+/).filter((part) => part.length > 0);
    if (parts.length !== 2) {
      throw new PolygonError(`第 ${index + 1} 行格式错误：应为「x, y」两个数值，实际得到 ${parts.length} 段`);
    }
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new PolygonError(`第 ${index + 1} 行坐标非数字：「${rawLine.trim()}」`);
    }
    points.push({ x, y });
  });
  return points;
}

/**
 * 去除相邻重复点，并在首末点不同（或去重后末点等于首点）时保证逻辑闭合：
 * 返回不含重复闭合点的顶点序列，面积与周长计算时再自动补闭合边。
 *
 * @param points - 原始点序列
 * @returns 去重后的顶点序列与被移除的重复点数量
 */
export function dedupeVertices(points: Point[]): { vertices: Point[]; removed: number } {
  if (points.length === 0) {
    return { vertices: [], removed: 0 };
  }
  const vertices: Point[] = [];
  let removed = 0;
  for (const point of points) {
    const last = vertices[vertices.length - 1];
    if (last && last.x === point.x && last.y === point.y) {
      removed += 1;
    } else {
      vertices.push(point);
    }
  }
  // 末点与首点相同时移除显式闭合点
  if (vertices.length > 1) {
    const first = vertices[0]!;
    const last = vertices[vertices.length - 1]!;
    if (first.x === last.x && first.y === last.y) {
      vertices.pop();
      removed += 1;
    }
  }
  return { vertices, removed };
}

/**
 * 鞋带公式计算有向面积（不修改输入，自动按闭合环处理）。
 *
 * @param vertices - 去重后的闭合环顶点（无需重复首点）
 * @returns 有向面积（CCW 正 / CW 负）
 */
export function shoelaceSignedArea(vertices: Point[]): number {
  let sum = 0;
  for (let i = 0; i < vertices.length; i += 1) {
    const current = vertices[i]!;
    const next = vertices[(i + 1) % vertices.length]!;
    sum += current.x * next.y - next.x * current.y;
  }
  return sum / 2;
}

/**
 * 计算周长：逐边欧氏距离，含末点回首点的闭合边。
 *
 * @param vertices - 去重后的闭合环顶点
 * @returns 周长
 */
export function ringPerimeter(vertices: Point[]): number {
  let perimeter = 0;
  for (let i = 0; i < vertices.length; i += 1) {
    const current = vertices[i]!;
    const next = vertices[(i + 1) % vertices.length]!;
    perimeter += Math.hypot(next.x - current.x, next.y - current.y);
  }
  return perimeter;
}

/**
 * 顶点算术质心（非面积加权形心，界面明确标注口径）。
 *
 * @param vertices - 顶点序列
 * @returns 算术平均点
 */
export function arithmeticCentroid(vertices: Point[]): Point {
  const total = vertices.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  return {
    x: total.x / vertices.length,
    y: total.y / vertices.length,
  };
}

/**
 * 计算单个环的完整度量。
 *
 * @param points - 环上的点（允许显式闭合点与相邻重复点）
 * @returns 环度量
 * @throws 顶点少于 3 个时抛出 PolygonError
 */
export function measureRing(points: Point[]): RingMetrics {
  const { vertices } = dedupeVertices(points);
  if (vertices.length < 3) {
    throw new PolygonError(`多边形至少需要 3 个不重复顶点，当前为 ${vertices.length} 个`);
  }
  const signedArea = shoelaceSignedArea(vertices);
  const area = Math.abs(signedArea);
  let direction: WindingDirection;
  if (Math.abs(signedArea) < 1e-12) {
    direction = 'degenerate';
  } else {
    direction = signedArea > 0 ? 'ccw' : 'cw';
  }
  return {
    vertexCount: vertices.length,
    signedArea,
    area,
    perimeter: ringPerimeter(vertices),
    centroid: arithmeticCentroid(vertices),
    direction,
  };
}

/**
 * 计算带孔多边形的净面积：外环绝对面积减去各内环绝对面积。
 * 周长与其他度量按外环返回。
 *
 * @param outer - 外环点序列
 * @param holes - 孔内环点序列数组
 * @returns 多边形度量
 */
export function measurePolygon(outer: Point[], holes: Point[][] = []): PolygonMetrics {
  const outerMetrics = measureRing(outer);
  const holeArea = holes.reduce((sum, hole) => sum + measureRing(hole).area, 0);
  return {
    ...outerMetrics,
    netArea: Math.max(outerMetrics.area - holeArea, 0),
    holeCount: holes.length,
  };
}

/**
 * GeoJSON 位置数组（[x, y] 或 [x, y, z]）转点序列。
 */
function positionsToPoints(positions: unknown): Point[] {
  if (!Array.isArray(positions)) {
    throw new PolygonError('GeoJSON 坐标结构非法：环应为位置数组');
  }
  return positions.map((position) => {
    if (!Array.isArray(position) || position.length < 2) {
      throw new PolygonError('GeoJSON 位置至少需要 [x, y] 两个数值');
    }
    const x = Number(position[0]);
    const y = Number(position[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new PolygonError('GeoJSON 位置包含非数字坐标');
    }
    return { x, y };
  });
}

/**
 * 解析 GeoJSON 文本，支持 Polygon 与 MultiPolygon。
 *
 * @param text - GeoJSON 几何或 Feature 文本
 * @returns 多个多边形（每个含外环与孔）
 */
export function parseGeoJson(text: string): Array<{ outer: Point[]; holes: Point[][]; index: number }> {
  let geo: unknown;
  try {
    geo = JSON.parse(text);
  } catch {
    throw new PolygonError('GeoJSON 不是合法 JSON，请检查括号与引号');
  }
  const root = geo as Record<string, unknown>;
  // 兼容 Feature 包装
  const geometry = root.type === 'Feature' ? (root.geometry as Record<string, unknown>) : root;
  if (!geometry || typeof geometry !== 'object') {
    throw new PolygonError('GeoJSON 缺少 geometry 对象');
  }
  const type = geometry.type;
  const coordinates = geometry.coordinates;

  if (type === 'Polygon') {
    const rings = coordinates as unknown[][];
    if (!Array.isArray(rings) || rings.length === 0) {
      throw new PolygonError('Polygon coordinates 至少需要一个环');
    }
    const outer = positionsToPoints(rings[0]);
    const holes = rings.slice(1).map((ring) => positionsToPoints(ring));
    return [{ outer, holes, index: 0 }];
  }

  if (type === 'MultiPolygon') {
    const polygons = coordinates as unknown[][][];
    if (!Array.isArray(polygons) || polygons.length === 0) {
      throw new PolygonError('MultiPolygon coordinates 至少需要一个多边形');
    }
    return polygons.map((rings, index) => {
      if (!Array.isArray(rings) || rings.length === 0) {
        throw new PolygonError(`第 ${index + 1} 个多边形缺少外环`);
      }
      return {
        outer: positionsToPoints(rings[0]),
        holes: rings.slice(1).map((ring) => positionsToPoints(ring)),
        index,
      };
    });
  }

  throw new PolygonError(`不支持的 GeoJSON 类型「${String(type)}」，仅支持 Polygon 与 MultiPolygon`);
}

/**
 * 汇总多个多边形的净面积与总周长（MultiPolygon 场景）。
 *
 * @param items - parseGeoJson 的返回项
 * @returns 每个多边形的度量与汇总
 */
export function measureGeoJsonCollection(items: Array<{ outer: Point[]; holes: Point[][]; index: number }>): {
  metrics: PolygonMetrics[];
  totalNetArea: number;
  totalPerimeter: number;
} {
  const metrics = items.map((item) => measurePolygon(item.outer, item.holes));
  return {
    metrics,
    totalNetArea: metrics.reduce((sum, item) => sum + item.netArea, 0),
    totalPerimeter: metrics.reduce((sum, item) => sum + item.perimeter, 0),
  };
}
