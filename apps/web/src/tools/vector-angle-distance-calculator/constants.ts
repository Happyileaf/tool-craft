import type { VectorDimension } from './utils/vector';

/**
 * 维度选项
 */
export const DIMENSION_OPTIONS: ReadonlyArray<{ label: string; value: VectorDimension }> = [
  { label: '二维（2D）', value: 2 },
  { label: '三维（3D）', value: 3 },
];

/**
 * 维度对应的坐标轴标签
 */
export const AXIS_LABELS = ['x', 'y', 'z'] as const;

/**
 * 关系判定中文映射
 */
export const RELATION_LABELS: Readonly<Record<string, { label: string; color: string }>> = {
  orthogonal: { label: '正交（垂直）', color: 'blue' },
  'parallel-same': { label: '平行 · 同向', color: 'green' },
  'parallel-opposite': { label: '平行 · 反向', color: 'orange' },
  neither: { label: '既不正交也不平行', color: 'default' },
};

/**
 * 数值结果统一保留的小数位
 */
export const RESULT_PRECISION = 6;
