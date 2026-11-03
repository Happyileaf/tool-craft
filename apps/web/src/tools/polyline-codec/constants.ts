/**
 * Encoded Polyline 编解码器常量与默认示例数据
 */

/** 转换方向 */
export enum PolylineModeEnum {
  /** 坐标点 → 折线字符串 */
  ENCODE = 'encode',
  /** 折线字符串 → 坐标点 */
  DECODE = 'decode',
}

/** 精度选项 */
export const PRECISION_OPTIONS = [
  { label: '精度 5（Google Directions API 经典格式）', value: 5 },
  { label: '精度 6（2019 年后官方推荐，精度更高）', value: 6 },
] as const;

/** 默认坐标点输入（Google 官方文档示例） */
export const DEFAULT_POINTS = `38.5,-120.2
40.7,-120.95
43.252,-126.453`;

/** 默认折线字符串输入（Google 官方文档精度 5 向量） */
export const DEFAULT_POLYLINE = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
