import { describe, it, expect } from 'vitest';
import { calculateLoan, type LoanResult, type PaymentRow } from './loan';

/** 取成功结果（失败时让用例直接报错） */
function expectOk(result: LoanResult): Exclude<LoanResult, { error: string }> {
  if (result.error !== null) {
    throw new Error(`expected success but got error: ${result.error}`);
  }
  return result;
}

/** 汇总断言：本金 + 总利息 ≈ 总还款；逐月本金合计 ≈ 本金；末期剩余为 0 */
function assertScheduleInvariant(
  rows: PaymentRow[],
  principal: number,
  totalPayment: number,
  totalInterest: number,
) {
  const sumPrincipal = rows.reduce((sum, row) => sum + row.principal, 0);
  const sumPayment = rows.reduce((sum, row) => sum + row.payment, 0);
  expect(sumPrincipal).toBeCloseTo(principal, 6);
  expect(sumPayment).toBeCloseTo(totalPayment, 6);
  expect(totalPayment - principal).toBeCloseTo(totalInterest, 6);
  expect(rows.at(-1)?.remaining).toBe(0);
  for (const row of rows) {
    expect(row.payment).toBeCloseTo(row.principal + row.interest, 10);
  }
}

describe('calculateLoan 等额本息', () => {
  it('120 万、4.9%、30 年：月供约 6368.72，总利息约 1,092,739', () => {
    const result = calculateLoan(1_200_000, 4.9, 360, 'equal-payment');
    expect(result.error).toBeNull();
    if (result.error === null) {
      expect(result.monthlyPayment).toBeCloseTo(6368.72, 2);
      expect(result.totalInterest).toBeCloseTo(1_092_739.43, 2);
      expect(result.totalPayment).toBeCloseTo(2_292_739.43, 2);
      expect(result.schedule).toHaveLength(360);
      assertScheduleInvariant(
        result.schedule,
        1_200_000,
        result.totalPayment,
        result.totalInterest,
      );
    }
  });

  it('免息贷款（年利率 0）：月供 = 本金 / 月数，总利息为 0', () => {
    const result = calculateLoan(120_000, 0, 12, 'equal-payment');
    if (result.error === null) {
      expect(result.monthlyPayment).toBeCloseTo(10_000, 10);
      expect(result.totalInterest).toBe(0);
      expect(result.totalPayment).toBe(120_000);
      assertScheduleInvariant(
        result.schedule,
        120_000,
        result.totalPayment,
        result.totalInterest,
      );
    }
  });

  it('每月还款额固定，利息逐月递减、本金逐月递增', () => {
    const result = calculateLoan(500_000, 3.1, 240, 'equal-payment');
    if (result.error === null) {
      const monthly = result.monthlyPayment;
      for (const row of result.schedule.slice(0, -1)) {
        expect(row.payment).toBeCloseTo(monthly, 6);
      }
      const first = result.schedule[0] as PaymentRow;
      const mid = result.schedule[100] as PaymentRow;
      expect(mid.interest).toBeLessThan(first.interest);
      expect(mid.principal).toBeGreaterThan(first.principal);
    }
  });

  it('单期向量：12 万、12%（月利率 1%）、12 期首月利息 1200、本金约 9461.85', () => {
    const result = calculateLoan(120_000, 12, 12, 'equal-payment');
    if (result.error === null) {
      const first = result.schedule[0] as PaymentRow;
      expect(first.interest).toBeCloseTo(1200, 6);
      expect(first.principal).toBeCloseTo(9461.85, 2);
      expect(first.payment).toBeCloseTo(10661.85, 2);
    }
  });
});

describe('calculateLoan 等额本金', () => {
  it('每月本金固定为 P/n，首月月供最高、逐月递减', () => {
    const result = calculateLoan(120_000, 12, 12, 'equal-principal');
    if (result.error === null) {
      expect(result.schedule).toHaveLength(12);
      for (const row of result.schedule) {
        expect(row.principal).toBeCloseTo(10_000, 10);
      }
      const first = result.schedule[0] as PaymentRow;
      const last = result.schedule[11] as PaymentRow;
      expect(first.interest).toBeCloseTo(1200, 6);
      expect(first.payment).toBeCloseTo(11_200, 6);
      expect(last.interest).toBeCloseTo(100, 6);
      expect(last.payment).toBeCloseTo(10_100, 6);
      // 总利息 = r·P·(n+1)/2 = 0.01×120000×13/2 = 7800
      expect(result.totalInterest).toBeCloseTo(7800, 6);
      assertScheduleInvariant(
        result.schedule,
        120_000,
        result.totalPayment,
        result.totalInterest,
      );
    }
  });

  it('免息等额本金：每月还款均为 P/n，总利息为 0', () => {
    const result = calculateLoan(60_000, 0, 6, 'equal-principal');
    if (result.error === null) {
      for (const row of result.schedule) {
        expect(row.payment).toBeCloseTo(10_000, 10);
        expect(row.interest).toBe(0);
      }
      expect(result.totalInterest).toBe(0);
    }
  });
});

describe('calculateLoan 入参校验', () => {
  it('本金为 0 / 负数 / 非有限数时报错', () => {
    expect(calculateLoan(0, 4.9, 360, 'equal-payment')).toEqual({
      error: '贷款本金必须为大于 0 的数字',
    });
    expect(calculateLoan(-1, 4.9, 360, 'equal-payment')).toEqual({
      error: '贷款本金必须为大于 0 的数字',
    });
    expect(calculateLoan(Number.NaN, 4.9, 360, 'equal-payment')).toEqual({
      error: '贷款本金必须为大于 0 的数字',
    });
  });

  it('年利率为负或非法时报错', () => {
    expect(calculateLoan(100, -0.1, 12, 'equal-payment').error).toContain('年利率');
    expect(calculateLoan(100, Number.NaN, 12, 'equal-payment').error).toContain('年利率');
  });

  it('期限为 0 / 负数 / 非整数时报错', () => {
    expect(calculateLoan(100, 4.9, 0, 'equal-payment').error).toContain('期限');
    expect(calculateLoan(100, 4.9, -12, 'equal-payment').error).toContain('期限');
    expect(calculateLoan(100, 4.9, 12.5, 'equal-payment').error).toContain('期限');
  });
});
