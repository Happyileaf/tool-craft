import { describe, expect, it } from 'vitest';
import {
  HTTP_STATUSES,
  STATUS_CLASSES,
  filterStatuses,
  getStatusByCode,
  getStatusClass,
  groupByCategory,
  searchStatuses,
  type HttpStatus,
} from './http-status';

describe('HTTP 状态码静态数据表', () => {
  it('覆盖 100–511 范围内的全部收录条目且编号唯一', () => {
    expect(HTTP_STATUSES.length).toBeGreaterThanOrEqual(50);
    const codes = HTTP_STATUSES.map((status) => status.code);
    expect(new Set(codes).size).toBe(codes.length);

    for (const code of codes) {
      expect(code).toBeGreaterThanOrEqual(100);
      expect(code).toBeLessThanOrEqual(511);
    }
  });

  it('各百位段的关键状态码均被收录', () => {
    const keyCodes = [
      100, 101, 103, 200, 201, 204, 206, 301, 302, 304, 307, 308, 400, 401, 403, 404,
      405, 408, 409, 429, 500, 501, 502, 503, 504,
    ];
    for (const code of keyCodes) {
      expect(getStatusByCode(code)).toBeDefined();
    }
  });

  it('每个条目的分类字段与编号百位段一致', () => {
    for (const status of HTTP_STATUSES) {
      expect(status.category).toBe(getStatusClass(status.code));
      expect(status.name.length).toBeGreaterThan(0);
      expect(status.nameZh.length).toBeGreaterThan(0);
      expect(status.scenario.length).toBeGreaterThan(0);
      expect(status.troubleshooting.length).toBeGreaterThan(0);
    }
  });

  it('503 标记为可重试、404 标记为不可直接重试', () => {
    expect(getStatusByCode(503)?.retryable).toBe(true);
    expect(getStatusByCode(404)?.retryable).toBe(false);
  });
});

describe('getStatusClass', () => {
  it('正确映射百位段', () => {
    expect(getStatusClass(100)).toBe('1xx');
    expect(getStatusClass(204)).toBe('2xx');
    expect(getStatusClass(301)).toBe('3xx');
    expect(getStatusClass(404)).toBe('4xx');
    expect(getStatusClass(503)).toBe('5xx');
  });

  it('范围外输入返回 null', () => {
    expect(getStatusClass(99)).toBeNull();
    expect(getStatusClass(600)).toBeNull();
    expect(getStatusClass(0)).toBeNull();
  });
});

describe('searchStatuses', () => {
  it('按完整编号精确过滤', () => {
    const result = searchStatuses('404');
    expect(result.map((status) => status.code)).toEqual([404]);
  });

  it('按编号前缀过滤（如 4 命中全部 4xx）', () => {
    const result = searchStatuses('4');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((status) => status.category === '4xx')).toBe(true);

    const prefix40 = searchStatuses('40');
    expect(prefix40.map((status) => status.code)).toContain(400);
    expect(prefix40.map((status) => status.code)).toContain(409);
    expect(prefix40.every((status) => String(status.code).startsWith('40'))).toBe(true);
  });

  it('英文关键词模糊匹配（大小写不敏感）', () => {
    const result = searchStatuses('not found');
    expect(result.map((status) => status.code)).toEqual([404]);

    const gateway = searchStatuses('GATEWAY');
    expect(gateway.map((status) => status.code)).toEqual(
      expect.arrayContaining([502, 504]),
    );
  });

  it('中文关键词匹配中文含义', () => {
    const redirects = searchStatuses('重定向');
    expect(redirects.map((status) => status.code)).toEqual(
      expect.arrayContaining([301, 302, 307, 308]),
    );

    const gateway = searchStatuses('网关');
    expect(gateway.map((status) => status.code)).toEqual(
      expect.arrayContaining([203, 502, 504]),
    );
    expect(gateway.map((status) => status.code)).not.toContain(407);
  });

  it('中文关键词也可命中场景描述', () => {
    const rateLimited = searchStatuses('限流');
    expect(rateLimited.map((status) => status.code)).toContain(429);
  });

  it('空白输入返回空数组', () => {
    expect(searchStatuses('')).toEqual([]);
    expect(searchStatuses('   ')).toEqual([]);
  });

  it('无匹配返回空数组且不抛异常', () => {
    expect(searchStatuses('999')).toEqual([]);
    expect(searchStatuses('一个不可能存在的关键词xyz')).toEqual([]);
  });

  it('null / undefined / 超长输入不抛异常', () => {
    expect(searchStatuses(null as unknown as string)).toEqual([]);
    expect(searchStatuses(undefined as unknown as string)).toEqual([]);
    expect(searchStatuses('a'.repeat(500)).length).toBe(0);
  });
});

describe('filterStatuses', () => {
  it('无关键词时返回全量', () => {
    expect(filterStatuses('')).toHaveLength(HTTP_STATUSES.length);
    expect(filterStatuses('   ')).toHaveLength(HTTP_STATUSES.length);
  });

  it('关键词 + 分类同时生效', () => {
    const result = filterStatuses('重定向', '3xx');
    expect(result.every((status) => status.category === '3xx')).toBe(true);
    expect(result.map((status) => status.code)).toEqual(
      expect.arrayContaining([301, 302, 307, 308]),
    );
  });

  it('关键词与分类不相交时为空', () => {
    expect(filterStatuses('not found', '5xx')).toEqual([]);
  });

  it('仅按分类过滤', () => {
    const serverErrors = filterStatuses('', '5xx');
    expect(serverErrors.every((status) => status.category === '5xx')).toBe(true);
    expect(serverErrors.map((status) => status.code)).toEqual(
      expect.arrayContaining([500, 502, 503, 504, 511]),
    );
  });

  it('结果按编号升序', () => {
    const result = filterStatuses('4');
    const codes = result.map((status) => status.code);
    const sorted = [...codes].sort((a, b) => a - b);
    expect(codes).toEqual(sorted);
  });
});

describe('groupByCategory', () => {
  it('始终返回全部分类键', () => {
    const groups = groupByCategory([]);
    for (const key of STATUS_CLASSES) {
      expect(groups[key]).toEqual([]);
    }
  });

  it('全量数据按百位段正确分组', () => {
    const groups = groupByCategory(HTTP_STATUSES);
    for (const key of STATUS_CLASSES) {
      expect(groups[key].every((status) => status.category === key)).toBe(true);
      expect(groups[key].length).toBeGreaterThan(0);
    }
    const total = STATUS_CLASSES.reduce(
      (sum: number, key) => sum + groups[key].length,
      0,
    );
    expect(total).toBe(HTTP_STATUSES.length);
  });

  it('组内按编号升序', () => {
    const groups = groupByCategory(filterStatuses(''));
    for (const key of STATUS_CLASSES) {
      const codes = groups[key].map((status: HttpStatus) => status.code);
      const sorted = [...codes].sort((a, b) => a - b);
      expect(codes).toEqual(sorted);
    }
  });
});
