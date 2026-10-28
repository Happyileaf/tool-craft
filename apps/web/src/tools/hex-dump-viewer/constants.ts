import type { HexCase, HexSeparator, HexOutputMode } from './utils/hex';

export type HexDirection = 'encode' | 'decode';

export interface DirectionOption {
  value: HexDirection;
  label: string;
}

export interface CaseOption {
  value: HexCase;
  label: string;
}

export interface SeparatorOption {
  value: HexSeparator;
  label: string;
}

export interface ModeOption {
  value: HexOutputMode;
  label: string;
  hint: string;
}

export const DIRECTION_OPTIONS: DirectionOption[] = [
  { value: 'encode', label: '文本 → Hex' },
  { value: 'decode', label: 'Hex → 文本' },
];

export const CASE_OPTIONS: CaseOption[] = [
  { value: 'lower', label: '小写 a-f' },
  { value: 'upper', label: '大写 A-F' },
];

export const SEPARATOR_OPTIONS: SeparatorOption[] = [
  { value: 'none', label: '无分隔' },
  { value: 'space', label: '空格' },
  { value: 'colon', label: '冒号' },
  { value: '0x', label: '0x 前缀' },
];

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'plain', label: 'Hex 串', hint: '连续或带分隔符的十六进制字节串' },
  { value: 'dump', label: 'Hex dump', hint: '偏移量 + 字节区 + ASCII 预览，每行 16 字节' },
];

export const DEFAULT_INPUT = `Hello, 世界!
UTF-8 text → hex bytes`;
