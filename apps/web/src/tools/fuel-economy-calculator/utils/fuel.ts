/** 油耗单位换算与行程油费估算的纯函数 */

/** 油耗表示单位 */
export enum FuelEconomyUnitEnum {
  /** 美制英里每加仑 */
  MPG_US = 'mpg-us',
  /** 英制英里每加仑 */
  MPG_UK = 'mpg-uk',
  /** 升每百公里 */
  L_PER_100KM = 'l-per-100km',
  /** 公里每升 */
  KM_PER_L = 'km-per-l',
}

/** 单位中文标签 */
export const FUEL_ECONOMY_UNIT_LABELS: Record<FuelEconomyUnitEnum, string> = {
  [FuelEconomyUnitEnum.MPG_US]: 'MPG（美制）',
  [FuelEconomyUnitEnum.MPG_UK]: 'MPG（英制）',
  [FuelEconomyUnitEnum.L_PER_100KM]: 'L/100km',
  [FuelEconomyUnitEnum.KM_PER_L]: 'km/L',
};

/** 下拉选项 */
export const FUEL_ECONOMY_UNIT_OPTIONS = [
  { label: FUEL_ECONOMY_UNIT_LABELS[FuelEconomyUnitEnum.MPG_US], value: FuelEconomyUnitEnum.MPG_US },
  { label: FUEL_ECONOMY_UNIT_LABELS[FuelEconomyUnitEnum.MPG_UK], value: FuelEconomyUnitEnum.MPG_UK },
  {
    label: FUEL_ECONOMY_UNIT_LABELS[FuelEconomyUnitEnum.L_PER_100KM],
    value: FuelEconomyUnitEnum.L_PER_100KM,
  },
  { label: FUEL_ECONOMY_UNIT_LABELS[FuelEconomyUnitEnum.KM_PER_L], value: FuelEconomyUnitEnum.KM_PER_L },
];

/** 一加仑（美制）对应的升数 */
const US_GALLON_LITERS = 3.785411784;

/** 一加仑（英制）对应的升数 */
const UK_GALLON_LITERS = 4.54609;

/** 一英里对应的公里数 */
const MILE_KILOMETERS = 1.609344;

/** 四种单位的换算结果 */
export interface FuelEconomyValues {
  /** 美制 MPG */
  mpgUs: number;
  /** 英制 MPG */
  mpgUk: number;
  /** 升每百公里 */
  lPer100Km: number;
  /** 公里每升 */
  kmPerL: number;
}

/** 行程油费估算结果 */
export interface TripCostEstimate {
  /** 行程耗油量（L） */
  fuelLiters: number;
  /** 行程油费 */
  totalCost: number;
  /** 按油箱容量估算的中途加油次数，未提供油箱容量时为 null */
  refuels: number | null;
  /** 人均分摊油费 */
  perPersonCost: number;
}

/**
 * 将指定单位的油耗换算为公里每升
 */
function toKmPerLiter(value: number, unit: FuelEconomyUnitEnum): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('油耗数值需为大于 0 的数字');
  }
  switch (unit) {
    case FuelEconomyUnitEnum.MPG_US:
      return (value * MILE_KILOMETERS) / US_GALLON_LITERS;
    case FuelEconomyUnitEnum.MPG_UK:
      return (value * MILE_KILOMETERS) / UK_GALLON_LITERS;
    case FuelEconomyUnitEnum.L_PER_100KM:
      return 100 / value;
    case FuelEconomyUnitEnum.KM_PER_L:
      return value;
    default:
      throw new Error('未知的油耗单位');
  }
}

/**
 * 把给定单位与数值的油耗换算成四种常用表示
 */
export function convertFuelEconomy(value: number, unit: FuelEconomyUnitEnum): FuelEconomyValues {
  const kmPerL = toKmPerLiter(value, unit);
  return {
    mpgUs: (kmPerL * US_GALLON_LITERS) / MILE_KILOMETERS,
    mpgUk: (kmPerL * UK_GALLON_LITERS) / MILE_KILOMETERS,
    lPer100Km: 100 / kmPerL,
    kmPerL,
  };
}

/** 行程油费估算的输入 */
export interface TripCostInput {
  /** 行程距离（km） */
  distanceKm: number;
  /** 油耗（L/100km） */
  litersPer100Km: number;
  /** 油价（每升） */
  pricePerLiter: number;
  /** 油箱容量（L），0 或 null 表示不估算加油次数 */
  tankLiters?: number | null;
  /** 同行人数，用于分摊油费 */
  travelers: number;
}

/**
 * 按距离、油耗、油价与油箱容量估算耗油量、油费、加油次数与人均分摊
 */
export function estimateTripCost(input: TripCostInput): TripCostEstimate {
  const { distanceKm, litersPer100Km, pricePerLiter, tankLiters, travelers } = input;
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    throw new Error('行程距离需为大于 0 的数字');
  }
  if (!Number.isFinite(litersPer100Km) || litersPer100Km <= 0) {
    throw new Error('油耗需为大于 0 的数字');
  }
  if (!Number.isFinite(pricePerLiter) || pricePerLiter < 0) {
    throw new Error('油价需为不小于 0 的数字');
  }
  if (!Number.isInteger(travelers) || travelers < 1) {
    throw new Error('同行人数需为不小于 1 的整数');
  }

  const fuelLiters = (distanceKm / 100) * litersPer100Km;
  const totalCost = fuelLiters * pricePerLiter;
  const refuels =
    tankLiters !== null && tankLiters !== undefined && Number.isFinite(tankLiters) && tankLiters > 0
      ? Math.max(Math.ceil(fuelLiters / tankLiters) - 1, 0)
      : null;

  return {
    fuelLiters,
    totalCost,
    refuels,
    perPersonCost: totalCost / travelers,
  };
}
