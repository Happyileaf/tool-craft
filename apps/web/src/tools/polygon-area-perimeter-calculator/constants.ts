import type { InputMode, WindingDirection } from './utils/polygon';

/**
 * 输入模式选项
 */
export const MODE_OPTIONS: ReadonlyArray<{ label: string; value: InputMode }> = [
  { label: '坐标文本（每行 x, y）', value: 'coordinates' },
  { label: 'GeoJSON 粘贴', value: 'geojson' },
];

/**
 * 环绕方向展示映射
 */
export const DIRECTION_LABELS: Readonly<Record<WindingDirection, { label: string; color: string }>> = {
  ccw: { label: '逆时针 CCW（有向面积为正）', color: 'green' },
  cw: { label: '顺时针 CW（有向面积为负）', color: 'orange' },
  degenerate: { label: '退化（面积为 0）', color: 'red' },
};

/**
 * 数值结果统一保留的小数位
 */
export const RESULT_PRECISION = 6;

/**
 * 坐标模式默认示例（单位正方形，未显式闭合）
 */
export const DEFAULT_COORDINATE_INPUT = `0, 0
1, 0
1, 1
0, 1`;

/**
 * GeoJSON 模式默认示例（带孔 Polygon）
 */
export const DEFAULT_GEOJSON_INPUT = JSON.stringify(
  {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
      [
        [2, 2],
        [4, 2],
        [4, 4],
        [2, 4],
        [2, 2],
      ],
    ],
  },
  null,
  2,
);
