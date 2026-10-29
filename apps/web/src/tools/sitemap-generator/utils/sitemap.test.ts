import { describe, expect, it } from 'vitest';
import {
  MAX_URLS,
  escapeXml,
  generateSitemap,
  parseUrlLines,
  validateChangefreq,
  validatePriority,
  validateUrl,
} from './sitemap';

describe('escapeXml', () => {
  it('转义 & < > 与引号，且 & 先转义', () => {
    expect(escapeXml('a & b < c > d "e" \'f\'')).toBe(
      'a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;',
    );
    expect(escapeXml('https://x.com/a?b=1&c=2')).toBe('https://x.com/a?b=1&amp;c=2');
  });
});

describe('parseUrlLines', () => {
  it('逐行 trim 并丢弃空行', () => {
    expect(parseUrlLines(' https://a.com \n\n  \nhttps://b.com\r\n')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });
});

describe('validateUrl', () => {
  it('http(s) 合法，其余协议与非法文本报错', () => {
    expect(validateUrl('https://a.com')).toBeNull();
    expect(validateUrl('http://a.com/path')).toBeNull();
    expect(validateUrl('ftp://a.com')).toBe('必须以 http:// 或 https:// 开头');
    expect(validateUrl('not a url')).toBe('不是合法的 URL');
  });
});

describe('validatePriority / validateChangefreq', () => {
  it('空值省略合法，越界与非法枚举报错', () => {
    expect(validatePriority('')).toBeNull();
    expect(validatePriority('0.8')).toBeNull();
    expect(validatePriority('1.5')).not.toBeNull();
    expect(validateChangefreq('')).toBeNull();
    expect(validateChangefreq('weekly')).toBeNull();
    expect(validateChangefreq('sometimes')).not.toBeNull();
  });
});

describe('generateSitemap', () => {
  const options = { lastmod: '', changefreq: '', priority: '' };

  it('生成符合 sitemaps.org 协议的 urlset XML', () => {
    const result = generateSitemap('https://a.com/\nhttps://a.com/x', options);
    expect(result.xml).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        '  <url>\n    <loc>https://a.com/</loc>\n  </url>\n' +
        '  <url>\n    <loc>https://a.com/x</loc>\n  </url>\n' +
        '</urlset>',
    );
    expect(result.count).toBe(2);
    expect(result.invalid).toEqual([]);
    expect(result.exceedsLimit).toBe(false);
  });

  it('全局默认 lastmod / changefreq / priority 输出，空值字段省略', () => {
    const result = generateSitemap('https://a.com/', {
      lastmod: '2026-10-30',
      changefreq: 'weekly',
      priority: '0.5',
    });
    expect(result.xml).toContain('<lastmod>2026-10-30</lastmod>');
    expect(result.xml).toContain('<changefreq>weekly</changefreq>');
    expect(result.xml).toContain('<priority>0.5</priority>');
  });

  it('URL 中 & < > 被转义', () => {
    const result = generateSitemap('https://a.com/?a=1&b=2', options);
    expect(result.xml).toContain('<loc>https://a.com/?a=1&amp;b=2</loc>');
  });

  it('非法 URL 记录行号与原因并跳过，不阻断其余输出', () => {
    const result = generateSitemap('https://a.com/\nnot-a-url\nftp://b.com', options);
    expect(result.count).toBe(1);
    expect(result.invalid).toEqual([
      { line: 2, url: 'not-a-url', reason: '不是合法的 URL' },
      { line: 3, url: 'ftp://b.com', reason: '必须以 http:// 或 https:// 开头' },
    ]);
  });

  it('空输入输出空字符串', () => {
    const result = generateSitemap('  \n\n', options);
    expect(result.xml).toBe('');
    expect(result.count).toBe(0);
  });

  it('超过 50000 条只写入上限并标记 exceedsLimit', () => {
    const urls = Array.from({ length: MAX_URLS + 2 }, (_, index) => `https://a.com/${index}`).join('\n');
    const result = generateSitemap(urls, options);
    expect(result.count).toBe(MAX_URLS);
    expect(result.exceedsLimit).toBe(true);
  });
});
