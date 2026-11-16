/**
 * 家庭用电量与电费计算的纯函数模块（零依赖，不触碰 DOM / React）
 *
 * 核心关系：
 *   日耗电(kWh) = 功率(W) × 时长(h) × 数量 ÷ 1000
 *   月耗电(kWh) = 日耗电 × 每月天数
 *   电费(元)    = 耗电量 × 电价
 * 年度值按「月度 × 12」估算（不区分大小月）。
 */
import {
  HOURS_PER_YEAR,
  LIMITS,
  MONTHS_PER_YEAR,
  type ApplianceInput,
  type PowerUnit,
  type PriceMode,
} from '../constants';

/** 单台电器的计算结果 */
export interface ApplianceResult {
  id: string;
  name: string;
  powerW: number;
  dailyKwh: number;
  monthlyKwh: number;
  monthlyCost: number;
  yearlyKwh: number;
  yearlyCost: number;
  /** 占月度总用电的比例（0–1），合计后由汇总层填充 */
  monthlyShare: number;
}

export interface PriceConfig {
  mode: PriceMode;
  /** 单一电价（元/kWh） */
  flatPrice: number | null;
  /** 峰段电价 */
  peakPrice: number | null;
  /** 谷段电价 */
  valleyPrice: number | null;
  /** 峰段用电占比（0–100） */
  peakRatio: number | null;
}

export interface BillSummary {
  monthlyKwh: number;
  monthlyCost: number;
  yearlyKwh: number;
  yearlyCost: number;
  /** 平均每日电费（月电费按 30 天摊） */
  averageDailyCost: number;
  /** 月度平均功率（W）：月耗电 ÷ 月小时数 × 1000，月小时按 30×24 */
  averagePowerW: number;
  /** 电价为 0 时给出提示 */
  zeroPrice: boolean;
}

export interface BillResult {
  rows: ApplianceResult[];
  summary: BillSummary | null;
  errors: string[];
}

