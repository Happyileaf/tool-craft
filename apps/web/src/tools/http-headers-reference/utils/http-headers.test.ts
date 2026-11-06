import { describe, expect, it } from 'vitest';
import {
  CATEGORY_LABELS,
  HTTP_HEADERS,
  SECURITY_PRACTICES,
  filterHeaders,
  filterPractices,
  type HeaderCategory,
} from './http-headers';

describe('HTTP 头字段静态数据完整性', () => {
  it('条目数不少于 40 且头名唯一', () => {
    expect(HTTP_HEADERS.length).toBeGreaterThanOrEqual(40);
    const names = HTTP_HEADERS.map((item) => item.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('覆盖 7 个大类', () => {
    const categories = new Set(HTTP_HEADERS.map((item) => item.category));
    const expected: HeaderCategory[] = [
      'general',
      'request',
      'response',
      'entity',
      'caching',
      'cors',
      'security',
    ];
    expected.forEach((category) => {
      expect(categories.has(category)).toBe(true);
      expect(CATEGORY_LABELS[category].length).toBeGreaterThan(0);
    });
  });

  it('核心必备头字段全部收录', () => {
    const names = HTTP_HEADERS.map((item) => item.name);
    [
      'Content-Type',
      'Authorization',
      'Cache-Control',
      'Cookie',
      'Set-Cookie',
      'Access-Control-Allow-Origin',
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'ETag',
      'Origin',
    ].forEach((name) => expect(names).toContain(name));
  });

  it('每条目必填字段齐全', () => {
    HTTP_HEADERS.forEach((item) => {
      expect(item.nameZh.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
      expect(item.example).toContain(`${item.name}:`);
      expect(item.rfc.length).toBeGreaterThan(0);
      expect(item.keywords.length).toBeGreaterThan(0);
      expect(['request', 'response', 'both']).toContain(item.direction);
      expect(typeof item.hopByHop).toBe('boolean');
      expect(typeof item.forbidden).toBe('boolean');
    });
  });

  it('逐跳头标记与 RFC 9110 一致', () => {
    const hopNames = HTTP_HEADERS.filter((item) => item.hopByHop).map((item) => item.name);
    [
      'Connection',
      'Transfer-Encoding',
      'Upgrade',
      'Via',
      'Warning',
      'Proxy-Authorization',
      'Expect',
      'Trailer',
    ].forEach((name) => expect(hopNames).toContain(name));
    // 端到端头不得误标
    const endToEnd = ['Content-Type', 'ETag', 'Cache-Control', 'Set-Cookie'];
    endToEnd.forEach((name) => {
      expect(HTTP_HEADERS.find((item) => item.name === name)!.hopByHop).toBe(false);
    });
  });

  it('禁止修改头标记覆盖 Fetch 标准关键项', () => {
    const forbidden = HTTP_HEADERS.filter((item) => item.forbidden).map((item) => item.name);
    ['Host', 'User-Agent', 'Referer', 'Accept-Encoding', 'Authorization', 'Cookie', 'Set-Cookie', 'Origin'].forEach(
      (name) => expect(forbidden).toContain(name),
    );
    // 普通可由前端设置的头不得误标
    ['Content-Type', 'Cache-Control', 'Accept', 'If-None-Match'].forEach((name) => {
      expect(HTTP_HEADERS.find((item) => item.name === name)!.forbidden).toBe(false);
    });
  });

  it('安全类头均带安全注意事项', () => {
    const securityHeaders = HTTP_HEADERS.filter((item) => item.category === 'security');
    expect(securityHeaders.length).toBeGreaterThanOrEqual(5);
    securityHeaders.forEach((item) => {
      expect((item.securityNote ?? '').length).toBeGreaterThan(10);
    });
  });

  it('鉴权与 Cookie 类头包含安全说明', () => {
    for (const name of ['Authorization', 'Cookie', 'Set-Cookie']) {
      const note = HTTP_HEADERS.find((item) => item.name === name)!.securityNote ?? '';
      expect(note.length).toBeGreaterThan(10);
    }
  });
});

describe('filterHeaders 过滤逻辑', () => {
  it('空关键字返回全部', () => {
    expect(filterHeaders('')).toHaveLength(HTTP_HEADERS.length);
    expect(filterHeaders('   ')).toHaveLength(HTTP_HEADERS.length);
  });

  it('按头名大小写不敏感检索', () => {
    const contentTypeHits = filterHeaders('content-type').map((item) => item.name);
    expect(contentTypeHits).toContain('Content-Type');
    expect(filterHeaders('ETAG').map((item) => item.name)).toContain('ETag');
  });

  it('搜索「缓存」命中缓存分类及相关条目', () => {
    const result = filterHeaders('缓存').map((item) => item.name);
    expect(result).toContain('Cache-Control');
    expect(result).toContain('ETag');
    expect(result.length).toBeGreaterThanOrEqual(6);
  });

  it('搜索 csp 能找到 Content-Security-Policy', () => {
    const result = filterHeaders('csp').map((item) => item.name);
    expect(result).toContain('Content-Security-Policy');
  });

  it('按分类过滤', () => {
    const cors = filterHeaders('', 'cors');
    expect(cors.length).toBeGreaterThanOrEqual(6);
    cors.forEach((item) => expect(item.category).toBe('cors'));

    const security = filterHeaders('', 'security');
    expect(security.length).toBeGreaterThanOrEqual(5);
  });

  it('按方向过滤', () => {
    const requestOnly = filterHeaders('', 'all', 'request');
    requestOnly.forEach((item) => expect(item.direction).toBe('request'));
    expect(requestOnly.map((item) => item.name)).toContain('Authorization');

    const responseOnly = filterHeaders('', 'all', 'response');
    responseOnly.forEach((item) => expect(item.direction).toBe('response'));
    expect(responseOnly.map((item) => item.name)).toContain('Set-Cookie');
  });

  it('分类、方向、关键字可组合', () => {
    const result = filterHeaders('cookie', 'security', 'all');
    // 安全分类下没有直接命名 cookie 的条目，返回空数组而非报错
    expect(Array.isArray(result)).toBe(true);

    const corsOrigin = filterHeaders('origin', 'cors');
    expect(corsOrigin.map((item) => item.name)).toContain('Origin');
  });

  it('无命中返回空数组', () => {
    expect(filterHeaders('不存在的头字段xyz')).toEqual([]);
  });
});

describe('安全实践专题', () => {
  it('包含基础安全头、Cookie 属性、CORS 凭据三个专题', () => {
    expect(SECURITY_PRACTICES).toHaveLength(3);
    const titles = SECURITY_PRACTICES.map((item) => item.title);
    expect(titles.some((title) => title.includes('基础安全'))).toBe(true);
    expect(titles.some((title) => title.includes('Cookie'))).toBe(true);
    expect(titles.some((title) => title.includes('CORS'))).toBe(true);
  });

  it('基础安全头专题引用的头名均真实存在于数据表', () => {
    const base = SECURITY_PRACTICES.find((item) => item.title.includes('基础安全'))!;
    const names = new Set(HTTP_HEADERS.map((item) => item.name));
    base.headers.forEach((name) => expect(names.has(name)).toBe(true));
    expect(base.example).toContain('Content-Security-Policy');
  });

  it('搜索「csrf」命中 Cookie 或 CORS 专题', () => {
    const result = filterPractices('csrf');
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('空关键字返回全部专题', () => {
    expect(filterPractices('')).toHaveLength(3);
  });
});
