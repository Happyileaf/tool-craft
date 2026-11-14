import { describe, expect, it } from 'vitest';
import { buildFeed, escapeXml, parseFeedDate } from './feed';

const item = {
  title: 'A & B <tag>',
  link: 'https://example.com/posts/1',
  pubDate: '2026-11-15',
  description: 'Includes "quotes" and \'apostrophes\'',
};

const items = [item];

const baseOptions = {
  format: 'rss' as const,
  title: 'Example & Feed',
  siteLink: 'https://example.com',
  description: 'Notes <and> updates',
  language: 'zh-CN',
  updatedAt: '2026-11-15T08:00:00Z',
  items,
};

describe('escapeXml', () => {
  it('转义 XML 保留字符', () => {
    expect(escapeXml(`a&b<c>d"e'f`)).toBe('a&amp;b&lt;c&gt;d&quot;e&apos;f');
  });
});

describe('parseFeedDate', () => {
  it('将 YYYY-MM-DD 解析为 UTC 零点', () => {
    expect(parseFeedDate('2026-11-15')?.toISOString()).toBe('2026-11-15T00:00:00.000Z');
  });

  it('支持 ISO 8601 与 RFC 822', () => {
    expect(parseFeedDate('2026-11-15T08:30:00Z')?.toISOString()).toBe(
      '2026-11-15T08:30:00.000Z',
    );
    expect(parseFeedDate('Sun, 15 Nov 2026 08:30:00 GMT')?.toISOString()).toBe(
      '2026-11-15T08:30:00.000Z',
    );
  });

  it('非法输入返回 null', () => {
    expect(parseFeedDate('')).toBeNull();
    expect(parseFeedDate('not-a-date')).toBeNull();
    expect(parseFeedDate('2026-02-30')).toBeNull();
  });
});

describe('buildFeed RSS', () => {
  it('生成 RSS 2.0 必需结构并转义内容', () => {
    const xml = buildFeed(baseOptions);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<title>Example &amp; Feed</title>');
    expect(xml).toContain('<link>https://example.com</link>');
    expect(xml).toContain('<description>Notes &lt;and&gt; updates</description>');
    expect(xml).toContain('<language>zh-CN</language>');
    expect(xml).toContain('<lastBuildDate>Sun, 15 Nov 2026 08:00:00 GMT</lastBuildDate>');
    expect(xml).toContain('<guid isPermaLink="true">https://example.com/posts/1</guid>');
    expect(xml).toContain('<pubDate>Sun, 15 Nov 2026 00:00:00 GMT</pubDate>');
    expect(xml).toContain('<title>A &amp; B &lt;tag&gt;</title>');
  });

  it('无条目时仍生成合法空 feed', () => {
    const xml = buildFeed({ ...baseOptions, items: [], updatedAt: '' });
    expect(xml).toContain('<channel>');
    expect(xml).not.toContain('<item>');
    expect(xml).not.toContain('<lastBuildDate>');
  });

  it('缺省更新时间时取最新条目时间', () => {
    const xml = buildFeed({ ...baseOptions, updatedAt: '' });
    expect(xml).toContain('<lastBuildDate>Sun, 15 Nov 2026 00:00:00 GMT</lastBuildDate>');
  });

  it('校验必填项与链接格式', () => {
    expect(() => buildFeed({ ...baseOptions, title: '  ' })).toThrow(/站点标题/);
    expect(() => buildFeed({ ...baseOptions, siteLink: '/relative' })).toThrow(/站点链接/);
    expect(() =>
      buildFeed({ ...baseOptions, items: [{ ...item, link: 'ftp://example.com' }] }),
    ).toThrow(/http\/https/);
    expect(() =>
      buildFeed({ ...baseOptions, items: [{ ...item, pubDate: 'bad-date' }] }),
    ).toThrow(/发布时间/);
  });
});

describe('buildFeed Atom', () => {
  it('生成 Atom 1.0 文档并使用 RFC 3339 时间', () => {
    const xml = buildFeed({ ...baseOptions, format: 'atom' });
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('<subtitle>Notes &lt;and&gt; updates</subtitle>');
    expect(xml).toContain('<link href="https://example.com"/>');
    expect(xml).toContain('<updated>2026-11-15T08:00:00.000Z</updated>');
    expect(xml).toContain('<entry>');
    expect(xml).toContain('<summary>Includes &quot;quotes&quot; and &apos;apostrophes&apos;</summary>');
    expect(xml).toContain('<updated>2026-11-15T00:00:00.000Z</updated>');
    expect(xml).toContain('<id>https://example.com/posts/1</id>');
  });

  it('无条目且无更新时间时 Atom 给出明确错误', () => {
    expect(() => buildFeed({ ...baseOptions, format: 'atom', items: [], updatedAt: '' })).toThrow(
      /Atom 输出需要/,
    );
  });
});
