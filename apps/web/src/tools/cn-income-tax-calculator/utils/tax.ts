/**
 * 中国个人所得税（综合所得）计算核心（零依赖纯函数）
 *
 * 覆盖：
 * 1. 居民个人工资薪金的累计预扣预缴（按月）；
 * 2. 综合所得年度汇算清缴（工资薪金 + 劳务报酬 + 稿酬 + 特许权使用费）。
 * 税率表与速算扣除数依据现行 7 级超额累进规则，参数集中在 constants 便于后续维护。
 */

/** 七级超额累进税率档：应纳税所得额上限（元，年度口径）与税率、速算扣除数 */
export interface TaxBracket {
  /** 应纳税所得额上限，Infinity 表示最高档 */
  upper: number;
  rate: number;
  quickDeduction: number;
}

/**
 * 年度综合所得税率表（居民个人）。
 * 月度预扣预缴复用同一张表，直接对「累计应纳税所得额」套用。
 */
export const ANNUAL_BRACKETS: TaxBracket[] = [
  { upper: 36_000, rate: 0.03, quickDeduction: 0 },
  { upper: 144_000, rate: 0.1, quickDeduction: 2_520 },
  { upper: 300_000, rate: 0.2, quickDeduction: 16_920 },
  { upper: 420_000, rate: 0.25, quickDeduction: 31_920 },
  { upper: 660_000, rate: 0.3, quickDeduction: 52_920 },
  { upper: 960_000, rate: 0.35, quickDeduction: 85_920 },
  { upper: Infinity, rate: 0.45, quickDeduction: 181_920 },
];

/** 按月度税率表（年终奖单独计税等场景使用，单位元/月） */
export const MONTHLY_BRACKETS: TaxBracket[] = [
  { upper: 3_000, rate: 0.03, quickDeduction: 0 },
  { upper: 12_000, rate: 0.1, quickDeduction: 210 },
  { upper: 25_000, rate: 0.2, quickDeduction: 1_410 },
  { upper: 35_000, rate: 0.25, quickDeduction: 2_660 },
  { upper: 55_000, rate: 0.3, quickDeduction: 4_410 },
  { upper: 80_000, rate: 0.35, quickDeduction: 7_160 },
  { upper: Infinity, rate: 0.45, quickDeduction: 15_160 },
];

/** 按超额累进税率表计算税额；taxable <= 0 时税额为 0 */
export function applyBrackets(taxable: number, brackets: TaxBracket[]): number {
  if (taxable <= 0) return 0;
  const bracket = brackets.find((b) => taxable <= b.upper) ?? brackets[brackets.length - 1]!;
  return round2(taxable * bracket.rate - bracket.quickDeduction);
}

/** 定位应纳税所得额命中的档位 */
export function matchBracket(taxable: number, brackets: TaxBracket[]): TaxBracket {
  return brackets.find((b) => taxable <= b.upper) ?? brackets[brackets.length - 1]!;
}

/** 四舍五入到分（两位小数），规避二进制浮点尾差 */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface MonthlySalaryInput {
  /** 当月税前工资（元） */
  gross: number;
  /** 当月三险一金个人缴纳部分（元） */
  socialInsurance: number;
  /** 当月专项附加扣除（元） */
  specialDeduction: number;
  /** 当月其他依法扣除（元，默认 0） */
  otherDeduction?: number;
}

export interface MonthlyWithholding extends MonthlySalaryInput {
  month: number;
  cumulativeIncome: number;
  cumulativeDeduction: number;
  cumulativeTaxable: number;
  cumulativeTax: number;
  /** 本月应预扣预缴税额 */
  currentTax: number;
  /** 税后到手（gross - 社保 - 本月预扣税） */
  netPay: number;
  rate: number;
}

export interface WithholdingResult {
  months: MonthlyWithholding[];
  totalGross: number;
  totalSocial: number;
  totalTax: number;
  totalNet: number;
}

/**
 * 工资薪金累计预扣预缴。
 * @param monthly 1-12 月（或实际在职月数）的输入
 * @param monthlyBasic 每月基本减除费用，默认 5000 元
 */
export function calculateWithholding(
  monthly: MonthlySalaryInput[],
  monthlyBasic = 5000,
): WithholdingResult {
  let cumIncome = 0;
  let cumSocial = 0;
  let cumSpecial = 0;
  let cumOther = 0;
  let cumTax = 0;

  const months: MonthlyWithholding[] = monthly.map((m, idx) => {
    const month = idx + 1;
    cumIncome += m.gross;
    cumSocial += m.socialInsurance;
    cumSpecial += m.specialDeduction;
    cumOther += m.otherDeduction ?? 0;

    const basicTotal = monthlyBasic * month;
    const cumDeduction = basicTotal + cumSocial + cumSpecial + cumOther;
    const cumTaxable = Math.max(0, round2(cumIncome - cumDeduction));
    const expectedCumTax = applyBrackets(cumTaxable, ANNUAL_BRACKETS);
    const currentTax = round2(Math.max(0, expectedCumTax - cumTax));
    cumTax = expectedCumTax;

    const netPay = round2(m.gross - m.socialInsurance - currentTax);
    const bracket = matchBracket(cumTaxable, ANNUAL_BRACKETS);

    return {
      ...m,
      month,
      cumulativeIncome: round2(cumIncome),
      cumulativeDeduction: round2(cumDeduction),
      cumulativeTaxable: cumTaxable,
      cumulativeTax: cumTax,
      currentTax,
      netPay,
      rate: bracket.rate,
    };
  });

  const totalGross = round2(months.reduce((s, x) => s + x.gross, 0));
  const totalSocial = round2(months.reduce((s, x) => s + x.socialInsurance, 0));
  const totalTax = round2(months.reduce((s, x) => s + x.currentTax, 0));
  const totalNet = round2(months.reduce((s, x) => s + x.netPay, 0));

  return { months, totalGross, totalSocial, totalTax, totalNet };
}

