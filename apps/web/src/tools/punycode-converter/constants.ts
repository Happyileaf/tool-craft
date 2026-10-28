import type { IdnaDirection } from './utils/punycode';

export interface ModeOption {
  value: 'domain' | 'raw';
  label: string;
  hint: string;
}

export interface DirectionOption {
  value: IdnaDirection;
  label: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'domain', label: '域名 / 邮箱', hint: '按点分标签转换，自动处理 xn-- 前缀' },
  { value: 'raw', label: '裸 Punycode', hint: '整段文本按 RFC 3492 Bootstring 编解码' },
];

export const DIRECTION_OPTIONS: DirectionOption[] = [
  { value: 'toAscii', label: 'Unicode → ASCII' },
  { value: 'toUnicode', label: 'ASCII → Unicode' },
];

export const DEFAULT_INPUT = `münchen.de
中文.中国
例え.jp
info@bücher.example`;
