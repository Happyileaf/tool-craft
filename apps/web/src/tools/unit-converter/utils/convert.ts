import { DEFAULT_PRECISION, UNIT_CATEGORIES } from '../constants';
import type { UnitCategoryDefinition, UnitDefinition } from '../constants';

/**
 * 按分类标识查找分类定义
 *
 * @param categoryId - 分类标识
 * @returns 分类定义，未找到时返回 undefined
 */
export function findCategory(
  categoryId: string,
): UnitCategoryDefinition | undefined {
  return UNIT_CATEGORIES.find((category) => category.id === categoryId);
}

/**
 * 在分类内按单位标识查找单位定义
 *
 * @param category - 分类定义
 * @param unitId - 单位标识
 * @returns 单位定义，未找到时返回 undefined
 */
export function findUnit(
  category: UnitCategoryDefinition,
  unitId: string,
): UnitDefinition | undefined {
  return category.units.find((unit) => unit.id === unitId);
}

/**
 * 将任意单位的数值归一化到该分类的基准单位
 *
 * 基准值 = 输入值 * factor + offset
 *
 * @param value - 输入数值
 * @param unit - 源单位定义
 * @returns 基准单位下的数值
 */
export function toBaseUnit(value: number, unit: UnitDefinition): number {
  return value * unit.factor + (unit.offset ?? 0);
}

/**
 * 将基准单位数值换算到目标单位
 *
 * 输入值 = (基准值 - offset) / factor
 *
 * @param baseValue - 基准单位下的数值
 * @param unit - 目标单位定义
 * @returns 目标单位下的数值
 */
export function fromBaseUnit(baseValue: number, unit: UnitDefinition): number {
  return (baseValue - (unit.offset ?? 0)) / unit.factor;
}

/**
 * 在同一分类的两个单位之间换算数值
 *
 * @param value - 源数值
 * @param sourceUnit - 源单位定义
 * @param targetUnit - 目标单位定义
 * @returns 目标单位下的换算结果
 */
export function convertBetweenUnits(
  value: number,
  sourceUnit: UnitDefinition,
  targetUnit: UnitDefinition,
): number {
  return fromBaseUnit(toBaseUnit(value, sourceUnit), targetUnit);
}

/**
 * 对换算结果做有效数字截断，消除浮点运算尾差
 *
 * 整数或绝对值极大/极小数直接返回以避免科学计数法被误处理；
 * 其余结果按给定有效位数四舍五入，并去掉无意义的尾随零
 *
 * @param value - 原始换算结果
 * @param precision - 保留的最大有效位数
 * @returns 规范化后的数值
 */
export function roundResult(
  value: number,
  precision: number = DEFAULT_PRECISION,
): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  if (value === 0) {
    return 0;
  }
  const abs = Math.abs(value);
  // 对极端量级直接返回，避免 toPrecision 产生不必要的指数形式
  if (abs >= 1e15 || abs < 1e-9) {
    return value;
  }
  return Number(value.toPrecision(precision));
}

/**
 * 一次完整换算的便捷入口，包含分类与单位查找、换算、精度处理
 *
 * @param categoryId - 分类标识
 * @param sourceUnitId - 源单位标识
 * @param targetUnitId - 目标单位标识
 * @param value - 源数值
 * @param precision - 结果最大有效位数
 * @returns 换算后的数值；任一标识非法时返回 null
 */
export function convertValue(
  categoryId: string,
  sourceUnitId: string,
  targetUnitId: string,
  value: number,
  precision: number = DEFAULT_PRECISION,
): number | null {
  const category = findCategory(categoryId);
  if (!category) {
    return null;
  }
  const sourceUnit = findUnit(category, sourceUnitId);
  const targetUnit = findUnit(category, targetUnitId);
  if (!sourceUnit || !targetUnit) {
    return null;
  }
  const raw = convertBetweenUnits(value, sourceUnit, targetUnit);
  return roundResult(raw, precision);
}
