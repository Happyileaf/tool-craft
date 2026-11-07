/**
 * 中国内地个人所得税（工资薪金 / 全年一次性奖金）纯函数
 *
 * 规则口径：
 * - 综合所得年度税率表（七级超额累进），同时用于工资薪金累计预扣预缴
 * - 全年一次性奖金单独计税：奖金 ÷ 12 查月度税率表，奖金 × 税率 − 速算扣除数
 * - 基本减除费用 60000 元/年（5000 元/月）
 * - 全部金额单位为人民币元，结果保留两位小数
 */

/** 税率级距：upper 为 null 表示无上界（最高一档） */
export interface TaxBracket {
  upper: number | null;
  rate: number;
  quickDeduction: number;
}

/** 综合所得年度税率表（应纳税所得额，元/年） */
export const ANNUAL_TAX_BRACKETS: TaxBracket[] = [
  { upper: 36000, rate: 0.03, quickDeduction: 0 },
  { upper: 144000, rate: 0.1, quickDeduction: 2520 },
  { upper: 300000, rate: 0.2, quickDeduction: 16920 },
  { upper: 420000, rate: 0.25, quickDeduction: 31920 },
  { upper: 660000, rate: 0.3, quickDeduction: 52920 },
  { upper: 960000, rate: 0.35, quickDeduction: 85920 },
  { upper: null, rate: 0.45, quickDeduction: 181920 },
];

/** 月度税率表（全年一次性奖金 ÷ 12 后查表，元/月） */
export const MONTHLY_TAX_BRACKETS: TaxBracket[] = [
  { upper: 3000, rate: 0.03, quickDeduction: 0 },
  { upper: 12000, rate: 0.1, quickDeduction: 210 },
  { upper: 25000, rate: 0.2, quickDeduction: 1410 },
  { upper: 35000, rate: 0.25, quickDeduction: 2660 },
  { upper: 55000, rate: 0.3, quickDeduction: 4410 },
  { upper: 80000, rate: 0.35, quickDeduction: 7160 },
  { upper: null, rate: 0.45, quickDeduction: 15160 },
];

/** 年度基本减除费用 */
export const BASIC_DEDUCTION_ANNUAL = 60000;

/** 月度基本减除费用（累计预扣预缴） */
export const BASIC_DEDUCTION_MONTHLY = 5000;

/** 四舍五入保留两位小数，规避浮点尾差 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** 按金额查找适用级距；正好等于级距端点时落在较低档（不错档） */
export function findBracket(brackets: TaxBracket[], amount: number): TaxBracket {
  const matched = brackets.find(
    (bracket) => bracket.upper === null || amount <= bracket.upper,
  );
  return matched ?? brackets[brackets.length - 1]!;
}

/** 按税率表计算应纳税额；应纳税所得额 ≤ 0 时税额为 0 */
export function calcTaxByBrackets(brackets: TaxBracket[], taxableIncome: number): number {
  if (taxableIncome <= 0) {
    return 0;
  }
  const bracket = findBracket(brackets, taxableIncome);
  return round2(taxableIncome * bracket.rate - bracket.quickDeduction);
}

export interface AnnualIncomeInput {
  /** 全年税前工资薪金合计 */
  grossAnnual: number;
  /** 全年社保、公积金等专项扣除合计 */
  socialSecurity: number;
  /** 全年专项附加扣除合计（子女教育、房贷利息、赡养老人等） */
  specialDeduction: number;
  /** 其他依法确定的扣除（默认 0） */
  otherDeduction?: number;
}

export interface AnnualTaxResult {
  /** 扣除合计（含基本减除费用） */
  totalDeduction: number;
  /** 应纳税所得额（不低于 0） */
  taxableIncome: number;
  /** 年度应纳税额 */
  tax: number;
  /** 税后到手（工资 − 社保公积金 − 个税） */
  afterTax: number;
  /** 适用级距 */
  bracket: TaxBracket;
}

/** 计算年度综合所得（工资薪金）个税 */
export function calcAnnualComprehensiveTax(
  input: AnnualIncomeInput,
): AnnualTaxResult | { error: string } {
  const otherDeduction = input.otherDeduction ?? 0;
  if (!Number.isFinite(input.grossAnnual) || input.grossAnnual <= 0) {
    return { error: '全年税前收入必须为大于 0 的有效数字' };
  }
  if (
    [input.socialSecurity, input.specialDeduction, otherDeduction].some(
      (v) => !Number.isFinite(v) || v < 0,
    )
  ) {
    return { error: '各项金额必须为非负有效数字' };
  }
  const totalDeduction =
    BASIC_DEDUCTION_ANNUAL + input.socialSecurity + input.specialDeduction + otherDeduction;
  const taxableIncome = Math.max(0, round2(input.grossAnnual - totalDeduction));
  const tax = calcTaxByBrackets(ANNUAL_TAX_BRACKETS, taxableIncome);
  const afterTax = round2(input.grossAnnual - input.socialSecurity - tax);
  return {
    totalDeduction: round2(totalDeduction),
    taxableIncome,
    tax,
    afterTax,
    bracket: findBracket(ANNUAL_TAX_BRACKETS, taxableIncome),
  };
}

