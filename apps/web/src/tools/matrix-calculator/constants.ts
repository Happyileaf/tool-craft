/**
 * 矩阵计算器工具内常量
 */
import type { Matrix } from './utils/matrix';

/** 运算标识 */
export type Operation =
  | 'add'
  | 'subtract'
  | 'scalarMultiply'
  | 'multiply'
  | 'transpose'
  | 'determinant'
  | 'inverse'
  | 'rank'
  | 'rref'
  | 'solve';

/** 运算下拉选项 */
export const OPERATION_OPTIONS: Array<{ label: string; value: Operation }> = [
  { label: '矩阵加法 A + B', value: 'add' },
  { label: '矩阵减法 A − B', value: 'subtract' },
  { label: '标量乘法 k·A', value: 'scalarMultiply' },
  { label: '矩阵乘法 A × B', value: 'multiply' },
  { label: '转置 Aᵀ', value: 'transpose' },
  { label: '行列式 det(A)', value: 'determinant' },
  { label: '逆矩阵 A⁻¹', value: 'inverse' },
  { label: '矩阵的秩 rank(A)', value: 'rank' },
  { label: '简化行阶梯形 RREF(A)', value: 'rref' },
  { label: '解线性方程组 Ax = b', value: 'solve' },
];

/** 示例预设：一次设置全部输入 */
export interface SamplePreset {
  label: string;
  operation: Operation;
  matrixA: string;
  matrixB: string;
  scalar: string;
  vector: string;
}

export const SAMPLE_OPTIONS: SamplePreset[] = [
  {
    label: '求逆（3×3）',
    operation: 'inverse',
    matrixA: '1 2 3\n0 1 4\n5 6 0',
    matrixB: '',
    scalar: '2',
    vector: '',
  },
  {
    label: '矩阵乘法',
    matrixA: '1 2 3\n4 5 6',
    matrixB: '7 8\n9 10\n11 12',
    operation: 'multiply',
    scalar: '2',
    vector: '',
  },
  {
    label: '标量乘法',
    operation: 'scalarMultiply',
    matrixA: '1 -2\n3/2 0.5',
    matrixB: '',
    scalar: '2/3',
    vector: '',
  },
  {
    label: '行列式',
    operation: 'determinant',
    matrixA: '6 1 1\n4 -2 5\n2 8 7',
    matrixB: '',
    scalar: '2',
    vector: '',
  },
  {
    label: '解方程组（唯一解）',
    operation: 'solve',
    matrixA: '2 1 -1\n-3 -1 2\n-2 1 2',
    matrixB: '',
    scalar: '2',
    vector: '8\n-11\n-3',
  },
  {
    label: '无解方程组',
    operation: 'solve',
    matrixA: '1 1\n2 2',
    matrixB: '',
    scalar: '2',
    vector: '3\n8',
  },
];

/** 默认样例输入（取首个预设） */
export const DEFAULT_SAMPLE: SamplePreset = SAMPLE_OPTIONS[0]!;

/** 矩阵到文本（供复制结果） */
export function matrixToText(matrix: Matrix): string {
  return matrix
    .map((row) => row.map((value) => value.toString()).join('\t'))
    .join('\n');
}
