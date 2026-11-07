/**
 * 个人所得税计算器的模块、字段与默认输入
 */

export enum TaxModuleEnum {
  ANNUAL = 'annual',
  BONUS = 'bonus',
  WITHHOLDING = 'withholding',
}

export const MODULE_OPTIONS: { label: string; value: TaxModuleEnum }[] = [
  { label: '年度综合所得', value: TaxModuleEnum.ANNUAL },
  { label: '年终奖方案对比', value: TaxModuleEnum.BONUS },
  { label: '月度累计预扣明细', value: TaxModuleEnum.WITHHOLDING },
];

/** 年度模块默认输入（元） */
export const DEFAULT_ANNUAL = {
  grossAnnual: '300000',
  socialSecurity: '36000',
  specialDeduction: '24000',
  otherDeduction: '0',
  bonus: '36000',
};

/** 月度模块默认输入（元/月） */
export const DEFAULT_MONTHLY = {
  monthlyGross: '30000',
  monthlySocial: '4500',
  monthlySpecial: '2000',
};

export const ANNUAL_FIELD_META: { key: keyof typeof DEFAULT_ANNUAL; label: string; hint: string }[] =
  [
    { key: 'grossAnnual', label: '全年税前工资薪金', hint: '税前应发合计，元' },
    { key: 'socialSecurity', label: '社保 + 公积金（年）', hint: '专项扣除，个人缴纳部分' },
    { key: 'specialDeduction', label: '专项附加扣除（年）', hint: '子女教育、房贷利息、赡养老人等' },
    { key: 'otherDeduction', label: '其他扣除（年）', hint: '企业年金、商业健康险等，无则填 0' },
    { key: 'bonus', label: '全年一次性奖金', hint: '仅在「年终奖方案对比」模块参与计算' },
  ];

export const MONTHLY_FIELD_META: {
  key: keyof typeof DEFAULT_MONTHLY;
  label: string;
  hint: string;
}[] = [
  { key: 'monthlyGross', label: '月税前工资', hint: '每月应发，元' },
  { key: 'monthlySocial', label: '月社保 + 公积金', hint: '个人缴纳部分' },
  { key: 'monthlySpecial', label: '月专项附加扣除', hint: '按月均摊的专项附加' },
];