function isFiniteNumber(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

/** 功率统一换算为瓦 */
export function toWatt(power: number, unit: PowerUnit): number {
  return unit === 'kW' ? power * 1000 : power;
}

/** 校验单行输入，返回该行错误信息（无错误返回 null） */
export function validateAppliance(row: ApplianceInput, index: number): string | null {
  const label = row.name.trim() || `第 ${index + 1} 台电器`;
  if (!isFiniteNumber(row.power)) {
    return `${label}：功率必须是有效数字`;
  }
  const powerW = toWatt(row.power, row.powerUnit);
  if (powerW < LIMITS.minPowerW || powerW > LIMITS.maxPowerW) {
    return `${label}：功率需在 ${LIMITS.minPowerW}–${LIMITS.maxPowerW} W 之间`;
  }
  if (!isFiniteNumber(row.hoursPerDay)) {
    return `${label}：每日时长必须是有效数字`;
  }
  if (row.hoursPerDay < LIMITS.minHours || row.hoursPerDay > LIMITS.maxHours) {
    return `${label}：每日时长需在 ${LIMITS.minHours}–${LIMITS.maxHours} 小时之间`;
  }
  if (!isFiniteNumber(row.daysPerMonth)) {
    return `${label}：每月天数必须是有效数字`;
  }
  if (row.daysPerMonth < LIMITS.minDays || row.daysPerMonth > LIMITS.maxDays) {
    return `${label}：每月天数需在 ${LIMITS.minDays}–${LIMITS.maxDays} 天之间`;
  }
  if (!isFiniteNumber(row.quantity)) {
    return `${label}：数量必须是有效数字`;
  }
  if (row.quantity < LIMITS.minQuantity || row.quantity > LIMITS.maxQuantity) {
    return `${label}：数量需在 ${LIMITS.minQuantity}–${LIMITS.maxQuantity} 之间`;
  }
  return null;
}

/** 校验电价配置 */
export function validatePrice(config: PriceConfig): string | null {
  if (config.mode === 'flat') {
    if (!isFiniteNumber(config.flatPrice)) {
      return '单一电价必须是有效数字';
    }
    if (config.flatPrice < LIMITS.minPrice || config.flatPrice > LIMITS.maxPrice) {
      return `电价需在 ${LIMITS.minPrice}–${LIMITS.maxPrice} 元/kWh 之间`;
    }
    return null;
  }
  const fields: Array<[number | null, string, number, number]> = [
    [config.peakPrice, '峰价', LIMITS.minPrice, LIMITS.maxPrice],
    [config.valleyPrice, '谷价', LIMITS.minPrice, LIMITS.maxPrice],
    [config.peakRatio, '峰段占比', LIMITS.minPeakRatio, LIMITS.maxPeakRatio],
  ];
  for (const [value, name, min, max] of fields) {
    if (!isFiniteNumber(value)) {
      return `${name}必须是有效数字`;
    }
    if (value < min || value > max) {
      return `${name}需在 ${min}–${max} 之间`;
    }
  }
  return null;
}

/** 计算单位电量的综合电价（元/kWh）；峰谷模式按峰段占比加权 */
export function effectiveUnitPrice(config: PriceConfig): number {
  if (config.mode === 'flat') {
    return config.flatPrice ?? 0;
  }
  const peak = config.peakPrice ?? 0;
  const valley = config.valleyPrice ?? 0;
  const ratio = (config.peakRatio ?? 0) / 100;
  return peak * ratio + valley * (1 - ratio);
}

/**
 * 计算全部电器与合计。
 * 任一行或电价非法时只返回 errors，不输出结果；空表提示至少添加一台电器。
 */
export function calculateBill(appliances: ApplianceInput[], config: PriceConfig): BillResult {
  if (appliances.length === 0) {
    return { rows: [], summary: null, errors: ['请至少添加一台电器'] };
  }

  const errors: string[] = [];
  appliances.forEach((row, index) => {
    const error = validateAppliance(row, index);
    if (error) {
      errors.push(error);
    }
  });
  const priceError = validatePrice(config);
  if (priceError) {
    errors.push(priceError);
  }
  if (errors.length > 0) {
    return { rows: [], summary: null, errors };
  }

  const unitPrice = effectiveUnitPrice(config);
  const rows: ApplianceResult[] = appliances.map((row) => {
    const powerW = toWatt(row.power as number, row.powerUnit);
    const dailyKwh = (powerW * (row.hoursPerDay as number) * (row.quantity as number)) / 1000;
    const monthlyKwh = dailyKwh * (row.daysPerMonth as number);
    const monthlyCost = monthlyKwh * unitPrice;
    const yearlyKwh = monthlyKwh * MONTHS_PER_YEAR;
    const yearlyCost = monthlyCost * MONTHS_PER_YEAR;
    return {
      id: row.id,
      name: row.name.trim(),
      powerW,
      dailyKwh,
      monthlyKwh,
      monthlyCost,
      yearlyKwh,
      yearlyCost,
      monthlyShare: 0,
    };
  });

  const monthlyKwh = rows.reduce((sum, row) => sum + row.monthlyKwh, 0);
  const monthlyCost = rows.reduce((sum, row) => sum + row.monthlyCost, 0);
  rows.forEach((row) => {
    row.monthlyShare = monthlyKwh > 0 ? row.monthlyKwh / monthlyKwh : 0;
  });

  const yearlyKwh = monthlyKwh * MONTHS_PER_YEAR;
  const yearlyCost = monthlyCost * MONTHS_PER_YEAR;
  const summary: BillSummary = {
    monthlyKwh,
    monthlyCost,
    yearlyKwh,
    yearlyCost,
    averageDailyCost: monthlyCost / 30,
    averagePowerW: monthlyKwh > 0 ? (monthlyKwh / (30 * 24)) * 1000 : 0,
    zeroPrice: unitPrice === 0,
  };

  return { rows, summary, errors: [] };
}

/**
 * 能效反推：年耗电量(kWh) → 365×24 小时平均功率(W)
 * 平均功率 W = 年耗电 kWh × 1000 ÷ 8760
 */
export function annualKwhToAveragePower(annualKwh: number | null): { powerW: number | null; error: string | null } {
  if (!isFiniteNumber(annualKwh)) {
    return { powerW: null, error: '年耗电量必须是有效数字' };
  }
  if (annualKwh < LIMITS.minAnnualKwh || annualKwh > LIMITS.maxAnnualKwh) {
    return {
      powerW: null,
      error: `年耗电量需在 ${LIMITS.minAnnualKwh}–${LIMITS.maxAnnualKwh.toLocaleString()} kWh 之间`,
    };
  }
  return { powerW: (annualKwh * 1000) / HOURS_PER_YEAR, error: null };
}

/** 固定小数位四舍五入（展示层使用） */
export function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
