import type { WrapMode } from './utils/textWrap';

export interface ModeOption {
  value: WrapMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'wrap', label: '硬换行（wrap）', hint: '按列宽把长文本折成多行' },
  { value: 'unwrap', label: '还原（unwrap）', hint: '合并段落内换行，保留段落间空行' },
];

/** 常用列宽预设 */
export const WIDTH_PRESETS = [40, 60, 72, 80, 100, 120];

export const DEFAULT_WIDTH = 80;

export const DEFAULT_INPUT = `Hard wrapping rewrites a paragraph so that every line fits inside a fixed column width, without breaking words apart. It is commonly used for plain-text emails, commit messages and code comments.

这是第二段中文文本，用来验证 CJK 字符按字符折行的行为：天干地支、生肖纪年等无空格文字应当可以在任意字符边界换行，而拉丁单词仍按词边界处理。`;
