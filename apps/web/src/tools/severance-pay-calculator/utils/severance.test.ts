import { describe, it, expect } from 'vitest';
import { calcCompensationMonths, calcSeverance } from './severance';

describe('calcCompensationMonths (年限折算)', () => {
  it('3 年 4 个月（不满 6 个月）→ N = 3.5', () => {
    expect(calcCompensationMonths(3, 4)).toBe(3.5);
  });

  it('3 年 7 个月（满 6 个月不满 1 年）→ N = 4', () => {
    expect(calcCompensationMonths(3, 7)).toBe(4);
  });

  it('整 5 年 → N = 5', () => {
    expect(calcCompensationMonths(5, 0)).toBe(5);
  });

  it('边界：剩余恰好 6 个月按一年计；5 个月按半个月计', () => {
    expect(calcCompensationMonths(2, 6)).toBe(3);
    expect(calcCompensationMonths(2, 5)).toBe(2.5);
  });

  it('工龄为 0 → N = 0', () => {
    expect(calcCompensationMonths(0, 0)).toBe(0);
  });

  it('非法输入报错', () => {
    expect(() => calcCompensationMonths(-1, 0)).toThrow(/工作年数/);
    expect(() => calcCompensationMonths(1, 12)).toThrow(/剩余月数/);
    expect(() => calcCompensationMonths(1.5, 0)).toThrow(/整数/);
  });
});

describe('calcSeverance (补偿金总额)', () => {
  it('月工资 10000、N=3.5、无封顶 → 经济补偿 35000；N+1 总额 45000；2N 总额 70000', () => {
    const base = { years: 3, months: 4, monthlyWage: 10000 };

    const n = calcSeverance({ ...base, scenario: 'N' });
    expect(n.effectiveMonths).toBe(3.5);
    expect(n.baseWage).toBe(10000);
    expect(n.wageCapped).toBe(false);
    expect(n.severancePay).toBe(35000);
    expect(n.noticePay).toBe(0);
    expect(n.totalPay).toBe(35000);

    const n1 = calcSeverance({ ...base, scenario: 'N_PLUS_1' });
    expect(n1.severancePay).toBe(35000);
    expect(n1.noticePay).toBe(10000);
    expect(n1.totalPay).toBe(45000);

    const doubleN = calcSeverance({ ...base, scenario: '2N' });
    expect(doubleN.severancePay).toBe(35000);
    expect(doubleN.totalPay).toBe(70000);
  });

  it('三倍封顶：月工资 40000、社平 10000、工龄 15 年 → 基数 30000、N 封顶 12、补偿 360000', () => {
    const result = calcSeverance({
      years: 15,
      months: 0,
      monthlyWage: 40000,
      localAvgWage: 10000,
      scenario: 'N',
    });
    expect(result.capWage).toBe(30000);
    expect(result.wageCapped).toBe(true);
    expect(result.baseWage).toBe(30000);
    expect(result.rawMonths).toBe(15);
    expect(result.monthsCapped).toBe(true);
    expect(result.effectiveMonths).toBe(12);
    expect(result.severancePay).toBe(360000);
    expect(result.totalPay).toBe(360000);
  });

  it('社平工资留空 → 不触发封顶，按实际工资与实际年限计算', () => {
    const result = calcSeverance({
      years: 15,
      months: 0,
      monthlyWage: 40000,
      scenario: 'N',
    });
    expect(result.wageCapped).toBe(false);
    expect(result.monthsCapped).toBe(false);
    expect(result.baseWage).toBe(40000);
    expect(result.effectiveMonths).toBe(15);
    expect(result.severancePay).toBe(600000);
    expect(result.capWage).toBeNull();
  });

  it('工资恰等于三倍社平时不触发封顶（仅 > 三倍才封顶）', () => {
    const result = calcSeverance({
      years: 2,
      months: 0,
      monthlyWage: 30000,
      localAvgWage: 10000,
      scenario: 'N',
    });
    expect(result.wageCapped).toBe(false);
    expect(result.baseWage).toBe(30000);
    expect(result.monthsCapped).toBe(false);
  });

  it('封顶但工龄不足 12 年时只封基数不封年限', () => {
    const result = calcSeverance({
      years: 3,
      months: 7,
      monthlyWage: 50000,
      localAvgWage: 10000,
      scenario: 'N',
    });
    expect(result.wageCapped).toBe(true);
    expect(result.baseWage).toBe(30000);
    expect(result.monthsCapped).toBe(false);
    expect(result.effectiveMonths).toBe(4);
    expect(result.severancePay).toBe(120000);
  });

  it('异常：月工资 ≤ 0、社平工资 ≤ 0 均报明确错误', () => {
    expect(() =>
      calcSeverance({ years: 1, months: 0, monthlyWage: 0, scenario: 'N' }),
    ).toThrow(/月工资/);
    expect(() =>
      calcSeverance({ years: 1, months: 0, monthlyWage: -5, scenario: 'N' }),
    ).toThrow(/月工资/);
    expect(() =>
      calcSeverance({
        years: 1,
        months: 0,
        monthlyWage: 10000,
        localAvgWage: 0,
        scenario: 'N',
      }),
    ).toThrow(/社平工资/);
    expect(() =>
      calcSeverance({
        years: 1,
        months: 0,
        monthlyWage: 10000,
        localAvgWage: -100,
        scenario: 'N',
      }),
    ).toThrow(/社平工资/);
  });

  it('breakdown 明细包含关键计算步骤', () => {
    const result = calcSeverance({
      years: 15,
      months: 0,
      monthlyWage: 40000,
      localAvgWage: 10000,
      scenario: '2N',
    });
    const text = result.breakdown.join('\n');
    expect(text).toContain('N = 15');
    expect(text).toContain('三倍封顶');
    expect(text).toContain('12');
    expect(text).toContain('2N');
  });
});
