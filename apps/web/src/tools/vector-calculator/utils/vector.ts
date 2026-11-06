/**
 * 二维 / 三维几何向量运算纯函数集合。
 * 向量用 number[] 表示，维度由数组长度决定（仅支持 2 或 3）。
 * 所有运算不修改入参，遇到非法维度或零向量等情形抛出带中文信息的错误。
 */

export type Vector = number[];

/** 支持的向量维度 */
export const SUPPORTED_DIMENSIONS = [2, 3] as const;

/** 浮点比较容差 */
const EPSILON = 1e-12;

/** 断言维度合法且一致 */
function assertSameDimension(a: Vector, b: Vector): void {
  if (a.length !== b.length) {
    throw new Error(`两向量维度不一致：${a.length} 维与 ${b.length} 维`);
  }
  if (!SUPPORTED_DIMENSIONS.includes(a.length as 2 | 3)) {
    throw new Error(`仅支持 2D / 3D 向量，收到 ${a.length} 维`);
  }
}

/** 断言为 3D 向量 */
function assertThreeDimensional(a: Vector, b: Vector): void {
  assertSameDimension(a, b);
  if (a.length !== 3) {
    throw new Error('叉积仅支持 3D 向量');
  }
}

/** 向量加法 A + B */
export function add(a: Vector, b: Vector): Vector {
  assertSameDimension(a, b);
  return a.map((value, index) => value + b[index]!);
}

/** 向量减法 A - B */
export function subtract(a: Vector, b: Vector): Vector {
  assertSameDimension(a, b);
  return a.map((value, index) => value - b[index]!);
}

/** 数乘 k·A */
export function scale(a: Vector, k: number): Vector {
  if (!SUPPORTED_DIMENSIONS.includes(a.length as 2 | 3)) {
    throw new Error(`仅支持 2D / 3D 向量，收到 ${a.length} 维`);
  }
  return a.map((value) => value * k);
}

/** 点积（内积）A·B */
export function dot(a: Vector, b: Vector): number {
  assertSameDimension(a, b);
  return a.reduce((sum, value, index) => sum + value * b[index]!, 0);
}

/** 叉积 A×B（仅 3D） */
export function cross(a: Vector, b: Vector): Vector {
  assertThreeDimensional(a, b);
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}

/** 向量模长（欧几里得范数） */
export function magnitude(a: Vector): number {
  if (!SUPPORTED_DIMENSIONS.includes(a.length as 2 | 3)) {
    throw new Error(`仅支持 2D / 3D 向量，收到 ${a.length} 维`);
  }
  return Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
}

/** 单位化向量；零向量抛出错误 */
export function normalize(a: Vector): Vector {
  const mag = magnitude(a);
  if (mag < EPSILON) {
    throw new Error('零向量无法单位化（模长为 0）');
  }
  return a.map((value) => value / mag);
}

/**
 * 两向量夹角（弧度），由点积公式 cosθ = (A·B)/(|A||B|) 反余弦得到。
 * 零向量参与时抛出错误；对浮点越界做 [-1, 1] 钳制。
 */
export function angleRadians(a: Vector, b: Vector): number {
  assertSameDimension(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA < EPSILON || magB < EPSILON) {
    throw new Error('零向量无法计算夹角（模长为 0）');
  }
  const cosine = dot(a, b) / (magA * magB);
  const clamped = Math.min(1, Math.max(-1, cosine));
  return Math.acos(clamped);
}

/** 两向量夹角（度） */
export function angleDegrees(a: Vector, b: Vector): number {
  return (angleRadians(a, b) * 180) / Math.PI;
}

/**
 * A 在 B 上的标量投影（带符号）：(A·B)/|B|。
 * B 为零向量时抛出错误。
 */
export function scalarProjection(a: Vector, b: Vector): number {
  assertSameDimension(a, b);
  const magB = magnitude(b);
  if (magB < EPSILON) {
    throw new Error('无法投影到零向量（参考向量模长为 0）');
  }
  return dot(a, b) / magB;
}

/**
 * A 在 B 上的向量投影：((A·B)/|B|²)·B。
 * B 为零向量时抛出错误。
 */
export function vectorProjection(a: Vector, b: Vector): Vector {
  assertSameDimension(a, b);
  const magBSquared = dot(b, b);
  if (magBSquared < EPSILON) {
    throw new Error('无法投影到零向量（参考向量模长为 0）');
  }
  const factor = dot(a, b) / magBSquared;
  return scale(b, factor);
}

/** 把计算结果按固定精度四舍五入，消除 -0 与浮点尾差，便于展示与断言 */
export function roundVector(a: Vector, digits: number = 6): Vector {
  return a.map((value) => {
    const rounded = Number(value.toFixed(digits));
    return Object.is(rounded, -0) ? 0 : rounded;
  });
}

/** 标量版本的四舍五入，消除 -0 */
export function roundScalar(value: number, digits: number = 6): number {
  const rounded = Number(value.toFixed(digits));
  return Object.is(rounded, -0) ? 0 : rounded;
}
