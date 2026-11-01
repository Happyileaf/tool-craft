import { describe, expect, it } from 'vitest';
import {
  compareTexts,
  diceCoefficient,
  jaroWinkler,
  lcsLength,
  levenshtein,
  levenshteinAlignment,
} from './similarity';

describe('levenshtein', () => {
  it('相同文本距离为 0', () => {
    expect(levenshtein('kitten', 'kitten')).toBe(0);
  });

  it('经典 kitten→sitting 距离为 3', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });

  it('空串距离等于另一串长度', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
    expect(levenshtein('', '')).toBe(0);
  });

  it('中文按码元计数', () => {
    expect(levenshtein('你好世界', '你好啊世界')).toBe(1);
  });
});

describe('lcsLength', () => {
  it('ABCBDAB 与 BDCABA 的 LCS 长度为 4', () => {
    expect(lcsLength('ABCBDAB', 'BDCABA')).toBe(4);
  });

  it('相同文本 LCS 等于自身长度', () => {
    expect(lcsLength('hello', 'hello')).toBe(5);
  });

  it('无公共字符时 LCS 为 0', () => {
    expect(lcsLength('abc', 'xyz')).toBe(0);
  });

  it('空串 LCS 为 0', () => {
    expect(lcsLength('', 'abc')).toBe(0);
  });
});

describe('jaroWinkler', () => {
  it('相同文本为 1', () => {
    expect(jaroWinkler('hello', 'hello')).toBeCloseTo(1, 10);
  });

  it('MARTHA 与 MARHTA 约为 0.9611（jellyfish 参考值）', () => {
    expect(jaroWinkler('MARTHA', 'MARHTA')).toBeCloseTo(0.9611, 4);
  });

  it('DWAYNE 与 DUANE 约为 0.8400', () => {
    expect(jaroWinkler('DWAYNE', 'DUANE')).toBeCloseTo(0.84, 3);
  });

  it('完全不匹配接近 0（无公共前缀）', () => {
    expect(jaroWinkler('abc', 'xyz')).toBe(0);
  });

  it('空串为 0', () => {
    expect(jaroWinkler('', 'abc')).toBe(0);
    expect(jaroWinkler('', '')).toBe(1);
  });
});

describe('diceCoefficient', () => {
  it('相同文本为 1', () => {
    expect(diceCoefficient('night', 'night')).toBeCloseTo(1, 10);
  });

  it('night 与 nacht 为 0.25', () => {
    expect(diceCoefficient('night', 'nacht')).toBeCloseTo(0.25, 10);
  });

  it('无公共 bigram 为 0', () => {
    expect(diceCoefficient('abc', 'xyz')).toBe(0);
  });

  it('中文双字组：你好世界 与 你好啊世界', () => {
    // A: 你好 好世 世界；B: 你好 好啊 啊世 世界；交集 2 → 4/(3+4)
    expect(diceCoefficient('你好世界', '你好啊世界')).toBeCloseTo(4 / 7, 10);
  });

  it('不足两个字符返回 0', () => {
    expect(diceCoefficient('a', 'a')).toBe(1); // 相同文本提前判 1
    expect(diceCoefficient('a', 'b')).toBe(0);
  });
});

describe('levenshteinAlignment', () => {
  it('相同文本全部 equal', () => {
    const ops = levenshteinAlignment('abc', 'abc');
    expect(ops.every((op) => op.type === 'equal')).toBe(true);
    expect(ops).toHaveLength(3);
  });

  it('kitten→sitting 对齐代价合计为 3', () => {
    const ops = levenshteinAlignment('kitten', 'sitting');
    const cost = ops.filter((op) => op.type !== 'equal').length;
    expect(cost).toBe(3);
  });

  it('插入序列正确', () => {
    const ops = levenshteinAlignment('ac', 'abc');
    expect(ops).toEqual([
      { type: 'equal', aChar: 'a', bChar: 'a' },
      { type: 'insert', bChar: 'b' },
      { type: 'equal', aChar: 'c', bChar: 'c' },
    ]);
  });

  it('删除序列正确', () => {
    const ops = levenshteinAlignment('abc', 'ac');
    expect(ops).toEqual([
      { type: 'equal', aChar: 'a', bChar: 'a' },
      { type: 'delete', aChar: 'b' },
      { type: 'equal', aChar: 'c', bChar: 'c' },
    ]);
  });

  it('空串对齐', () => {
    expect(levenshteinAlignment('', '')).toEqual([]);
    expect(levenshteinAlignment('ab', '')).toEqual([
      { type: 'delete', aChar: 'a' },
      { type: 'delete', aChar: 'b' },
    ]);
  });
});

describe('compareTexts 汇总', () => {
  it('完全相同各指标为 1', () => {
    const result = compareTexts('data', 'data');
    expect(result.levenshtein).toBe(0);
    expect(result.levenshteinRatio).toBe(1);
    expect(result.lcsRatio).toBe(1);
    expect(result.jaroWinkler).toBe(1);
    expect(result.dice).toBe(1);
    expect(result.lengthA).toBe(4);
  });

  it('两个空串视为完全相同', () => {
    const result = compareTexts('', '');
    expect(result.levenshteinRatio).toBe(1);
    expect(result.lcsRatio).toBe(1);
  });

  it('忽略大小写选项生效', () => {
    expect(compareTexts('ABC', 'abc').levenshtein).toBe(3);
    const ignored = compareTexts('ABC', 'abc', { ignoreCase: true });
    expect(ignored.levenshtein).toBe(0);
    expect(ignored.levenshteinRatio).toBe(1);
  });

  it('kitten/sitting 归一化相似度为 4/7', () => {
    const result = compareTexts('kitten', 'sitting');
    expect(result.levenshteinRatio).toBeCloseTo(1 - 3 / 7, 10);
    expect(result.alignment.length).toBeGreaterThan(0);
  });
});
