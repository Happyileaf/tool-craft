/**
 * 多边形面积与周长计算纯函数集合（鞋带公式）。
 * 顶点用 [x, y] 表示，支持手动坐标文本解析与 GeoJSON Polygon / MultiPolygon 解析。
 * 所有量算在浏览器本地完成，不依赖任何地理库。
 */

export type Point = [number, number];

/** 单个环（闭合多边形顶点序列，首尾点允许重复） */
export type Ring = Point[];

/** 环的方向 */
export type RingOrientation = 'ccw' | 'cw';

/** 单个环的量算结果 */
export interface RingMeasurement {
  /** 环序号（从 0 开始） */
  index: number;
  /** 去重闭合点后的顶点数 */
  vertexCount: number;
  /** 有符号面积（右手坐标系下：正=逆时针 CCW，负=顺时针 CW） */
  signedArea: number;
  /** 绝对面积 */
  area: number;
  /** 周长（含闭合边） */
  perimeter: number;
  /** 环方向 */
  orientation: RingOrientation;
  /** 是否检测到自相交 */
  selfIntersecting: boolean;
}

/** 整个多边形的量算结果 */
export interface PolygonMeasurement {
  /** 各个环的明细（第一个为外环，其余为孔洞内环） */
  rings: RingMeasurement[];
  /** 净面积 = 外环面积 − 各孔洞面积之和 */
  netArea: number;
  /** 外环周长（孔洞周长单独列在 rings 中） */
  outerPerimeter: number;
  /** 总顶点数（去重后） */
  totalVertices: number;
}

/** 浮点容差 */
const EPSILON = 1e-12;

/**
 * 去除首尾重复的闭合点。GeoJSON 与手动输入常把首点在末尾再写一次，
 * 去重可避免周长重复计算一条零长度边。
 */
export function dedupeClosingPoint(ring: Ring): Ring {
  if (ring.length < 2) return ring;
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (Math.abs(first[0] - last[0]) < EPSILON && Math.abs(first[1] - last[1]) < EPSILON) {
    return ring.slice(0, -1);
  }
  return ring;
}

/**
 * 鞋带公式求有符号面积的两倍（cross-sum）。
 * 返回 Σ(x_i·y_{i+1} − x_{i+1}·y_i)，有符号面积 = 该值 / 2。
 */
function shoelaceCrossSum(ring: Ring): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const current = ring[i]!;
    const next = ring[(i + 1) % ring.length]!;
    sum += current[0] * next[1] - next[0] * current[1];
  }
  return sum;
}

/** 两点欧氏距离 */
function distance(a: Point, b: Point): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** 计算环的周长（相邻顶点距离求和，含末点回首点的闭合边） */
export function ringPerimeter(ring: Ring): number {
  if (ring.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < ring.length; i += 1) {
    perimeter += distance(ring[i]!, ring[(i + 1) % ring.length]!);
  }
  return perimeter;
}

/**
 * 线段 AB 与 CD 是否相交（含端点接触）。
 * 使用方向叉积法判断。
 */
function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const cross = (p: Point, q: Point, r: Point): number =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);

  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  // 共线且落在另一线段范围内的退化情形此处不额外展开，
  // 常见自相交（非相邻边交叉）已能被上面的严格相交捕获。
  return false;
}

/**
 * 检测环是否自相交：检查所有非相邻、非共享端点的边对。
 * 复杂度 O(n²)，对常见手工录入的小顶点数多边形足够。
 */
export function isSelfIntersecting(ring: Ring): boolean {
  const n = ring.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i += 1) {
    const a = ring[i]!;
    const b = ring[(i + 1) % n]!;
    for (let j = i + 1; j < n; j += 1) {
      // 跳过相邻边（共享一个端点）
      if (j === i || j === (i + 1) % n || i === (j + 1) % n) continue;
      const c = ring[j]!;
      const d = ring[(j + 1) % n]!;
      if (segmentsIntersect(a, b, c, d)) return true;
    }
  }
  return false;
}

