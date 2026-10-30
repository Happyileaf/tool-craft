import { describe, expect, it } from 'vitest';
import { countWords, parseStopWords, sortWords, toCsv, tokenize } from './frequency';

describe('tokenize 分词', () => {
  it('latin 模式：Unicode 字母连字、撇号与连字符，转小写', () => {
    expect(tokenize("Don't stop, state-of-the-art!", 'latin')).toEqual([
      "don't",
      'stop',
      'state-of-the-art',
    ]);
  });

  it('纯数字不产生词条，包含字母的字母数字混合保留', () => {
    expect(tokenize('abc123 42 7zip', 'latin')).toEqual(['abc123', '7zip']);
  });

  it('支持重音等非 ASCII 拉丁字母', () => {
    expect(tokenize('Café résumé café', 'latin')).toEqual(['café', 'résumé', 'café']);
  });

  it('cjk-chars 模式：拉丁词 + 逐字汉字', () => {
    expect(tokenize('hello 你好世界', 'cjk-chars')).toEqual([
      'hello',
      '你',
      '好',
      '世',
      '界',
    ]);
  });

  it('cjk-bigrams 模式：汉字二元组，单字退化为单字词', () => {
    expect(tokenize('我爱北京', 'cjk-bigrams')).toEqual(['我爱', '爱北', '北京']);
    expect(tokenize('好', 'cjk-bigrams')).toEqual(['好']);
  });
});

describe('countWords 统计', () => {
  it('计数、频率基于过滤后的词次', () => {
    const { words, totalTokens } = countWords('the quick brown fox the quick fox fox', {
      mode: 'latin',
    });
    expect(totalTokens).toBe(6);
    const fox = words.find((item) => item.word === 'fox');
    expect(fox?.count).toBe(3);
    expect(fox?.frequency).toBeCloseTo(3 / 6);
    expect(words.some((item) => item.word === 'the')).toBe(false);
  });

  it('关闭内置停用词后 the 参与统计', () => {
    const { words } = countWords('the the cat', { mode: 'latin', useDefaultStopWords: false });
    expect(words.find((item) => item.word === 'the')?.count).toBe(2);
  });

  it('自定义停用词与最短词长生效', () => {
    const { words } = countWords('a ab abc ab abc abc', {
      mode: 'latin',
      useDefaultStopWords: false,
      customStopWords: parseStopWords('abc'),
      minLength: 2,
    });
    expect(words).toEqual([{ word: 'ab', count: 2, frequency: 1 }]);
  });

  it('空文本总词次为 0，不产生除零', () => {
    const result = countWords('', { mode: 'latin' });
    expect(result).toEqual({ words: [], totalTokens: 0 });
  });
});

describe('sortWords 排序与截取', () => {
  const sample = countWords('banana banana apple cherry cherry cherry', {
    mode: 'latin',
    useDefaultStopWords: false,
  }).words;

  it('次数降序、次数升序、字母序', () => {
    expect(sortWords(sample, 'count-desc').map((w) => w.word)).toEqual([
      'cherry',
      'banana',
      'apple',
    ]);
    expect(sortWords(sample, 'count-asc').map((w) => w.word)).toEqual([
      'apple',
      'banana',
      'cherry',
    ]);
    expect(sortWords(sample, 'alpha').map((w) => w.word)).toEqual([
      'apple',
      'banana',
      'cherry',
    ]);
  });

  it('limit 截取 Top N', () => {
    expect(sortWords(sample, 'count-desc', 2)).toHaveLength(2);
    expect(sortWords(sample, 'count-desc', 2)[0]?.word).toBe('cherry');
  });

  it('同次数按字母序稳定排列', () => {
    const tied = countWords('b b a a c c', { mode: 'latin', useDefaultStopWords: false }).words;
    expect(sortWords(tied, 'count-desc').map((w) => w.word)).toEqual(['a', 'b', 'c']);
  });
});

describe('toCsv 导出', () => {
  it('输出表头与转义含逗号 / 引号的词条', () => {
    const words = [
      { word: 'a,b', count: 2, frequency: 0.5 },
      { word: 'say "hi"', count: 1, frequency: 0.25 },
    ];
    const csv = toCsv(words);
    expect(csv.split('\n')[0]).toBe('word,count,frequency');
    expect(csv).toContain('"a,b",2,0.500000');
    expect(csv).toContain('"say ""hi""",1,0.250000');
  });
});
