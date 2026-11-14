/** 摄影景深与超焦距计算的常量与预设 */

/** 结果长度单位 */
export type LengthUnit = 'm' | 'cm' | 'ft';

export interface LengthUnitOption {
  label: string;
  value: LengthUnit;
}

export const LENGTH_UNIT_OPTIONS: LengthUnitOption[] = [
  { label: '米 (m)', value: 'm' },
  { label: '厘米 (cm)', value: 'cm' },
  { label: '英尺 (ft)', value: 'ft' },
];

/** 常见画幅的弥散圆直径预设，单位 mm */
export interface CocPreset {
  label: string;
  value: number;
}

export const COC_PRESETS: CocPreset[] = [
  { label: '全画幅（0.030 mm）', value: 0.03 },
  { label: 'APS-C（0.020 mm）', value: 0.02 },
  { label: 'M4/3（0.015 mm）', value: 0.015 },
  { label: '1 英寸（0.011 mm）', value: 0.011 },
];

export const DEFAULT_DOF_INPUT = {
  focalLength: 50,
  aperture: 8,
  subjectDistance: 3,
  distanceUnit: 'm' as LengthUnit,
  coc: 0.03,
  resultUnit: 'm' as LengthUnit,
};

export const DEFAULT_TARGET_DEPTH = 2;

export const UNIT_TO_MM: Record<LengthUnit, number> = {
  m: 1000,
  cm: 10,
  ft: 304.8,
};

export const APERTURE_MIN = 0.5;
export const APERTURE_MAX = 64;
