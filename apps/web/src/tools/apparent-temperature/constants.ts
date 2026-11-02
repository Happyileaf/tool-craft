import type { CalcMode, TempUnit } from './utils/apparent-temperature';

export interface ModeOption {
  value: CalcMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'heat-index',
    label: '炎热侧：热指数 Heat Index',
    hint: '输入气温与相对湿度，按 NWS Rothfusz 多项式计算热指数（适用于约 ≥ 27°C 的暖热环境）',
  },
  {
    value: 'wind-chill',
    label: '寒冷侧：风寒 Wind Chill',
    hint: '输入气温与风速，按 2001 年美加联合公式计算风寒温度（适用于 ≤ 10°C 且风速 > 4.8 km/h）',
  },
];

export const UNIT_OPTIONS: { value: TempUnit; label: string }[] = [
  { value: 'C', label: '摄氏度 °C' },
  { value: 'F', label: '华氏度 °F' },
];

/** 热指数模式默认输入（°C / %） */
export const DEFAULT_HEAT_TEMP_C = 35;
export const DEFAULT_HEAT_HUMIDITY = 65;

/** 风寒模式默认输入（°C / km/h） */
export const DEFAULT_WIND_TEMP_C = -5;
export const DEFAULT_WIND_SPEED_KMH = 25;

/** 华氏度模式默认输入 */
export const DEFAULT_HEAT_TEMP_F = 96;
export const DEFAULT_WIND_TEMP_F = 0;
export const DEFAULT_WIND_SPEED_MPH = 15;

/** 热指数模式典型场景预设 */
export const HEAT_PRESETS: { label: string; tempC: number; humidity: number }[] = [
  { label: '闷热盛夏 32°C/80%', tempC: 32, humidity: 80 },
  { label: '干热酷暑 40°C/20%', tempC: 40, humidity: 20 },
  { label: '湿热危险 35°C/65%', tempC: 35, humidity: 65 },
  { label: '桑拿天 30°C/90%', tempC: 30, humidity: 90 },
];

/** 风寒模式典型场景预设 */
export const WIND_PRESETS: { label: string; tempC: number; windKmh: number }[] = [
  { label: '干冷微风 -5°C/10km/h', tempC: -5, windKmh: 10 },
  { label: '寒风 -10°C/30km/h', tempC: -10, windKmh: 30 },
  { label: '严寒 -20°C/40km/h', tempC: -20, windKmh: 40 },
  { label: '极地 -30°C/60km/h', tempC: -30, windKmh: 60 },
];
