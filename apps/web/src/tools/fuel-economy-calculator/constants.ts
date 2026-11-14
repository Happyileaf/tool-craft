/**
 * 燃油经济性计算器工具内常量
 */

import { FuelEconomyUnitEnum } from './utils/fuel';

/** 默认油耗数值（美制 MPG） */
export const DEFAULT_ECONOMY_VALUE = 30;

/** 默认油耗单位 */
export const DEFAULT_ECONOMY_UNIT = FuelEconomyUnitEnum.MPG_US;

/** 默认行程距离（km） */
export const DEFAULT_DISTANCE_KM = 300;

/** 默认行程油耗（L/100km） */
export const DEFAULT_TRIP_L_PER_100KM = 8;

/** 默认油价（元/L） */
export const DEFAULT_PRICE_PER_LITER = 7.5;

/** 默认油箱容量（L） */
export const DEFAULT_TANK_LITERS = 50;

/** 默认同行人数 */
export const DEFAULT_TRAVELERS = 2;

/** 常见油耗预设，便于快速体验单位差异 */
export interface EconomyPreset {
  /** 预设显示名称 */
  readonly label: string;
  /** 数值 */
  readonly value: number;
  /** 单位 */
  readonly unit: FuelEconomyUnitEnum;
}

/** 常见油耗预设 */
export const ECONOMY_PRESETS: readonly EconomyPreset[] = [
  { label: '30 MPG（美制）', value: 30, unit: FuelEconomyUnitEnum.MPG_US },
  { label: '36 MPG（英制）', value: 36, unit: FuelEconomyUnitEnum.MPG_UK },
  { label: '7.8 L/100km', value: 7.8, unit: FuelEconomyUnitEnum.L_PER_100KM },
  { label: '12.8 km/L', value: 12.8, unit: FuelEconomyUnitEnum.KM_PER_L },
];
