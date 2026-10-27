/**
 * 支持的坐标系
 */
export enum CoordinateSystemEnum {
  WGS84 = 'wgs84',
  GCJ02 = 'gcj02',
  BD09 = 'bd09',
}

/**
 * 坐标系选项
 */
export const SYSTEM_OPTIONS = [
  { label: 'WGS-84（GPS / 国际标准）', value: CoordinateSystemEnum.WGS84 },
  { label: 'GCJ-02（火星坐标 / 高德、腾讯）', value: CoordinateSystemEnum.GCJ02 },
  { label: 'BD-09（百度坐标）', value: CoordinateSystemEnum.BD09 },
];

/**
 * 批量转换默认样例：北京天安门附近、上海人民广场附近（GCJ-02）
 */
export const DEFAULT_SAMPLE = '116.404,39.915\n121.4737,31.2304';

/**
 * 克拉索夫斯基椭球长半轴（GCJ-02 偏移算法通行常数）
 */
export const A = 6378245.0;

/**
 * 偏心率平方（GCJ-02 偏移算法通行常数）
 */
export const EE = 0.00669342162296594323;

/**
 * BD-09 算法使用的角度换算常数
 */
export const X_PI = (Math.PI * 3000.0) / 180.0;
