/**
 * 理想气体计算器常量：字段元信息与摩尔质量示例
 */
import type { GasField } from './utils/ideal-gas';

/** 四字段的界面元信息 */
export const FIELD_META: Record<
  GasField,
  { label: string; labelEn: string; siUnit: string; hint: string }
> = {
  pressure: {
    label: '压强 P',
    labelEn: 'Pressure',
    siUnit: 'Pa',
    hint: '内部换算为帕斯卡 Pa',
  },
  volume: {
    label: '体积 V',
    labelEn: 'Volume',
    siUnit: 'm³',
    hint: '内部换算为立方米 m³',
  },
  moles: {
    label: '物质的量 n',
    labelEn: 'Amount of substance',
    siUnit: 'mol',
    hint: '内部换算为摩尔 mol',
  },
  temperature: {
    label: '热力学温度 T',
    labelEn: 'Temperature',
    siUnit: 'K',
    hint: '摄氏/华氏先换算为开尔文 K',
  },
};

/** 常见气体摩尔质量参考（g/mol，来自标准原子量） */
export const COMMON_MOLAR_MASS: ReadonlyArray<{ gas: string; formula: string; molarMass: number }> = [
  { gas: '氢气', formula: 'H₂', molarMass: 2.016 },
  { gas: '氦气', formula: 'He', molarMass: 4.0026 },
  { gas: '氮气', formula: 'N₂', molarMass: 28.0134 },
  { gas: '氧气', formula: 'O₂', molarMass: 31.9988 },
  { gas: '二氧化碳', formula: 'CO₂', molarMass: 44.0095 },
  { gas: '甲烷', formula: 'CH₄', molarMass: 16.0425 },
  { gas: '空气（平均）', formula: 'Air', molarMass: 28.97 },
];

/** 结果区物理量中文名 */
export const FIELD_RESULT_NAME: Record<GasField, string> = {
  pressure: '压强 P',
  volume: '体积 V',
  moles: '物质的量 n',
  temperature: '热力学温度 T',
};
