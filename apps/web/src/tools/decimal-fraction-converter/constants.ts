export const MODE_OPTIONS = [
  { label: '小数 → 分数', value: 'decimalToFraction' },
  { label: '分数 → 小数', value: 'fractionToDecimal' },
  { label: '百分数 → 分数', value: 'percentToFraction' },
  { label: '分数 → 百分数', value: 'fractionToPercent' },
  { label: '带分数 ↔ 假分数', value: 'mixedFraction' },
] as const;

export type ConvertMode = (typeof MODE_OPTIONS)[number]['value'];

export const DEFAULT_INPUTS: Record<ConvertMode, string> = {
  decimalToFraction: '0.1(6)',
  fractionToDecimal: '17/23',
  percentToFraction: '33.(3)%',
  fractionToPercent: '1/3',
  mixedFraction: '5/2',
};

export const MODE_PLACEHOLDERS: Record<ConvertMode, string> = {
  decimalToFraction: '输入小数，循环节用圆括号，如 0.25、-1.25、0.(3)、0.1(6)',
  fractionToDecimal: '输入分数，如 3/4、-5/2，也支持带分数 1 1/2',
  percentToFraction: '输入百分数，如 25%、12.5%、33.(3)%',
  fractionToPercent: '输入分数，如 1/4、1/3、5/2',
  mixedFraction: '输入假分数（如 5/2）或带分数（如 2 1/2）',
};
