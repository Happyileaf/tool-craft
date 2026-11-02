export interface ModeOption {
  value: 'kelvin-to-color' | 'color-to-kelvin';
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'kelvin-to-color',
    label: '色温 → 颜色',
    hint: '输入开尔文色温，计算对应的黑体辐射 sRGB 颜色',
  },
  {
    value: 'color-to-kelvin',
    label: '颜色 → 色温',
    hint: '输入 #RRGGBB / rgb() 颜色，按 McCamy 公式估算相关色温（CCT）',
  },
];

export const DEFAULT_KELVIN = 6500;

export const DEFAULT_COLOR = '#FFFFFF';

/** 常见光源色温预设（K） */
export const KELVIN_PRESETS: { label: string; kelvin: number }[] = [
  { label: '烛光 1900K', kelvin: 1900 },
  { label: '钨丝灯 2700K', kelvin: 2700 },
  { label: '日出日落 3500K', kelvin: 3500 },
  { label: '正午日光 5500K', kelvin: 5500 },
  { label: '阴天 6500K', kelvin: 6500 },
  { label: '蓝天 10000K', kelvin: 10000 },
];

/** 色温的中文光色描述（仅用于展示，不参与计算） */
export function describeKelvin(kelvin: number): string {
  if (kelvin < 2000) return '暖橙光（烛光/火光）';
  if (kelvin < 3000) return '暖黄光（钨丝灯）';
  if (kelvin < 4000) return '暖白光（日出日落）';
  if (kelvin < 5000) return '中性偏暖白光';
  if (kelvin < 6500) return '日光白（正午日光）';
  if (kelvin < 8000) return '冷白光（阴天/标准 D65）';
  if (kelvin < 12000) return '冷蓝光（晴朗蓝天）';
  return '深蓝白光（高原/极地天空）';
}
