import { describe, expect, it } from 'vitest';
import {
  flattenJson,
  flattenJsonText,
  unflattenJson,
  unflattenJsonText,
} from './flatten';

describe('flattenJson', () => {
  it('扁平化为点路径单层键值', () => {
    expect(flattenJson({ a: 1, b: { c: 2, d: { e: 3 } } })).toEqual({
      a: 1,
      'b.c': 2,
      'b.d.e': 3,
    });
  });

  it('数组展开为带索引的路径', () => {
    expect(flattenJson({ a: [1, 2, { b: 3 }] })).toEqual({
      'a[0]': 1,
      'a[1]': 2,
      'a[2].b': 3,
    });
  });

  it('根为数组时路径从 [0] 开始', () => {
    expect(flattenJson([{ a: 1 }, { b: 2 }])).toEqual({
      '[0].a': 1,
      '[1].b': 2,
    });
  });

  it('嵌套数组使用连续索引路径', () => {
    expect(flattenJson({ a: [[10, 20], [30]] })).toEqual({
      'a[0][0]': 10,
      'a[0][1]': 20,
      'a[1][0]': 30,
    });
  });

  it('空对象与空数组作为叶子保留', () => {
    expect(flattenJson({ a: {}, b: [], c: { d: [] } })).toEqual({
      a: {},
      b: [],
      'c.d': [],
    });
  });

  it('null 作为叶子保留', () => {
    expect(flattenJson({ a: null, b: { c: null } })).toEqual({
      a: null,
      'b.c': null,
    });
  });

  it('根为标量时输出空路径键', () => {
    expect(flattenJson(42)).toEqual({ '': 42 });
    expect(flattenJson('text')).toEqual({ '': 'text' });
  });

  it('空对象与空数组输入输出空对象', () => {
    expect(flattenJson({})).toEqual({});
    expect(flattenJson([])).toEqual({});
  });

  it('支持自定义分隔符', () => {
    expect(flattenJson({ a: { b: 1 } }, { separator: '/' })).toEqual({
      'a/b': 1,
    });
  });

  it('expandArrays=false 时数组整体作为叶子', () => {
    expect(flattenJson({ a: [1, 2], b: { c: [3] } }, { expandArrays: false })).toEqual({
      a: [1, 2],
      'b.c': [3],
    });
  });

  it('键本身包含点号时仍按实际键输出', () => {
    expect(flattenJson({ 'a.b': 1, a: { c: 2 } })).toEqual({
      'a.b': 1,
      'a.c': 2,
    });
  });

  it('空分隔符抛错', () => {
    expect(() => flattenJson({ a: 1 }, { separator: '' })).toThrow('分隔符不能为空');
  });
});

describe('unflattenJson', () => {
  it('按点路径还原嵌套对象', () => {
    expect(
      unflattenJson({ a: 1, 'b.c': 2, 'b.d.e': 3 }),
    ).toEqual({
      a: 1,
      b: { c: 2, d: { e: 3 } },
    });
  });

  it('按索引路径还原数组', () => {
    expect(
      unflattenJson({ 'a[0]': 1, 'a[1]': 2, 'a[2].b': 3 }),
    ).toEqual({ a: [1, 2, { b: 3 }] });
  });

  it('还原根数组', () => {
    expect(unflattenJson({ '[0].a': 1, '[1].b': 2 })).toEqual([
      { a: 1 },
      { b: 2 },
    ]);
  });

  it('还原嵌套数组', () => {
    expect(
      unflattenJson({ 'a[0][0]': 10, 'a[0][1]': 20, 'a[1][0]': 30 }),
    ).toEqual({ a: [[10, 20], [30]] });
  });

  it('空数组索引形成稀疏数组', () => {
    const result = unflattenJson({ 'a[2]': 1 }) as { a: unknown[] };
    expect(Array.isArray(result.a)).toBe(true);
    expect(result.a[2]).toBe(1);
  });

  it('支持自定义分隔符', () => {
    expect(unflattenJson({ 'a/b': 1 }, '/')).toEqual({ a: { b: 1 } });
  });

  it('空路径键还原为标量根', () => {
    expect(unflattenJson({ '': 42 })).toBe(42);
  });

  it('叶子与路径同时存在时抛出路径冲突', () => {
    expect(() => unflattenJson({ a: 1, 'a.b': 2 })).toThrow(/路径冲突/);
    expect(() => unflattenJson({ 'a.b': 2, a: 1 })).toThrow(/路径冲突/);
  });

  it('索引与对象类型冲突时抛错', () => {
    expect(() => unflattenJson({ a: 1, 'a[0]': 2 })).toThrow(/路径冲突/);
    expect(() => unflattenJson({ 'a.b': 1, 'a[0]': 2 })).toThrow(/路径冲突/);
  });

  it('多个根标量值抛错', () => {
    expect(() => unflattenJson({ a: 2, '': 1 })).toThrow(/根路径/);
    expect(() => unflattenJson({ '': 1, a: 2 })).toThrow(/冲突/);
  });

  it('空分隔符抛错', () => {
    expect(() => unflattenJson({ a: 1 }, '')).toThrow('分隔符不能为空');
  });
});

describe('flattenJson / unflattenJson 往返', () => {
  it('复杂结构双向转换后保持等价', () => {
    const original = {
      id: 7,
      name: 'demo',
      active: true,
      tags: ['a', 'b'],
      meta: { score: 1.5, nested: { deep: [1, { x: null }] } },
      empty: { obj: {}, arr: [] },
    };
    const flat = flattenJson(original);
    expect(unflattenJson(flat)).toEqual(original);
  });

  it('根数组往返保持等价', () => {
    const original = [{ a: 1 }, { b: [2, 3] }, null];
    expect(unflattenJson(flattenJson(original))).toEqual(original);
  });
});

describe('flattenJsonText', () => {
  it('解析并扁平化 JSON 文本', () => {
    const result = flattenJsonText('{"a":{"b":1},"c":[2]}');
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ 'a.b': 1, 'c[0]': 2 });
  });

  it('空文本返回空结果', () => {
    expect(flattenJsonText('   ')).toEqual({ data: null, error: null });
  });

  it('非法 JSON 返回解析错误', () => {
    const result = flattenJsonText('{a: 1}');
    expect(result.data).toBeNull();
    expect(result.error).toContain('JSON 解析失败');
  });
});

describe('unflattenJsonText', () => {
  it('解析并还原扁平 JSON 文本', () => {
    const result = unflattenJsonText('{"a.b":1,"a.c":2}');
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ a: { b: 1, c: 2 } });
  });

  it('空文本返回空结果', () => {
    expect(unflattenJsonText('')).toEqual({ data: null, error: null });
  });

  it('非法 JSON 返回解析错误', () => {
    const result = unflattenJsonText('not json');
    expect(result.data).toBeNull();
    expect(result.error).toContain('JSON 解析失败');
  });

  it('顶层数组输入返回类型错误', () => {
    const result = unflattenJsonText('[{"a.b":1}]');
    expect(result.data).toBeNull();
    expect(result.error).toContain('单层 JSON 对象');
  });

  it('顶层标量输入返回类型错误', () => {
    const result = unflattenJsonText('42');
    expect(result.data).toBeNull();
    expect(result.error).toContain('单层 JSON 对象');
  });

  it('路径冲突转成错误结果而非抛异常', () => {
    const result = unflattenJsonText('{"a":1,"a.b":2}');
    expect(result.data).toBeNull();
    expect(result.error).toContain('路径冲突');
  });
});
