import { describe, expect, it } from 'vitest';
import {
  capitalRecoveryFactor,
  fvifa,
  fvAnnuity,
  futureValueFactor,
  percentToRate,
  presentValueFactor,
  pvifa,
  pvAnnuity,
  sinkingFundFactor,
  solvePayment,
} from './annuity';

const RATE = 0.05;
const N = 10;
const A = 1000;

describe('annuity factors', () => {
  it('PVIFA 与教材算例一致（i=5%, n=10 ≈ 7.72173）', () => {
    expect(pvifa(RATE, N)).toBeCloseTo(7.7217349, 6);
  });

  it('FVIFA 与教材算例一致（i=5%, n=10 ≈ 12.57789）', () => {
    expect(fvifa(RATE, N)).toBeCloseTo(12.5778925, 6);
  });

  it('i=0 时 PVIFA/FVIFA 极限等于 n', () => {
    expect(pvifa(0, N)).toBe(N);
    expect(fvifa(0, N)).toBe(N);
  });

  it('资本回收系数与 PVIFA 互为倒数', () => {
    expect(capitalRecoveryFactor(RATE, N) * pvifa(RATE, N)).toBeCloseTo(1, 10);
  });

  it('偿债基金系数与 FVIFA 互为倒数', () => {
    expect(sinkingFundFactor(RATE, N) * fvifa(RATE, N)).toBeCloseTo(1, 10);
  });

  it('i=0 时资本回收/偿债基金系数极限为 1/n', () => {
    expect(capitalRecoveryFactor(0, N)).toBeCloseTo(1 / N, 10);
    expect(sinkingFundFactor(0, N)).toBeCloseTo(1 / N, 10);
  });
});

describe('ordinary annuity', () => {
  it('普通年金 PVA ≈ 7721.73、FVA ≈ 12577.89', () => {
    const input = { type: 'ordinary' as const, payment: A, ratePerPeriod: RATE, periods: N };
    expect(pvAnnuity(input)).toBeCloseTo(7721.7349, 4);
    expect(fvAnnuity(input)).toBeCloseTo(12577.8925, 4);
  });

  it('i=0 时普通年金 PV=FV=A·n', () => {
    const input = { type: 'ordinary' as const, payment: A, ratePerPeriod: 0, periods: N };
    expect(pvAnnuity(input)).toBe(A * N);
    expect(fvAnnuity(input)).toBe(A * N);
  });
});

describe('annuity due', () => {
  it('预付年金 PV/FV 均等于普通年金 × (1+i)', () => {
    const ordinary = { type: 'ordinary' as const, payment: A, ratePerPeriod: RATE, periods: N };
    const due = { type: 'due' as const, payment: A, ratePerPeriod: RATE, periods: N };
    expect(pvAnnuity(due)).toBeCloseTo((pvAnnuity(ordinary) as number) * 1.05, 6);
    expect(fvAnnuity(due)).toBeCloseTo((fvAnnuity(ordinary) as number) * 1.05, 6);
  });

  it('预付现值系数直接校验 ≈ 8.10782', () => {
    expect(presentValueFactor('due', RATE, N)).toBeCloseTo(8.1078217, 6);
  });
});

describe('deferred annuity', () => {
  it('递延 m=3 期现值 = 普通 PVA / (1.05)^3', () => {
    const deferred = {
      type: 'deferred' as const,
      payment: A,
      ratePerPeriod: RATE,
      periods: N,
      deferralPeriods: 3,
    };
    const ordinaryPV = 7721.7349;
    expect(pvAnnuity(deferred)).toBeCloseTo(ordinaryPV / Math.pow(1.05, 3), 4);
  });

  it('递延期不影响终值（收付期末时点 FV 与普通年金相同）', () => {
    const deferred = {
      type: 'deferred' as const,
      payment: A,
      ratePerPeriod: RATE,
      periods: N,
      deferralPeriods: 3,
    };
    expect(fvAnnuity(deferred)).toBeCloseTo(12577.8925, 4);
  });

  it('m=0 时递延现值退化为普通年金现值', () => {
    expect(presentValueFactor('deferred', RATE, N, 0)).toBeCloseTo(pvifa(RATE, N), 10);
  });
});

