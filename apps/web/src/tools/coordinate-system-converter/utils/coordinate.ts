import { A, CoordinateSystemEnum, EE, X_PI } from '../constants';

/**
 * 一个经纬度点（顺序：经度 lng、纬度 lat）
 */
export interface CoordinatePoint {
  lng: number;
  lat: number;
}

/**
 * 带境外标记的转换结果
 */
export interface ConvertedPoint extends CoordinatePoint {
  /** 中国境外、按通行实现未施加 GCJ-02 偏移 */
  outOfChina: boolean;
}

/**
 * 批量转换单行结果
 */
export interface BatchRow {
  /** 原始行文本 */
  source: string;
  ok: boolean;
  lng?: number;
  lat?: number;
  outOfChina?: boolean;
  error?: string;
}

/**
 * 判断坐标是否在中国境外（按通行矩形范围，境外不做 GCJ-02 偏移）。
 *
 * @param lng - 经度
 * @param lat - 纬度
 * @returns 是否在境外
 */
export function outOfChina(lng: number, lat: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

/**
 * 纬度偏移多项式（GCJ-02 标准实现）。
 *
 * @param x - 经度差（弧度基准）
 * @param y - 纬度差（弧度基准）
 * @returns 纬度偏移量
 */
function transformLat(x: number, y: number): number {
  let result =
    -100.0 +
    2.0 * x +
    3.0 * y +
    0.2 * y * y +
    0.1 * x * y +
    0.2 * Math.sqrt(Math.abs(x));
  result += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  result += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0;
  result += ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0;
  return result;
}

/**
 * 经度偏移多项式（GCJ-02 标准实现）。
 *
 * @param x - 经度差（弧度基准）
 * @param y - 纬度差（弧度基准）
 * @returns 经度偏移量
 */
function transformLng(x: number, y: number): number {
  let result =
    300.0 +
    x +
    2.0 * y +
    0.1 * x * x +
    0.1 * x * y +
    0.1 * Math.sqrt(Math.abs(x));
  result += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  result += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0;
  result += ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0;
  return result;
}

/**
 * WGS-84 转 GCJ-02；中国境外原样返回。
 *
 * @param lng - WGS-84 经度
 * @param lat - WGS-84 纬度
 * @returns GCJ-02 坐标与境外标记
 */
export function wgs84ToGcj02(lng: number, lat: number): ConvertedPoint {
  if (outOfChina(lng, lat)) {
    return { lng, lat, outOfChina: true };
  }
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * Math.PI);
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return { lng: lng + dLng, lat: lat + dLat, outOfChina: false };
}

/**
 * GCJ-02 转 WGS-84，采用通行减法近似（GCJ-02 无官方逆算法）；境外原样返回。
 *
 * @param lng - GCJ-02 经度
 * @param lat - GCJ-02 纬度
 * @returns WGS-84 近似坐标与境外标记
 */
export function gcj02ToWgs84(lng: number, lat: number): ConvertedPoint {
  if (outOfChina(lng, lat)) {
    return { lng, lat, outOfChina: true };
  }
  const shifted = wgs84ToGcj02(lng, lat);
  return { lng: lng * 2 - shifted.lng, lat: lat * 2 - shifted.lat, outOfChina: false };
}

/**
 * GCJ-02 转 BD-09。
 *
 * @param lng - GCJ-02 经度
 * @param lat - GCJ-02 纬度
 * @returns BD-09 坐标与境外标记
 */
export function gcj02ToBd09(lng: number, lat: number): ConvertedPoint {
  if (outOfChina(lng, lat)) {
    return { lng, lat, outOfChina: true };
  }
  const z =
    Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * X_PI);
  const theta =
    Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * X_PI);
  return {
    lng: z * Math.cos(theta) + 0.0065,
    lat: z * Math.sin(theta) + 0.006,
    outOfChina: false,
  };
}

/**
 * BD-09 转 GCJ-02；中国境外原样返回。
 *
 * @param bdLng - BD-09 经度
 * @param bdLat - BD-09 纬度
 * @returns GCJ-02 坐标与境外标记
 */
export function bd09ToGcj02(bdLng: number, bdLat: number): ConvertedPoint {
  if (outOfChina(bdLng, bdLat)) {
    return { lng: bdLng, lat: bdLat, outOfChina: true };
  }
  const x = bdLng - 0.0065;
  const y = bdLat - 0.006;
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
  return { lng: z * Math.cos(theta), lat: z * Math.sin(theta), outOfChina: false };
}

/**
 * 在三种坐标系之间转换；同源转换原样返回。WGS-84 与 BD-09 之间经 GCJ-02 中转。
 *
 * @param lng - 输入经度
 * @param lat - 输入纬度
 * @param from - 源坐标系
 * @param to - 目标坐标系
 * @returns 转换结果
 */
export function convert(
  lng: number,
  lat: number,
  from: CoordinateSystemEnum,
  to: CoordinateSystemEnum,
): ConvertedPoint {
  if (from === to) {
    return { lng, lat, outOfChina: outOfChina(lng, lat) };
  }
  if (from === CoordinateSystemEnum.WGS84 && to === CoordinateSystemEnum.GCJ02) {
    return wgs84ToGcj02(lng, lat);
  }
  if (from === CoordinateSystemEnum.GCJ02 && to === CoordinateSystemEnum.WGS84) {
    return gcj02ToWgs84(lng, lat);
  }
  if (from === CoordinateSystemEnum.GCJ02 && to === CoordinateSystemEnum.BD09) {
    return gcj02ToBd09(lng, lat);
  }
  if (from === CoordinateSystemEnum.BD09 && to === CoordinateSystemEnum.GCJ02) {
    return bd09ToGcj02(lng, lat);
  }
  if (from === CoordinateSystemEnum.WGS84 && to === CoordinateSystemEnum.BD09) {
    const gcj = wgs84ToGcj02(lng, lat);
    return gcj02ToBd09(gcj.lng, gcj.lat);
  }
  const gcj = bd09ToGcj02(lng, lat);
  return gcj02ToWgs84(gcj.lng, gcj.lat);
}

/**
 * 批量转换：每行格式「经度,纬度」，空行跳过，非法行仅该行报错。
 *
 * @param text - 多行文本
 * @param from - 源坐标系
 * @param to - 目标坐标系
 * @returns 逐行结果
 */
export function convertBatch(
  text: string,
  from: CoordinateSystemEnum,
  to: CoordinateSystemEnum,
): BatchRow[] {
  return text
    .split('\n')
    .map((rawLine): BatchRow | null => {
      const source = rawLine.trim();
      if (!source) {
        return null;
      }
      const parts = source.split(/[\s,，;；\t]+/).filter((part) => part.length > 0);
      const lngText = parts[0];
      const latText = parts[1];
      if (lngText === undefined || latText === undefined || parts.length > 2) {
        return { source, ok: false, error: '格式应为「经度,纬度」两个字段' };
      }
      const lng = Number(lngText);
      const lat = Number(latText);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        return { source, ok: false, error: '经度或纬度不是有效数字' };
      }
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return { source, ok: false, error: '经度需在 [-180,180]、纬度需在 [-90,90]' };
      }
      const result = convert(lng, lat, from, to);
      return {
        source,
        ok: true,
        lng: result.lng,
        lat: result.lat,
        outOfChina: result.outOfChina,
      };
    })
    .filter((row): row is BatchRow => row !== null);
}
