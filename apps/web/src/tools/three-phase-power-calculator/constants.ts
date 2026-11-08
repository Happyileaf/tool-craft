/**
 * 三相交流功率计算器常量
 */

/** 计算模式 */
export const POWER_MODE = Object.freeze({
  POWER: 'power',
  CURRENT: 'current',
} as const);

export type PowerMode = (typeof POWER_MODE)[keyof typeof POWER_MODE];

/** 接法选项 */
export const CONNECTION_OPTIONS: ReadonlyArray<{ label: string; value: 'star' | 'delta' }> =
  Object.freeze([
    { label: '星形（Y / Star）：I_ph = I_L，V_ph = V_L/√3', value: 'star' },
    { label: '三角形（Δ / Delta）：V_ph = V_L，I_ph = I_L/√3', value: 'delta' },
  ]);

/** 常见功率因数预设 */
export const PF_PRESETS: ReadonlyArray<{ label: string; value: number }> = Object.freeze([
  { label: '1.00（纯阻性）', value: 1 },
  { label: '0.95', value: 0.95 },
  { label: '0.90', value: 0.9 },
  { label: '0.85', value: 0.85 },
  { label: '0.80（电机常见）', value: 0.8 },
  { label: '0.70', value: 0.7 },
]);

/** 场景预设 */
export const SCENARIO_PRESETS: ReadonlyArray<{
  label: string;
  lineVoltage: number;
  lineCurrent: number;
  powerFactor: number;
  connection: 'star' | 'delta';
}> = Object.freeze([
  { label: '低压配电 400V / 10A / cosφ=0.8', lineVoltage: 400, lineCurrent: 10, powerFactor: 0.8, connection: 'star' },
  { label: '电机柜 380V / 25A / cosφ=0.85 / Δ', lineVoltage: 380, lineCurrent: 25, powerFactor: 0.85, connection: 'delta' },
  { label: '高压侧 10kV / 5A / cosφ=0.95', lineVoltage: 10000, lineCurrent: 5, powerFactor: 0.95, connection: 'star' },
]);
