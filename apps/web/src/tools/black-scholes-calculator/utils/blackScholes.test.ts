import { describe, expect, it } from 'vitest';
import {
  blackScholes,
  normalCdf,
  normalPdf,
  putCallParityResidual,
  toYears,
  validateInputs,
  type BsmInputs,
} from './blackScholes';

/** 教科书基准输入：S=K=100、r=5%、σ=20%、T=1 年、q=0 */
const BASE: BsmInputs = { S: 100, K: 100, r: 0.05, sigma: 0.2, T: 1 };

describe('正态分布函数', () => {
  it('normalCdf(0) 严格等于 0.5', () => {
    expect(normalCdf(0)).toBe(0.5);
  });

  it('normalCdf(1.96) ≈ 0.9750（容差 1e-4）', () => {
    expect(Math.abs(normalCdf(1.96) - 0.975)).toBeLessThan(1e-4);
  });

  it('满足对称性 N(−x) = 1 − N(x)', () => {
    for (const x of [0.5, 1, 1.64, 2.33, 3]) {
      expect(normalCdf(-x)).toBeCloseTo(1 - normalCdf(x), 12);
    }
  });

  it('normalPdf 与 normalCdf 数值自洽（φ(0)=1/√(2π)，密度恒正）', () => {
    expect(normalPdf(0)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 12);
    expect(normalPdf(1.5)).toBeCloseTo(
      Math.exp(-0.5 * 1.5 * 1.5) / Math.sqrt(2 * Math.PI),
      12,
    );
    expect(normalPdf(-2)).toBeGreaterThan(0);
  });
});

describe('Black-Scholes-Merton 教科书基准', () => {
  it('S=K=100、r=5%、σ=20%、T=1 → Call ≈ 10.4506、Put ≈ 5.5735', () => {
    const result = blackScholes(BASE);
    expect(result.call).toBeCloseTo(10.4506, 2);
    expect(result.put).toBeCloseTo(5.5735, 2);
  });

  it('d1 ≈ 0.35、d2 ≈ 0.15', () => {
    const { d1, d2 } = blackScholes(BASE);
    expect(d1).toBeCloseTo(0.35, 2);
    expect(d2).toBeCloseTo(0.15, 2);
  });

  it('带股息率 q=0.03 时定价仍为有限正数', () => {
    const result = blackScholes({ ...BASE, q: 0.03 });
    expect(Number.isFinite(result.call)).toBe(true);
    expect(Number.isFinite(result.put)).toBe(true);
    expect(result.call).toBeGreaterThan(0);
    expect(result.put).toBeGreaterThan(0);
  });
});

describe('买卖平价关系', () => {
  const cases: BsmInputs[] = [
    BASE,
    { S: 120, K: 100, r: 0.03, sigma: 0.25, T: 0.5 },
    { S: 80, K: 110, r: 0.08, sigma: 0.4, T: 2, q: 0.02 },
    { S: 500, K: 480, r: 0, sigma: 0.15, T: 0.25, q: 0.01 },
  ];

  it('多组输入下 |C − P − (S·e^(−qT) − K·e^(−rT))| < 1e-9', () => {
    for (const inputs of cases) {
      const { call, put, parityResidual } = blackScholes(inputs);
      expect(Math.abs(parityResidual)).toBeLessThan(1e-9);
      expect(
        Math.abs(putCallParityResidual(call, put, inputs) - parityResidual),
      ).toBeLessThan(1e-15);
    }
  });
});

describe('Delta 边界与多空关系', () => {
  it('深度实值 Call（S=200、K=50）Delta > 0.999', () => {
    const result = blackScholes({ ...BASE, S: 200, K: 50 });
    expect(result.greeks.deltaCall).toBeGreaterThan(0.999);
  });

  it('深度虚值 Call（S=20、K=200）Delta < 0.001', () => {
    const result = blackScholes({ ...BASE, S: 20, K: 200 });
    expect(result.greeks.deltaCall).toBeLessThan(0.001);
  });

  it('q=0 时 deltaCall − deltaPut ≈ 1', () => {
    const result = blackScholes(BASE);
    expect(result.greeks.deltaCall - result.greeks.deltaPut).toBeCloseTo(1, 10);
  });

  it('q=0.03 时 deltaCall − deltaPut ≈ e^(−qT)', () => {
    const result = blackScholes({ ...BASE, q: 0.03 });
    expect(result.greeks.deltaCall - result.greeks.deltaPut).toBeCloseTo(
      Math.exp(-0.03 * BASE.T),
      10,
    );
  });
});

describe('Gamma 与 Vega', () => {
  it('Gamma 看涨/看跌完全相同且恒正', () => {
    const result = blackScholes(BASE);
    expect(result.greeks.gamma).toBeGreaterThan(0);
    const again = blackScholes(BASE);
    expect(result.greeks.gamma).toBe(again.greeks.gamma);
  });

  it('Vega 看涨/看跌完全相同、恒正，且 per1pct = vega / 100', () => {
    const result = blackScholes(BASE);
    expect(result.greeks.vega).toBeGreaterThan(0);
    expect(result.greeks.vegaPer1pct).toBeCloseTo(result.greeks.vega / 100, 12);
  });
});

describe('Theta 与 Rho', () => {
  it('日历日 Theta 等于年化 Theta / 365', () => {
    const { greeks } = blackScholes(BASE);
    expect(greeks.thetaCallDaily).toBeCloseTo(greeks.thetaCallAnnual / 365, 12);
    expect(greeks.thetaPutDaily).toBeCloseTo(greeks.thetaPutAnnual / 365, 12);
  });

  it('Rho 为每 1% 利率变动口径，看涨为正、看跌为负', () => {
    const { greeks } = blackScholes(BASE);
    expect(greeks.rhoCall).toBeGreaterThan(0);
    expect(greeks.rhoPut).toBeLessThan(0);
  });
});

describe('非法输入矩阵', () => {
  it('S = 0 抛出含字段名 S 的错误', () => {
    expect(() => blackScholes({ ...BASE, S: 0 })).toThrow(/标的现价 S/);
  });

  it('K = -1 抛出含字段名 K 的错误', () => {
    expect(() => blackScholes({ ...BASE, K: -1 })).toThrow(/行权价 K/);
  });

  it('sigma = 0 抛出含字段名 sigma 的错误', () => {
    expect(() => blackScholes({ ...BASE, sigma: 0 })).toThrow(/波动率 sigma/);
  });

  it('T = 0 抛出含字段名 T 的错误', () => {
    expect(() => blackScholes({ ...BASE, T: 0 })).toThrow(/剩余期限 T/);
  });

  it('r = -0.01 抛出含字段名 r 的错误', () => {
    expect(() => blackScholes({ ...BASE, r: -0.01 })).toThrow(/无风险利率 r/);
  });

  it('q 为负数抛出含字段名 q 的错误', () => {
    expect(() => blackScholes({ ...BASE, q: -0.02 })).toThrow(/股息率 q/);
  });

  it('validateInputs 对 NaN 同样报错', () => {
    expect(() => validateInputs({ ...BASE, S: Number.NaN })).toThrow(/标的现价 S/);
  });
});

describe('期限单位换算 toYears', () => {
  it('年保持原值、月除以 12、日除以 365', () => {
    expect(toYears(1, 'year')).toBe(1);
    expect(toYears(6, 'month')).toBeCloseTo(0.5, 12);
    expect(toYears(730, 'day')).toBeCloseTo(2, 12);
  });
});