export interface AnnualIncomeInput {
  /** 年度工资薪金合计 */
  salary: number;
  /** 年度劳务报酬合计（税前） */
  laborService: number;
  /** 年度稿酬合计（税前） */
  authorRemuneration: number;
  /** 年度特许权使用费合计（税前） */
  royalty: number;
  /** 年度三险一金个人缴纳合计 */
  socialInsurance: number;
  /** 年度专项附加扣除合计 */
  specialDeduction: number;
  /** 年度其他扣除合计 */
  otherDeduction?: number;
  /** 年度基本减除费用，默认 60000 */
  basicDeduction?: number;
  /** 年度已预扣预缴税额合计（用于汇算补退税） */
  prepaidTax?: number;
}

export interface AnnualSettlement {
  /** 四项收入并入综合所得的收入额合计 */
  taxableIncomeAmount: number;
  breakdown: {
    salary: number;
    laborService: number;
    authorRemuneration: number;
    royalty: number;
  };
  totalDeduction: number;
  taxable: number;
  tax: number;
  rate: number;
  quickDeduction: number;
  prepaidTax: number;
  /** 正数应补税，负数应退税 */
  balance: number;
  afterTax: number;
}

/**
 * 综合所得年度汇算。
 * 收入额换算：工资薪金全额；劳务报酬/特许权按 80% 计入；
 * 稿酬先按 80% 再减按 70%（即 56%）计入。
 */
export function calculateAnnual(input: AnnualIncomeInput): AnnualSettlement {
  const salaryAmount = round2(input.salary);
  const laborAmount = round2(input.laborService * 0.8);
  const authorAmount = round2(input.authorRemuneration * 0.8 * 0.7);
  const royaltyAmount = round2(input.royalty * 0.8);
  const taxableIncomeAmount = round2(
    salaryAmount + laborAmount + authorAmount + royaltyAmount,
  );

  const basic = input.basicDeduction ?? 60_000;
  const totalDeduction = round2(
    basic +
      input.socialInsurance +
      input.specialDeduction +
      (input.otherDeduction ?? 0),
  );
  const taxable = Math.max(0, round2(taxableIncomeAmount - totalDeduction));
  const bracket = matchBracket(taxable, ANNUAL_BRACKETS);
  const tax = applyBrackets(taxable, ANNUAL_BRACKETS);
  const prepaidTax = round2(input.prepaidTax ?? 0);
  const balance = round2(tax - prepaidTax);
  const afterTax = round2(
    input.salary +
      input.laborService +
      input.authorRemuneration +
      input.royalty -
      input.socialInsurance -
      tax,
  );

  return {
    taxableIncomeAmount,
    breakdown: {
      salary: salaryAmount,
      laborService: laborAmount,
      authorRemuneration: authorAmount,
      royalty: royaltyAmount,
    },
    totalDeduction,
    taxable,
    tax,
    rate: bracket.rate,
    quickDeduction: bracket.quickDeduction,
    prepaidTax,
    balance,
    afterTax,
  };
}

/**
 * 全年一次性奖金单独计税（政策延续口径）：奖金 ÷ 12 定档，按月度税率表全额计税。
 * 返回单独计税方案税额；调用方可与并入综合所得方案对比择优。
 */
export function calculateBonusSeparate(bonus: number): {
  tax: number;
  rate: number;
  quickDeduction: number;
  monthlyBasis: number;
  net: number;
} {
  const monthlyBasis = round2(bonus / 12);
  const bracket = matchBracket(monthlyBasis, MONTHLY_BRACKETS);
  const tax = round2(bonus * bracket.rate - bracket.quickDeduction);
  return {
    tax: Math.max(0, tax),
    rate: bracket.rate,
    quickDeduction: bracket.quickDeduction,
    monthlyBasis,
    net: round2(bonus - Math.max(0, tax)),
  };
}

/** 生成 12 个月相同结构的默认输入（月薪平摊场景的便捷工厂） */
export function uniformMonthly(
  gross: number,
  socialInsurance: number,
  specialDeduction: number,
  months = 12,
): MonthlySalaryInput[] {
  return Array.from({ length: months }, () => ({
    gross,
    socialInsurance,
    specialDeduction,
  }));
}
