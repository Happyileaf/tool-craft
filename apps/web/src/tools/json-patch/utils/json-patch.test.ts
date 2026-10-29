import { describe, expect, it } from 'vitest';
import {
  applyJsonPatch,
  deepEqual,
  type JsonPatchSuccess,
  type JsonValue,
} from './json-patch';

function ok(
  result: JsonPatchSuccess | { error: string },
): JsonPatchSuccess {
  expect('error' in result).toBe(false);
  return result as JsonPatchSuccess;
}

function fail(result: JsonPatchSuccess | { error: string }): string {
  expect('error' in result).toBe(true);
  return (result as { error: string }).error;
}

describe('deepEqual', () => {
  it('比较标量', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(1, '1')).toBe(false);
    expect(deepEqual(null, 0)).toBe(false);
  });

  it('深度比较数组与对象（忽略键顺序）', () => {
    expect(deepEqual([1, 2, { a: 1 }], [1, 2, { a: 1 }])).toBe(true);
    expect(deepEqual({ a: 1, b: [2] }, { b: [2], a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual([], {})).toBe(false);
  });
});

describe('RFC 6902 附录 A 官方示例', () => {
  const base: JsonValue = {
    foo: { bar: 'baz', '': 0 },
    '': 0,
    a: 1,
    ' ': 7,
    c: { d: 'e', f: null },
    i: 0,
    x: { '': { b: 3 }, c: 4 },
    '/': 9,
    '~1': 10,
    list: [1, 2, 3],
  };

  it('A.1 add 对象键', () => {
    const { result } = ok(
      applyJsonPatch(base, [{ op: 'add', path: '/bar', value: [1, 2] }]),
    );
    expect(result).toMatchObject({ bar: [1, 2] });
  });

  it('A.3 remove 对象键', () => {
    const { result } = ok(applyJsonPatch(base, [{ op: 'remove', path: '/foo/bar' }]));
    expect(result).not.toHaveProperty('bar');
    expect((result as { foo: object }).foo).toEqual({ '': 0 });
  });

  it('A.4 remove 后再 add 实现 replace 效果', () => {
    const { result } = ok(
      applyJsonPatch(base, [
        { op: 'remove', path: '/foo/bar' },
        { op: 'add', path: '/hello', value: ['world'] },
        { op: 'add', path: '/foo/new', value: 'qux' },
      ]),
    );
    expect(result).toMatchObject({
      hello: ['world'],
      foo: { '': 0, new: 'qux' },
    });
  });

  it('A.5 空字符串键的路径', () => {
    const { result } = ok(
      applyJsonPatch(base, [{ op: 'replace', path: '/', value: 'replaced' }]),
    );
    expect((result as Record<string, unknown>)['']).toBe('replaced');
    expect((result as { foo: Record<string, unknown> }).foo['']).toBe(0);
  });

  it('A.6 空格键', () => {
    const { result } = ok(
      applyJsonPatch(base, [{ op: 'replace', path: '/ ', value: 8 }]),
    );
    expect((result as Record<string, unknown>)[' ']).toBe(8);
  });

  it('A.7 多层路径与转义键', () => {
    const { result } = ok(
      applyJsonPatch(base, [{ op: 'replace', path: '/c/f', value: 'patched' }]),
    );
    expect((result as { c: { f: string } }).c.f).toBe('patched');
  });

  it('A.8 数组指定下标插入', () => {
    const { result } = ok(
      applyJsonPatch({ list: ['a', 'b', 'c', 'd'] }, [
        { op: 'add', path: '/list/1', value: 'x' },
      ]),
    );
    expect((result as { list: string[] }).list).toEqual(['a', 'x', 'b', 'c', 'd']);
  });

  it('A.9 "-" 追加数组末尾', () => {
    const { result } = ok(
      applyJsonPatch({ list: ['a', 'b'] }, [
        { op: 'add', path: '/list/-', value: 'c' },
      ]),
    );
    expect((result as { list: string[] }).list).toEqual(['a', 'b', 'c']);
  });

  it('A.10 数组按下标删除', () => {
    const { result } = ok(
      applyJsonPatch({ list: ['a', 'b', 'c', 'd'] }, [
        { op: 'remove', path: '/list/1' },
      ]),
    );
    expect((result as { list: string[] }).list).toEqual(['a', 'c', 'd']);
  });

  it('A.11 数组元素替换', () => {
    const { result } = ok(
      applyJsonPatch({ list: ['a', 'b', 'c'] }, [
        { op: 'replace', path: '/list/1', value: 'z' },
      ]),
    );
    expect((result as { list: string[] }).list).toEqual(['a', 'z', 'c']);
  });

  it('A.14 转义路径 /a~1b 与 /m~0n', () => {
    const doc: JsonValue = { 'a/b': 1, 'm~n': 2 };
    const { result } = ok(
      applyJsonPatch(doc, [
        { op: 'add', path: '/a~1b', value: 'x' },
        { op: 'add', path: '/m~0n', value: 'y' },
      ]),
    );
    expect(result).toEqual({ 'a/b': 'x', 'm~n': 'y' });
  });

  it('A.15 move 移动键', () => {
    const doc: JsonValue = {
      foo: { bar: 'baz', waldo: 'fred' },
      qux: { corge: 'grault' },
    };
    const { result } = ok(
      applyJsonPatch(doc, [
        { op: 'move', from: '/foo/waldo', path: '/qux/thud' },
      ]),
    );
    expect(result).toEqual({
      foo: { bar: 'baz' },
      qux: { corge: 'grault', thud: 'fred' },
    });
  });

  it('A.16 move 数组元素（先删后插）', () => {
    const { result } = ok(
      applyJsonPatch({ list: ['a', 'b', 'c', 'd'] }, [
        { op: 'move', from: '/list/1', path: '/list/3' },
      ]),
    );
    expect((result as { list: string[] }).list).toEqual(['a', 'c', 'd', 'b']);
  });

  it('A.17 copy 复制到数组', () => {
    const { result } = ok(
      applyJsonPatch({ foo: { x: { y: 1 } }, list: ['a', 'b'] }, [
        { op: 'copy', from: '/foo/x', path: '/list/-' },
      ]),
    );
    expect(result).toEqual({
      foo: { x: { y: 1 } },
      list: ['a', 'b', { y: 1 }],
    });
  });

  it('A.18 test 成功（深度相等）', () => {
    const out = ok(
      applyJsonPatch({ list: ['a', 2, { c: 3 }] }, [
        {
          op: 'test',
          path: '/list',
          value: ['a', 2, { c: 3 }],
        },
      ]),
    );
    expect(out.applied).toBe(1);
  });

  it('test 数字相等但类型语义一致', () => {
    const out = ok(
      applyJsonPatch({ x: 1e2 }, [{ op: 'test', path: '/x', value: 100 }]),
    );
    expect(out.applied).toBe(1);
  });

  it('add 到空路径替换整个文档', () => {
    const { result } = ok(
      applyJsonPatch({ a: 1 }, [{ op: 'add', path: '', value: { b: 2 } }]),
    );
    expect(result).toEqual({ b: 2 });
  });

  it('replace 根节点', () => {
    const { result } = ok(
      applyJsonPatch({ a: 1 }, [{ op: 'replace', path: '', value: [1, 2] }]),
    );
    expect(result).toEqual([1, 2]);
  });

  it('成功时返回已应用操作数', () => {
    const out = ok(
      applyJsonPatch({ a: 1 }, [
        { op: 'add', path: '/b', value: 2 },
        { op: 'add', path: '/c', value: 3 },
      ]),
    );
    expect(out.applied).toBe(2);
    expect(out.result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('不修改原始文档（深拷贝隔离）', () => {
    const doc: JsonValue = { list: [1, 2], nested: { a: 1 } };
    const snapshot = JSON.parse(JSON.stringify(doc));
    ok(
      applyJsonPatch(doc, [
        { op: 'add', path: '/list/-', value: 3 },
        { op: 'remove', path: '/nested/a' },
      ]),
    );
    expect(doc).toEqual(snapshot);
  });

  it('copy 出的值与源脱耦', () => {
    const { result } = ok(
      applyJsonPatch({ src: { nested: { v: 1 } } }, [
        { op: 'copy', from: '/src', path: '/dst' },
        { op: 'replace', path: '/src/nested/v', value: 99 },
      ]),
    );
    expect(result).toEqual({
      src: { nested: { v: 99 } },
      dst: { nested: { v: 1 } },
    });
  });
});

describe('操作级错误', () => {
  it('补丁不是数组', () => {
    expect(fail(applyJsonPatch({}, { op: 'add' }))).toContain('补丁必须是');
  });

  it('操作不是对象', () => {
    expect(fail(applyJsonPatch({}, ['bad']))).toContain('第 1 个操作必须是对象');
  });

  it('op 未知（含操作序号）', () => {
    const message = fail(applyJsonPatch({}, [{ op: 'rename', path: '/a' }]));
    expect(message).toContain('第 1 个操作');
    expect(message).toContain('未知');
  });

  it('缺少 op 字段', () => {
    expect(fail(applyJsonPatch({}, [{ path: '/a' }]))).toContain(
      '第 1 个操作缺少',
    );
  });

  it('缺少 path 字段', () => {
    const message = fail(applyJsonPatch({}, [{ op: 'add', value: 1 }]));
    expect(message).toContain('第 1 个操作（add）失败');
    expect(message).toContain('path');
  });

  it('add/replace/test 缺少 value', () => {
    expect(fail(applyJsonPatch({}, [{ op: 'add', path: '/a' }]))).toContain(
      '缺少 "value"',
    );
  });

  it('move/copy 缺少 from', () => {
    expect(fail(applyJsonPatch({ a: 1 }, [{ op: 'move', path: '/b' }]))).toContain(
      '缺少字符串类型的 "from"',
    );
  });

  it('操作序号正确指向失败的操作', () => {
    const message = fail(
      applyJsonPatch({ a: 1 }, [
        { op: 'add', path: '/b', value: 2 },
        { op: 'remove', path: '/missing' },
      ]),
    );
    expect(message).toContain('第 2 个操作（remove）失败');
    expect(message).toContain('不存在');
  });

  it('replace 不存在的路径', () => {
    const message = fail(
      applyJsonPatch({ a: 1 }, [{ op: 'replace', path: '/b', value: 2 }]),
    );
    expect(message).toContain('第 1 个操作（replace）失败');
    expect(message).toContain('不存在');
  });

  it('test 不匹配', () => {
    const message = fail(
      applyJsonPatch({ a: 1 }, [{ op: 'test', path: '/a', value: 2 }]),
    );
    expect(message).toContain('test 断言失败');
  });

  it('数组读取越界', () => {
    const message = fail(
      applyJsonPatch({ list: [1] }, [{ op: 'remove', path: '/list/5' }]),
    );
    expect(message).toContain('越界');
  });

  it('数组插入越界（index > length）', () => {
    const message = fail(
      applyJsonPatch({ list: [1] }, [
        { op: 'add', path: '/list/3', value: 2 },
      ]),
    );
    expect(message).toContain('越界');
  });

  it('数组下标非法（前导零 / 非数字）', () => {
    expect(fail(
      applyJsonPatch({ list: [1] }, [{ op: 'remove', path: '/list/01' }]),
    )).toContain('非法');
    expect(fail(
      applyJsonPatch({ list: [1] }, [{ op: 'remove', path: '/list/abc' }]),
    )).toContain('非法');
  });

  it('在标量中继续深入报错', () => {
    const message = fail(
      applyJsonPatch({ a: 1 }, [{ op: 'remove', path: '/a/b' }]),
    );
    expect(message).toContain('不是对象或数组');
  });

  it('remove 根节点报错', () => {
    expect(fail(applyJsonPatch({ a: 1 }, [{ op: 'remove', path: '' }]))).toContain(
      '根节点',
    );
  });

  it('move 到自身后代路径报错', () => {
    const message = fail(
      applyJsonPatch({ a: { b: 1 } }, [
        { op: 'move', from: '/a', path: '/a/c' },
      ]),
    );
    expect(message).toContain('自身后代');
  });

  it('from 路径不存在报错', () => {
    const message = fail(
      applyJsonPatch({ a: 1 }, [
        { op: 'move', from: '/missing', path: '/b' },
      ]),
    );
    expect(message).toContain('第 1 个操作（move）失败');
  });

  it('JSON Pointer 非法转义', () => {
    expect(fail(
      applyJsonPatch({ 'a~b': 1 }, [{ op: 'remove', path: '/a~2' }]),
    )).toContain('非法转义');
  });

  it('JSON Pointer 波浪号结尾不完整', () => {
    expect(fail(
      applyJsonPatch({ a: 1 }, [{ op: 'remove', path: '/a~' }]),
    )).toContain('转义不完整');
  });

  it('路径不以 / 开头报错', () => {
    expect(fail(
      applyJsonPatch({ a: 1 }, [{ op: 'remove', path: 'a' }]),
    )).toContain('以 "/" 开头');
  });

  it('中途失败的操作不影响报错结果（原子返回错误）', () => {
    const result = applyJsonPatch({ a: 1 }, [
      { op: 'add', path: '/b', value: 2 },
      { op: 'remove', path: '/nope' },
    ]);
    expect('error' in result).toBe(true);
    expect(result).not.toHaveProperty('result');
  });
});
