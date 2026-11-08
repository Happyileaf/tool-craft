import { describe, expect, it } from 'vitest';
import {
  Z_SCORES,
  adjustForDesignAndResponse,
  calculateMarginOfError,
  calculateSampleSize,
  formatPercent,
  getZScore,
  inverseNormalCdf,
} from './sample-size';

describe('getZScore', () => {
  it('返回常用置信水平的内置 z 分位数', () => {
    expect(getZScore(0.95)).toBe(Z_SCORES[0.95]);
    expect(getZScore(0.99)).toBe(Z_SCORES[0.99]);
    expect(getZScore(0.9)).toBe(Z_SCORES[0.9]);
  });

  it('内置值与标准正态分位数一致', () => {
    expect(getZScore(0.95)).toBeCloseTo(1.96, 2);
    expect(getZScore(0.99)).toBeCloseTo(2.576, 2);
    expect(getZScore(0.9)).toBeCloseTo(1.645, 2);
  });

  it('非内置置信水平走 Acklam 逼近', () => {
    expect(getZScore(0.97)).toBeCloseTo(2.1701, 3);
  });

  it('拒绝越界置信水平', () => {
    expect(() => getZScore(0)).toThrow();
    expect(() => getZScore(1)).toThrow();
    expect(() => getZScore(1.2)).toThrow();
  });
});

describe('inverseNormalCdf', () => {
  it('关键累积概率逼近标准分位数', () => {
    expect(inverseNormalCdf(0.975)).toBeCloseTo(1.959964, 4);
    expect(inverseNormalCdf(0.5)).toBeCloseTo(0, 6);
    expect(inverseNormalCdf(0.025)).toBeCloseTo(-1.959964, 4);
  });
});

describe('calculateSampleSize', () => {
  it('经典场景 95% / e=5% / p=0.5 → 385', () => {
    const result = calculateSampleSize({
      confidenceLevel: 0.95,
      marginOfError: 0.05,
      proportion: 0.5,
    });
    expect(result.rawSampleSize).toBeCloseTo(384.1459, 2);
    expect(result.requiredSampleSize).toBe(385);
    expect(result.finiteCorrectionApplied).toBe(false);
  });

  it('99% / e=3% / p=0.5 → 1844', () => {
    const result = calculateSampleSize({
      confidenceLevel: 0.99,
      marginOfError: 0.03,
      proportion: 0.5,
    });
    expect(result.requiredSampleSize).toBe(1844);
  });

  it('有限总体 N=1000 时应用 FPC → 278', () => {
    const result = calculateSampleSize({
      confidenceLevel: 0.95,
      marginOfError: 0.05,
      proportion: 0.5,
      populationSize: 1000,
    });
    expect(result.finiteCorrectionApplied).toBe(true);
    expect(result.adjustedSampleSize).toBeCloseTo(277.73, 1);
    expect(result.requiredSampleSize).toBe(278);
  });

  it('FPC 校正结果不超过总体规模', () => {
    const result = calculateSampleSize({
      confidenceLevel: 0.95,
      marginOfError: 0.05,
      populationSize: 100,
    });
    expect(result.requiredSampleSize).toBeLessThanOrEqual(100);
  });

  it('默认 proportion 为 0.5（最保守）', () => {
    const explicit = calculateSampleSize({
      confidenceLevel: 0.95,
      marginOfError: 0.05,
      proportion: 0.5,
    });
    const implicit = calculateSampleSize({ confidenceLevel: 0.95, marginOfError: 0.05 });
    expect(implicit.requiredSampleSize).toBe(explicit.requiredSampleSize);
  });

  it('拒绝非法误差幅度与比例', () => {
    expect(() =>
      calculateSampleSize({ confidenceLevel: 0.95, marginOfError: 0 }),
    ).toThrow();
    expect(() =>
      calculateSampleSize({ confidenceLevel: 0.95, marginOfError: 1 }),
    ).toThrow();
    expect(() =>
      calculateSampleSize({
        confidenceLevel: 0.95,
        marginOfError: 0.05,
        proportion: 1.5,
      }),
    ).toThrow();
  });
});

describe('calculateMarginOfError', () => {
  it('n=385 反推误差幅度约为 5%', () => {
    const margin = calculateMarginOfError({
      sampleSize: 385,
      confidenceLevel: 0.95,
      proportion: 0.5,
    });
    expect(margin).toBeCloseTo(0.04994, 3);
  });

  it('与正向计算互逆（有限总体）', () => {
    const forward = calculateSampleSize({
      confidenceLevel: 0.95,
      marginOfError: 0.05,
      proportion: 0.5,
      populationSize: 2000,
    });
    const backward = calculateMarginOfError({
      sampleSize: forward.requiredSampleSize,
      confidenceLevel: 0.95,
      proportion: 0.5,
      populationSize: 2000,
    });
    expect(backward).toBeLessThanOrEqual(0.05);
    expect(backward).toBeCloseTo(0.05, 2);
  });

  it('样本量等于总体规模时误差为 0', () => {
    const margin = calculateMarginOfError({
      sampleSize: 500,
      confidenceLevel: 0.95,
      populationSize: 500,
    });
    expect(margin).toBe(0);
  });

  it('拒绝非正整数样本量', () => {
    expect(() =>
      calculateMarginOfError({ sampleSize: 0, confidenceLevel: 0.95 }),
    ).toThrow();
    expect(() =>
      calculateMarginOfError({ sampleSize: 10.5, confidenceLevel: 0.95 }),
    ).toThrow();
  });
});

describe('adjustForDesignAndResponse', () => {
  it('deff=2、应答率 0.8 时向上取整', () => {
    expect(
      adjustForDesignAndResponse({ baseSampleSize: 385, designEffect: 2, responseRate: 0.8 }),
    ).toBe(963);
  });

  it('默认 deff=1、应答率 1 时保持原样本量', () => {
    expect(adjustForDesignAndResponse({ baseSampleSize: 385 })).toBe(385);
  });

  it('拒绝非法设计效应与应答率', () => {
    expect(() =>
      adjustForDesignAndResponse({ baseSampleSize: 100, designEffect: 0.5 }),
    ).toThrow();
    expect(() =>
      adjustForDesignAndResponse({ baseSampleSize: 100, responseRate: 0 }),
    ).toThrow();
  });
});

describe('formatPercent', () => {
  it('比例转百分比文本', () => {
    expect(formatPercent(0.05)).toBe('5.00%');
    expect(formatPercent(0.1234, 1)).toBe('12.3%');
  });
});
