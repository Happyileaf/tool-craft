/**
 * WGS-84 两点大圆计算：Haversine 距离与初始 / 终点方位角
 */

/** 经纬度坐标（十进制度，北纬 / 东经为正） */
export interface LatLon {
  lat: number;
  lon: number;
}

/** 距离单位 */
export type DistanceUnit = 'km' | 'mi' | 'nmi';

/** 单位换算系数（相对于米） */
const UNIT_TO_METERS: Record<DistanceUnit, number> = {
  km: 1000,
  mi: 1609.344,
  nmi: 1852,
};

/** WGS-84 平均地球半径（米） */
const EARTH_RADIUS_METERS = 6371008.8;

/**
 * 角度转弧度
 *
 * @param degrees - 角度
 * @returns 弧度
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * 弧度转角度并归一化到 [0, 360)
 *
 * @param radians - 弧度
 * @returns 0–360 度
 */
function toDegreesNormalized(radians: number): number {
  return (radians * 180 / Math.PI + 360) % 360;
}

/**
 * 校验经纬度范围
 *
 * @param point - 坐标
 * @param label - 字段名（用于错误信息）
 * @throws 纬度超出 [-90, 90] 或经度超出 [-180, 180] 时抛错
 */
function validatePoint(point: LatLon, label: string): void {
  if (Number.isNaN(point.lat) || Number.isNaN(point.lon)) {
    throw new Error(`${label}经纬度必须为数字`);
  }
  if (point.lat < -90 || point.lat > 90) {
    throw new Error(`${label}纬度必须在 -90 到 90 之间`);
  }
  if (point.lon < -180 || point.lon > 180) {
    throw new Error(`${label}经度必须在 -180 到 180 之间`);
  }
}

/**
 * Haversine 公式计算两点大圆距离
 *
 * @param from - 起点
 * @param to - 终点
 * @param unit - 距离单位，默认 km
 * @returns 大圆距离
 */
export function greatCircleDistance(from: LatLon, to: LatLon, unit: DistanceUnit = 'km'): number {
  validatePoint(from, '起点');
  validatePoint(to, '终点');
  const phi1 = toRadians(from.lat);
  const phi2 = toRadians(to.lat);
  const deltaPhi = toRadians(to.lat - from.lat);
  const deltaLambda = toRadians(to.lon - from.lon);

  const sinPhi = Math.sin(deltaPhi / 2);
  const sinLambda = Math.sin(deltaLambda / 2);
  const a = sinPhi * sinPhi + Math.cos(phi1) * Math.cos(phi2) * sinLambda * sinLambda;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const meters = EARTH_RADIUS_METERS * c;
  return meters / UNIT_TO_METERS[unit];
}

/**
 * 计算从起点到终点的初始方位角（大圆航线在起点处的航向，0–360°，正北为 0，顺时针）
 *
 * @param from - 起点
 * @param to - 终点
 * @returns 初始方位角；两点重合时返回 0
 */
export function initialBearing(from: LatLon, to: LatLon): number {
  validatePoint(from, '起点');
  validatePoint(to, '终点');
  const phi1 = toRadians(from.lat);
  const phi2 = toRadians(to.lat);
  const deltaLambda = toRadians(to.lon - from.lon);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  if (x === 0 && y === 0) {
    return 0;
  }
  return toDegreesNormalized(Math.atan2(y, x));
}

/**
 * 计算终点方位角（大圆航线到达终点时的航向，0–360°）
 *
 * 等于「从终点返回起点的初始方位角」+180° 归一化
 *
 * @param from - 起点
 * @param to - 终点
 * @returns 终点方位角；两点重合时返回 0
 */
export function finalBearing(from: LatLon, to: LatLon): number {
  const reverse = initialBearing(to, from);
  return (reverse + 180) % 360;
}

/**
 * 反方位角（从终点返回起点的初始方位角，0–360°）
 *
 * @param from - 起点
 * @param to - 终点
 * @returns 返程初始方位角
 */
export function backBearing(from: LatLon, to: LatLon): number {
  return initialBearing(to, from);
}

/** 大圆计算完整结果（各单位距离与方位角） */
export interface GreatCircleResult {
  km: number;
  mi: number;
  nmi: number;
  initialBearing: number;
  finalBearing: number;
  backBearing: number;
}

/**
 * 一次算出多单位距离与全部方位角
 *
 * @param from - 起点
 * @param to - 终点
 * @returns 距离（km/mi/nmi）与初始 / 终点 / 反方位角
 */
export function calculateGreatCircle(from: LatLon, to: LatLon): GreatCircleResult {
  return {
    km: greatCircleDistance(from, to, 'km'),
    mi: greatCircleDistance(from, to, 'mi'),
    nmi: greatCircleDistance(from, to, 'nmi'),
    initialBearing: initialBearing(from, to),
    finalBearing: finalBearing(from, to),
    backBearing: backBearing(from, to),
  };
}

/**
 * 把 0–360° 方位角格式化为 16 方位罗盘方位（如 N、NNE、NE）
 *
 * @param bearing - 方位角
 * @returns 罗盘方位缩写
 */
export function compassPoint(bearing: number): string {
  const points = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const normalized = ((bearing % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return points[index] ?? 'N';
}
