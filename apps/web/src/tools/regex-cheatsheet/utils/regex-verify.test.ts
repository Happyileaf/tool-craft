import { describe, expect, it } from 'vitest';
import { CATEGORY_LABELS, ENGINE_DIFFERENCES, REGEX_ENTRIES } from './regex-data';
import { filterEntries, getCoverageStats, verifyAllEntries } from './regex-verify';

describe('REGEX_ENTRIES 数据集完整性', () => {
  it('覆盖至少 8 个分类、30 个条目', () => {
    const categories = new Set(REGEX_ENTRIES.map((entry) => entry.category));
    expect(categories.size).toBeGreaterThanOrEqual(8);
    expect(REGEX_ENTRIES.length).toBeGreaterThanOrEqual(30);
  });

  it('id 与 syntax 无重复', () => {
    const ids = REGEX_ENTRIES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('每个条目字段完整且至少有一个匹配样例', () => {
    REGEX_ENTRIES.forEach((entry) => {
      expect(entry.syntax).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.description.length).toBeGreaterThan(10);
      expect(entry.pattern).toBeTruthy();
      expect(entry.matchSamples.length).toBeGreaterThan(0);
      expect(CATEGORY_LABELS[entry.category]).toBeTruthy();
    });
  });

  it('标志位条目完整覆盖 g i m s u y', () => {
    const flagEntries = REGEX_ENTRIES.filter((entry) => entry.category === 'flag');
    const flags = flagEntries.map((entry) => entry.syntax);
    ['g', 'i', 'm', 's', 'u', 'y'].forEach((flag) => {
      expect(flags).toContain(flag);
    });
  });

  it('提供语言差异说明区块', () => {
    expect(ENGINE_DIFFERENCES.length).toBeGreaterThanOrEqual(4);
  });
});

describe('verifyAllEntries 原生 RegExp 实测', () => {
  const verified = verifyAllEntries();

  it('全部条目均可构造为合法 RegExp', () => {
    const broken = verified.filter((item) => !item.constructible);
    expect(broken.map((item) => `${item.entry.id}: ${item.error}`)).toEqual([]);
  });

  it('匹配样例全部命中、不匹配样例全部不命中', () => {
    const failed = verified.filter((item) => !item.allExpectationsMet);
    expect(
      failed.map((item) => ({
        id: item.entry.id,
        matchChecks: item.matchChecks,
        rejectChecks: item.rejectChecks,
      })),
    ).toEqual([]);
  });

  it('零宽断言条目返回的 matched 为 true', () => {
    const lookahead = verified.find((item) => item.entry.id === 'lookahead');
    expect(lookahead?.matchChecks[0]?.matched).toBe(true);
  });

  it('实测结果包含具体匹配文本', () => {
    const digit = verified.find((item) => item.entry.id === 'digit');
    expect(digit?.matchChecks[0]?.matchText).toBe('123');
  });
});

describe('filterEntries 搜索', () => {
  it('搜索 look 过滤出 lookahead / lookbehind 条目', () => {
    const results = filterEntries('look');
    const ids = results.map((entry) => entry.id);
    expect(ids).toContain('lookahead');
    expect(ids).toContain('lookbehind');
    expect(ids).toContain('negative-lookahead');
    expect(ids).toContain('negative-lookbehind');
  });

  it('支持中文关键字搜索', () => {
    expect(filterEntries('命名组').map((entry) => entry.id)).toContain('named-group');
    expect(filterEntries('标志').length).toBeGreaterThanOrEqual(6);
  });

  it('分类限定生效', () => {
    const anchors = filterEntries('', 'anchor');
    expect(anchors.every((entry) => entry.category === 'anchor')).toBe(true);
  });

  it('空关键字返回全部', () => {
    expect(filterEntries('')).toHaveLength(REGEX_ENTRIES.length);
  });

  it('无命中时返回空数组', () => {
    expect(filterEntries('zzz-not-exist')).toEqual([]);
  });
});

describe('getCoverageStats', () => {
  it('返回分类与条目数量', () => {
    const stats = getCoverageStats();
    expect(stats.categories).toBeGreaterThanOrEqual(8);
    expect(stats.entries).toBe(REGEX_ENTRIES.length);
  });
});
