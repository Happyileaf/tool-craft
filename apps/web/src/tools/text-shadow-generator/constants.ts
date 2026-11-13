import type { TextShadowLayer } from './utils/textShadow';

/** 偏移与模糊的取值范围 */
export const OFFSET_MIN = -50;
export const OFFSET_MAX = 50;
export const BLUR_MIN = 0;
export const BLUR_MAX = 100;

/** 内置多层文字阴影预设（名称 + 一组层） */
export interface TextShadowPreset {
  key: string;
  label: string;
  layers: TextShadowLayer[];
}

export const TEXT_SHADOW_PRESETS: TextShadowPreset[] = [
  {
    key: 'soft',
    label: '柔和投影',
    layers: [
      { offsetX: 0, offsetY: 2, blur: 4, color: '#00000040', enabled: true },
      { offsetX: 0, offsetY: 4, blur: 12, color: '#00000026', enabled: true },
    ],
  },
  {
    key: 'neon',
    label: '霓虹发光',
    layers: [
      { offsetX: 0, offsetY: 0, blur: 6, color: '#22d3ee', enabled: true },
      { offsetX: 0, offsetY: 0, blur: 16, color: '#0ea5e9', enabled: true },
      { offsetX: 0, offsetY: 0, blur: 32, color: '#6366f1', enabled: true },
    ],
  },
  {
    key: 'retro',
    label: '复古立体',
    layers: [
      { offsetX: 1, offsetY: 1, blur: 0, color: '#7c3aed', enabled: true },
      { offsetX: 2, offsetY: 2, blur: 0, color: '#db2777', enabled: true },
      { offsetX: 3, offsetY: 3, blur: 0, color: '#f59e0b', enabled: true },
    ],
  },
  {
    key: 'emboss',
    label: '浮雕凸起',
    layers: [{ offsetX: 1, offsetY: 1, blur: 1, color: '#ffffffb3', enabled: true }],
  },
];

/** 新增一层时的默认值 */
export const createEmptyLayer = (): TextShadowLayer => ({
  offsetX: 2,
  offsetY: 2,
  blur: 4,
  color: '#00000080',
  enabled: true,
});

/** 初始层（柔和投影） */
export const DEFAULT_LAYERS: TextShadowLayer[] = (TEXT_SHADOW_PRESETS[0]?.layers ?? []).map(
  (layer) => ({
    ...layer,
  }),
);

/** 预览示例文案与可选背景色 */
export const PREVIEW_TEXT = 'Agile 文字阴影 Text Shadow 123';
export const PREVIEW_BACKGROUNDS = [
  { key: 'light', label: '浅色', value: '#f8fafc' },
  { key: 'dark', label: '深色', value: '#0f172a' },
  { key: 'indigo', label: '靛蓝', value: '#312e81' },
];

/** 浅色背景的取值（用于判断预览文字颜色） */
export const LIGHT_BG = PREVIEW_BACKGROUNDS[0]?.value ?? '#f8fafc';
