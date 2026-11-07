/**
 * 平面解析几何纯函数：两点参数、直线方程、交点、距离、中点、平行垂直判定
 *
 * 直线统一用一般式 Ax + By + C = 0 表示，避免斜率不存在（竖直线）时的除零问题。
 * 所有容差比较集中在 EPSILON，UI 层负责输入解析与展示。
 */

export const EPSILON = 1e-9;

export interface Point {
  x: number;
  y: number;
}

/** 直线一般式 Ax + By + C = 0，A、B 不同时为 0 */
export interface LineGeneral {
  a: number;
  b: number;
  c: number;
}

/** 两点参数结果 */
export interface TwoPointResult {
  /** 斜率，竖直线为 null */
  slope: number | null;
  /** 倾斜角（度，范围 [0,180)），竖直为 90 */
  angleDeg: number;
  /** 直线长度（两点间距离） */
  length: number;
  /** 中点 */
  midpoint: Point;
  /** 一般式直线方程 */
  line: LineGeneral;
}

/** 两直线关系 */
export type LineRelation =
  | { kind: 'parallel' }
  | { kind: 'perpendicular'; point: Point }
  | { kind: 'intersect'; point: Point }
  | { kind: 'coincident' };

/**
 * 解析数值输入，空串或非有限数返回 null
 */
export function parseNumber(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function nearZero(value: number): boolean {
  return Math.abs(value) < EPSILON;
}

/**
 * 两点 P1、P2 的完整参数：斜率、倾斜角、距离、中点、一般式
 */
export function analyzeTwoPoints(p1: Point, p2: Point): TwoPointResult | { error: string } {
  if (nearZero(p1.x - p2.x) && nearZero(p1.y - p2.y)) {
    return { error: '两个点坐标完全相同，无法确定一条直线' };
  }

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const slope = nearZero(dx) ? null : dy / dx;
  const angleRad = Math.atan2(dy, dx);
  let angleDeg = (angleRad * 180) / Math.PI;
  if (angleDeg < 0) {
    angleDeg += 180;
  }
  if (angleDeg >= 180 - EPSILON) {
    angleDeg -= 180;
  }

  const length = Math.hypot(dx, dy);
  const midpoint: Point = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  // 一般式：(y1-y2)x + (x2-x1)y + (x1*y2 - x2*y1) = 0
  const line: LineGeneral = {
    a: p1.y - p2.y,
    b: p2.x - p1.x,
    c: p1.x * p2.y - p2.x * p1.y,
  };

  return { slope, angleDeg, length, midpoint, line };
}

/**
 * 由斜截式参数构造一般式：y = kx + b → kx - y + b = 0
 */
export function lineFromSlopeIntercept(slope: number, intercept: number): LineGeneral {
  return { a: slope, b: -1, c: intercept };
}

/**
 * 由一般式读取斜率，竖直直线返回 null
 */
export function slopeOf(line: LineGeneral): number | null {
  return nearZero(line.b) ? null : -line.a / line.b;
}

/**
 * 两条直线的关系：重合 / 平行 / 垂直 / 相交（含交点）
 */
export function relateLines(l1: LineGeneral, l2: LineGeneral): LineRelation | { error: string } {
  if ((nearZero(l1.a) && nearZero(l1.b)) || (nearZero(l2.a) && nearZero(l2.b))) {
    return { error: '存在非法直线（A、B 同时为 0）' };
  }

  const determinant = l1.a * l2.b - l2.a * l1.b;

  if (nearZero(determinant)) {
    // 平行或重合：检查 C 是否同比例，用 a*c2 - a2*c1 与 b*c2 - b2*c1 是否都为 0
    if (nearZero(l1.a * l2.c - l2.a * l1.c) && nearZero(l1.b * l2.c - l2.b * l1.c)) {
      return { kind: 'coincident' };
    }
    return { kind: 'parallel' };
  }

  // 垂直判定：方向向量 (B,-A) 点积为 0 → A1*A2 + B1*B2 = 0
  const perpendicular = nearZero(l1.a * l2.a + l1.b * l2.b);

  const x = (l1.b * l2.c - l2.b * l1.c) / determinant;
  const y = (l2.a * l1.c - l1.a * l2.c) / determinant;

  if (perpendicular) {
    return { kind: 'perpendicular', point: { x, y } };
  }
  return { kind: 'intersect', point: { x, y } };
}

/**
 * 点到直线的距离：|Ax0 + By0 + C| / sqrt(A² + B²)
 */
export function pointToLineDistance(point: Point, line: LineGeneral): number | { error: string } {
  const denom = Math.hypot(line.a, line.b);
  if (nearZero(denom)) {
    return { error: '非法直线（A、B 同时为 0）' };
  }
  return Math.abs(line.a * point.x + line.b * point.y + line.c) / denom;
}

/**
 * 两点间距离
 */
export function distanceBetween(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * 判断过 P1、P2 与过 P3、P4 的两条直线是否平行（含重合）
 */
export function areParallel(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const r1 = analyzeTwoPoints(p1, p2);
  const r2 = analyzeTwoPoints(p3, p4);
  if ('error' in r1 || 'error' in r2) {
    return false;
  }
  const relation = relateLines(r1.line, r2.line);
  return !('error' in relation) && (relation.kind === 'parallel' || relation.kind === 'coincident');
}

/**
 * 一般式格式化为可读方程字符串，如 2x + 3y - 5 = 0
 */
export function formatLineEquation(line: LineGeneral): string {
  const parts: string[] = [];
  const appendTerm = (coef: number, variable: string) => {
    if (nearZero(coef)) {
      return;
    }
    // 系数绝对值为 1 时省略数字，只保留变量与符号
    const coefText = Math.abs(Math.round(coef * 1e6) / 1e6) === 1 ? '' : formatCoefficient(Math.abs(coef));
    if (parts.length === 0) {
      parts.push(coef < 0 ? `-${coefText}${variable}` : `${coefText}${variable}`);
    } else {
      parts.push(coef < 0 ? `- ${coefText}${variable}` : `+ ${coefText}${variable}`);
    }
  };

  appendTerm(line.a, 'x');
  appendTerm(line.b, 'y');
  if (parts.length === 0) {
    parts.push('0');
  }
  if (!nearZero(line.c)) {
    parts.push(line.c < 0 ? `- ${formatCoefficient(Math.abs(line.c))}` : `+ ${formatCoefficient(line.c)}`);
  }
  return `${parts.join(' ')} = 0`;
}

function formatCoefficient(value: number): string {
  const rounded = Math.round(value * 1e6) / 1e6;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

/**
 * 数字输出格式化：整数不带小数点，浮点至多 6 位并去除尾随 0
 */
export function formatNumber(value: number | null): string {
  if (value === null) {
    return '不存在（竖直）';
  }
  if (!Number.isFinite(value)) {
    return String(value);
  }
  const rounded = Math.round(value * 1e6) / 1e6;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}
