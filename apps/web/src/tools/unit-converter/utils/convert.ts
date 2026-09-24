import type { Unit, UnitCategory } from '../constants';

/**
 * 温度转换特殊处理
 */
function convertTemperature(value: number, fromUnit: Unit, toUnit: Unit): number {
  // 都转成摄氏度先
  let celsius;
  if (fromUnit.key === 'c') {
    celsius = value;
  } else if (fromUnit.key === 'f') {
    celsius = (value - 32) * 5 / 9;
  } else if (fromUnit.key === 'k') {
    celsius = value - 273.15;
  } else {
    celsius = 0;
  }

  // 从摄氏度转目标单位
  if (toUnit.key === 'c') {
    return celsius;
  } else if (toUnit.key === 'f') {
    return celsius * 9 / 5 + 32;
  } else if (toUnit.key === 'k') {
    return celsius + 273.15;
  }
  return 0;
}

/**
 * 单位换算
 */
export function convert(
  value: number,
  fromUnit: Unit,
  toUnit: Unit,
  category: UnitCategory
): number {
  // 温度特殊处理
  if (category === 'temperature') {
    return convertTemperature(value, fromUnit, toUnit);
  }

  // 先转成基准单位（米，平方米等），再转目标单位
  const baseValue = value * fromUnit.factor;
  return baseValue / toUnit.factor;
}
