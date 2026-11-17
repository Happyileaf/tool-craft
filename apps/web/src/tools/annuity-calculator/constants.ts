/**
 * 年金计算器常量：类型选项、期粒度与利率参考
 */
import type { AnnuityType } from './utils/annuity';

/** 年金类型选项 */
export const ANNUITY_TYPE_OPTIONS: Array<{
  value: AnnuityType;
  label: string;
  hint: string;
}> = [
  {
    value: 'ordinary',
    label: '普通年金（期末收付）',
    hint: '每期末收付一次，最常见的租金、贷款还款形态',
  },
  {
    value: 'due',
    label: '预付年金（期初收付）',
    hint: '每期初收付，整体前移一期，结果 = 普通年金 × (1+i)',
  },
  {
    value: 'deferred',
    label: '递延年金（m 期后开始）',
    hint: '前 m 期不收付，之后连续 n 期普通收付，现值再折现 m 期',
  },
  {
    value: 'perpetuity',
    label: '永续年金（无限期）',
    hint: '永久等额收付，PV=A/i；终值无定义，支持预付永续 PV=A/i+A',
  },
];

/** 计算模式 */
export type CalcMode = 'forward' | 'reverse-pv' | 'reverse-fv';

/** 计算模式选项 */
export const CALC_MODE_OPTIONS: Array<{ value: CalcMode; label: string; hint: string }> = [
  {
    value: 'forward',
    label: '正算：已知 A 求 PV / FV',
    hint: '输入每期收付额 A，输出现值 PV 与终值 FV（永续无 FV）',
  },
  {
    value: 'reverse-pv',
    label: '反算：按目标现值 PV 求 A',
    hint: '给定目标现值，反推每期应收付的金额 A',
  },
  {
    value: 'reverse-fv',
    label: '反算：按目标终值 FV 求 A',
    hint: '给定目标终值，反推每期应收付的金额 A（永续不支持）',
  },
];

/** 期粒度（仅做利率与期数的本地换算，不涉及名义/实际利率复杂换算） */
export type PeriodGranularity = 'year' | 'month';

export const GRANULARITY_OPTIONS: Array<{
  value: PeriodGranularity;
  label: string;
  rateLabel: string;
  periodLabel: string;
}> = [
  { value: 'year', label: '按年', rateLabel: '年利率（%）', periodLabel: '期数 n（年）' },
  { value: 'month', label: '按月', rateLabel: '月利率（%）', periodLabel: '期数 n（月）' },
];

/** 常见年利率参考（仅提示） */
export const RATE_REFERENCE: Array<{ scene: string; range: string }> = [
  { scene: '银行活期存款', range: '约 0.2% – 0.3% / 年' },
  { scene: '定期存款 / 国债', range: '约 1.5% – 3.0% / 年' },
  { scene: '稳健理财 / 货币基金', range: '约 2.0% – 3.5% / 年' },
  { scene: '消费贷 / 信用贷', range: '约 3.5% – 8% / 年（以合同为准）' },
];
