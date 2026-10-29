import { describe, expect, it } from 'vitest';
import { computeStats, formatNumber, parseNumbers, quantileSorted } from './statistics';

describe('parseNumbers', () => {
  it('支持逗号、空格、换行、分号、制表符等混合分隔符', () => {
    const result = parseNumbers('1, 2;3\n4\t5，6；7、8/9|10');
    expect(result.values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result.invalidTokens).toEqual([]);
  });

  it('支持负数、小数与科学计数法', () => {
    const result = parseNumbers('-1.5 +2 3e2 1.2e-1');
    expect(result.values).toEqual([-1.5, 2, 300, 0.12]);
  });

  it('非法 token 被收集且忽略', () => {
    const result = parseNumbers('1 abc 2, foo; 3');
    expect(result.values).toEqual([1, 2, 3]);
    expect(result.invalidTokens).toEqual(['abc', 'foo']);
  });

  it('空文本与纯分隔符返回空结果', () => {
    expect(parseNumbers('').values).toEqual([]);
    expect(parseNumbers('   ,;\n').values).toEqual([]);
  });
});

describe('quantileSorted', () => {
  it('线性插值分位数与手算一致', () => {
    const sorted = [1, 2, 3, 4];
    expect(quantileSorted(sorted, 0)).toBe(1);
    expect(quantileSorted(sorted, 0.25)).toBe(1.75);
    expect(quantileSorted(sorted, 0.5)).toBe(2.5);
    expect(quantileSorted(sorted, 0.75)).toBe(3.25);
    expect(quantileSorted(sorted, 1)).toBe(4);
  });

  it('奇数长度分位命中整数位置', () => {
    expect(quantileSorted([1, 2, 2, 3, 4], 0.25)).toBe(2);
    expect(quantileSorted([1, 2, 2, 3, 4], 0.75)).toBe(3);
  });

  it('空数组返回 NaN，单元素恒为自身', () => {
    expect(Number.isNaN(quantileSorted([], 0.5))).toBe(true);
    expect(quantileSorted([42], 0.25)).toBe(42);
  });
});

describe('computeStats', () => {
  it('数据集 1,2,2,3,4 各指标正确', () => {
    const stats = computeStats([1, 2, 2, 3, 4]);
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(5);
    expect(stats!.sum).toBe(12);
    expect(stats!.mean).toBeCloseTo(2.4, 10);
    expect(stats!.median).toBe(2);
    expect(stats!.mode).toEqual([2]);
    expect(stats!.min).toBe(1);
    expect(stats!.max).toBe(4);
    expect(stats!.range).toBe(3);
    expect(stats!.q1).toBe(2);
    expect(stats!.q3).toBe(3);
    expect(stats!.populationVariance).toBeCloseTo(1.04, 10);
    expect(stats!.populationStdDev).toBeCloseTo(1.0198039, 6);
    expect(stats!.sampleVariance).toBeCloseTo(1.3, 10);
    expect(stats!.sampleStdDev).toBeCloseTo(1.1401754, 6);
  });

  it('偶数个数据中位数取中间两数均值', () => {
    const stats = computeStats([4, 1, 3, 2]);
    expect(stats!.median).toBe(2.5);
    expect(stats!.q1).toBe(1.75);
    expect(stats!.q3).toBe(3.25);
    expect(stats!.sorted).toEqual([1, 2, 3, 4]);
  });

  it('支持多众数并按首次出现顺序返回', () => {
    expect(computeStats([3, 1, 2, 1, 3, 2])!.mode).toEqual([3, 1, 2]);
    expect(computeStats([1, 1, 2, 2, 3])!.mode).toEqual([1, 2]);
  });

  it('所有值唯一时无众数', () => {
    expect(computeStats([1, 2, 3, 4])!.mode).toEqual([]);
  });

  it('单元素：方差为 0、样本标准差不可计算、分位数为自身', () => {
    const stats = computeStats([5])!;
    expect(stats.mean).toBe(5);
    expect(stats.median).toBe(5);
    expect(stats.populationVariance).toBe(0);
    expect(stats.populationStdDev).toBe(0);
    expect(stats.sampleVariance).toBeNull();
    expect(stats.sampleStdDev).toBeNull();
    expect(stats.q1).toBe(5);
    expect(stats.q3).toBe(5);
    expect(stats.range).toBe(0);
  });

  it('空数组返回 null', () => {
    expect(computeStats([])).toBeNull();
  });

  it('sorted 不修改输入数组顺序', () => {
    const input = [3, 1, 2];
    computeStats(input);
    expect(input).toEqual([3, 1, 2]);
  });
});

describe('formatNumber', () => {
  it('去除尾零并兜底非有限值', () => {
    expect(formatNumber(2.4)).toBe('2.4');
    expect(formatNumber(1.019803902718557)).toBe('1.019804');
    expect(formatNumber(1 / 0)).toBe('—');
    expect(formatNumber(Number.NaN)).toBe('—');
  });
});
