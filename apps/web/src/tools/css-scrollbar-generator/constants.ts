import type { ScrollbarConfig } from './utils/scrollbar';

/** 宽度滑块范围与步长 */
export const WIDTH_MIN = 4;
export const WIDTH_MAX = 24;
export const WIDTH_STEP = 1;

/** 圆角范围 */
export const RADIUS_MIN = 0;
export const RADIUS_MAX = 20;

/** 内置配色预设 */
export interface ScrollbarPreset {
  key: string;
  label: string;
  trackColor: string;
  thumbColor: string;
  thumbHoverColor: string;
}

export const SCROLLBAR_PRESETS: ScrollbarPreset[] = [
  { key: 'slate', label: '石板灰', trackColor: '#f1f5f9', thumbColor: '#94a3b8', thumbHoverColor: '#64748b' },
  { key: 'indigo', label: '靛蓝', trackColor: '#eef2ff', thumbColor: '#818cf8', thumbHoverColor: '#6366f1' },
  { key: 'emerald', label: '翡翠绿', trackColor: '#ecfdf5', thumbColor: '#34d399', thumbHoverColor: '#10b981' },
  { key: 'dark', label: '深色', trackColor: '#1e293b', thumbColor: '#475569', thumbHoverColor: '#64748b' },
  { key: 'rose', label: '玫瑰红', trackColor: '#fff1f2', thumbColor: '#fb7185', thumbHoverColor: '#f43f5e' },
];

/** 默认配置 */
export const DEFAULT_SCROLLBAR: ScrollbarConfig = {
  width: 12,
  trackColor: '#f1f5f9',
  thumbColor: '#94a3b8',
  thumbHoverColor: '#64748b',
  thumbRadius: 8,
  trackRadius: 0,
  showButtons: false,
};
