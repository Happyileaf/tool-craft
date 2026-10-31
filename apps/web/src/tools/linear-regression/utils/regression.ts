/**
 * 一元线性回归（最小二乘法）纯函数
 *
 * 给定 n 个数据点 (xᵢ, yᵢ)，拟合 y = a + bx：
 *   b = Σ(xᵢ-x̄)(yᵢ-ȳ) / Σ(xᵢ-x̄)²
 *   a = ȳ - b·x̄
 * 同时给出 Pearson 相关系数 r、决定系数 R²（一元回归中 R² = r²）、
 * 逐点拟合值与残差。本模块也负责把 CSV / "x,y" 每行文本解析为数据点。
 */

import { MAX_ABS_VALUE, MIN_POINTS } from '../constants';

/** 一个二维数据点 */
export interface Point {
  x: number;
  y: number;
}

/** 单点回归诊断（拟合值与残差） */
export interface PointFit {
  /** 原始 x */
  x: number;
  /** 原始 y */
  y: number;
  /** 拟合值 ŷ = a + bx */
  yHat: number;
  /** 残差 y − ŷ */
  residual: number;
}

/** 回归汇总结果 */
export interface RegressionResult {
  /** 数据点数 */
  n: number;
  /** 截距 a */
  intercept: number;
  /** 斜率 b */
  slope: number;
  /** Pearson 相关系数 r（[−1, 1]） */
  r: number;
  /** 决定系数 R²（[0, 1]） */
  rSquared: number;
  /** x 均值 */
  meanX: number;
  /** y 均值 */
  meanY: number;
  /** 残差平方和 SSE = Σ(yᵢ−ŷᵢ)² */
  sse: number;
  /** 回归平方和 SSR = Σ(ŷᵢ−ȳ)² */
  ssr: number;
  /** 总离差平方和 SST = SSR + SSE */
  sst: number;
  /** 逐点拟合与残差，顺序与输入一致 */
  fits: PointFit[];
}

/**
 * 解析 "x,y" 每行格式的文本为数据点
 *
 * 支持逗号 / 制表符 / 分号 / 空白分隔；以 # 开头的行、空行忽略。
 *
 * @param text - 原始文本
 * @returns 数据点数组
 * @throws 当存在无法解析为两个数值的行时抛出错误（带行号）
 */
export function parsePoints(text: string): Point[] {
  const points: Point[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;
    const parts = line.split(/[,;\t]|\s+/).filter((part) => part.length > 0);
    if (parts.length !== 2) {
      throw new Error(`第 ${lineIndex + 1} 行无法解析：应恰好包含 x、y 两个数值（实际 ${parts.length} 个）`);
    }
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`第 ${lineIndex + 1} 行包含非数值：${rawLine.trim()}`);
    }
    if (Math.abs(x) > MAX_ABS_VALUE || Math.abs(y) > MAX_ABS_VALUE) {
      throw new Error(`第 ${lineIndex + 1} 行数值超出允许范围（绝对值 ≤ ${MAX_ABS_VALUE}）`);
    }
    points.push({ x, y });
  });
  return points;
}

/**
 * 把数据点序列化为 CSV 文本（供文本编辑框回填）
 *
 * @param points - 数据点
 * @returns 每行 `x,y` 的文本
 */
export function pointsToCsv(points: Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join('\n');
}

/**
 * 校验数据点是否可用于回归
 *
 * @param points - 数据点
 * @throws 点数不足、x 方差为 0 或存在重复点以外的退化情况时抛出错误
 */
export function assertFittable(points: Point[]): void {
  if (points.length < MIN_POINTS) {
    throw new Error(`至少需要 ${MIN_POINTS} 个数据点才能拟合直线（当前 ${points.length} 个）`);
  }
  const firstX = points[0]?.x;
  if (points.every((point) => point.x === firstX)) {
    throw new Error('所有点的 x 值相同（x 方差为 0），无法拟合斜率；请提供至少两个不同的 x 值');
  }
}

/**
 * 最小二乘一元线性回归
 *
 * @param points - 数据点（至少 2 个且 x 不全相同）
 * @returns 截距、斜率、r、R²、平方和分解与逐点残差
 */
export function linearRegression(points: Point[]): RegressionResult {
  assertFittable(points);
  const n = points.length;

  const meanX = points.reduce((sum, point) => sum + point.x, 0) / n;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / n;

  let ssX = 0; // Σ(xᵢ-x̄)²
  let ssY = 0; // Σ(yᵢ-ȳ)²
  let ssXY = 0; // Σ(xᵢ-x̄)(yᵢ-ȳ)
  for (const point of points) {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    ssX += dx * dx;
    ssY += dy * dy;
    ssXY += dx * dy;
  }

  // 调用方已保证 x 不全相同，ssX > 0
  const slope = ssXY / ssX;
  const intercept = meanY - slope * meanX;

  const fits: PointFit[] = points.map((point) => {
    const yHat = intercept + slope * point.x;
    return { x: point.x, y: point.y, yHat, residual: point.y - yHat };
  });

  const sse = fits.reduce((sum, fit) => sum + fit.residual * fit.residual, 0);
  // 一元 OLS 下 SST = SSR + SSE 恒成立；直接由 SST − SSE 得 SSR 更稳
  const sst = ssY;
  const ssr = Math.max(0, sst - sse);

  // y 全相等时 ssY = 0，相关系数无定义
  const denominator = Math.sqrt(ssX * ssY);
  const r = denominator === 0 ? 0 : ssXY / denominator;
  const rSquared = ssY === 0 ? 1 : Math.min(1, Math.max(0, sse === 0 ? 1 : 1 - sse / sst));

  return {
    n,
    intercept,
    slope,
    r: Math.min(1, Math.max(-1, r)),
    rSquared,
    meanX,
    meanY,
    sse,
    ssr,
    sst,
    fits,
  };
}

/**
 * 格式化回归方程为可读文本
 *
 * @param result - 回归结果
 * @param digits - 系数小数位数
 * @returns 如 `y = 3.00 + 0.50x`
 */
export function formatEquation(result: Pick<RegressionResult, 'intercept' | 'slope'>, digits = 4): string {
  const a = result.intercept.toFixed(digits);
  const b = Math.abs(result.slope).toFixed(digits);
  const sign = result.slope >= 0 ? '+' : '−';
  return `y = ${a} ${sign} ${b}x`;
}
