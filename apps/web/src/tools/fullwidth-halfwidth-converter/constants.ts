import type { ConvertDirection, ConvertScope } from './utils/widthConverter';

export const DEFAULT_INPUT = 'Ｈｅｌｌｏ，Ｗｏｒｌｄ！\u3000密码是ＡＢＣ１２３。';

export const DIRECTION_OPTIONS: { label: string; value: ConvertDirection }[] = [
  { label: '全角 → 半角', value: 'toHalfwidth' },
  { label: '半角 → 全角', value: 'toFullwidth' },
];

export const SCOPE_OPTIONS: { label: string; value: ConvertScope }[] = [
  { label: '全部字符', value: 'all' },
  { label: '仅字母数字', value: 'alnum' },
  { label: '仅标点与空格', value: 'punctuation' },
];

export const SCOPE_DESCRIPTIONS: Record<ConvertScope, string> = {
  all: '转换全部 ASCII 可打印字符（U+FF01–FF5E ↔ U+0021–007E）与空格（U+3000 ↔ U+0020）',
  alnum: '仅转换 A-Z / a-z / 0-9，标点与空格保持原样',
  punctuation: '仅转换标点符号与空格，字母数字保持原样',
};
