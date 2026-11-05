import { describe, expect, it } from 'vitest';
import {
  LANGUAGE_DIFFERENCES,
  REGEX_CATEGORIES,
  REGEX_ENTRIES,
} from './regexSyntaxData';
import {
  filterEntries,
  getFlagEntries,
  groupByCategory,
  validateAllEntries,
  validateEntry,
} from './regexSyntax';

describe('静态数据完整性', () => {
  it('覆盖至少 8 个分类与 30 个语法条目', () => {
    expect(REGEX_CATEGORIES.length).toBeGreaterThanOrEqual(8);
    expect(REGEX_ENTRIES.length).toBeGreaterThanOrEqual(30);
  });

  it('每个条目字段完整且 id 唯一', () => {
    const ids = new Set<string>();
    for (const entry of REGEX_ENTRIES) {
      expect(entry.syntax.length).toBeGreaterThan(0);
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.nameEn.length).toBeGreaterThan(0);
      expect(entry.explanation.length).toBeGreaterThan(0);
      expect(entry.matchExamples.length).toBeGreaterThan(0);
      expect(entry.notMatchExamples.length).toBeGreaterThan(0);
      expect(ids.has(entry.id)).toBe(false);
      ids.add(entry.id);
    }
  });

  it('每个条目都能归入已声明的分类', () => {
    const categoryIds = new Set(REGEX_CATEGORIES.map((item) => item.id));
    for (const entry of REGEX_ENTRIES) {
      expect(categoryIds.has(entry.category)).toBe(true);
    }
  });

  it('语言差异说明非空且覆盖 lookbehind 主题', () => {
    expect(LANGUAGE_DIFFERENCES.length).toBeGreaterThanOrEqual(3);
    expect(
      LANGUAGE_DIFFERENCES.some((item) => item.topic.toLowerCase().includes('lookbehind')),
    ).toBe(true);
  });
});

describe('原生 RegExp 实测验证', () => {
  it('全部条目均可构造且所有样例与预期一致', () => {
    const results = validateAllEntries();
    expect(results).toHaveLength(REGEX_ENTRIES.length);
    for (const result of results) {
      if (!result.constructable || !result.allConsistent) {
        const detail = result.checks
          .filter((check) => !check.consistent)
          .map((check) => `${JSON.stringify(check.text)} 期望=${check.expectedMatch} 实测=${check.actualMatch}`)
          .join('; ');
        throw new Error(
          `条目 ${result.entry.id} 验证失败：${result.error ?? detail}`,
        );
      }
      expect(result.constructable).toBe(true);
      expect(result.allConsistent).toBe(true);
    }
  });

  it('每条命中样例都返回实际匹配片段而非静态文本', () => {
    for (const result of validateAllEntries()) {
      const matchedChecks = result.checks.filter((check) => check.expectedMatch);
      expect(matchedChecks.length).toBeGreaterThan(0);
      for (const check of matchedChecks) {
        expect(check.actualMatch).toBe(true);
        expect(check.matchedText).not.toBeNull();
        expect(check.text.includes(check.matchedText as string)).toBe(true);
      }
    }
  });

  it('环视断言的负向样例不会因回溯而误命中', () => {
    const negativeLookahead = REGEX_ENTRIES.find((item) => item.id === 'negative-lookahead');
    const negativeLookbehind = REGEX_ENTRIES.find((item) => item.id === 'negative-lookbehind');
    expect(negativeLookahead).toBeDefined();
    expect(negativeLookbehind).toBeDefined();
    expect(validateEntry(negativeLookahead!).allConsistent).toBe(true);
    expect(validateEntry(negativeLookbehind!).allConsistent).toBe(true);
  });

  it('非法正则返回 constructable=false 而不抛异常', () => {
    const result = validateEntry({
      ...REGEX_ENTRIES[0]!,
      pattern: '([unclosed',
      flags: '',
    });
    expect(result.constructable).toBe(false);
    expect(result.allConsistent).toBe(false);
    expect(result.error).not.toBeNull();
  });
});

describe('filterEntries 搜索', () => {
  it('搜索 look 命中全部四个环视条目', () => {
    const hits = filterEntries('look').map((entry) => entry.id).sort();
    expect(hits).toEqual(
      [
        'negative-lookahead',
        'negative-lookbehind',
        'positive-lookahead',
        'positive-lookbehind',
      ].sort(),
    );
  });

  it('空关键字返回全部条目', () => {
    expect(filterEntries('')).toHaveLength(REGEX_ENTRIES.length);
    expect(filterEntries('   ')).toHaveLength(REGEX_ENTRIES.length);
  });

  it('支持按中文名与语法符号搜索', () => {
    expect(filterEntries('数字').some((entry) => entry.id === 'digit')).toBe(true);
    expect(filterEntries('\\d').some((entry) => entry.id === 'digit')).toBe(true);
  });

  it('无命中时返回空数组', () => {
    expect(filterEntries('不存在的语法zzz')).toEqual([]);
  });
});

describe('groupByCategory 与 getFlagEntries', () => {
  it('分组保持分类顺序且条目总数不变', () => {
    const groups = groupByCategory(REGEX_ENTRIES);
    expect(groups).toHaveLength(REGEX_CATEGORIES.length);
    expect(groups[0]!.category.id).toBe(REGEX_CATEGORIES[0]!.id);
    const total = groups.reduce((sum, group) => sum + group.entries.length, 0);
    expect(total).toBe(REGEX_ENTRIES.length);
  });

  it('过滤后分组自动剔除空分类', () => {
    const groups = groupByCategory(filterEntries('look'));
    expect(groups).toHaveLength(1);
    expect(groups[0]!.category.id).toBe('assertion');
  });

  it('标志位条目恰好包含 g i m s u y 六个', () => {
    const flags = getFlagEntries().map((entry) => entry.syntax).sort();
    expect(flags).toEqual(['g', 'i', 'm', 's', 'u', 'y']);
  });
});
