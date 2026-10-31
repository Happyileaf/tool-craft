/**
 * 线性回归计算器常量
 */

/** 最少数据点数（两点确定一条直线；相关系数要求 ≥ 2） */
export const MIN_POINTS = 2;

/** x / y 数值允许的绝对值上限，防止溢出 */
export const MAX_ABS_VALUE = 1e9;

/** Anscombe 第一组（经典教学数据），用于一键示例 */
export const ANSCOMBE_QUARTET_I: ReadonlyArray<readonly [number, number]> = [
  [10, 8.04],
  [8, 6.95],
  [13, 7.58],
  [9, 8.81],
  [11, 8.33],
  [14, 9.96],
  [6, 7.24],
  [4, 4.26],
  [12, 10.84],
  [7, 4.82],
  [5, 5.68],
];

/** 强正相关示例 */
export const LINEAR_EXAMPLE: ReadonlyArray<readonly [number, number]> = [
  [1, 1.8],
  [2, 3.9],
  [3, 6.1],
  [4, 8.2],
  [5, 9.8],
  [6, 12.1],
];
