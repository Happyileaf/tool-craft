import { BASE32_MAP, GEOHASH_ALPHABET, MAX_PRECISION, MIN_PRECISION } from '../constants';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface DecodeResult {
  latitude: number;
  longitude: number;
  bbox: BoundingBox;
  error: GeoPoint;
}

export interface EncodeStep {
  index: number;
  char: string;
  bits: string;
  latRange: [number, number];
  lngRange: [number, number];
}

/**
 * 判断文本是否为合法 geohash（仅含字母表字符，非空）。
 *
 * @param hash - geohash 文本
 * @returns 是否合法
 */
export function isValidHash(hash: string): boolean {
  const text = hash.trim().toLowerCase();
  if (!text) {
    return false;
  }
  for (const char of text) {
    if (!(char in BASE32_MAP)) {
      return false;
    }
  }
  return true;
}

/**
 * 归一化 geohash 文本：去除首尾空白并转小写；含非法字符时抛错。
 *
 * @param hash - geohash 文本
 * @returns 归一化后的 geohash
 */
export function normalizeHash(hash: string): string {
  const text = hash.trim().toLowerCase();
  if (!text) {
    throw new Error('Geohash 不能为空');
  }
  if (!isValidHash(text)) {
    throw new Error(
      `包含非法字符，geohash 仅支持字母表 ${GEOHASH_ALPHABET}（注意不含 a、l、o、i）`,
    );
  }
  return text;
}

/**
 * 校验经纬度与精度，非法时抛错。
 *
 * @param lat - 纬度
 * @param lng - 经度
 * @param precision - 字符精度
 */
function validateInput(lat: number, lng: number, precision: number): void {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error('纬度超出范围，需为 -90 到 90 之间的数值');
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error('经度超出范围，需为 -180 到 180 之间的数值');
  }
  if (!Number.isInteger(precision) || precision < MIN_PRECISION || precision > MAX_PRECISION) {
    throw new Error(`精度需为 ${MIN_PRECISION} 到 ${MAX_PRECISION} 之间的整数`);
  }
}

/**
 * 逐字符执行区间二分，返回每一步的字符、5 bit 与收窄后的经纬度区间。
 *
 * @param lat - 纬度
 * @param lng - 经度
 * @param precision - 字符精度
 * @returns 逐字符编码过程
 */
export function encodeSteps(lat: number, lng: number, precision: number): EncodeStep[] {
  validateInput(lat, lng, precision);
  const steps: EncodeStep[] = [];
  let latRange: [number, number] = [-90, 90];
  let lngRange: [number, number] = [-180, 180];
  let isEven = true;
  let bit = 0;

  for (let index = 0; index < precision; index += 1) {
    let bits = '';
    for (let bitIndex = 0; bitIndex < 5; bitIndex += 1) {
      if (isEven) {
        const mid = (lngRange[0] + lngRange[1]) / 2;
        if (lng >= mid) {
          bit = (bit << 1) | 1;
          lngRange[0] = mid;
        } else {
          bit = bit << 1;
          lngRange[1] = mid;
        }
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        if (lat >= mid) {
          bit = (bit << 1) | 1;
          latRange[0] = mid;
        } else {
          bit = bit << 1;
          latRange[1] = mid;
        }
      }
      bits += bit & 1 ? '1' : '0';
      isEven = !isEven;
    }
    steps.push({
      index,
      char: GEOHASH_ALPHABET.charAt(bit),
      bits,
      latRange: [latRange[0], latRange[1]],
      lngRange: [lngRange[0], lngRange[1]],
    });
    bit = 0;
  }
  return steps;
}

/**
 * 将经纬度编码为 geohash 字符串。
 *
 * @param lat - 纬度（-90 到 90）
 * @param lng - 经度（-180 到 180）
 * @param precision - 字符精度（1 到 12）
 * @returns geohash 字符串
 */
export function encode(lat: number, lng: number, precision: number): string {
  return encodeSteps(lat, lng, precision)
    .map((step) => step.char)
    .join('');
}

/**
 * 解码 geohash，返回中心点、边界框与误差范围（中心点为区间中点）。
 *
 * @param hash - geohash 文本
 * @returns 中心点、边界框与误差
 */
export function decode(hash: string): DecodeResult {
  const text = normalizeHash(hash);
  let latRange: [number, number] = [-90, 90];
  let lngRange: [number, number] = [-180, 180];
  let isEven = true;

  for (const char of text) {
    const value = BASE32_MAP[char] ?? 0;
    for (let bitIndex = 4; bitIndex >= 0; bitIndex -= 1) {
      const bitValue = (value >> bitIndex) & 1;
      if (isEven) {
        const mid = (lngRange[0] + lngRange[1]) / 2;
        if (bitValue) {
          lngRange[0] = mid;
        } else {
          lngRange[1] = mid;
        }
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        if (bitValue) {
          latRange[0] = mid;
        } else {
          latRange[1] = mid;
        }
      }
      isEven = !isEven;
    }
  }

  const latitude = (latRange[0] + latRange[1]) / 2;
  const longitude = (lngRange[0] + lngRange[1]) / 2;
  return {
    latitude,
    longitude,
    bbox: {
      minLat: latRange[0],
      maxLat: latRange[1],
      minLng: lngRange[0],
      maxLng: lngRange[1],
    },
    error: {
      lat: latitude - latRange[0],
      lng: longitude - lngRange[0],
    },
  };
}
