export const MODE_OPTIONS: { value: 'validate' | 'generate'; label: string; hint: string }[] = [
  {
    value: 'validate',
    label: '批量校验',
    hint: '每行一个 12 位 ISIN，输出合法编码并逐行报告非法原因',
  },
  {
    value: 'generate',
    label: '补全校验位',
    hint: '输入 11 位主体或完整 ISIN，按 Luhn mod 10 计算/纠正末位校验位',
  },
];

/** 默认样例输入（含 Apple、BP、Intel、Bayer 与一条错误码） */
export const DEFAULT_INPUT = `US0378331005
GB0002634946
US4581401001
DE000BAY0017
FR0000131906
XS9135527440`;

/** 详情面板的默认 ISIN */
export const DEFAULT_DETAIL_ISIN = 'US0378331005';
