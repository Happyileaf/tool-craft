import type { BandCount, ColorName } from './utils/resistor';

export const DEFAULT_BANDS: Record<BandCount, ColorName[]> = {
  4: ['brown', 'black', 'red', 'gold'],
  5: ['brown', 'black', 'black', 'brown', 'brown'],
  6: ['brown', 'black', 'black', 'red', 'brown', 'red'],
};

export const DEFAULT_OHMS = '1000';
export const DEFAULT_TOLERANCE = 1;

export const BAND_SELECTOR_LABELS = ['第 1 环', '第 2 环', '第 3 环', '倍率环', '误差环', '温度系数环'];

export const HINT =
  '正向：依次选择各色环，实时读取标称阻值、误差与阻值区间；反向：输入阻值（如 4700）与公差，自动匹配色环。全部计算在浏览器本地完成。';
