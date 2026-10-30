import { STANDARD_CSS } from './utils/ansi';

export const DEFAULT_TEXT = 'Hello, ANSI!';

const STANDARD_LABELS: Record<string, string> = {
  black: '黑',
  red: '红',
  green: '绿',
  yellow: '黄',
  blue: '蓝',
  magenta: '品红',
  cyan: '青',
  white: '白',
  brightBlack: '亮黑',
  brightRed: '亮红',
  brightGreen: '亮绿',
  brightYellow: '亮黄',
  brightBlue: '亮蓝',
  brightMagenta: '亮品红',
  brightCyan: '亮青',
  brightWhite: '亮白',
};

export interface StandardColorOption {
  value: string;
  label: string;
  css: string;
}

/** 标准 16 色下拉选项（顺序与 SGR 编号一致） */
export const STANDARD_OPTIONS: StandardColorOption[] = Object.keys(STANDARD_CSS).map((name) => ({
  value: name,
  label: `${STANDARD_LABELS[name] ?? name}（${name}）`,
  css: STANDARD_CSS[name]!,
}));

export const SPACE_OPTIONS = [
  { label: '不设置', value: 'none' },
  { label: '标准 16 色', value: 'standard' },
  { label: '256 色', value: 'palette256' },
  { label: 'RGB 真彩', value: 'rgb' },
];

export interface StyleOption {
  label: string;
  value: string;
}

export const STYLE_OPTIONS: StyleOption[] = [
  { label: '加粗', value: 'bold' },
  { label: '暗淡', value: 'dim' },
  { label: '斜体', value: 'italic' },
  { label: '下划线', value: 'underline' },
  { label: '闪烁', value: 'blink' },
  { label: '反色', value: 'reverse' },
  { label: '隐藏', value: 'hidden' },
  { label: '删除线', value: 'strikethrough' },
];
