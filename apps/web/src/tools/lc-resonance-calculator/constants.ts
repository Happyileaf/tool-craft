/**
 * LC 谐振频率与电抗计算器的静态配置与预设。
 */

/** 计算模式 */
export const LC_MODES = [
  { value: 'f0', label: 'L + C → 谐振频率 f₀' },
  { value: 'solveL', label: 'f₀ + C → 反求电感 L' },
  { value: 'solveC', label: 'f₀ + L → 反求电容 C' },
] as const;

export type LcMode = (typeof LC_MODES)[number]['value'];

/** 快速填入的典型 L/C 预设 */
export const LC_PRESETS: {
  label: string;
  l: number;
  lUnit: string;
  c: number;
  cUnit: string;
}[] = [
  { label: '100 µH + 100 pF（射频 ~1.59 MHz）', l: 100, lUnit: 'µH', c: 100, cUnit: 'pF' },
  { label: '10 µH + 100 nF（开关电源 ~159 kHz）', l: 10, lUnit: 'µH', c: 100, cUnit: 'nF' },
  { label: '1 mH + 10 nF（~50.3 kHz）', l: 1, lUnit: 'mH', c: 10, cUnit: 'nF' },
  { label: '1 µH + 1 nF（~5.03 MHz）', l: 1, lUnit: 'µH', c: 1, cUnit: 'nF' },
];
