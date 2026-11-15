/**
 * 标准光圈序列（f 值），支持 1/3 档与 1/2 档两套常用标注
 */
export const APERTURE_STOPS_THIRD = [
  1, 1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9,
  10, 11, 13, 14, 16, 18, 20, 22, 25, 29, 32, 36, 40, 45, 51, 57, 64,
];

export const APERTURE_STOPS_HALF = [
  1, 1.2, 1.4, 1.7, 2, 2.4, 2.8, 3.3, 4, 4.8, 5.6, 6.7, 8, 9.5, 11, 13, 16, 19, 22, 27, 32,
  38, 45, 54, 64,
];

/**
 * 常用快门速度序列（秒），用于下拉建议与快速输入
 */
export const SHUTTER_PRESETS = [
  1 / 8000, 1 / 4000, 1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15,
  1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8, 15, 30,
];

/**
 * ND 滤镜预设：名称、减光档数与对应光学密度
 */
export const ND_PRESETS: { label: string; stops: number; density: number }[] = [
  { label: 'ND2', stops: 1, density: 0.3 },
  { label: 'ND4', stops: 2, density: 0.6 },
  { label: 'ND8', stops: 3, density: 0.9 },
  { label: 'ND16', stops: 4, density: 1.2 },
  { label: 'ND32', stops: 5, density: 1.5 },
  { label: 'ND64', stops: 6, density: 1.8 },
  { label: 'ND128', stops: 7, density: 2.1 },
  { label: 'ND256', stops: 8, density: 2.4 },
  { label: 'ND512', stops: 9, density: 2.7 },
  { label: 'ND1024', stops: 10, density: 3.0 },
  { label: 'ND100000', stops: 16.6, density: 5.0 },
];

/**
 * ISO 常用取值，用于快捷选择
 */
export const ISO_PRESETS = [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800];

export const DEFAULT_APERTURE = 8;
export const DEFAULT_SHUTTER = '1/125';
export const DEFAULT_ISO = 100;
