/**
 * 常见传感器画幅预设。宽度、高度单位为毫米，cropFactor 为该画幅相对 35mm 全画幅的裁切系数。
 */
export interface SensorPreset {
  key: string;
  label: string;
  width: number;
  height: number;
  cropFactor: number;
}

export const SENSOR_PRESETS: SensorPreset[] = [
  { key: 'full-frame', label: '35mm 全画幅（36 × 24）', width: 36, height: 24, cropFactor: 1 },
  { key: 'aps-c', label: 'APS-C（23.6 × 15.7）', width: 23.6, height: 15.7, cropFactor: 1.5 },
  { key: 'aps-c-canon', label: 'APS-C Canon（22.3 × 14.9）', width: 22.3, height: 14.9, cropFactor: 1.6 },
  { key: 'aps-h', label: 'APS-H（28.7 × 19.1）', width: 28.7, height: 19.1, cropFactor: 1.3 },
  { key: 'm43', label: 'M4/3（17.3 × 13.0）', width: 17.3, height: 13, cropFactor: 2 },
  { key: 'one-inch', label: '1 英寸（13.2 × 8.8）', width: 13.2, height: 8.8, cropFactor: 2.7 },
  { key: 'medium-format', label: '中画幅（43.8 × 32.9）', width: 43.8, height: 32.9, cropFactor: 0.79 },
];

/**
 * 35mm 全画幅对角线长度（毫米），用作裁切系数基准
 */
export const FULL_FRAME_DIAGONAL = Math.sqrt(36 ** 2 + 24 ** 2);

export const DEFAULT_SENSOR_KEY = 'full-frame';
export const DEFAULT_FOCAL = 50;
export const DEFAULT_APERTURE = 1.8;

export const FOV_DIMENSIONS = [
  { value: 'diagonal', label: '对角线视角' },
  { value: 'horizontal', label: '水平视角' },
  { value: 'vertical', label: '垂直视角' },
] as const;

export type FovDimension = (typeof FOV_DIMENSIONS)[number]['value'];
