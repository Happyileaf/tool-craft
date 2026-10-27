import { describe, expect, it } from 'vitest';
import { analyzeEntropy } from './entropy';

describe('analyzeEntropy', () => {
  it('空文本返回零值结构', () => {
    const result = analyzeEntropy('');
    expect(result.length).toBe(0);
    expect(result.uniqueCount).toBe(0);
    expect(result.entropy).toBe(0);
    expect(result.maxEntropy).toBe(0);
    expect(result.normalizedEntropy).toBe(0);
    expect(result.minBits).toBe(0);
    expect(result.frequencies).toEqual([]);
  });

  it('单字符重复输入熵为 0，归一化熵为 0', () => {
    const result = analyzeEntropy('aaaa');
    expect(result.length).toBe(4);
    expect(result.uniqueCount).toBe(1);
    expect(result.entropy).toBeCloseTo(0, 10);
    expect(result.maxEntropy).toBeCloseTo(0, 10);
    expect(result.normalizedEntropy).toBe(0);
    expect(result.minBits).toBe(0);
  });

  it('等概率两字符熵为 1 bit/字符', () => {
    const result = analyzeEntropy('ab');
    expect(result.entropy).toBeCloseTo(1, 10);
    expect(result.maxEntropy).toBeCloseTo(1, 10);
    expect(result.normalizedEntropy).toBeCloseTo(1, 10);
  });

  it('等概率 4/8/16 种字符对应 2/3/4 bit', () => {
    expect(analyzeEntropy('abcd').entropy).toBeCloseTo(2, 10);
    expect(analyzeEntropy('abcdefgh').entropy).toBeCloseTo(3, 10);
    expect(analyzeEntropy('abcdefghijklmnop').entropy).toBeCloseTo(4, 10);
  });

  it('非等概率分布熵介于 0 与 log2(n) 之间', () => {
    const result = analyzeEntropy('aaab');
    expect(result.entropy).toBeGreaterThan(0);
    expect(result.entropy).toBeLessThan(1);
  });

  it('频率分布计数总和等于文本长度，概率之和为 1', () => {
    const text = 'the quick brown fox';
    const result = analyzeEntropy(text);
    const totalCount = result.frequencies.reduce((sum, item) => sum + item.count, 0);
    const totalProbability = result.frequencies.reduce((sum, item) => sum + item.probability, 0);
    expect(totalCount).toBe(Array.from(text).length);
    expect(totalProbability).toBeCloseTo(1, 10);
  });

  it('频率分布按计数降序排列', () => {
    const result = analyzeEntropy('aaabbc');
    expect(result.frequencies.map((item) => item.char)).toEqual(['a', 'b', 'c']);
    expect(result.frequencies.map((item) => item.count)).toEqual([3, 2, 1]);
  });

  it('minBits = ceil(entropy × length)', () => {
    const result = analyzeEntropy('aaab');
    expect(result.minBits).toBe(Math.ceil(result.entropy * result.length));
  });

  it('代理对 emoji 按一个字符计数', () => {
    const result = analyzeEntropy('a😀b😀');
    expect(result.length).toBe(4);
    expect(result.uniqueCount).toBe(3);
    const emojiEntry = result.frequencies.find((item) => item.char === '😀');
    expect(emojiEntry?.count).toBe(2);
  });

  it('空白与换行计入长度与频率', () => {
    const result = analyzeEntropy('a b\n');
    expect(result.length).toBe(4);
    expect(result.frequencies.find((item) => item.char === ' ')?.count).toBe(1);
    expect(result.frequencies.find((item) => item.char === '\n')?.count).toBe(1);
  });

  it('256 种等概率字符最大熵为 8 bit', () => {
    const chars = Array.from({ length: 256 }, (_, index) =>
      String.fromCodePoint(index + 256),
    ).join('');
    const result = analyzeEntropy(chars);
    expect(result.uniqueCount).toBe(256);
    expect(result.entropy).toBeCloseTo(8, 10);
    expect(result.maxEntropy).toBeCloseTo(8, 10);
  });
});
