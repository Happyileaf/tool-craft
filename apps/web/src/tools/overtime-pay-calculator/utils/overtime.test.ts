import { describe, it, expect } from 'vitest';
import {
  MONTHLY_PAY_DAYS,
  WORK_HOURS_PER_DAY,
  OVERTIME_RATES,
  deriveWages,
  calculateOvertimePay,
  roundCurrency,
} from './overtime';

describe('deriveWages', () => {
  it('converts monthly base to daily and hourly wages via 21.75 / 8', () => {
    const wages = deriveWages(8000);
    expect(wages.dailyWage).toBeCloseTo(8000 / 21.75, 6);
    expect(wages.hourlyWage).toBeCloseTo(8000 / 21.75 / 8, 6);
  });

  it('accepts zero base and rejects invalid input', () => {
    expect(deriveWages(0).hourlyWage).toBe(0);
    expect(() => deriveWages(-1)).toThrow('非负');
    expect(() => deriveWages(Number.NaN)).toThrow('非负');
  });
});

describe('calculateOvertimePay', () => {
  it('matches the worked example: 8000 base with 10/8/4 overtime hours', () => {
    const result = calculateOvertimePay(8000, {
      workday: 10,
      restDay: 8,
      statutoryHoliday: 4,
    });
    const hourly = 8000 / MONTHLY_PAY_DAYS / WORK_HOURS_PER_DAY;
    const workdayPay = hourly * 10 * 1.5;
    const restPay = hourly * 8 * 2;
    const holidayPay = hourly * 4 * 3;

    expect(result.breakdown).toHaveLength(3);
    expect(result.breakdown[0]).toMatchObject({ type: 'workday', rate: 1.5, hours: 10 });
    expect(result.breakdown[0]!.pay).toBeCloseTo(workdayPay, 6);
    expect(result.breakdown[1]!.pay).toBeCloseTo(restPay, 6);
    expect(result.breakdown[2]!.pay).toBeCloseTo(holidayPay, 6);
    expect(result.totalOvertimePay).toBeCloseTo(workdayPay + restPay + holidayPay, 6);
    expect(result.grossPay).toBeCloseTo(8000 + result.totalOvertimePay, 6);
    expect(result.totalHours).toBe(22);
  });

  it('returns zero overtime when no hours are entered', () => {
    const result = calculateOvertimePay(5000, {
      workday: 0,
      restDay: 0,
      statutoryHoliday: 0,
    });
    expect(result.totalOvertimePay).toBe(0);
    expect(result.grossPay).toBe(5000);
  });

  it('rejects negative overtime hours', () => {
    expect(() =>
      calculateOvertimePay(5000, { workday: -1, restDay: 0, statutoryHoliday: 0 }),
    ).toThrow('非负');
  });

  it('uses the statutory rates 150/200/300 percent', () => {
    expect(OVERTIME_RATES).toEqual({ workday: 1.5, restDay: 2, statutoryHoliday: 3 });
  });
});

describe('roundCurrency', () => {
  it('rounds to two decimal places', () => {
    expect(roundCurrency(123.456)).toBe(123.46);
    expect(roundCurrency(0.005)).toBe(0.01);
    expect(roundCurrency(2)).toBe(2);
  });
});
