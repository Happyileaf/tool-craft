import { describe, it, expect } from 'vitest';
import {
  ANNUAL_TAX_BRACKETS,
  MONTHLY_TAX_BRACKETS,
  findBracket,
  calcTaxByBrackets,
  calcAnnualComprehensiveTax,
  calcBonusSeparate,
  compareBonusOptions,
  buildWithholdingSchedule,
  formatRate,
  formatMoney,
  round2,
} from './tax';

describe('级距边界（不错档）', () => {
  it('年表端点金额落在较低档', () => {
    expect(findBracket(ANNUAL_TAX_BRACKETS, 36000).rate).toBe(0.03);
    expect(findBracket(ANNUAL_TAX_BRACKETS, 36000.01).rate).toBe(0.1);
    expect(findBracket(ANNUAL_TAX_BRACKETS, 144000).rate).toBe(0.1);
    expect(findBracket(ANNUAL_TAX_BRACKETS, 960000).rate).toBe(0.35);
    expect(findBracket(ANNUAL_TAX_BRACKETS, 1000000).rate).toBe(0.45);
  });

  it('月表端点金额落在较低档', () => {
    expect(findBracket(MONTHLY_TAX_BRACKETS, 3000).rate).toBe(0.03);
    expect(findBracket(MONTHLY_TAX_BRACKETS, 3000.01).rate).toBe(0.1);
    expect(findBracket(MONTHLY_TAX_BRACKETS, 80000).rate).toBe(0.35);
    expect(findBracket(MONTHLY_TAX_BRACKETS, 90000).rate).toBe(0.45);
  });

  it('各级距边界税额与速算扣除数自洽', () => {
    expect(calcTaxByBrackets(ANNUAL_TAX_BRACKETS, 36000)).toBe(1080);
    expect(calcTaxByBrackets(ANNUAL_TAX_BRACKETS, 144000)).toBe(11880);
    expect(calcTaxByBrackets(ANNUAL_TAX_BRACKETS, 300000)).toBe(43080);
    expect(calcTaxByBrackets(ANNUAL_TAX_BRACKETS, 420000)).toBe(73080);
    expect(calcTaxByBrackets(ANNUAL_TAX_BRACKETS, 660000)).toBe(145080);
    expect(calcTaxByBrackets(ANNUAL_TAX_BRACKETS, 960000)).toBe(250080);
  });

  it('应纳税所得额非正时税额为 0', () => {
    expect(calcTaxByBrackets(ANNUAL_TAX_BRACKETS, 0)).toBe(0);
    expect(calcTaxByBrackets(ANNUAL_TAX_BRACKETS, -500)).toBe(0);
  });
});

describe('年度综合所得', () => {
  it('年薪 30 万、社保公积金 3.6 万、专项附加 2.4 万：应税 18 万、税额 19080、到手 244920', () => {
    const r = calcAnnualComprehensiveTax({
      grossAnnual: 300000,
      socialSecurity: 36000,
      specialDeduction: 24000,
    });
    expect('error' in r).toBe(false);
    if (!('error' in r)) {
      expect(r.taxableIncome).toBe(180000);
      expect(r.tax).toBe(19080);
      expect(r.afterTax).toBe(244920);
      expect(r.bracket.rate).toBe(0.2);
    }
  });

  it('收入低于扣除合计时应纳税所得额为 0', () => {
    const r = calcAnnualComprehensiveTax({
      grossAnnual: 60000,
      socialSecurity: 6000,
      specialDeduction: 12000,
    });
    if (!('error' in r)) {
      expect(r.taxableIncome).toBe(0);
      expect(r.tax).toBe(0);
    }
  });

  it('非法输入返回错误', () => {
    expect(
      calcAnnualComprehensiveTax({ grossAnnual: -1, socialSecurity: 0, specialDeduction: 0 }),
    ).toEqual({ error: '全年税前收入必须为大于 0 的有效数字' });
    expect(
      calcAnnualComprehensiveTax({ grossAnnual: Number.NaN, socialSecurity: 0, specialDeduction: 0 }),
    ).toEqual({ error: '全年税前收入必须为大于 0 的有效数字' });
    expect(
      calcAnnualComprehensiveTax({ grossAnnual: 100, socialSecurity: -5, specialDeduction: 0 }),
    ).toEqual({ error: '各项金额必须为非负有效数字' });
  });
});

