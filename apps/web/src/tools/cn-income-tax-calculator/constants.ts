export const BASIC_MONTHLY = 5000;
export const BASIC_ANNUAL = 60_000;

export const SPECIAL_DEDUCTION_OPTIONS: Array<{ label: string; value: number }> = [
  { label: "子女教育（每个子女 2000/月）", value: 2000 },
  { label: "继续教育（学历 400/月）", value: 400 },
  { label: "住房贷款利息（1000/月）", value: 1000 },
  { label: "住房租金（直辖市/省会 1500/月）", value: 1500 },
  { label: "赡养老人（独生 3000/月）", value: 3000 },
  { label: "3 岁以下婴幼儿照护（每个 2000/月）", value: 2000 },
];

export const ANNUAL_BRACKET_RANGES = [
  "不超过 36,000 元",
  "36,000 ~ 144,000 元",
  "144,000 ~ 300,000 元",
  "300,000 ~ 420,000 元",
  "420,000 ~ 660,000 元",
  "660,000 ~ 960,000 元",
  "超过 960,000 元",
];

export const CURRENCY_FMT = new Intl.NumberFormat("zh-CN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function yuan(n: number): string {
  return CURRENCY_FMT.format(n);
}
