export enum ConvertModeEnum {
  ENCODE = 'encode',
  DECODE = 'decode',
}

export const GEOHASH_ALPHABET = '0123456789bcdefghjkmnpqrstuvwxyz';

export const BASE32_MAP: Record<string, number> = Object.fromEntries(
  GEOHASH_ALPHABET.split('').map((char, index) => [char, index]),
);

export const MIN_PRECISION = 1;
export const MAX_PRECISION = 12;
export const DEFAULT_PRECISION = 11;

export const PRECISION_OPTIONS = Array.from(
  { length: MAX_PRECISION - MIN_PRECISION + 1 },
  (_, index) => {
    const value = index + MIN_PRECISION;
    return { label: `${value} 位`, value };
  },
);

export const MODE_OPTIONS = [
  { label: '编码：经纬度 → Geohash', value: ConvertModeEnum.ENCODE },
  { label: '解码：Geohash → 经纬度', value: ConvertModeEnum.DECODE },
];

export const DEFAULT_SAMPLE_LAT = 57.64911;
export const DEFAULT_SAMPLE_LNG = 10.40744;
export const DEFAULT_SAMPLE_HASH = 'u4pruydqqvj';
