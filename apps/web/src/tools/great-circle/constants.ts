import type { LatLon } from './utils/geo';

/** 默认起点：伦敦 */
export const DEFAULT_FROM: LatLon = { lat: 51.5074, lon: -0.1278 };

/** 默认终点：纽约 */
export const DEFAULT_TO: LatLon = { lat: 40.7128, lon: -74.006 };

/** 城市坐标预设 */
export interface CityPreset {
  label: string;
  point: LatLon;
}

export const CITY_PRESETS: CityPreset[] = [
  { label: '伦敦', point: { lat: 51.5074, lon: -0.1278 } },
  { label: '纽约', point: { lat: 40.7128, lon: -74.006 } },
  { label: '北京', point: { lat: 39.9042, lon: 116.4074 } },
  { label: '上海', point: { lat: 31.2304, lon: 121.4737 } },
  { label: '东京', point: { lat: 35.6762, lon: 139.6503 } },
  { label: '悉尼', point: { lat: -33.8688, lon: 151.2093 } },
];
