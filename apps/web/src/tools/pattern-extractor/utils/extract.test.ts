import { describe, expect, it } from 'vitest';
import { collectMatches, extractPatterns, resultToText } from './extract';
import { PATTERN_MAP } from './patterns';

describe('collectMatches', () => {
  it('按首次出现顺序去重并计数', () => {
    const { items, total } = collectMatches('a@x.com b@x.com a@x.com', PATTERN_MAP.email!.regex);
    expect(items).toEqual([
      { value: 'a@x.com', count: 2 },
      { value: 'b@x.com', count: 1 },
    ]);
    expect(total).toBe(3);
  });

  it('零宽匹配不会死循环', () => {
    const { total } = collectMatches('abc', /(?:)/g);
    expect(total).toBe(4);
  });
});

describe('extractPatterns', () => {
  const sample = [
    '联系：alice@example.com 与 bob@test.org，重复 alice@example.com。',
    '站点 https://example.com/p?q=1 和 http://t.cn',
    'IP 192.168.0.1 与 999.1.1.1（非法段不匹配），IPv6 ::1 与 2001:db8::1',
    'UUID 550e8400-e29b-41d4-a716-446655440000',
    '日期 2024-02-29 12:30 色值 #f00 与 #1A2B3C',
  ].join('\n');

  it('多模式组合分组、去重、计数', () => {
    const result = extractPatterns(sample, ['email', 'url', 'ipv4', 'ipv6', 'uuid', 'datetime', 'hexColor']);
    const byKey: Record<string, (typeof result.groups)[number]> = Object.fromEntries(
      result.groups.map((group) => [group.key, group]),
    );

    expect(byKey.email!.items).toEqual([
      { value: 'alice@example.com', count: 2 },
      { value: 'bob@test.org', count: 1 },
    ]);
    expect(byKey.url!.items.map((item) => item.value)).toEqual([
      'https://example.com/p?q=1',
      'http://t.cn',
    ]);
    expect(byKey.ipv4!.items.map((item) => item.value)).toEqual(['192.168.0.1']);
    expect(byKey.ipv6!.items.map((item) => item.value)).toEqual(['::1', '2001:db8::1']);
    expect(byKey.uuid!.items).toHaveLength(1);
    expect(byKey.datetime!.items.map((item) => item.value)).toEqual(['2024-02-29 12:30']);
    expect(byKey.hexColor!.items.map((item) => item.value)).toEqual(['#f00', '#1A2B3C']);
  });

  it('空输入与未选模式返回空结果', () => {
    expect(extractPatterns('', ['email']).totalCount).toBe(0);
    expect(extractPatterns('a@x.com', []).groups).toHaveLength(0);
  });

  it('自定义正则可追加提取并支持忽略大小写', () => {
    const result = extractPatterns('foo FOO bar', [], {
      name: 'foo',
      source: 'foo',
      ignoreCase: true,
    });
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]!.total).toBe(2);
    expect(result.groups[0]!.items).toEqual([
      { value: 'foo', count: 1 },
      { value: 'FOO', count: 1 },
    ]);
  });

  it('非法自定义正则仅该项报错，不影响内置模式', () => {
    const result = extractPatterns('a@x.com', ['email'], { name: '', source: '(' });
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0]!.error).toBeNull();
    expect(result.groups[0]!.total).toBe(1);
    expect(result.groups[1]!.error).not.toBeNull();
    expect(result.groups[1]!.items).toEqual([]);
  });

  it('空源码的自定义模式被忽略', () => {
    const result = extractPatterns('a@x.com', ['email'], { name: '', source: '   ' });
    expect(result.groups).toHaveLength(1);
  });
});

describe('resultToText', () => {
  it('输出分组文本与合计', () => {
    const result = extractPatterns('a@x.com a@x.com', ['email']);
    const text = resultToText(result);
    expect(text).toContain('# 邮箱（1 项 / 2 次）');
    expect(text).toContain('a@x.com\t×2');
    expect(text).toContain('合计：去重 1 项，命中 2 次');
  });
});
