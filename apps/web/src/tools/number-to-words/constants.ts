import type { NumberWordsMode } from './utils/numberWords';

export const DEFAULT_INPUT = '12345';

export const MODE_OPTIONS: { label: string; value: NumberWordsMode }[] = [
  { label: '基数词（cardinal）', value: 'cardinal' },
  { label: '序数词（ordinal）', value: 'ordinal' },
  { label: '美元金额（check）', value: 'money' },
];

export const MODE_PLACEHOLDERS: Record<NumberWordsMode, string> = {
  cardinal: '输入整数或小数，如 12345、3.14、-42（可含千分位逗号）',
  ordinal: '输入整数，如 1、21、100',
  money: '输入金额数字，如 123.45（小数至多 2 位美分）',
};

export const MODE_HINTS: Record<NumberWordsMode, string> = {
  cardinal: '小数部分按 point 逐位读出，如 3.14 → three point one four。',
  ordinal: '序数词仅支持整数；复合序数词仅末位变形，如 21 → twenty-first。',
  money: '支票读法输出 dollars / cents，整数部分 1 时用单数 dollar，如 1.01 → one dollar and one cent。',
};
