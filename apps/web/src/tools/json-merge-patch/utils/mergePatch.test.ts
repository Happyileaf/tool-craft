import { describe, expect, it } from 'vitest';
import {
  applyPatch,
  generatePatch,
  isPlainObject,
  parseJson,
} from './mergePatch';

/**
 * RFC 7386 Appendix A 官方测试向量（按原文顺序，末两组为生成语义向量）
 */
const RFC_CASES: Array<[unknown, unknown, unknown]> = [
  [{ a: 'b' }, { a: 'c' }, { a: 'c' }],
  [{ a: 'b' }, { b: 'c' }, { a: 'b', b: 'c' }],
  [{ a: 'b' }, { a: null }, {}],
  [{ a: 'b', b: 'c' }, { a: null }, { b: 'c' }],
  [{ a: ['b'] }, { a: 'c' }, { a: 'c' }],
  [{ a: 'c' }, { a: ['b'] }, { a: ['b'] }],
  [{ a: { b: 'c' } }, { a: { b: 'd', c: null } }, { a: { b: 'd' } }],
  [{ a: [{ b: 'c' }] }, { a: [1] }, { a: [1] }],
  [['a', 'b'], ['c', 'd'], ['c', 'd']],
  [{ a: 'b' }, ['c'], ['c']],
  [{ a: 'foo' }, null, null],
  [{ a: 'foo' }, 'bar', 'bar'],
  [{ e: null }, { a: 1 }, { e: null, a: 1 }],
  [[1, 2], { a: 'b', c: null }, { a: 'b' }],
  [{}, { a: { bb: { ccc: null } } }, { a: { bb: {} } }],
];

describe('applyPatch - RFC 7386 Appendix A 官方向量', () => {
  it.each(RFC_CASES)('应用 %#：%j + %j => %j', (target, patch, expected) => {
    expect(applyPatch(target, patch)).toEqual(expected);
  });

  it('不修改原始目标对象', () => {
    const target = { a: { b: 'c' }, keep: 1 };
    const patch = { a: { b: 'd' } };
    const result = applyPatch(target, patch);
    expect(result).toEqual({ a: { b: 'd' }, keep: 1 });
    expect(target).toEqual({ a: { b: 'c' }, keep: 1 });
  });
});

describe('generatePatch - 最小补丁生成', () => {
  it('删除键生成 null', () => {
    expect(generatePatch({ a: 'b', b: 'c' }, { a: 'b' })).toEqual({ b: null });
  });

  it('值变更取目标值', () => {
    expect(generatePatch({ a: 'b' }, { a: 'c' })).toEqual({ a: 'c' });
  });

  it('新增键出现在补丁中', () => {
    expect(generatePatch({ a: 'b' }, { a: 'b', b: 'c' })).toEqual({ b: 'c' });
  });

  it('嵌套对象递归比较', () => {
    expect(
      generatePatch(
        { a: { b: 'c', d: 1 } },
        { a: { b: 'd', d: 1 } },
      ),
    ).toEqual({ a: { b: 'd' } });
  });

  it('数组整体替换而非逐元素比较', () => {
    expect(generatePatch({ a: [1, 2] }, { a: [1, 3] })).toEqual({
      a: [1, 3],
    });
  });

  it('源为对象、目标为标量时补丁即标量', () => {
    expect(generatePatch({ a: 'x' }, 'bar')).toBe('bar');
  });

  it('源为数组、目标为对象时补丁即对象', () => {
    expect(generatePatch([1, 2], { a: 'b' })).toEqual({ a: 'b' });
  });

  it('深层新增键生成嵌套补丁（RFC A.20）', () => {
    expect(generatePatch({}, { a: { bb: { ccc: null } } })).toEqual({
      a: { bb: { ccc: null } },
    });
  });

  it.each([
    [
      { title: 'Goodbye!', tags: ['example', 'sample'], keep: true },
      { title: 'Hello!', tags: ['example'], keep: true, extra: 1 },
    ],
    [{ a: 1, b: { c: 2, d: 3 } }, { a: 1, b: { c: 9 } }],
    [{ x: [1, 2], y: 'same' }, { x: [1, 2], y: 'same' }],
    ['old', 'new'],
    [null, { a: 1 }],
    [{ a: { nested: 1 } }, { a: { nested: 1, added: 2 } }],
  ])('往返性质：applyPatch(source, generatePatch(source, target)) 深等于 target（%#）', (source, target) => {
    const patch = generatePatch(source, target);
    expect(applyPatch(source, patch)).toEqual(target);
  });

  it('完全相同的文档生成空补丁', () => {
    expect(generatePatch({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] })).toEqual({});
  });
});

describe('parseJson', () => {
  it('解析合法 JSON', () => {
    expect(parseJson('{"a":1}')).toEqual({ a: 1 });
    expect(parseJson('[1,2,3]')).toEqual([1, 2, 3]);
    expect(parseJson('null')).toBeNull();
  });

  it('非法 JSON 抛出含行列定位的错误', () => {
    expect(() => parseJson('{\n  "a": 1,\n}')).toThrow();
    try {
      parseJson('{\n  "a": 1,\n}');
    } catch (error) {
      const caught = error as { message: string; line: number; column: number };
      expect(caught.line).toBeGreaterThanOrEqual(1);
      expect(caught.column).toBeGreaterThanOrEqual(1);
      expect(typeof caught.message).toBe('string');
    }
  });

  it('首行错误定位为第 1 行', () => {
    try {
      parseJson('{broken}');
      throw new Error('应当抛出解析错误');
    } catch (error) {
      const caught = error as { message: string; line: number };
      expect(caught.line).toBe(1);
    }
  });
});

describe('isPlainObject', () => {
  it('普通对象为 true', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it('null、数组、标量为 false', () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([1, 2])).toBe(false);
    expect(isPlainObject('x')).toBe(false);
    expect(isPlainObject(1)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
  });
});
