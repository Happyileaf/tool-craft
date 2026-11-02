/**
 * CSS cubic-bezier 缓动函数的纯函数数学核心（零依赖）
 *
 * 缓动曲线由 P0=(0,0)、P1=(x1,y1)、P2=(x2,y2)、P3=(1,1) 定义，
 * 其中 x1、x2 必须落在 [0,1]，y1、y2 可超出该范围（过冲/回弹）。
 */

/** cubic-bezier 四个控制点参数 */
export interface BezierControlPoints {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** 常用缓动预设（与 CSS 规范关键字一致） */
export const BEZIER_PRESETS: { [key: string]: BezierControlPoints } = {
  linear: { x1: 0, y1: 0, x2: 1, y2: 1 },
  ease: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
  'ease-in': { x1: 0.42, y1: 0, x2: 1, y2: 1 },
  'ease-out': { x1: 0, y1: 0, x2: 0.58, y2: 1 },
  'ease-in-out': { x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
  'ease-in-back': { x1: 0.36, y1: 0, x2: 0.66, y2: -0.56 },
  'ease-out-back': { x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 },
};

/**
 * 计算单条三次贝塞尔轴在参数 t 处的值
 *
 * 端点固定为 0 与 1，两个内部控制点坐标为 a、b：
 * B(t) = 3a·t(1−t)² + 3b·t²(1−t) + t³
 *
 * @param t - 曲线参数，范围 [0,1]
 * @param a - 第一个内部控制点坐标
 * @param b - 第二个内部控制点坐标
 * @returns 该轴在 t 处的值
 */
export function cubicBezierAxis(t: number, a: number, b: number): number {
  const oneMinusT = 1 - t;
  return 3 * a * oneMinusT * oneMinusT * t + 3 * b * oneMinusT * t * t + t * t * t;
}

/**
 * 计算缓动曲线在参数 t 处的坐标点
 *
 * @param t - 曲线参数，范围 [0,1]
 * @param points - 四个控制点参数
 * @returns 曲线点坐标 { x, y }
 */
export function cubicBezierPoint(
  t: number,
  points: BezierControlPoints,
): { x: number; y: number } {
  return {
    x: cubicBezierAxis(t, points.x1, points.x2),
    y: cubicBezierAxis(t, points.y1, points.y2),
  };
}

/**
 * 校验控制点是否构成合法的 CSS cubic-bezier
 *
 * CSS 要求 x1、x2 位于 [0,1]；y 坐标无限制。
 *
 * @param points - 四个控制点参数
 * @returns 合法返回 null，否则返回中文错误信息
 */
export function validateBezier(points: BezierControlPoints): string | null {
  const { x1, x2 } = points;
  if ([x1, x2].some((value) => Number.isNaN(value) || !Number.isFinite(value))) {
    return 'x1、x2 必须为有限数字';
  }
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    return 'x1、x2 必须位于 0 到 1 之间';
  }
  if ([points.y1, points.y2].some((value) => Number.isNaN(value) || !Number.isFinite(value))) {
    return 'y1、y2 必须为有限数字';
  }
  return null;
}

/**
 * 给定进度 x（时间比例）求缓动输出 y
 *
 * 先用牛顿迭代在 x(t)=x 上反解参数 t，不收敛时回退二分法。
 *
 * @param x - 输入进度，范围 [0,1]
 * @param points - 四个控制点参数
 * @param epsilon - 收敛精度
 * @returns 缓动后的输出值
 */
export function solveCubicBezierY(
  x: number,
  points: BezierControlPoints,
  epsilon = 1e-7,
): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const { x1, x2, y1, y2 } = points;

  /** x 轴曲线导数，用于牛顿迭代 */
  const slopeX = (t: number): number => {
    const oneMinusT = 1 - t;
    return (
      3 * oneMinusT * oneMinusT * x1 +
      6 * oneMinusT * t * (x2 - x1) +
      3 * t * t * (1 - x2)
    );
  };

  // 牛顿迭代：以 x 作为 t 的初值猜测
  let t = x;
  for (let i = 0; i < 8; i += 1) {
    const currentX = cubicBezierAxis(t, x1, x2);
    const error = currentX - x;
    if (Math.abs(error) < epsilon) {
      return cubicBezierAxis(t, y1, y2);
    }
    const slope = slopeX(t);
    if (Math.abs(slope) < 1e-6) break;
    t -= error / slope;
    t = Math.min(1, Math.max(0, t));
  }

  // 二分回退
  let low = 0;
  let high = 1;
  t = x;
  while (low < high) {
    const currentX = cubicBezierAxis(t, x1, x2);
    if (Math.abs(currentX - x) < epsilon) break;
    if (currentX < x) low = t;
    else high = t;
    t = (low + high) / 2;
  }

  return cubicBezierAxis(t, y1, y2);
}

/**
 * 将控制点格式化为 CSS cubic-bezier() 字符串
 *
 * @param points - 四个控制点参数
 * @returns 形如 `cubic-bezier(0.25, 0.1, 0.25, 1)` 的字符串
 */
export function formatBezier(points: BezierControlPoints): string {
  const fmt = (value: number): string => {
    const rounded = Math.round(value * 1000) / 1000;
    return String(rounded);
  };
  return `cubic-bezier(${fmt(points.x1)}, ${fmt(points.y1)}, ${fmt(points.x2)}, ${fmt(points.y2)})`;
}

/**
 * 对曲线均匀采样，用于绘制 SVG 路径
 *
 * @param points - 四个控制点参数
 * @param samples - 采样点数量（含端点）
 * @returns 采样点数组
 */
export function sampleBezier(
  points: BezierControlPoints,
  samples = 40,
): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];
  for (let i = 0; i <= samples; i += 1) {
    result.push(cubicBezierPoint(i / samples, points));
  }
  return result;
}
