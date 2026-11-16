/** 功率输入单位（内部统一换算为 W） */
export type PowerUnit = 'W' | 'kW';

/** 电价模式 */
export type PriceMode = 'flat' | 'tou';

/** 一台电器的输入行 */
export interface ApplianceInput {
  id: string;
  name: string;
  /** 额定功率数值（按 powerUnit 解释） */
  power: number | null;
  powerUnit: PowerUnit;
  /** 每日使用小时数 0–24 */
  hoursPerDay: number | null;
  /** 每月使用天数 0–31 */
  daysPerMonth: number | null;
  /** 电器数量 1–100 */
  quantity: number | null;
}

/** 校验后的边界常量 */
export const LIMITS = {
  minPowerW: 0,
  maxPowerW: 100000,
  minHours: 0,
  maxHours: 24,
  minDays: 0,
  maxDays: 31,
  minQuantity: 1,
  maxQuantity: 100,
  minPrice: 0,
  maxPrice: 10,
  minPeakRatio: 0,
  maxPeakRatio: 100,
  minAnnualKwh: 0,
  maxAnnualKwh: 1_000_000,
} as const;

export const HOURS_PER_YEAR = 365 * 24;
export const MONTHS_PER_YEAR = 12;

export const DEFAULT_FLAT_PRICE = 0.6;
export const DEFAULT_PEAK_PRICE = 1.0;
export const DEFAULT_VALLEY_PRICE = 0.3;
export const DEFAULT_PEAK_RATIO = 60;

let sequence = 0;
/** 生成带前缀的行 id（仅用于前端 key，不参与计算） */
export function createRowId(): string {
  sequence += 1;
  return `appliance-${Date.now()}-${sequence}`;
}

export function createDefaultAppliance(partial?: Partial<ApplianceInput>): ApplianceInput {
  return {
    id: createRowId(),
    name: '',
    power: null,
    powerUnit: 'W',
    hoursPerDay: null,
    daysPerMonth: null,
    quantity: 1,
    ...partial,
  };
}

/** 首屏示例：验收向量中的两台电器 */
export const DEFAULT_APPLIANCES: ApplianceInput[] = [
  createDefaultAppliance({
    name: '电暖器',
    power: 2000,
    powerUnit: 'W',
    hoursPerDay: 2,
    daysPerMonth: 30,
    quantity: 1,
  }),
  createDefaultAppliance({
    name: '电视',
    power: 100,
    powerUnit: 'W',
    hoursPerDay: 5,
    daysPerMonth: 30,
    quantity: 1,
  }),
];
