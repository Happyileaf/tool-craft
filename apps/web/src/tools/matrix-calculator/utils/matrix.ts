/**
 * 矩阵解析与精确线性代数运算（部分主元 Gauss-Jordan）。
 * 全部基于 BigInt 分数，保证行列式 / 逆矩阵 / RREF 的课堂级精确结果。
 * 纯函数实现，不依赖 DOM / React。
 */

import { Fraction, parseFraction } from './fraction';

/** 矩阵：按行存储的二维分数数组 */
export type Matrix = Fraction[][];

/** 单步消元记录 */
export interface EliminationStep {
  /** 操作说明 */
  action: string;
  /** 操作后的矩阵快照 */
  matrix: Matrix;
}

/** 线性方程组解的类型 */
export type SolutionKind = 'unique' | 'none' | 'infinite';

/** 线性方程组求解结果 */
export interface SystemSolution {
  kind: SolutionKind;
  /** 唯一解（kind=unique 时给出，按变量顺序） */
  unique?: Fraction[];
  /** 无穷多解时的自由变量列序（0 基） */
  freeVariables?: number[];
  /** 增广矩阵消元步骤（用于界面展示） */
  steps?: EliminationStep[];
  /** 消元后的增广矩阵 RREF（用于界面展示） */
  rref?: Matrix;
}

/**
 * 深拷贝矩阵
 *
 * @param matrix - 原矩阵
 * @returns 拷贝
 */
export function cloneMatrix(matrix: Matrix): Matrix {
  return matrix.map((row) => row.slice());
}

/**
 * 解析矩阵文本：支持空格、逗号、分号/换行分隔；行用换行或分号
 *
 * @param text - 原始输入
 * @returns 矩阵
 */
export function parseMatrix(text: string): Matrix {
  const rows: Matrix = [];
  const lines = text
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    throw new Error('请输入矩阵内容');
  }
  lines.forEach((line, rowIndex) => {
    const tokens = line.split(/[\s,]+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
      return;
    }
    rows.push(tokens.map((token) => parseFraction(token)));
    if (rows.length > 1 && rows[rows.length - 1]!.length !== rows[0]!.length) {
      throw new Error(
        `第 ${rowIndex + 1} 行有 ${rows[rows.length - 1]!.length} 个元素，与首行 ${rows[0]!.length} 个不一致`,
      );
    }
  });
  if (rows.length === 0 || rows[0]!.length === 0) {
    throw new Error('矩阵不能为空');
  }
  return rows;
}

/**
 * 矩阵行列数
 *
 * @param matrix - 矩阵
 * @returns 行数与列数
 */
export function shape(matrix: Matrix): { rows: number; cols: number } {
  return { rows: matrix.length, cols: matrix[0]?.length ?? 0 };
}

function ensureSameShape(a: Matrix, b: Matrix): void {
  const sa = shape(a);
  const sb = shape(b);
  if (sa.rows !== sb.rows || sa.cols !== sb.cols) {
    throw new Error(
      `维度不匹配：${sa.rows}×${sa.cols} 与 ${sb.rows}×${sb.cols} 不能进行该运算`,
    );
  }
}

/**
 * 矩阵加法
 */
export function add(a: Matrix, b: Matrix): Matrix {
  ensureSameShape(a, b);
  return a.map((row, i) => row.map((value, j) => value.add(b[i]![j]!)));
}

/**
 * 矩阵减法
 */
export function subtract(a: Matrix, b: Matrix): Matrix {
  ensureSameShape(a, b);
  return a.map((row, i) => row.map((value, j) => value.sub(b[i]![j]!)));
}

/**
 * 标量乘法
 */
export function scalarMultiply(a: Matrix, scalar: Fraction): Matrix {
  return a.map((row) => row.map((value) => value.mul(scalar)));
}

/**
 * 矩阵乘法
 */