describe('全年一次性奖金单独计税', () => {
  it('36000 元：除以 12 为 3000，适用 3%，税额 1080', () => {
    const r = calcBonusSeparate(36000);
    if (!('error' in r)) {
      expect(r.monthlyAmount).toBe(3000);
      expect(r.rate).toBe(0.03);
      expect(r.tax).toBe(1080);
      expect(r.afterTax).toBe(34920);
    }
  });

  it('临界点 36001：税额 3390.1（多发 1 元多缴 2310.1 元的税收悬崖）', () => {
    const r = calcBonusSeparate(36001);
    if (!('error' in r)) {
      expect(r.rate).toBe(0.1);
      expect(r.quickDeduction).toBe(210);
      expect(r.tax).toBe(3390.1);
    }
  });

  it('144000 元适用 10%、速算扣除 210', () => {
    const r = calcBonusSeparate(144000);
    if (!('error' in r)) {
      expect(r.monthlyAmount).toBe(12000);
      expect(r.rate).toBe(0.1);
      expect(r.tax).toBe(14190);
      expect(r.afterTax).toBe(129810);
    }
  });

  it('负奖金报错', () => {
    expect(calcBonusSeparate(-1)).toEqual({ error: '奖金金额必须为非负有效数字' });
  });
});

describe('两种奖金方案对比', () => {
  const annual = {
    grossAnnual: 300000,
    socialSecurity: 36000,
    specialDeduction: 24000,
  };

  it('奖金 36000：单独计税更优，推荐 separate', () => {
    const r = compareBonusOptions(annual, 36000);
    if (!('error' in r)) {
      expect(r.separate.bonusTax).toBe(1080);
      expect(r.separate.totalTax).toBe(20160);
      expect(r.combined.totalTax).toBe(26280);
      expect(r.recommended).toBe('separate');
      expect(r.saving).toBe(6120);
    }
  });

  it('工资低于扣除合计、奖金并入后仍免税：并入更优，推荐 combined', () => {
    const lowIncome = {
      grossAnnual: 60000,
      socialSecurity: 0,
      specialDeduction: 0,
    };
    const r = compareBonusOptions(lowIncome, 36000);
    if (!('error' in r)) {
      expect(r.combined.totalTax).toBe(1080);
      expect(r.separate.totalTax).toBe(1080);
      // 税额相等时默认 separate
      expect(r.recommended).toBe('separate');
    }

    const lowerIncome = {
      grossAnnual: 50000,
      socialSecurity: 0,
      specialDeduction: 0,
    };
    const r2 = compareBonusOptions(lowerIncome, 36000);
    if (!('error' in r2)) {
      // 并入：应税 (50000+36000-60000)=26000，税 780；单独：工资 0 + 奖金 1080
      expect(r2.combined.totalTax).toBe(780);
      expect(r2.separate.totalTax).toBe(1080);
      expect(r2.recommended).toBe('combined');
      expect(r2.saving).toBe(300);
    }
  });
});

describe('累计预扣预缴明细', () => {
  it('月工资 30000、月社保公积金 4500、月专项附加 2000 的官方口径示例', () => {
    const r = buildWithholdingSchedule(30000, 4500, 2000);
    if (!('error' in r)) {
      expect(r).toHaveLength(12);
      // 1 月：累计应税 18500，预扣 555
      expect(r[0]!.cumulativeTaxable).toBe(18500);
      expect(r[0]!.taxThisMonth).toBe(555);
      // 6 月：累计应税 111000，累计税额 8580
      expect(r[5]!.cumulativeTaxable).toBe(111000);
      expect(r[5]!.cumulativeTax).toBe(8580);
      // 12 月：累计应税 222000，累计税额 27480，12 月当月 3700（27480 − 23780）
      expect(r[11]!.cumulativeTaxable).toBe(222000);
      expect(r[11]!.cumulativeTax).toBe(27480);
      expect(r[11]!.taxThisMonth).toBe(3700);
      // 全年累计税额之和等于年度汇算口径
      const yearTax = r.reduce((sum, row) => sum + row.taxThisMonth, 0);
      expect(round2(yearTax)).toBe(27480);
    }
  });

  it('非法输入报错', () => {
    expect(buildWithholdingSchedule(-1, 0, 0)).toEqual({
      error: '各项月度金额必须为非负有效数字',
    });
  });
});

describe('格式化', () => {
  it('税率与金额', () => {
    expect(formatRate(0.1)).toBe('10%');
    expect(formatMoney(19080)).toBe('19,080.00');
    expect(formatMoney(3390.1)).toBe('3,390.10');
  });
});