describe('perpetuity', () => {
  it('普通永续 PV = A/i = 20000，FV 无定义返回 null', () => {
    const input = {
      type: 'perpetuity' as const,
      payment: A,
      ratePerPeriod: RATE,
      periods: 0,
    };
    expect(pvAnnuity(input)).toBeCloseTo(20000, 6);
    expect(fvAnnuity(input)).toBeNull();
    expect(futureValueFactor('perpetuity', RATE, 0)).toBeNull();
  });

  it('预付永续 PV = A/i + A = 21000', () => {
    const input = {
      type: 'perpetuity' as const,
      payment: A,
      ratePerPeriod: RATE,
      periods: 0,
      perpetuityDue: true,
    };
    expect(pvAnnuity(input)).toBeCloseTo(21000, 6);
  });

  it('i=0 时永续现值抛错', () => {
    expect(() =>
      pvAnnuity({ type: 'perpetuity', payment: A, ratePerPeriod: 0, periods: 0 }),
    ).toThrow();
  });
});

describe('reverse solve payment', () => {
  it('按目标现值反算 A 与正算互逆（普通年金）', () => {
    const targetPV = A * pvifa(RATE, N);
    const solved = solvePayment('ordinary', 'pv', targetPV, RATE, N);
    expect(solved).toBeCloseTo(A, 6);
    const rebuilt = pvAnnuity({
      type: 'ordinary',
      payment: solved,
      ratePerPeriod: RATE,
      periods: N,
    }) as number;
    expect(Math.abs(rebuilt - targetPV) / targetPV).toBeLessThan(1e-10);
  });

  it('按目标终值反算 A 与正算互逆（预付年金）', () => {
    const targetFV = 12577.8925 * 1.05;
    const solved = solvePayment('due', 'fv', targetFV, RATE, N);
    const rebuilt = fvAnnuity({
      type: 'due',
      payment: solved,
      ratePerPeriod: RATE,
      periods: N,
    }) as number;
    expect(Math.abs(rebuilt - targetFV) / targetFV).toBeLessThan(1e-10);
  });

  it('递延年金按目标现值反算考虑 m 期折现', () => {
    const targetPV = 5000;
    const solved = solvePayment('deferred', 'pv', targetPV, RATE, N, 3);
    const rebuilt = pvAnnuity({
      type: 'deferred',
      payment: solved,
      ratePerPeriod: RATE,
      periods: N,
      deferralPeriods: 3,
    }) as number;
    expect(Math.abs(rebuilt - targetPV) / targetPV).toBeLessThan(1e-10);
  });

  it('永续年金按目标现值反算 A = PV·i', () => {
    expect(solvePayment('perpetuity', 'pv', 20000, RATE, 0)).toBeCloseTo(1000, 6);
  });

  it('永续年金按目标终值反算抛错', () => {
    expect(() => solvePayment('perpetuity', 'fv', 1000, RATE, 0)).toThrow();
  });
});

describe('validation and edge cases', () => {
  it('i ≤ −100% 抛错', () => {
    expect(() => pvifa(-1, N)).toThrow();
    expect(() => pvifa(-1.2, N)).toThrow();
  });

  it('非正整数期数抛错', () => {
    expect(() => pvifa(RATE, 0)).toThrow();
    expect(() => pvifa(RATE, -2)).toThrow();
    expect(() => pvifa(RATE, 3.5)).toThrow();
  });

  it('递延期为负或非整数抛错', () => {
    expect(() => presentValueFactor('deferred', RATE, N, -1)).toThrow();
    expect(() => presentValueFactor('deferred', RATE, N, 1.5)).toThrow();
  });

  it('非正收付额或目标金额抛错', () => {
    expect(() =>
      pvAnnuity({ type: 'ordinary', payment: 0, ratePerPeriod: RATE, periods: N }),
    ).toThrow();
    expect(() => solvePayment('ordinary', 'pv', -5, RATE, N)).toThrow();
  });

  it('极端利率与期数导致溢出时抛可读错误', () => {
    expect(() => fvifa(5, 10000)).toThrow(/溢出/);
  });

  it('百分数转小数', () => {
    expect(percentToRate(3.5)).toBeCloseTo(0.035, 10);
    expect(percentToRate(0)).toBe(0);
  });

  it('负利率（>−100%）可正常计算', () => {
    const factor = pvifa(-0.02, N);
    expect(Number.isFinite(factor)).toBe(true);
    expect(factor).toBeGreaterThan(0);
  });
});
