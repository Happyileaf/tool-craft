/**
 * 电阻分压器计算器常量
 */

/** 电阻单位与换算到欧姆的倍率 */
export const RESISTOR_UNITS: Array<{ value: string; label: string; factor: number }> = [
  { value: 'Ω', label: 'Ω（欧姆）', factor: 1 },
  { value: 'kΩ', label: 'kΩ（千欧）', factor: 1e3 },
  { value: 'MΩ', label: 'MΩ（兆欧）', factor: 1e6 },
];

/** 电压单位与换算到伏特的倍率 */
export const VOLTAGE_UNITS: Array<{ value: string; label: string; factor: number }> = [
  { value: 'mV', label: 'mV', factor: 1e-3 },
  { value: 'V', label: 'V（伏特）', factor: 1 },
];

/** 计算模式 */
export const CALC_MODES = [
  { value: 'output', label: '已知 R1 / R2（/RL）求输出电压' },
  { value: 'resistor', label: '已知目标输出电压与 R1 求 R2' },
] as const;

/** 示例预设：典型分压与带载场景 */
export const EXAMPLE_PRESETS = [
  {
    name: '5V → 3.3V（R1=1kΩ, R2=2kΩ，近似）',
    inputVoltage: 5,
    inputVoltageUnit: 'V',
    r1: 1,
    r1Unit: 'kΩ',
    r2: 1.95,
    r2Unit: 'kΩ',
    useLoad: false,
    rl: 100,
    rlUnit: 'kΩ',
  },
  {
    name: '12V → 5V 带 10kΩ 负载（R1=R2=10kΩ）',
    inputVoltage: 12,
    inputVoltageUnit: 'V',
    r1: 10,
    r1Unit: 'kΩ',
    r2: 10,
    r2Unit: 'kΩ',
    useLoad: true,
    rl: 100,
    rlUnit: 'kΩ',
  },
];

/** 分压比达到「负载效应可忽略」经验阈值：RL ≥ 10 × R2（输出偏差 < 约 10%） */
export const LOAD_NEGLECT_RATIO = 10;