export interface BonusSeparateResult {
  /** 奖金 ÷ 12 的月度金额 */
  monthlyAmount: number;
  /** 适用税率 */
  rate: number;
  /** 速算扣除数 */
  quickDeduction: number;
  /** 单独计税应纳税额 */
  tax: number;
  /** 税后奖金 */
  afterTax: number;
}

/** 全年一次性奖金单独计税 */
export function calcBonusSeparate(bonus: number): BonusSeparateResult | { error: string } {
  if (!Number.isFinite(bonus) || bonus < 0) {
    return { error: '奖金金额必须为非负有效数字' };
  }
  const monthlyAmount = round2(bonus / 12);
  const bracket = findBracket(MONTHLY_TAX_BRACKETS, monthlyAmount);
  const tax = round2(bonus * bracket.rate - bracket.quickDeduction);
  return {
    monthlyAmount,
    rate: bracket.rate,
    quickDeduction: bracket.quickDeduction,
    tax: Math.max(0, tax),
    afterTax: round2(bonus - Math.max(0, tax)),
  };
}

export interface BonusOptionDetail {
  /** 该方案下奖金承担的个税 */
  bonusTax: number;
  /** 工资 + 奖金整体年度个税 */
  totalTax: number;
  /** 整体税后到手（已扣社保公积金） */
  totalAfterTax: number;
}

export interface BonusComparison {
  separate: BonusOptionDetail;
  combined: BonusOptionDetail;
  /** 推荐方案：税额更低者，相等时默认 separate */
  recommended: 'separate' | 'combined';
  /** 两方案税额差额（推荐方案少缴的金额） */
  saving: number;
}

/** 对比全年一次性奖金「单独计税」与「并入综合所得」两种方案 */
export function compareBonusOptions(
  annual: AnnualIncomeInput,
  bonus: number,
): BonusComparison | { error: string } {
  if (!Number.isFinite(bonus) || bonus < 0) {
    return { error: '奖金金额必须为非负有效数字' };
  }
  const wage = calcAnnualComprehensiveTax(annual);
  if ('error' in wage) {
    return { error: wage.error };
  }

  const separateBonus = calcBonusSeparate(bonus);
  if ('error' in separateBonus) {
    return { error: separateBonus.error };
  }
  const separateTotalTax = round2(wage.tax + separateBonus.tax);
  const separate: BonusOptionDetail = {
    bonusTax: separateBonus.tax,
    totalTax: separateTotalTax,
    totalAfterTax: round2(annual.grossAnnual + bonus - annual.socialSecurity - separateTotalTax),
  };

  const mergedInput: AnnualIncomeInput = { ...annual, grossAnnual: annual.grossAnnual + bonus };
  const merged = calcAnnualComprehensiveTax(mergedInput);
  if ('error' in merged) {
    return { error: merged.error };
  }
  const combined: BonusOptionDetail = {
    bonusTax: round2(merged.tax - wage.tax),
    totalTax: merged.tax,
    totalAfterTax: round2(annual.grossAnnual + bonus - annual.socialSecurity - merged.tax),
  };

  const recommended = combined.totalTax < separateTotalTax ? 'combined' : 'separate';
  return {
    separate,
    combined,
    recommended,
    saving: round2(Math.abs(separateTotalTax - merged.tax)),
  };
}

export interface WithholdingRow {
  /** 月份 1-12 */
  month: number;
  /** 累计应纳税所得额 */
  cumulativeTaxable: number;
  /** 累计应预扣预缴税额 */
  cumulativeTax: number;
  /** 本月应预扣预缴税额 */
  taxThisMonth: number;
  /** 本月税后到手 */
  afterTaxThisMonth: number;
}

/**
 * 按月均匀口径生成 12 个月累计预扣预缴明细表
 *
 * @param monthlyGross 月税前工资
 * @param monthlySocial 月社保公积金专项扣除
 * @param monthlySpecial 月专项附加扣除
 */
export function buildWithholdingSchedule(
  monthlyGross: number,
  monthlySocial: number,
  monthlySpecial: number,
): WithholdingRow[] | { error: string } {
  if (
    [monthlyGross, monthlySocial, monthlySpecial].some(
      (v) => !Number.isFinite(v) || v < 0,
    )
  ) {
    return { error: '各项月度金额必须为非负有效数字' };
  }
  const rows: WithholdingRow[] = [];
  let previousCumulativeTax = 0;
  for (let month = 1; month <= 12; month += 1) {
    const cumulativeIncome = monthlyGross * month;
    const cumulativeDeduction =
      (BASIC_DEDUCTION_MONTHLY + monthlySocial + monthlySpecial) * month;
    const cumulativeTaxable = Math.max(0, round2(cumulativeIncome - cumulativeDeduction));
    const cumulativeTax = calcTaxByBrackets(ANNUAL_TAX_BRACKETS, cumulativeTaxable);
    const taxThisMonth = round2(cumulativeTax - previousCumulativeTax);
    rows.push({
      month,
      cumulativeTaxable,
      cumulativeTax,
      taxThisMonth,
      afterTaxThisMonth: round2(monthlyGross - monthlySocial - taxThisMonth),
    });
    previousCumulativeTax = cumulativeTax;
  }
  return rows;
}

/** 百分数格式化，如 0.1 → "10%" */
export function formatRate(rate: number): string {
  return `${round2(rate * 100)}%`;
}

/** 金额格式化：千分位 + 两位小数 */
export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return round2(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
