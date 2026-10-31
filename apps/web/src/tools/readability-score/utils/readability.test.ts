import { describe, expect, it } from 'vitest';
import {
  analyzeReadability,
  countSentences,
  countSyllables,
  describeGradeLevel,
  getReadingEaseBand,
  tokenizeWords,
} from './readability';

describe('countSentences', () => {
  it('按 . ! ? 后接空白切分', () => {
    expect(countSentences('Hello. Are you OK? Yes!')).toBe(3);
  });

  it('小数与缩写噪声不在无空白处切开', () => {
    expect(countSentences('Pi is 3.14 today.')).toBe(1);
  });

  it('无字母片段不计句', () => {
    expect(countSentences('... 123 !!!')).toBe(0);
  });
});

describe('tokenizeWords', () => {
  it("撇号与连字符词整体计 1 个，转小写", () => {
    expect(tokenizeWords("Don't use well-known words.")).toEqual([
      "don't",
      'use',
      'well-known',
      'words',
    ]);
  });

  it('纯标点与数字为空', () => {
    expect(tokenizeWords('123 ... ---')).toEqual([]);
  });
});

describe('countSyllables', () => {
  it('常见单词音节数', () => {
    expect(countSyllables('the')).toBe(1);
    expect(countSyllables('cat')).toBe(1);
    expect(countSyllables('mat')).toBe(1);
    expect(countSyllables('little')).toBe(2);
    expect(countSyllables('table')).toBe(2);
    expect(countSyllables('needed')).toBe(2);
    expect(countSyllables('liked')).toBe(1);
    expect(countSyllables('sentence')).toBe(2);
    expect(countSyllables('elephant')).toBe(3);
  });

  it('空串返回 0，非空词至少 1', () => {
    expect(countSyllables('')).toBe(0);
    expect(countSyllables('str')).toBe(1);
  });
});

describe('analyzeReadability', () => {
  it('经典句：RE=116.145、Grade=-1.45（容差 0.01）', () => {
    const result = analyzeReadability('The cat sat on the mat.');
    expect(result).not.toBeNull();
    expect(result?.sentences).toBe(1);
    expect(result?.words).toBe(6);
    expect(result?.syllables).toBe(6);
    expect(result?.readingEase).toBeCloseTo(116.145, 2);
    expect(result?.gradeLevel).toBeCloseTo(-1.45, 2);
  });

  it('长句与长词使 RE 下降、Grade 上升', () => {
    const easy = analyzeReadability('The cat sat on the mat.')!;
    const hard = analyzeReadability(
      'Notwithstanding institutional complexities, interdisciplinary methodologies facilitate operationalization.',
    )!;
    expect(hard.readingEase).toBeLessThan(easy.readingEase);
    expect(hard.gradeLevel).toBeGreaterThan(easy.gradeLevel);
  });

  it('空字符串与纯标点数字返回 null', () => {
    expect(analyzeReadability('')).toBeNull();
    expect(analyzeReadability('123 ... !!!')).toBeNull();
  });
});

describe('getReadingEaseBand', () => {
  it('分级阈值映射正确', () => {
    expect(getReadingEaseBand(95).label).toBe('Very Easy');
    expect(getReadingEaseBand(85).label).toBe('Easy');
    expect(getReadingEaseBand(75).label).toBe('Fairly Easy');
    expect(getReadingEaseBand(65).label).toBe('Plain English');
    expect(getReadingEaseBand(55).label).toBe('Fairly Difficult');
    expect(getReadingEaseBand(40).label).toBe('Difficult');
    expect(getReadingEaseBand(10).label).toBe('Very Confusing');
  });
});

describe('describeGradeLevel', () => {
  it('端点与常规年级', () => {
    expect(describeGradeLevel(-1.45)).toContain('低于 1 年级');
    expect(describeGradeLevel(8)).toContain('8.0');
    expect(describeGradeLevel(13)).toContain('大学');
  });
});
