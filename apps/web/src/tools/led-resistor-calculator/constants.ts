/**
 * LED 限流电阻计算器常量：颜色 Vf 预设、E24 基础数列、拓扑与默认输入
 */
import type { LedTopology } from './utils/led';

/** LED 颜色正向压降预设（典型值，选中后填充但允许手填覆盖） */
export interface LedColorPreset {
  /** 预设键 */
  value: string;
  /** 颜色名称 */
  label: string;
  /** 典型正向压降（V） */
  vf: number;
}

/** 常用颜色的典型正向压降（小功率直插 LED 经验值） */
export const LED_COLOR_PRESETS: LedColorPreset[] = [
  { value: 'red', label: '红', vf: 2.0 },
  { value: 'yellow', label: '黄', vf: 2.1 },
  { value: 'green', label: '绿', vf: 2.2 },
  { value: 'blue', label: '蓝', vf: 3.2 },
  { value: 'white', label: '白', vf: 3.2 },
];

/**
 * E24 标称阻值基础数列（24 个 1.0–9.1 系数量），
 * 全系列按 ×1、×10、…、×10^6 展开
 */
export const E24_BASE: readonly number[] = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
  3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
];

/** E24 全系列展开的最小与最大十倍幂（1Ω ～ 9.1MΩ） */
export const E24_DECADE_MIN = 0;
export const E24_DECADE_MAX = 6;

/** 拓扑选项 */
export interface TopologyOption {
  value: LedTopology;
  label: string;
  hint: string;
}

/** 单路 / 串联 / 并联（每路独立电阻）三种拓扑 */
export const TOPOLOGY_OPTIONS: TopologyOption[] = [
  { value: 'single', label: '单路', hint: '一颗 LED 串联一颗限流电阻' },
  { value: 'series', label: 'N 颗串联', hint: '总压降 = N×Vf，回路电流仍为 If' },
  { value: 'parallel', label: 'N 颗并联', hint: '每路独立限流电阻，每路电流 If，总电流 N×If' },
];

/** 表单默认输入（5V 驱动红色 LED、20mA 的经典场景） */
export const DEFAULT_INPUT = {
  supplyVoltage: 5,
  forwardVoltage: 2.0,
  targetCurrentMa: 20,
  topology: 'single' as LedTopology,
  count: 1,
};