export function multiply(a: Matrix, b: Matrix): Matrix {
  const sa = shape(a);
  const sb = shape(b);
  if (sa.cols !== sb.rows) {
    throw new Error(
      `维度不匹配：${sa.rows}×${sa.cols} 与 ${sb.rows}×${sb.cols} 不能相乘`,
    );
  }
  return a.map((row) =>
    Array.from({ length: sb.cols }, (_, j) =>
      row.reduce((acc, value, k) => acc.add(value.mul(b[k]![j]!)), Fraction.zero()),
    ),
  );
}

/**
 * 转置
 */
export function transpose(a: Matrix): Matrix {
  const { rows, cols } = shape(a);
  return Array.from({ length: cols }, (_, i) =>
    Array.from({ length: rows }, (_, j) => a[j]![i]!),
  );
}

/**
 * 要求矩阵为方阵，返回阶数
 *
 * @param a - 矩阵
 * @returns 阶数
 */
function requireSquare(a: Matrix): number {
  const { rows, cols } = shape(a);
  if (rows !== cols) {
    throw new Error(`该运算要求方阵，当前为 ${rows}×${cols}`);
  }
  return rows;
}

/**
 * 构造 n 阶单位阵
 */
export function identity(n: number): Matrix {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? Fraction.one() : Fraction.zero())),
  );
}

/**
 * 部分主元 Gauss-Jordan 消元，返回 RREF、秩与逐步记录；
 * 可选对增广列进行消元（用于求逆与解方程组）
 *
 * @param source - 输入矩阵（会被复制，不修改原矩阵）
 * @returns RREF、秩、步骤记录
 */
export function gaussJordan(source: Matrix): {
  rref: Matrix;
  rank: number;
  steps: EliminationStep[];
} {
  const matrix = cloneMatrix(source);
  const { rows, cols } = shape(matrix);
  const steps: EliminationStep[] = [];
  let rank = 0;
  let pivotCol = 0;

  let pivotRow = 0;
  while (pivotRow < rows && pivotCol < cols) {
    let maxRow = pivotRow;
    for (let r = pivotRow + 1; r < rows; r += 1) {
      // 比较绝对值大小：|a|/denA > |b|/denB 等价于 |a|*denB > |b|*denA
      const current = matrix[r]![pivotCol]!;
      const best = matrix[maxRow]![pivotCol]!;
      const lhs = bigAbs(current.numerator) * best.denominator;
      const rhs = bigAbs(best.numerator) * current.denominator;
      if (lhs > rhs) {
        maxRow = r;
      }
    }

    if (matrix[maxRow]![pivotCol]!.isZero()) {
      pivotCol += 1;
      continue;
    }

    if (maxRow !== pivotRow) {
      const temp = matrix[pivotRow]!;
      matrix[pivotRow] = matrix[maxRow]!;
      matrix[maxRow] = temp;
      steps.push({
        action: `交换第 ${pivotRow + 1} 行与第 ${maxRow + 1} 行`,
        matrix: cloneMatrix(matrix),
      });
    }

    const pivot = matrix[pivotRow]![pivotCol]!;
    if (!pivot.isOne()) {
      matrix[pivotRow] = matrix[pivotRow]!.map((value) => value.div(pivot));
      steps.push({
        action: `第 ${pivotRow + 1} 行除以 ${pivot.toString()}，主元归一`,
        matrix: cloneMatrix(matrix),
      });
    }

    for (let r = 0; r < rows; r += 1) {
      if (r === pivotRow) {
        continue;
      }
      const factor = matrix[r]![pivotCol]!;
      if (factor.isZero()) {
        continue;
      }
      matrix[r] = matrix[r]!.map((value, c) =>
        value.sub(factor.mul(matrix[pivotRow]![c]!)),
      );
      steps.push({
        action: `第 ${r + 1} 行减去 (${factor.toString()}) × 第 ${pivotRow + 1} 行`,
        matrix: cloneMatrix(matrix),
      });
    }

    rank += 1;
    pivotCol += 1;
    pivotRow += 1;
  }

  return { rref: matrix, rank, steps };
}

