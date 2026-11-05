import { describe, expect, it } from 'vitest';
import { HTTP_METHODS, METHOD_COMPARISONS } from './httpMethodsData';
import {
  bodySupportLabel,
  filterMethods,
  getMethod,
  methodsWith,
  validateMethodInvariants,
} from './httpMethods';

describe('静态数据完整性', () => {
  it('完整覆盖 9 个标准方法', () => {
    expect(HTTP_METHODS.map((item) => item.method)).toEqual([
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

  it('每条方法字段完整且方法名唯一', () => {
    const names = new Set<string>();
    for (const entry of HTTP_METHODS) {
      expect(entry.semantics.length).toBeGreaterThan(0);
      expect(entry.rfc.length).toBeGreaterThan(0);
      expect(entry.useCases.length).toBeGreaterThan(0);
      expect(entry.commonStatuses.length).toBeGreaterThan(0);
      expect(entry.pitfalls.length).toBeGreaterThan(0);
      expect(entry.requestExample.includes(entry.method)).toBe(true);
      expect(names.has(entry.method)).toBe(false);
      names.add(entry.method);
    }
  });

  it('包含 3 个专题对比且 PUT vs PATCH 含请求体示例', () => {
    expect(METHOD_COMPARISONS.length).toBeGreaterThanOrEqual(3);
    const putVsPatch = METHOD_COMPARISONS.find((item) => item.id === 'put-vs-patch');
    expect(putVsPatch).toBeDefined();
    expect(putVsPatch!.sideA.example).toContain('PUT');
    expect(putVsPatch!.sideB.example).toContain('PATCH');
    expect(putVsPatch!.summary.length).toBeGreaterThan(0);
  });
});

describe('RFC 9110 不变量', () => {
  it('内置数据全部通过不变量校验', () => {
    expect(validateMethodInvariants()).toEqual([]);
  });

  it('GET 与 HEAD 标注为 safe 且 idempotent', () => {
    const get = getMethod('get')!;
    const head = getMethod('HEAD')!;
    expect(get.safe).toBe(true);
    expect(get.idempotent).toBe(true);
    expect(head.safe).toBe(true);
    expect(head.idempotent).toBe(true);
  });

  it('PATCH 非 safe 且非默认幂等', () => {
    const patch = getMethod('PATCH')!;
    expect(patch.safe).toBe(false);
    expect(patch.idempotent).toBe(false);
    expect(patch.pitfalls.join(' ')).toContain('幂等');
  });

  it('safe 方法集合为 GET/HEAD/OPTIONS/TRACE', () => {
    expect(methodsWith('safe').sort()).toEqual(['GET', 'HEAD', 'OPTIONS', 'TRACE'].sort());
  });

  it('幂等方法包含 PUT/DELETE 但不包含 POST/PATCH', () => {
    const idempotent = methodsWith('idempotent');
    expect(idempotent).toContain('PUT');
    expect(idempotent).toContain('DELETE');
    expect(idempotent).not.toContain('POST');
    expect(idempotent).not.toContain('PATCH');
  });

  it('可缓存方法为 GET/HEAD/POST', () => {
    expect(methodsWith('cacheable').sort()).toEqual(['GET', 'HEAD', 'POST'].sort());
  });

  it('GET 与 DELETE 的请求体语义为未定义，HEAD/TRACE 不允许请求体', () => {
    expect(getMethod('GET')!.body).toBe('undefined');
    expect(getMethod('DELETE')!.body).toBe('undefined');
    expect(getMethod('HEAD')!.body).toBe('no');
    expect(getMethod('TRACE')!.body).toBe('no');
    expect(bodySupportLabel('yes')).toBe('允许');
    expect(bodySupportLabel('no')).toBe('不允许');
    expect(bodySupportLabel('undefined')).toBe('未定义');
  });
});

describe('filterMethods 搜索', () => {
  it('空关键字返回全部方法与对比', () => {
    const all = filterMethods('');
    expect(all.methods).toHaveLength(9);
    expect(all.comparisons).toHaveLength(METHOD_COMPARISONS.length);
    expect(filterMethods('   ').methods).toHaveLength(9);
  });

  it('搜索“幂等”命中相关方法与对比条目', () => {
    const result = filterMethods('幂等');
    expect(result.methods.length).toBeGreaterThan(0);
    expect(result.methods.some((item) => item.method === 'PUT')).toBe(true);
    expect(result.comparisons.some((item) => item.id === 'put-vs-patch')).toBe(true);
  });

  it('支持方法名与英文关键字搜索', () => {
    expect(filterMethods('patch').methods.map((item) => item.method)).toContain('PATCH');
    expect(filterMethods('CORS').comparisons.some((item) => item.id === 'options-cors')).toBe(true);
    expect(filterMethods('隧道').methods[0]!.method).toBe('CONNECT');
  });

  it('无命中时返回空数组', () => {
    const result = filterMethods('不存在的方法zzz');
    expect(result.methods).toEqual([]);
    expect(result.comparisons).toEqual([]);
  });
});
