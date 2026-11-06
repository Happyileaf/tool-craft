import { describe, expect, it } from 'vitest';
import {
  HTTP_METHODS,
  METHOD_COMPARISONS,
  filterComparisons,
  filterMethods,
} from './http-methods';

describe('HTTP 方法静态数据完整性', () => {
  it('完整覆盖 9 个标准方法', () => {
    expect(HTTP_METHODS).toHaveLength(9);
    const names = HTTP_METHODS.map((item) => item.method);
    expect(names).toEqual([
      'GET',
      'HEAD',
      'POST',
      'PUT',
      'DELETE',
      'CONNECT',
      'OPTIONS',
      'TRACE',
      'PATCH',
    ]);
  });

  it('方法名唯一且全部大写', () => {
    const names = HTTP_METHODS.map((item) => item.method);
    expect(new Set(names).size).toBe(names.length);
    names.forEach((name) => expect(name).toBe(name.toUpperCase()));
  });

  it('每条方法必填字段齐全', () => {
    HTTP_METHODS.forEach((item) => {
      expect(item.nameZh.length).toBeGreaterThan(0);
      expect(item.semantics.length).toBeGreaterThan(0);
      expect(item.rfc).toMatch(/^RFC \d+/);
      expect(item.useCase.length).toBeGreaterThan(0);
      expect(item.pitfalls.length).toBeGreaterThanOrEqual(1);
      expect(item.requestExample.length).toBeGreaterThan(0);
      expect(item.responseExample.length).toBeGreaterThan(0);
      expect(item.statusCodes.length).toBeGreaterThan(0);
      expect(item.keywords.length).toBeGreaterThan(0);
    });
  });

  it('safe / idempotent / cacheable 属性与 RFC 9110 定义一致', () => {
    const byName = Object.fromEntries(HTTP_METHODS.map((item) => [item.method, item]));

    // GET 与 HEAD：safe 且 idempotent 且可缓存
    for (const name of ['GET', 'HEAD'] as const) {
      const entry = HTTP_METHODS.find((item) => item.method === name)!;
      expect(entry.safe).toBe(true);
      expect(entry.idempotent).toBe(true);
      expect(entry.cacheable).toBe(true);
      expect(entry.requestBody).toBe(false);
    }

    // safe 方法全集：GET HEAD OPTIONS TRACE
    expect(HTTP_METHODS.filter((item) => item.safe).map((item) => item.method).sort()).toEqual(
      ['GET', 'HEAD', 'OPTIONS', 'TRACE'].sort(),
    );

    // 幂等方法全集：GET HEAD PUT DELETE OPTIONS TRACE
    expect(
      HTTP_METHODS.filter((item) => item.idempotent).map((item) => item.method).sort(),
    ).toEqual(['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE'].sort());

    // PATCH：非 safe、非默认幂等、不可缓存、允许请求体
    expect(byName.PATCH!.safe).toBe(false);
    expect(byName.PATCH!.idempotent).toBe(false);
    expect(byName.PATCH!.cacheable).toBe(false);
    expect(byName.PATCH!.requestBody).toBe(true);

    // POST：非 safe、非幂等、默认不可缓存
    expect(byName.POST!.safe).toBe(false);
    expect(byName.POST!.idempotent).toBe(false);
    expect(byName.POST!.cacheable).toBe(false);

    // PUT/POST/PATCH 允许请求体，GET/HEAD/DELETE/CONNECT/OPTIONS/TRACE 不允许
    expect(
      HTTP_METHODS.filter((item) => item.requestBody).map((item) => item.method).sort(),
    ).toEqual(['PATCH', 'POST', 'PUT'].sort());

    // 仅 GET/HEAD 可缓存
    expect(
      HTTP_METHODS.filter((item) => item.cacheable).map((item) => item.method).sort(),
    ).toEqual(['GET', 'HEAD'].sort());
  });

  it('PATCH 误用说明明确指出幂等性取决于媒体类型', () => {
    const patch = HTTP_METHODS.find((item) => item.method === 'PATCH');
    expect(patch?.pitfalls.join('\n')).toContain('媒体类型');
  });

  it('CONNECT 与 TRACE 含安全注意事项', () => {
    const connect = HTTP_METHODS.find((item) => item.method === 'CONNECT');
    const trace = HTTP_METHODS.find((item) => item.method === 'TRACE');
    expect(connect?.pitfalls.join('\n')).toMatch(/代理|隧道/);
    expect(trace?.pitfalls.join('\n')).toMatch(/XST|追踪|泄露/);
  });
});

describe('filterMethods 过滤逻辑', () => {
  it('空关键字返回全部方法', () => {
    expect(filterMethods('')).toHaveLength(9);
    expect(filterMethods('   ')).toHaveLength(9);
  });

  it('按方法名大小写不敏感检索', () => {
    expect(filterMethods('DELETE').map((item) => item.method)).toEqual(['DELETE']);
    expect(filterMethods('trace').map((item) => item.method)).toEqual(['TRACE']);
  });

  it('搜索「幂等」能过滤出相关方法', () => {
    const result = filterMethods('幂等').map((item) => item.method);
    // 六个幂等方法的 keywords 或语义中包含「幂等」
    expect(result).toContain('GET');
    expect(result).toContain('PUT');
    expect(result).toContain('DELETE');
    // POST 的防重说明中提到幂等键，属于相关条目；核心断言为幂等方法全部命中
    for (const name of ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE']) {
      expect(result).toContain(name);
    }
  });

  it('按分组过滤 common / special', () => {
    const special = filterMethods('', 'special').map((item) => item.method);
    expect(special).toEqual(['CONNECT', 'OPTIONS', 'TRACE']);
    expect(filterMethods('', 'common')).toHaveLength(6);
  });

  it('关键字与分组可组合', () => {
    const result = filterMethods('cors', 'special').map((item) => item.method);
    expect(result).toEqual(['OPTIONS']);
  });

  it('无命中返回空数组', () => {
    expect(filterMethods('不存在的方法xyz')).toEqual([]);
  });
});

describe('专题对比区', () => {
  it('包含 PUT vs PATCH、POST vs PUT、OPTIONS/CORS 三个专题', () => {
    expect(METHOD_COMPARISONS).toHaveLength(3);
    const titles = METHOD_COMPARISONS.map((item) => item.title);
    expect(titles.some((title) => title.includes('PUT vs PATCH'))).toBe(true);
    expect(titles.some((title) => title.includes('POST vs PUT'))).toBe(true);
    expect(titles.some((title) => title.includes('CORS'))).toBe(true);
  });

  it('PUT vs PATCH 对比含语义差异与请求体示例', () => {
    const putPatch = METHOD_COMPARISONS.find((item) => item.title.includes('PUT vs PATCH'));
    expect(putPatch).toBeDefined();
    expect(putPatch?.bodyExample).toContain('PATCH');
    expect(putPatch?.bodyExample).toContain('PUT');
    expect(putPatch?.rows.some((row) => row.aspect === '语义')).toBe(true);
    expect(putPatch?.rows.some((row) => row.aspect === '幂等性')).toBe(true);
  });

  it('搜索「幂等」能过滤出对比条目', () => {
    const result = filterComparisons('幂等');
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('搜索 cors 命中 OPTIONS 预检专题', () => {
    const result = filterComparisons('cors');
    expect(result).toHaveLength(1);
    expect(result[0]!.title).toContain('CORS');
  });

  it('空关键字返回全部专题', () => {
    expect(filterComparisons('')).toHaveLength(3);
  });
});
