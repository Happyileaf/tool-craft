/**
 * 二维 / 三维向量运算纯函数集合：模长、点积、叉积、夹角、投影、
 * 和差数乘与正交 / 平行关系判定。浮点容差统一使用 EPSILON。
 */

/** 浮点比较容差 */
export const EPSILON = 1e-10;

/** 支持的向量维度 */
export type VectorDimension = 2 | 3;

/** 向量类型：二维或三维分量数组 */
export type Vector = [number, number] | [number, number, number];

/**
 * 向量运算错误
 */
export class VectorError extends Error {}

/**
 * 关系判定结果
 */
export type VectorRelation = 'orthogonal' | 'parallel-same' | 'parallel-opposite' | 'neither';

/**
 * 校验两个向量维度一致且分量均为有限数。
 *
 * @param a - 向量 a
 * @param b - 向量 b
 */
function assertSameDimension(a: Vector, b: Vector): void {
  if (a.length !== b.length) {
    throw new VectorError(`向量维度不一致：${a.length}D 与 ${b.length}D`);
  }
  for (const value of [...a, ...b]) {
    if (!Number.isFinite(value)) {
      throw new VectorError('向量分量必须为有限数字');
    }
  }
}

/**
 * 向量模长（欧几里得范数）。
 *
 * @param v - 输入向量
 * @returns 模长（≥ 0）
 */
export function magnitude(v: Vector): number {
  return Math.sqrt(v.reduce((sum, component) => sum + component * component, 0));
}

/**
 * 点积（内积）a·b。
 *
 * @param a - 向量 a
 * @param b - 向量 b
 * @returns 标量点积
 */
export function dot(a: Vector, b: Vector): number {
  assertSameDimension(a, b);
  return a.reduce((sum, component, index) => sum + component * b[index]!, 0);
}

/**
 * 叉积：
 * - 三维返回向量 a×b（满足右手定则）
 * - 二维返回标量 z 分量（a.x*b.y − a.y*b.x）
 *
 * @param a - 向量 a
 * @param b - 向量 b
 * @returns 三维向量或二维标量
 */
export function cross(a: Vector, b: Vector): Vector | number {
  assertSameDimension(a, b);
  if (a.length === 2) {
    const [ax, ay] = a as [number, number];
    const [bx, by] = b as [number, number];
    return ax * by - ay * bx;
  }
  const [ax, ay, az] = a as [number, number, number];
  const [bx, by, bz] = b as [number, number, number];
  return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
}

/**
 * 两向量夹角（弧度），使用 atan2(|a×b|, a·b) 提升数值稳定性，
 * 结果范围 [0, π]。零向量参与时抛出错误。
 *
 * @param a - 向量 a
 * @param b - 向量 b
 * @returns 夹角弧度
 */
export function angleBetween(a: Vector, b: Vector): number {
  assertSameDimension(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA < EPSILON || magB < EPSILON) {
    throw new VectorError('零向量无法计算夹角（模长为 0）');
  }
  const dotProduct = dot(a, b);
  const crossMagnitude =
    a.length === 2
      ? Math.abs(cross(a, b) as number)
      : magnitude(cross(a, b) as Vector);
  return Math.atan2(crossMagnitude, dotProduct);
}

/**
 * 弧度转角度。
 *
 * @param radians - 弧度值
 * @returns 角度值
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * 标量投影 comp_b(a) = a·b / |b|。b 为零向量时抛出错误。
 *
 * @param a - 被投影向量
 * @param b - 投影方向向量
 * @returns 带符号标量投影
 */
export function scalarProjection(a: Vector, b: Vector): number {
  assertSameDimension(a, b);
  const magB = magnitude(b);
  if (magB < EPSILON) {
    throw new VectorError('无法向零向量投影（方向向量模长为 0）');
  }
  return dot(a, b) / magB;
}

/**
 * 向量投影 proj_b(a) = (a·b / |b|²) · b。b 为零向量时抛出错误。
 *
 * @param a - 被投影向量
 * @param b - 投影方向向量
 * @returns 与 b 共线的投影向量
 */
export function vectorProjection(a: Vector, b: Vector): Vector {
  assertSameDimension(a, b);
  const magBSquared = b.reduce((sum, component) => sum + component * component, 0);
  if (magBSquared < EPSILON) {
    throw new VectorError('无法向零向量投影（方向向量模长为 0）');
  }
  const scale = dot(a, b) / magBSquared;
  return b.map((component) => component * scale) as Vector;
}

/**
 * 向量加法 a + b。
 */
export function add(a: Vector, b: Vector): Vector {
  assertSameDimension(a, b);
  return a.map((component, index) => component + b[index]!) as Vector;
}

/**
 * 向量减法 a − b。
 */
export function subtract(a: Vector, b: Vector): Vector {
  assertSameDimension(a, b);
  return a.map((component, index) => component - b[index]!) as Vector;
}

/**
 * 数乘 k·v。
 */
export function scale(v: Vector, scalar: number): Vector {
  if (!Number.isFinite(scalar)) {
    throw new VectorError('数乘系数必须为有限数字');
  }
  return v.map((component) => component * scalar) as Vector;
}

/**
 * 判定两向量的方向关系：
 * - orthogonal：点积 ≈ 0（含零向量按正交处理需调用方排除，这里零向量直接报错）
 * - parallel-same：叉积 ≈ 0 且点积 > 0（同向）
 * - parallel-opposite：叉积 ≈ 0 且点积 < 0（反向）
 * - neither：既不正交也不平行
 *
 * @param a - 向量 a
 * @param b - 向量 b
 * @returns 关系枚举
 */
export function relation(a: Vector, b: Vector): VectorRelation {
  assertSameDimension(a, b);
  if (magnitude(a) < EPSILON || magnitude(b) < EPSILON) {
    throw new VectorError('零向量无法判定方向关系');
  }
  const dotProduct = dot(a, b);
  if (Math.abs(dotProduct) <= EPSILON) {
    return 'orthogonal';
  }
  const crossMagnitude =
    a.length === 2
      ? Math.abs(cross(a, b) as number)
      : magnitude(cross(a, b) as Vector);
  if (crossMagnitude <= EPSILON) {
    return dotProduct > 0 ? 'parallel-same' : 'parallel-opposite';
  }
  return 'neither';
}
