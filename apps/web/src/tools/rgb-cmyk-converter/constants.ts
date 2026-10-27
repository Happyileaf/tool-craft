/**
 * RGB ↔ CMYK 转换器常量
 */

/** RGB 通道定义 */
export const RGB_CHANNELS = [
  { key: 'r', label: 'R 红', min: 0, max: 255 },
  { key: 'g', label: 'G 绿', min: 0, max: 255 },
  { key: 'b', label: 'B 蓝', min: 0, max: 255 },
] as const;

/** CMYK 通道定义 */
export const CMYK_CHANNELS = [
  { key: 'c', label: 'C 青', color: '#13a8e0' },
  { key: 'm', label: 'M 品红', color: '#d62493' },
  { key: 'y', label: 'Y 黄', color: '#f5d400' },
  { key: 'k', label: 'K 黑', color: '#1f1f1f' },
] as const;

/** 默认颜色（科技蓝） */
export const DEFAULT_HEX = '#3B82F6';
