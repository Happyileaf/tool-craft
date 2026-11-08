import { describe, it, expect } from "vitest";
import {
  ANNUAL_BRACKETS,
  MONTHLY_BRACKETS,
  applyBrackets,
  matchBracket,
  round2,
  calculateWithholding,
  calculateAnnual,
  calculateBonusSeparate,
  uniformMonthly,
} from "./tax";

describe("bracket engine", () => {
  it("maps known taxable amounts to expected tax", () => {
    expect(applyBrackets(0, ANNUAL_BRACKETS)).toBe(0);
    expect(applyBrackets(36_000, ANNUAL_BRACKETS)).toBe(1080);
    // 144000 × 10% - 2520 = 11880
    expect(applyBrackets(144_000, ANNUAL_BRACKETS)).toBe(11_880);
    // 300000 × 20% - 16920 = 43080
    expect(applyBrackets(300_000, ANNUAL_BRACKETS)).toBe(43_080);
    // 1000000 × 45% - 181920 = 268080
    expect(applyBrackets(1_000_000, ANNUAL_BRACKETS)).toBe(268_080);
  });

  it("negative taxable income yields zero tax", () => {
    expect(applyBrackets(-500, ANNUAL_BRACKETS)).toBe(0);
  });

  it("picks the correct bracket rate", () => {
    expect(matchBracket(50_000, ANNUAL_BRACKETS).rate).toBe(0.1);
    expect(matchBracket(960_001, ANNUAL_BRACKETS).rate).toBe(0.45);
  });

  it("round2 handles float tails", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(1234.567)).toBe(1234.57);
  });
});

describe("cumulative monthly withholding", () => {
  it("withholds flat 3% across the year within the first bracket", () => {
    // 月薪 10000，社保 1500，专项附加 1000，减除 5000
    // 月应纳税所得额 = 10000 - 5000 - 1500 - 1000 = 2500
    const months = uniformMonthly(10_000, 1_500, 1_000);
    const r = calculateWithholding(months);
    expect(r.months).toHaveLength(12);
    expect(r.months[0]!.currentTax).toBe(75); // 2500 × 3%
    expect(r.months[11]!.cumulativeTaxable).toBe(30_000);
    expect(r.totalTax).toBe(900); // 30000 × 3%
    // 到手 = 10000 - 1500 - 75
    expect(r.months[0]!.netPay).toBe(8425);
    expect(r.totalGross).toBe(120_000);
  });

  it("jumps bracket mid-year and withholds progressively", () => {
    // 月薪 30000，社保 3000，专项附加 2000，月应税 = 20000
    const months = uniformMonthly(30_000, 3_000, 2_000);
    const r = calculateWithholding(months);
    // 第 2 月累计 40000 跨入 10% 档：累计税 40000×10%-2520=1480
    expect(r.months[1]!.cumulativeTax).toBe(1480);
    // 第 1 月累计税 600
    expect(r.months[0]!.currentTax).toBe(600);
    // 第 2 月当月 = 1480 - 600 = 880
    expect(r.months[1]!.currentTax).toBe(880);
    // 全年累计应税 240000，年度税 = 240000×20%-16920 = 31080
    expect(r.months[11]!.cumulativeTax).toBe(31_080);
    expect(r.totalTax).toBe(31_080);
  });

  it("never withholds negative tax when cumulative income drops", () => {
    const r = calculateWithholding([
      { gross: 30_000, socialInsurance: 3_000, specialDeduction: 2_000 },
      { gross: 0, socialInsurance: 3_000, specialDeduction: 2_000 },
    ]);
    expect(r.months[0]!.currentTax).toBe(600);
    expect(r.months[1]!.currentTax).toBe(0);
  });
});

describe("annual comprehensive settlement", () => {
  it("settles salary-only case consistently with withholding", () => {
    const r = calculateAnnual({
      salary: 360_000,
      laborService: 0,
      authorRemuneration: 0,
      royalty: 0,
      socialInsurance: 36_000,
      specialDeduction: 24_000,
      prepaidTax: 31_080,
    });
    // 应税 = 360000 - 60000 - 36000 - 24000 = 240000
    expect(r.taxable).toBe(240_000);
    expect(r.tax).toBe(31_080);
    expect(r.balance).toBe(0);
  });

  it("applies 80% and 56% inclusion rules for labor service and author fees", () => {
    const r = calculateAnnual({
      salary: 0,
      laborService: 10_000,
      authorRemuneration: 10_000,
      royalty: 10_000,
      socialInsurance: 0,
      specialDeduction: 0,
    });
    // 劳务 8000 + 稿酬 5600 + 特许 8000 = 21600
    expect(r.breakdown.laborService).toBe(8_000);
    expect(r.breakdown.authorRemuneration).toBe(5_600);
    expect(r.breakdown.royalty).toBe(8_000);
    expect(r.taxableIncomeAmount).toBe(21_600);
    // 应税 = 21600 - 60000 → 0
    expect(r.taxable).toBe(0);
    expect(r.tax).toBe(0);
  });

  it("computes refund (negative balance) when prepaid exceeds final tax", () => {
    const r = calculateAnnual({
      salary: 200_000,
      laborService: 0,
      authorRemuneration: 0,
      royalty: 0,
      socialInsurance: 20_000,
      specialDeduction: 24_000,
      prepaidTax: 10_000,
    });
    // 应税 = 200000-60000-20000-24000 = 96000，税 = 96000×10%-2520 = 7080
    expect(r.tax).toBe(7_080);
    expect(r.balance).toBe(-2_920);
  });
});

describe("annual bonus separate taxation", () => {
  it("uses monthly bracket on bonus/12 basis", () => {
    // 奖金 36000，月均 3000，适用 3%，税 1080
    const r = calculateBonusSeparate(36_000);
    expect(r.monthlyBasis).toBe(3_000);
    expect(r.rate).toBe(0.03);
    expect(r.tax).toBe(1_080);
    expect(r.net).toBe(34_920);
  });

  it("applies quick deduction at higher bracket", () => {
    // 奖金 120000，月均 10000，10% 档速扣 210 → 120000×10%-210 = 11790
    const r = calculateBonusSeparate(120_000);
    expect(r.rate).toBe(0.1);
    expect(r.tax).toBe(11_790);
    expect(MONTHLY_BRACKETS.length).toBe(7);
  });
});
