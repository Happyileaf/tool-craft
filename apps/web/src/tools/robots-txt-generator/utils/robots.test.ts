import { describe, expect, it } from 'vitest';
import { generateRobotsTxt, splitEntries, validateRobots, type RobotsGroup } from './robots';

const group = (partial: Partial<RobotsGroup> = {}): RobotsGroup => ({
  id: 1,
  agents: '',
  allow: '',
  disallow: '',
  crawlDelay: '',
  ...partial,
});

describe('splitEntries', () => {
  it('按行拆分、去空白、丢空行', () => {
    expect(splitEntries('a\n  b  \n\nc')).toEqual(['a', 'b', 'c']);
    expect(splitEntries('')).toEqual([]);
  });
});

describe('generateRobotsTxt', () => {
  it('多组 User-agent + Allow/Disallow 正确拼装，组间空行分隔', () => {
    const output = generateRobotsTxt(
      [
        group({ id: 1, agents: '*', disallow: '/admin\n/private/' }),
        group({ id: 2, agents: 'Googlebot', allow: '/', disallow: '' }),
      ],
      '',
    );
    expect(output).toBe(
      'User-agent: *\nDisallow: /admin\nDisallow: /private/\n\nUser-agent: Googlebot\nAllow: /',
    );
  });

  it('Crawl-delay 仅在填写时出现，多 Sitemap 输出在末尾', () => {
    const output = generateRobotsTxt(
      [group({ id: 1, agents: '*', disallow: '/', crawlDelay: '10' })],
      'https://a.com/sitemap.xml\nhttps://a.com/sitemap-news.xml',
    );
    expect(output).toBe(
      'User-agent: *\nDisallow: /\nCrawl-delay: 10\n\n' +
        'Sitemap: https://a.com/sitemap.xml\n\nSitemap: https://a.com/sitemap-news.xml',
    );
  });

  it('空表单输出空字符串，缺少 User-agent 的组被跳过', () => {
    expect(generateRobotsTxt([group()], '')).toBe('');
    expect(
      generateRobotsTxt([group({ id: 1, disallow: '/secret' }), group({ id: 2, agents: '*' })], ''),
    ).toBe('User-agent: *');
  });

  it('非法路径不输出，非法 Sitemap 不输出（不阻断其余组）', () => {
    const output = generateRobotsTxt(
      [group({ id: 1, agents: '*', allow: 'bad-path', disallow: '/ok' })],
      'ftp://x.com/s.xml\nhttps://x.com/s.xml',
    );
    expect(output).toBe('User-agent: *\nDisallow: /ok\n\nSitemap: https://x.com/s.xml');
  });
});

describe('validateRobots', () => {
  it('合法输入无错误', () => {
    const result = validateRobots(
      [group({ id: 1, agents: '*', disallow: '/admin', crawlDelay: '5' })],
      'https://example.com/sitemap.xml',
    );
    expect(result.errors).toEqual([]);
  });

  it('缺少 User-agent、路径未以 / 开头、非法 Crawl-delay 均报错', () => {
    const result = validateRobots(
      [group({ id: 1, disallow: 'admin' }), group({ id: 2, agents: '*', crawlDelay: '-2' })],
      '',
    );
    expect(result.errors).toContain('第 1 组：缺少 User-agent');
    expect(result.errors).toContain('第 1 组：路径「admin」必须以 / 开头');
    expect(result.errors).toContain('第 2 组：Crawl-delay「-2」必须是非负数字');
  });

  it('全空组不报错；非法 Sitemap URL 报错', () => {
    expect(validateRobots([group()], '').errors).toEqual([]);
    const result = validateRobots([], 'not a url\nftp://x.com/s.xml');
    expect(result.errors).toEqual([
      'Sitemap「not a url」必须是合法的 http(s) URL',
      'Sitemap「ftp://x.com/s.xml」必须以 http:// 或 https:// 开头',
    ]);
  });
});