/**
 * 方阵行列式（带行交换与主元归一记录的 Gauss 消元）
 *
 * @param source - 方阵
 * @returns 行列式精确值
 */
export function determinant(source: Matrix): Fraction {
  const n = requireSquare(source);
  const matrix = cloneMatrix(source);
  let det = Fraction.one();

  for (let col = 0; col < n; col += 1) {
    let pivotRow = col;
    while (pivotRow < n && matrix[pivotRow]![col]!.isZero()) {
      pivotRow += 1;
    }
    if (pivotRow === n) {
      return Fraction.zero();
    }
    if (pivotRow !== col) {
      const temp = matrix[col]!;
      matrix[col] = matrix[pivotRow]!;
      matrix[pivotRow] = temp;
      det = det.negate();
    }
    const pivot = matrix[col]![col]!;
    det = det.mul(pivot);
    for (let r = col + 1; r < n; r += 1) {
      if (matrix[r]![col]!.isZero()) {
        continue;
      }
      const factor = matrix[r]![col]!.div(pivot);
      matrix[r] = matrix[r]!.map((value, c) =>
        value.sub(factor.mul(matrix[col]![c]!)),
      );
    }
  }
  return det;
}

/**
 * 求逆矩阵，奇异矩阵返回 null
 *
 * @param source - 方阵
 * @returns 逆矩阵或 null
 */
export function inverse(source: Matrix): Matrix | null {
  const n = requireSquare(source);
  const aug: Matrix = source.map((row, i) => [
    ...row,
    ...identity(n)[i]!,
  ]);
  const { rref } = gaussJordan(aug);
  // 增广矩阵 [A|I] 的整体秩在 A 奇异时仍可能等于 n（主元落在右侧增广列），
  // 因此必须校验 RREF 左上 n×n 系数块为单位阵
  const isIdentity = rref.every((row, i) =>
    row.slice(0, n).every((value, j) => (i === j ? value.isOne() : value.isZero())),
  );
  if (!isIdentity) {
    return null;
  }
  return rref.map((row) => row.slice(n));
}

/**
 * 解线性方程组 Ax = b
 *
 * @param a - 系数矩阵（m×n）
 * @param b - 右端向量（长度 m）
 * @returns 解的判定与唯一解/自由变量信息
 */
export function solveSystem(a: Matrix, b: Fraction[]): SystemSolution {
  const { rows, cols } = shape(a);
  if (b.length !== rows) {
    throw new Error(`右端向量长度 ${b.length} 与系数矩阵行数 ${rows} 不一致`);
  }
  const aug: Matrix = a.map((row, i) => [...row, b[i]!]);
  const { rref, rank, steps } = gaussJordan(aug);

  const inconsistent = rref.some((row) => {
    const coefficients = row.slice(0, cols);
    return coefficients.every((value) => value.isZero()) && !row[cols]!.isZero();
  });
  if (inconsistent) {
    return { kind: 'none', steps, rref };
  }
  if (rank < cols) {
    const pivotCols = new Set<number>();
    for (const row of rref) {
      for (let c = 0; c < cols; c += 1) {
        if (!row[c]!.isZero()) {
          pivotCols.add(c);
          break;
        }
      }
    }
    const freeVariables = Array.from({ length: cols }, (_, c) => c).filter(
      (c) => !pivotCols.has(c),
    );
    return { kind: 'infinite', freeVariables, steps, rref };
  }

  const unique = Array.from({ length: cols }, (_, c) => {
    const pivotRow = rref.findIndex((row) => !row[c]!.isZero());
    return rref[pivotRow]![cols]!;
  });
  return { kind: 'unique', unique, steps, rref };
}

function bigAbs(n: bigint): bigint {
  return n < BigInt(0) ? -n : n;
}
