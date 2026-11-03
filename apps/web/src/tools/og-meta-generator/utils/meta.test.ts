import { describe, expect, it } from 'vitest';
import {
  DESCRIPTION_RECOMMENDED_MAX,
  TITLE_RECOMMENDED_MAX,
  escapeHtmlAttribute,
  generateMetaTags,
  isHttpUrl,
  normalizeTwitterHandle,
  validateMetaInput,
  type MetaInput,
} from './meta';

/** 构造一份完整合法的表单 */
function createInput(overrides: Partial<MetaInput> = {}): MetaInput {
  return {
    title: '示例页面标题',
    description: '这是一个用于搜索引擎与社交分享的页面描述。',
    url: 'https://example.com/article/1',
    siteName: '示例站点',
    ogType: 'website',
    locale: 'zh_CN',
    imageUrl: 'https://example.com/cover.png',
    imageAlt: '封面图',
    imageWidth: '1200',
    imageHeight: '630',
    twitterCard: 'summary_large_image',
    twitterSite: '@example',
    twitterCreator: 'author',
    keywords: 'SEO, Open Graph',
    author: '张三',
    robots: 'index, follow',
    ...overrides,
  };
}

describe('isHttpUrl', () => {
  it('接受 http 与 https URL', () => {
    expect(isHttpUrl('https://a.com/x')).toBe(true);
    expect(isHttpUrl('http://a.com:8080/x?y=1')).toBe(true);
  });

  it('拒绝空串、相对地址与非 http 协议', () => {
    expect(isHttpUrl('')).toBe(false);
    expect(isHttpUrl('/article/1')).toBe(false);
    expect(isHttpUrl('ftp://a.com/x')).toBe(false);
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('escapeHtmlAttribute', () => {
  it('转义 &、双引号与尖括号', () => {
    expect(escapeHtmlAttribute('a&b"c<d>')).toBe('a&amp;b&quot;c&lt;d&gt;');
  });
});

describe('normalizeTwitterHandle', () => {
  it('为空返回空串，无 @ 自动补 @，多个前导 @ 折叠', () => {
    expect(normalizeTwitterHandle('')).toBe('');
    expect(normalizeTwitterHandle('  ')).toBe('');
    expect(normalizeTwitterHandle('example')).toBe('@example');
    expect(normalizeTwitterHandle('@example')).toBe('@example');
    expect(normalizeTwitterHandle('@@example')).toBe('@example');
  });
});

describe('validateMetaInput', () => {
  it('完整合法输入无任何问题', () => {
    expect(validateMetaInput(createInput())).toEqual([]);
  });

  it('标题为空报错', () => {
    const issues = validateMetaInput(createInput({ title: '  ' }));
    expect(issues.some((i) => i.level === 'error' && i.message.includes('标题'))).toBe(true);
  });

  it('标题超长给警告', () => {
    const issues = validateMetaInput(createInput({ title: 'a'.repeat(TITLE_RECOMMENDED_MAX + 1) }));
    expect(issues.some((i) => i.level === 'warning' && i.message.includes('标题长度'))).toBe(true);
  });

  it('描述为空报错，超长警告', () => {
    const empty = validateMetaInput(createInput({ description: '' }));
    expect(empty.some((i) => i.level === 'error' && i.message.includes('描述'))).toBe(true);
    const long = validateMetaInput(
      createInput({ description: 'a'.repeat(DESCRIPTION_RECOMMENDED_MAX + 1) }),
    );
    expect(long.some((i) => i.level === 'warning' && i.message.includes('描述长度'))).toBe(true);
  });

  it('URL 为空或非法报错', () => {
    expect(
      validateMetaInput(createInput({ url: '' })).some((i) => i.message.includes('URL')),
    ).toBe(true);
    expect(
      validateMetaInput(createInput({ url: 'example.com/x' })).some(
        (i) => i.level === 'error' && i.message.includes('http(s)'),
      ),
    ).toBe(true);
  });

  it('图片 URL 非法报错；有图无 alt 警告', () => {
    const badUrl = validateMetaInput(createInput({ imageUrl: '/cover.png' }));
    expect(badUrl.some((i) => i.level === 'error' && i.message.includes('分享图'))).toBe(true);
    const noAlt = validateMetaInput(createInput({ imageAlt: '' }));
    expect(noAlt.some((i) => i.level === 'warning' && i.message.includes('og:image:alt'))).toBe(
      true,
    );
  });

  it('图片宽高必须为正整数', () => {
    const issues = validateMetaInput(createInput({ imageWidth: '0', imageHeight: 'abc' }));
    expect(issues).toHaveLength(2);
    expect(issues.every((i) => i.level === 'error')).toBe(true);
  });

  it('大图卡片无图给警告', () => {
    const issues = validateMetaInput(
      createInput({ twitterCard: 'summary_large_image', imageUrl: '' }),
    );
    expect(issues.some((i) => i.message.includes('summary_large_image'))).toBe(true);
  });
});

describe('generateMetaTags', () => {
  it('完整输入输出 canonical、og 与 twitter 全部标签并保持顺序', () => {
    const { html, issues } = generateMetaTags(createInput());
    expect(issues).toEqual([]);
    const lines = html.split('\n');
    expect(lines[0]).toBe('<title>示例页面标题</title>');
    expect(html).toContain('<meta name="description" content="这是一个用于搜索引擎与社交分享的页面描述。">');
    expect(html).toContain('<link rel="canonical" href="https://example.com/article/1">');
    expect(html).toContain('<meta property="og:title" content="示例页面标题">');
    expect(html).toContain('<meta property="og:type" content="website">');
    expect(html).toContain('<meta property="og:locale" content="zh_CN">');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:site" content="@example">');
    expect(html).toContain('<meta name="twitter:creator" content="@author">');
    // title/description/canonical 必须出现在 og 标签之前
    expect(lines.findIndex((l) => l.startsWith('<title>'))).toBeLessThan(
      lines.findIndex((l) => l.includes('og:title')),
    );
  });

  it('空字段对应标签不输出', () => {
    const { html } = generateMetaTags(
      createInput({
        keywords: '',
        author: '',
        robots: '',
        siteName: '',
        locale: '',
        imageUrl: '',
        imageAlt: '',
        imageWidth: '',
        imageHeight: '',
        twitterSite: '',
        twitterCreator: '',
      }),
    );
    expect(html).not.toContain('keywords');
    expect(html).not.toContain('name="author"');
    expect(html).not.toContain('name="robots"');
    expect(html).not.toContain('og:site_name');
    expect(html).not.toContain('og:image');
    expect(html).not.toContain('twitter:image');
    expect(html).not.toContain('twitter:site');
  });

  it('非法 URL 不输出 canonical / og:url / og:image，但仍保留其他标签', () => {
    const { html } = generateMetaTags(
      createInput({ url: 'not-a-url', imageUrl: 'also-not-url' }),
    );
    expect(html).not.toContain('canonical');
    expect(html).not.toContain('og:url');
    expect(html).not.toContain('og:image');
    expect(html).toContain('<title>');
    expect(html).toContain('twitter:card');
  });

  it('属性中的双引号与 & 被转义，避免属性逃逸', () => {
    const { html } = generateMetaTags(
      createInput({ title: 'A&B "quoted"', description: 'x & y' }),
    );
    expect(html).toContain('<title>A&amp;B &quot;quoted&quot;</title>');
    expect(html).toContain('content="x &amp; y"');
  });

  it('locale 中的连字符归一为下划线（zh-CN → zh_CN）', () => {
    const { html } = generateMetaTags(createInput({ locale: 'zh-CN' }));
    expect(html).toContain('og:locale" content="zh_CN"');
  });

  it('twitter 账号无 @ 时自动补齐', () => {
    const { html } = generateMetaTags(createInput({ twitterSite: 'example', twitterCreator: '@writer' }));
    expect(html).toContain('twitter:site" content="@example"');
    expect(html).toContain('twitter:creator" content="@writer"');
  });

  it('og:type 与 twitter:card 始终输出', () => {
    const { html } = generateMetaTags(createInput({ ogType: 'article', twitterCard: 'summary' }));
    expect(html).toContain('og:type" content="article"');
    expect(html).toContain('twitter:card" content="summary"');
  });
});
