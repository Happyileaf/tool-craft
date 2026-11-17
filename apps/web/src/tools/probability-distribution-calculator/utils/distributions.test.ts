import { describe, expect, it } from 'vitest';
import {
  binomialCdf,
  binomialPmf,
  binomialQuantile,
  normalCdf,
  normalPdf,
  normalQuantile,
  poissonCdf,
  poissonPmf,
  poissonQuantile,
  summarize,
} from './distributions';

const EPS = 1e-6;

describe('正态分布', () => {
  it('标准正态 PDF 在 0 处等于 1/√(2π)', () => {
    expect(normalPdf(0, 0, 1)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 10);
  });

  it('标准正态 PDF 关于均值对称', () => {
    expect(normalPdf(1.5, 0, 1)).toBeCloseTo(normalPdf(-1.5, 0, 1), 12);
  });

  it('CDF 关键分位点：Φ(0)=0.5、Φ(1.96)≈0.975、Φ(-1.96)≈0.025', () => {
    expect(normalCdf(0, 0, 1)).toBeCloseTo(0.5, 8);
    expect(normalCdf(1.96, 0, 1)).toBeCloseTo(0.975, 4);
    expect(normalCdf(-1.96, 0, 1)).toBeCloseTo(0.025, 4);
  });

  it('CDF 负半轴满足 Φ(-z) = 1 - Φ(z)', () => {
    for (const z of [0.5, 1, 2.33, 3]) {
      expect(normalCdf(-z, 0, 1) + normalCdf(z, 0, 1)).toBeCloseTo(1, 10);
    }
  });

  it('一般正态分布平移缩放：N(μ,σ²) 的 CDF 与标准化结果一致', () => {
    expect(normalCdf(13, 10, 1.5)).toBeCloseTo(normalCdf(2, 0, 1), 10);
  });

  it('分位函数是 CDF 的逆：Φ⁻¹(Φ(x)) ≈ x', () => {
    for (const x of [-2.5, -1, 0, 0.7, 2.8]) {
      const p = normalCdf(x, 0, 1);
      expect(normalQuantile(p, 0, 1)).toBeCloseTo(x, 6);
    }
  });

  it('常用分位数：Φ⁻¹(0.95)≈1.645、Φ⁻¹(0.975)≈1.96', () => {
    expect(normalQuantile(0.95, 0, 1)).toBeCloseTo(1.6449, 3);
    expect(normalQuantile(0.975, 0, 1)).toBeCloseTo(1.96, 3);
  });

  it('非法标准差与越界概率抛错', () => {
    expect(() => normalPdf(0, 0, 0)).toThrow();
    expect(() => normalQuantile(0, 0, 1)).toThrow();
    expect(() => normalQuantile(1, 0, 1)).toThrow();
  });
});

describe('二项分布', () => {
  it('B(10, 0.5) 的 PMF 在 k=5 处等于 252/1024', () => {
    expect(binomialPmf(5, 10, 0.5)).toBeCloseTo(252 / 1024, 10);
  });

  it('PMF 对越界 k 返回 0', () => {
    expect(binomialPmf(-1, 10, 0.5)).toBe(0);
    expect(binomialPmf(11, 10, 0.5)).toBe(0);
    expect(binomialPmf(2.5, 10, 0.5)).toBe(0);
  });

  it('所有质量之和为 1', () => {
    const n = 30;
    const total = Array.from({ length: n + 1 }, (_, k) => binomialPmf(k, n, 0.3)).reduce(
      (a, b) => a + b,
      0,
    );
    expect(total).toBeCloseTo(1, 10);
  });

  it('CDF 单调递增且端点正确', () => {
    expect(binomialCdf(-1, 10, 0.5)).toBe(0);
    expect(binomialCdf(10, 10, 0.5)).toBe(1);
    expect(binomialCdf(4, 10, 0.5)).toBeCloseTo(
      [0, 1, 2, 3, 4].reduce((sum, k) => sum + binomialPmf(k, 10, 0.5), 0),
      10,
    );
  });

  it('CDF 从长尾一侧求和与短尾一侧结果一致', () => {
    expect(binomialCdf(8, 10, 0.5)).toBeCloseTo(1 - binomialPmf(9, 10, 0.5) - binomialPmf(10, 10, 0.5), 10);
  });

  it('分位函数满足 F(k-1) < p ≤ F(k)', () => {
    const k = binomialQuantile(0.5, 20, 0.4);
    expect(binomialCdf(k, 20, 0.4)).toBeGreaterThanOrEqual(0.5 - EPS);
    expect(binomialCdf(k - 1, 20, 0.4)).toBeLessThan(0.5);
  });

  it('非法参数抛错', () => {
    expect(() => binomialPmf(1, 0, 0.5)).toThrow();
    expect(() => binomialPmf(1, 10, 1)).toThrow();
  });
});

describe('泊松分布', () => {
  it('Poisson(2) 在 k=0 处为 e^-2', () => {
    expect(poissonPmf(0, 2)).toBeCloseTo(Math.exp(-2), 12);
  });

  it('Poisson(λ) 在 k=1 处为 λe^-λ', () => {
    expect(poissonPmf(1, 3)).toBeCloseTo(3 * Math.exp(-3), 12);
  });

  it('PMF 对非整数或负 k 返回 0', () => {
    expect(poissonPmf(-1, 2)).toBe(0);
    expect(poissonPmf(1.2, 2)).toBe(0);
  });

  it('CDF 为逐项质量累积', () => {
    expect(poissonCdf(2, 2)).toBeCloseTo(
      poissonPmf(0, 2) + poissonPmf(1, 2) + poissonPmf(2, 2),
      12,
    );
    expect(poissonCdf(-1, 2)).toBe(0);
  });

  it('分位函数与 CDF 互逆', () => {
    const k = poissonQuantile(0.9, 4);
    expect(poissonCdf(k, 4)).toBeGreaterThanOrEqual(0.9 - EPS);
    expect(poissonCdf(k - 1, 4)).toBeLessThan(0.9);
  });

  it('非法 λ 抛错', () => {
    expect(() => poissonPmf(0, 0)).toThrow();
    expect(() => poissonQuantile(0.5, -1)).toThrow();
  });
});

describe('summarize 汇总指标', () => {
  it('正态分布返回 μ、σ² 与求值点指标', () => {
    const s = summarize('normal', { mean: 10, stdDev: 2 }, 10);
    expect(s.mean).toBe(10);
    expect(s.variance).toBe(4);
    expect(s.stdDev).toBe(2);
    expect(s.cdfAtX).toBeCloseTo(0.5, 8);
    expect(s.tailAtX).toBeCloseTo(0.5, 8);
  });

  it('二项分布均值为 np、方差为 np(1-p)', () => {
    const s = summarize('binomial', { trials: 20, prob: 0.3 }, 6);
    expect(s.mean).toBeCloseTo(6, 10);
    expect(s.variance).toBeCloseTo(4.2, 10);
    expect(s.cdfAtX + s.tailAtX).toBeCloseTo(1, 10);
  });

  it('泊松分布均值与方差都等于 λ', () => {
    const s = summarize('poisson', { lambda: 5 }, 5);
    expect(s.mean).toBe(5);
    expect(s.variance).toBe(5);
    expect(s.stdDev).toBeCloseTo(Math.sqrt(5), 10);
    expect(s.densityAtX).toBeCloseTo(poissonPmf(5, 5), 12);
  });
});