/** 量算单个环 */
export function measureRing(ring: Ring, index: number): RingMeasurement {
  const cleaned = dedupeClosingPoint(ring);
  if (cleaned.length < 3) {
    throw new Error(`第 ${index + 1} 个环有效顶点不足 3 个，无法构成多边形`);
  }
  const crossSum = shoelaceCrossSum(cleaned);
  const signedArea = crossSum / 2;
  const orientation: RingOrientation = signedArea >= 0 ? 'ccw' : 'cw';
  return {
    index,
    vertexCount: cleaned.length,
    signedArea: round(signedArea),
    area: round(Math.abs(signedArea)),
    perimeter: round(ringPerimeter(cleaned)),
    orientation,
    selfIntersecting: isSelfIntersecting(cleaned),
  };
}

/**
 * 量算一个含若干环的多边形：第一个环为外环，其余为孔洞。
 * 净面积 = 外环面积 − 孔洞面积之和。
 */
export function measurePolygon(rings: Ring[]): PolygonMeasurement {
  if (!rings || rings.length === 0) {
    throw new Error('没有可用的环，请至少输入一个多边形');
  }
  const measurements = rings.map((ring, index) => measureRing(ring, index));
  const outer = measurements[0]!;
  const holes = measurements.slice(1);
  const holeAreaSum = holes.reduce((sum, ring) => sum + ring.area, 0);
  return {
    rings: measurements,
    netArea: round(outer.area - holeAreaSum),
    outerPerimeter: outer.perimeter,
    totalVertices: measurements.reduce((sum, ring) => sum + ring.vertexCount, 0),
  };
}

/**
 * 解析手动输入的坐标文本，每行一个 `x,y` 顶点。
 * 容忍空白、制表符、中文逗号、分号等分隔写法。
 */
export function parseCoordinateText(text: string): Ring {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const points: Ring = [];
  for (const line of lines) {
    const parts = line.split(/[\s,，;；]+/).filter((part) => part.length > 0);
    if (parts.length < 2) {
      throw new Error(`无法解析坐标行：「${line}」，应为 x,y 两个数字`);
    }
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (Number.isNaN(x) || Number.isNaN(y)) {
      throw new Error(`坐标包含非数字：「${line}」`);
    }
    points.push([x, y]);
  }
  return points;
}

/**
 * 解析 GeoJSON 文本，支持 Polygon 与 MultiPolygon。
 * 返回多个多边形（每个多边形由外环 + 孔洞环组成）的环数组列表。
 */
export function parseGeoJson(text: string): Ring[][] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('GeoJSON 不是合法 JSON，请检查括号与引号');
  }

  const root = data as { type?: unknown; coordinates?: unknown };
  if (!root || typeof root !== 'object' || typeof root.type !== 'string') {
    throw new Error('GeoJSON 结构损坏：缺少 type 字段');
  }

  if (root.type === 'Polygon') {
    return [extractRings(root.coordinates, 'Polygon')];
  }
  if (root.type === 'MultiPolygon') {
    if (!Array.isArray(root.coordinates)) {
      throw new Error('MultiPolygon 的 coordinates 必须是数组');
    }
    return root.coordinates.map((polygon) => extractRings(polygon, 'MultiPolygon'));
  }
  throw new Error(`仅支持 Polygon / MultiPolygon，收到类型：${root.type}`);
}

/** 从 GeoJSON coordinates 中提取并校验环结构 */
function extractRings(coordinates: unknown, ownerType: string): Ring[] {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    throw new Error(`${ownerType} 的 coordinates 缺少环数据`);
  }
  return coordinates.map((rawRing, ringIndex) => {
    if (!Array.isArray(rawRing)) {
      throw new Error(`第 ${ringIndex + 1} 个环不是数组`);
    }
    return rawRing.map((rawPoint) => {
      if (!Array.isArray(rawPoint) || rawPoint.length < 2) {
        throw new Error(`第 ${ringIndex + 1} 个环存在非法坐标点（应为 [x, y]）`);
      }
      const x = Number(rawPoint[0]);
      const y = Number(rawPoint[1]);
      if (Number.isNaN(x) || Number.isNaN(y)) {
        throw new Error(`第 ${ringIndex + 1} 个环坐标包含非数字`);
      }
      return [x, y] as Point;
    });
  });
}

/** 统一四舍五入到 6 位并消除 -0 */
function round(value: number): number {
  const rounded = Number(value.toFixed(6));
  return Object.is(rounded, -0) ? 0 : rounded;
}
