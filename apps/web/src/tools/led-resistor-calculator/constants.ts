import type { LedInput, LedTopology } from './utils/led';

/** 常用颜色 LED 的典型正向压降（V），手填仍可覆盖 */
export const LED_COLOR_PRESETS: { label: string; forwardVoltage: number }[] = [
  { label: '红（2.0V）', forwardVoltage: 2.0 },
  { label: '黄（2.1V）', forwardVoltage: 2.1 },
  { label: '绿（2.2V）', forwardVoltage: 2.2 },
  { label: '蓝（3.2V）', forwardVoltage: 3.2 },
  { label: '白（3.2V）', forwardVoltage: 3.2 },
];

export const TOPOLOGY_OPTIONS: { label: string; value: LedTopology }[] = [
  { label: '单颗', value: 'single' },
  { label: 'N 颗串联', value: 'series' },
  { label: 'N 条并联', value: 'parallel' },
];

export const DEFAULT_INPUT: LedInput = {
  supplyVoltage: 5,
  forwardVoltage: 2.0,
  currentMa: 20,
  topology: 'single',
  seriesCount: 3,
  parallelCount: 2,
};

export const HINT =
  '输入电源电压、LED 正向压降与期望电流，按 R=(Vs−Vf)/If 计算限流电阻，并在 E24 标称系列中向上选型（优先防过流），回算实际电流、偏差与功耗。全部计算在浏览器本地完成。';
