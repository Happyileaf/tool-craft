export enum PlusCodeModeEnum {
  ENCODE = 'encode',
  DECODE = 'decode',
  SHORTEN = 'shorten',
}

/** 允许的码长：2/4/6/8/10（粗格网偶数位）与 11–15（细分格网） */
export const CODE_LENGTH_OPTIONS = [
  { label: '2 位（约 20°，区域级）', value: 2 },
  { label: '4 位（约 1°）', value: 4 },
  { label: '6 位（约 0.05°，街区级）', value: 6 },
  { label: '8 位（约 0.0025°）', value: 8 },
  { label: '10 位（标准精度，约 14m）', value: 10 },
  { label: '11 位（约 3.5m）', value: 11 },
  { label: '12 位（亚米级）', value: 12 },
  { label: '13 位', value: 13 },
  { label: '14 位', value: 14 },
  { label: '15 位（最细精度）', value: 15 },
];

export const DEFAULT_CODE_LENGTH = 10;

export const MODE_TABS = [
  { key: PlusCodeModeEnum.ENCODE, label: '编码：经纬度 → Plus Code' },
  { key: PlusCodeModeEnum.DECODE, label: '解码：Plus Code → 坐标区域' },
  { key: PlusCodeModeEnum.SHORTEN, label: '短码：缩短 / 恢复' },
];

/** 苏黎世火车站附近（Google 官方文档示例点） */
export const SAMPLE_LAT = 47.36559;
export const SAMPLE_LNG = 8.52499;
export const SAMPLE_FULL_CODE = '8FVC9G8F+6X';
export const SAMPLE_SHORT_CODE = '8F+6X';

/** 短码示例对应的参考点（与完整码同一区域） */
export const SAMPLE_REF_LAT = 47.37;
export const SAMPLE_REF_LNG = 8.53;
