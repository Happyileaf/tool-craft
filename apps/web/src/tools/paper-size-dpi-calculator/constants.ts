/** 物理尺寸单位 */
export type PhysicalUnit = 'mm' | 'cm' | 'in';

/** 纸张方向：portrait 纵向（高 ≥ 宽），landscape 横向（交换宽高） */
export type Orientation = 'portrait' | 'landscape';

/** 换算方向 */
export type ConvertMode = 'paper-to-pixel' | 'pixel-to-paper';

/** 标准纸张定义，宽高统一以毫米记录（纵向：宽 ≤ 高） */
export interface PaperPreset {
  /** 唯一标识，如 A4、B3、C6、letter */
  id: string;
  /** 展示名称 */
  label: string;
  /** 分组 */
  group: 'ISO A' | 'ISO B' | 'ISO C' | 'North America';
  /** 宽度（mm，纵向） */
  widthMm: number;
  /** 高度（mm，纵向） */
  heightMm: number;
}

export const MM_PER_INCH = 25.4;
export const MIN_DPI = 1;
export const MAX_DPI = 2400;
export const MIN_SIDE_MM = 1;
export const MAX_SIDE_MM = 2000;
export const MIN_PIXEL_SIDE = 1;
export const MAX_PIXEL_SIDE = 100000;
export const MAX_TOTAL_PIXELS = 1e10;
/** 反向匹配时标注「近似匹配」的相对误差上限 */
export const MATCH_TOLERANCE = 0.02;

export const DPI_PRESETS = [72, 96, 150, 300, 600, 1200];

export const UNIT_OPTIONS: Array<{ value: PhysicalUnit; label: string; mmPerUnit: number }> = [
  { value: 'mm', label: '毫米 (mm)', mmPerUnit: 1 },
  { value: 'cm', label: '厘米 (cm)', mmPerUnit: 10 },
  { value: 'in', label: '英寸 (in)', mmPerUnit: 25.4 },
];

/** ISO 216 / ISO 269 标准边长（mm，纵向宽 × 高），取各标准公布的圆整毫米值 */
const ISO_A_DIMENSIONS: Array<[number, number]> = [
  [841, 1189], [594, 841], [420, 594], [297, 420], [210, 297],
  [148, 210], [105, 148], [74, 105], [52, 74], [37, 52], [26, 37],
];
const ISO_B_DIMENSIONS: Array<[number, number]> = [
  [1000, 1414], [707, 1000], [500, 707], [353, 500], [250, 353],
  [176, 250], [125, 176], [88, 125], [62, 88], [44, 62], [31, 44],
];
const ISO_C_DIMENSIONS: Array<[number, number]> = [
  [917, 1297], [648, 917], [458, 648], [324, 458], [229, 324],
  [162, 229], [114, 162], [81, 114], [57, 81], [40, 57], [28, 40],
];

function buildIsoSeries(prefix: string, group: PaperPreset['group'], dimensions: Array<[number, number]>): PaperPreset[] {
  return dimensions.map(([widthMm, heightMm], level) => ({
    id: `${prefix}${level}`,
    label: `${prefix}${level}`,
    group,
    widthMm,
    heightMm,
  }));
}

const ISO_A = buildIsoSeries('A', 'ISO A', ISO_A_DIMENSIONS);
const ISO_B = buildIsoSeries('B', 'ISO B', ISO_B_DIMENSIONS);
const ISO_C = buildIsoSeries('C', 'ISO C', ISO_C_DIMENSIONS);

const NORTH_AMERICA: PaperPreset[] = [
  { id: 'letter', label: 'Letter', group: 'North America', widthMm: 215.9, heightMm: 279.4 },
  { id: 'legal', label: 'Legal', group: 'North America', widthMm: 215.9, heightMm: 355.6 },
  { id: 'tabloid', label: 'Tabloid', group: 'North America', widthMm: 279.4, heightMm: 431.8 },
  { id: 'executive', label: 'Executive', group: 'North America', widthMm: 184.15, heightMm: 266.7 },
];

export const PAPER_PRESETS: PaperPreset[] = [...ISO_A, ...ISO_B, ...ISO_C, ...NORTH_AMERICA];

/** 速查表覆盖的纸张与 DPI */
export const QUICK_REFERENCE_PAPERS = ['A3', 'A4', 'A5', 'A6', 'letter', 'legal'];
export const QUICK_REFERENCE_DPIS = [72, 150, 300];

export const DEFAULT_DPI = 300;
export const DEFAULT_PRESET_ID = 'A4';
export const DEFAULT_PIXEL_WIDTH = 2480;
export const DEFAULT_PIXEL_HEIGHT = 3508;
