import type { ChineseVariant } from './utils/chinese';

export interface VariantOption {
  value: ChineseVariant;
  label: string;
  hint: string;
}

export const VARIANT_OPTIONS: VariantOption[] = [
  {
    value: 'simple',
    label: '小写中文数字',
    hint: '零一二三四…、十百千万亿，小数用「点」',
  },
  {
    value: 'financial',
    label: '财务大写金额',
    hint: '零壹贰叁…、拾佰仟萬億，自动补全「元 / 角 / 分 / 整」',
  },
];

export const DEFAULT_NUMBER_INPUT = '12345.67';

export const DEFAULT_CHINESE_INPUT = '壹萬贰仟叁佰肆拾伍元陆角柒分';

/** 快捷填入的示例（数字 → 中文方向） */
export const NUMBER_SAMPLES: string[] = [
  '12345',
  '100010000',
  '12345.67',
  '-3.14',
];

/** 快捷填入的示例（中文 → 数字方向） */
export const CHINESE_SAMPLES: string[] = [
  '一万二千三百四十五',
  '一亿零一万',
  '两千三',
  '壹佰贰拾叁元肆角伍分',
];
