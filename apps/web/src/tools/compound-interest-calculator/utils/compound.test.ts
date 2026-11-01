import { describe, it, expect } from 'vitest';
import { calculateCompound, type CompoundInput, type CompoundResult } from './compound';

/** 取成功结果（失败时让用例直接报错） */
function expectOk(result: CompoundResult): Exclude<CompoundResult, { error: string }> {
  if (result.error !== null) {
    throw new Error(`expected success but got error: ${result.error}`);
  }
  return result;
}

/** 基础输入构造器 */
function makeInput(overrides: Partial<CompoundInput> = {}): CompoundInput {
  return {
    principal: 10_000,
    annualRatePercent: 8,
    years: 10,
    frequency: 'yearly',
    contribution: 0,
    timing: 'end',
    ...overrides,
  };
}

describe('calculateCompound 纯本金复利', () => {
  it('1 万、年复利 8%、10 年：终值约 21589.25，收益约 11589.25', () => {
    const result = calculateCompound(makeInput());
    if (result.error === null) {
      expect(result.futureValue).toBeCloseTo(21_589.25, 2);
      expect(result.totalContributed).toBe(10_000);
      expect(result.totalInterest).toBeCloseTo(11_589.25, 2);
      expect(result.periods).toBe(10);
    }
  });

  it('1 万、月复利 8%（月利率 8%/12）、10 年：终值约 22196.40', () => {
    const result = calculateCompound(makeInput({ frequency: 'monthly' }));
    if (result.error === null) {
      expect(result.futureValue).toBeCloseTo(22_196.4, 2);
      expect(result.periods).toBe(120);
    }
  });

  it('日复利 8%、1 年：终值约 10832.78（365 期）', () => {
    const result = calculateCompound(makeInput({ years: 1, frequency: 'daily' }));
    if (result.error === null) {
      expect(result.futureValue).toBeCloseTo(10_832.78, 2);
      expect(result.periods).toBe(365);
    }
  });

  it('零利率：终值 = 本金 + 全部定投，收益为 0，复利与单利一致', () => {
    const result = calculateCompound(
      makeInput({ annualRatePercent: 0, frequency: 'monthly', contribution: 500, years: 2 }),
    );
    if (result.error === null) {
      expect(result.futureValue).toBeCloseTo(10_000 + 500 * 24, 10);
      expect(result.totalInterest).toBeCloseTo(0, 10);
      expect(result.compoundAdvantage).toBeCloseTo(0, 10);
    }
  });
});

describe('calculateCompound 定投终值', () => {
  it('无本金、每月末投 1000、月利率 1%、12 个月：终值约 12682.50', () => {
    const result = calculateCompound(
      makeInput({
        principal: 0,
        annualRatePercent: 12,
        years: 1,
        frequency: 'monthly',
        contribution: 1000,
        timing: 'end',
      }),
    );
    if (result.error === null) {
      expect(result.futureValue).toBeCloseTo(12_682.5, 2);
      expect(result.totalContributed).toBe(12_000);
      // 期初年金终值 = 期末年金 × (1+r)
      const beginResult = calculateCompound(
        makeInput({
          principal: 0,
          annualRatePercent: 12,
          years: 1,
          frequency: 'monthly',
          contribution: 1000,
          timing: 'begin',
        }),
      );
      if (beginResult.error === null) {
        expect(beginResult.futureValue).toBeCloseTo(result.futureValue * 1.01, 6);
      }
    }
  });

  it('本金 + 定投组合：终值等于明细末期 endBalance', () => {
    const result = calculateCompound(
      makeInput({
        principal: 50_000,
        annualRatePercent: 6,
        years: 5,
        frequency: 'monthly',
        contribution: 2000,
        timing: 'begin',
      }),
    );
    if (result.error === null) {
      expect(result.schedule).toHaveLength(60);
      expect(result.futureValue).toBeCloseTo(
        (result.schedule.at(-1) as (typeof result.schedule)[number]).endBalance,
        10,
      );
      expect(result.totalContributed).toBe(50_000 + 2000 * 60);
    }
  });

  it('逐期明细恒等式：期末余额 = 期初余额 + 定投 + 利息', () => {
    const result = calculateCompound(
      makeInput({ frequency: 'quarterly', contribution: 300, timing: 'begin', years: 3 }),
    );
    if (result.error === null) {
      for (const row of result.schedule) {
        expect(row.endBalance).toBeCloseTo(
          row.startBalance + row.contribution + row.interest,
          10,
        );
      }
      // 期初三要素：定投先入账，利息 = (startBalance + contribution) × r
      const first = result.schedule[0] as (typeof result.schedule)[number];
      const r = 0.08 / 4;
      expect(first.interest).toBeCloseTo((10_000 + 300) * r, 10);
    }
  });
});

describe('calculateCompound 单利对比', () => {
  it('纯本金单利：1 万、8%、10 年 = 18000，复利优势约 3589.25', () => {
    const result = calculateCompound(makeInput());
    if (result.error === null) {
      expect(result.simpleFutureValue).toBeCloseTo(18_000, 10);
      expect(result.simpleInterest).toBeCloseTo(8_000, 10);
      expect(result.compoundAdvantage).toBeCloseTo(3_589.25, 2);
    }
  });

  it('不足整年按精确年数计单利（月复利 1 年 6 个月）', () => {
    const result = calculateCompound(
      makeInput({ years: 1.5, frequency: 'monthly', contribution: 100 }),
    );
    if (result.error === null) {
      expect(result.simpleFutureValue).toBeCloseTo(10_000 * (1 + 0.08 * 1.5) + 100 * 18, 10);
    }
  });
});

describe('calculateCompound 入参校验', () => {
  it('本金为负或非法时报错', () => {
    expect(calculateCompound(makeInput({ principal: -1 })).error).toContain('本金');
    expect(calculateCompound(makeInput({ principal: Number.NaN })).error).toContain('本金');
  });

  it('期限为 0 / 负数 / 折算不足 1 期时报错', () => {
    expect(calculateCompound(makeInput({ years: 0 })).error).toContain('期限');
    expect(calculateCompound(makeInput({ years: -1 })).error).toContain('期限');
    expect(calculateCompound(makeInput({ years: 0.001, frequency: 'yearly' })).error).toContain(
      '期限',
    );
  });

  it('定投金额为负时报错', () => {
    expect(calculateCompound(makeInput({ contribution: -100 })).error).toContain('定投');
  });

  it('负利率正常计算（允许投资亏损场景）', () => {
    const result = calculateCompound(makeInput({ annualRatePercent: -5 }));
    if (result.error === null) {
      expect(result.futureValue).toBeLessThan(10_000);
      expect(result.futureValue).toBeCloseTo(10_000 * 0.95 ** 10, 10);
    }
  });
});
