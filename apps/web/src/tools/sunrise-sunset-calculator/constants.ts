/** 日出日落与晨昏时刻计算器的常量与城市预设 */

export interface CityPreset {
  label: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number;
}

export const CITY_PRESETS: CityPreset[] = [
  { label: '北京', latitude: 39.9042, longitude: 116.4074, timezoneOffset: 8 },
  { label: '上海', latitude: 31.2304, longitude: 121.4737, timezoneOffset: 8 },
  { label: '广州', latitude: 23.1291, longitude: 113.2644, timezoneOffset: 8 },
  { label: '乌鲁木齐', latitude: 43.8256, longitude: 87.6168, timezoneOffset: 8 },
  { label: '东京', latitude: 35.6762, longitude: 139.6503, timezoneOffset: 9 },
  { label: '伦敦', latitude: 51.5072, longitude: -0.1276, timezoneOffset: 0 },
  { label: '纽约', latitude: 40.7128, longitude: -74.006, timezoneOffset: -5 },
  { label: '悉尼', latitude: -33.8688, longitude: 151.2093, timezoneOffset: 10 },
];

export const TIMEZONE_OPTIONS = [
  { label: 'UTC-12', value: -12 },
  { label: 'UTC-8（洛杉矶）', value: -8 },
  { label: 'UTC-5（纽约）', value: -5 },
  { label: 'UTC+0（伦敦）', value: 0 },
  { label: 'UTC+5:30（印度）', value: 5.5 },
  { label: 'UTC+8（北京）', value: 8 },
  { label: 'UTC+9（东京）', value: 9 },
  { label: 'UTC+10（悉尼）', value: 10 },
  { label: 'UTC+14', value: 14 },
];

export const DEFAULT_SUN_INPUT = {
  date: '2026-06-21',
  latitude: 39.9042,
  longitude: 116.4074,
  timezoneOffset: 8,
};
