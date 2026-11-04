/**
 * 555 定时器非稳态（多谐振荡器）参数计算（零依赖纯函数）
 *
 * 经典模式（充电经 R1+R2、放电经 R2）：
 *   t1 = ln2 · (R1 + R2) · C（高电平时间）
 *   t2 = ln2 · R2 · C       （低电平时间）
 *   T  = t1 + t2，f = 1/T，D = t1 / T
 *
 * 二极管改进模式（充电经 R1 + 二极管、放电经 R2，忽略二极管压降）：
 *   t1 = ln2 · R1 · C，t2 = ln2 · R2 · C，D = R1 / (R1 + R2)
 *
 * 本模块不触碰 DOM 与 React，非法输入以抛出 Error 的方式返回中文提示。
 */

export type Timer555Mode = 'classic' | 'diode';

export interface UnitOption {
  /** 单位符号 */
  label: string;
  /** 相对基准单位（Ω / F）的倍率 */
  factor: number;
}

/** 电阻允许的输入单位 */
export const RESISTANCE_UNITS: UnitOption[] = [
  { label: 'Ω', factor: 1 },
  { label: 'kΩ', factor: 1e3 },
  { label: 'MΩ', factor: 1e6 },
];

/** 电容允许的输入单位 */
export const CAPACITANCE_UNITS: UnitOption[] = [
  { label: 'pF', factor: 1e-12 },
  { label: 'nF', factor: 1e-9 },
  { label: 'µF', factor: 1e-6 },
  { label: 'mF', factor: 1e-3 },
  { label: 'F', factor: 1 },
];

export interface QuantityInput {
  /** 按所选单位填写的数值 */
  value: number;
  /** 所选单位相对基准单位的倍率 */
  factor: number;
}

export interface Timer555Input {
  mode: Timer555Mode;
  R1: QuantityInput;
  R2: QuantityInput;
  C: QuantityInput;
}

export interface Timer555Solution {
  /** 工作模式 */
  mode: Timer555Mode;
  /** 高电平时间 t1（s） */
  tHigh: number;
  /** 低电平时间 t2（s） */
  tLow: number;
  /** 周期 T（s） */
  period: number;
  /** 频率 f（Hz） */
  frequency: number;
  /** 占空比（0–1） */
  dutyCycle: number;
}

const LN2 = Math.LN2;

/** NE555 双极型 datasheet 典型最高工作频率约 2 MHz */
export const MAX_TYPICAL_FREQUENCY = 2e6;

function requirePositive(input: QuantityInput, name: string): number {
  if (!Number.isFinite(input.value)) {
    throw new Error(`${name} 不是有效数字`);
  }
  const value = input.value * input.factor;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} 必须为正数`);
  }
  return value;
}

/**
 * 计算 555 非稳态电路的时间 / 频率 / 占空比。
 *
 * @throws 任一参数非正数时抛出带中文说明的 Error
 */
export function solveAstable(input: Timer555Input): Timer555Solution {
  const R1 = requirePositive(input.R1, '电阻 R1');
  const R2 = requirePositive(input.R2, '电阻 R2');
  const C = requirePositive(input.C, '电容 C');

  const tHigh = LN2 * (input.mode === 'diode' ? R1 : R1 + R2) * C;
  const tLow = LN2 * R2 * C;
  const period = tHigh + tLow;

  return {
    mode: input.mode,
    tHigh,
    tLow,
    period,
    frequency: 1 / period,
    dutyCycle: tHigh / period,
  };
}

export interface FormattedQuantity {
  value: number;
  unit: string;
}

/** 按数量级自适应单位格式化时间（ns/µs/ms/s） */
export function formatTime(second: number): FormattedQuantity {
  if (second >= 1) return { value: second, unit: 's' };
  if (second >= 1e-3) return { value: second / 1e-3, unit: 'ms' };
  if (second >= 1e-6) return { value: second / 1e-6, unit: 'µs' };
  return { value: second / 1e-9, unit: 'ns' };
}

/** 按数量级自适应单位格式化频率（Hz/kHz/MHz） */
export function formatFrequency(hz: number): FormattedQuantity {
  if (hz >= 1e6) return { value: hz / 1e6, unit: 'MHz' };
  if (hz >= 1e3) return { value: hz / 1e3, unit: 'kHz' };
  return { value: hz, unit: 'Hz' };
}

/** 去掉浮点尾差，最多保留 6 位有效小数 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return String(parseFloat(value.toPrecision(8)));
}

/** 占空比格式化为百分比字符串 */
export function formatPercent(ratio: number): string {
  return `${formatNumber(ratio * 100)}%`;
}
