import { describe, expect, it } from 'vitest';
import { HEADER_CATEGORIES, HTTP_HEADERS } from './httpHeadersData';
import {
  DIRECTION_LABELS,
  countByCategory,
  filterHeaders,
  forbiddenHeaderNames,
  getHeader,
  validateHeaderData,
} from './httpHeaders';

describe('静态数据完整性', () => {
  it('收录不少于 50 个头字段且覆盖全部 8 个分类', () => {
    expect(HTTP_HEADERS.length).toBeGreaterThanOrEqual(50);
    expect(HEADER_CATEGORIES).toHaveLength(8);
    const usedCategories = new Set(HTTP_HEADERS.map((item) => item.category));
    for (const category of HEADER_CATEGORIES) {
      expect(usedCategories.has(category.id)).toBe(true);
      expect(countByCategory(category.id)).toBeGreaterThan(0);
    }
  });

  it('每条均含方向、分类、说明、取值语法与示例五个必填信息', () => {
    expect(validateHeaderData()).toEqual([]);
  });

  it('头名称唯一且使用连字符形式', () => {
    const names = HTTP_HEADERS.map((item) => item.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    expect(HTTP_HEADERS.every((item) => !item.name.includes('_'))).toBe(true);
  });
});

describe('搜索与筛选', () => {
  it('搜索 cache 命中 Cache-Control、ETag、If-None-Match 等缓存条目', () => {
    const hits = filterHeaders({ keyword: 'cache', category: null, direction: null });
    const names = hits.map((item) => item.name);
    expect(names).toContain('Cache-Control');
    expect(names).toContain('ETag');
    expect(names).toContain('If-None-Match');
  });

  it('头名称搜索大小写不敏感', () => {
    expect(getHeader('content-type')?.name).toBe('Content-Type');
    expect(getHeader('  AUTHORIZATION ')?.name).toBe('Authorization');
  });

  it('分类筛选与搜索可组合使用', () => {
    const cors = filterHeaders({ keyword: '', category: 'cors', direction: null });
    expect(cors.length).toBeGreaterThanOrEqual(6);
    expect(cors.every((item) => item.category === 'cors')).toBe(true);

    const corsOrigin = filterHeaders({
      keyword: 'origin',
      category: 'cors',
      direction: null,
    });
    expect(corsOrigin.map((item) => item.name)).toContain('Access-Control-Allow-Origin');
    expect(corsOrigin.every((item) => item.category === 'cors')).toBe(true);
  });

  it('方向筛选正确区分请求头、响应头与通用头', () => {
    const requestOnly = filterHeaders({ keyword: '', category: null, direction: 'request' });
    expect(requestOnly.map((item) => item.name)).toContain('Authorization');
    expect(requestOnly.every((item) => item.direction === 'request')).toBe(true);

    const both = filterHeaders({ keyword: 'Content-Type', category: null, direction: 'both' });
    expect(both.map((item) => item.name)).toContain('Content-Type');
  });

  it('无结果时返回空数组（由 UI 渲染空状态）', () => {
    expect(
      filterHeaders({ keyword: '不存在的头字段zzz', category: null, direction: null }),
    ).toEqual([]);
    expect(filterHeaders({ keyword: 'etag', category: 'cors', direction: null })).toEqual([]);
  });

  it('空关键字返回全部条目', () => {
    expect(filterHeaders({ keyword: '   ', category: null, direction: null })).toHaveLength(
      HTTP_HEADERS.length,
    );
  });
});

describe('forbidden 与废弃标记', () => {
  it('Host 与 Origin 被明确标记为 forbidden header name', () => {
    expect(getHeader('Host')!.forbidden).toBe(true);
    expect(getHeader('Origin')!.forbidden).toBe(true);
    expect(forbiddenHeaderNames()).toEqual(
      expect.arrayContaining(['Host', 'Origin', 'Cookie', 'Set-Cookie']),
    );
  });

  it('Pragma、X-Frame-Options 等遗留头标注废弃并给出替代说明', () => {
    expect(getHeader('Pragma')!.deprecated).toBe(true);
    expect(getHeader('Pragma')!.pitfalls.join(' ')).toContain('Cache-Control');
    expect(getHeader('X-Frame-Options')!.deprecated).toBe(true);
    expect(getHeader('X-Frame-Options')!.pitfalls.join(' ')).toContain('frame-ancestors');
  });

  it('方向标签中文映射完整', () => {
    expect(DIRECTION_LABELS.request).toBe('请求头');
    expect(DIRECTION_LABELS.response).toBe('响应头');
    expect(DIRECTION_LABELS.both).toBe('通用');
  });
});
