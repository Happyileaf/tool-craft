import { describe, expect, it } from 'vitest';
import { diffJson, formatValue, parseJson } from './jsonDiff';

/** 便捷解析，测试中只使用合法 JSON */
const parse = (text: string): unknown => {
  const result = parseJson(text);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
};

describe('parseJson', () => {
  it('合法 JSON 解析成功并携带值', () => {
    expect(parseJson('{"a":1}')).toEqual({ ok: true, value: { a: 1 } });
    expect(parseJson('  [1, 2, 3]  ')).toEqual({ ok: true, value: [1, 2, 3] });
  });

  it('非法 JSON 解析报错并返回错误信息', () => {
    const result = parseJson('{a: 1}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it('空文本解析报错', () => {
    const result = parseJson('   ');
    expect(result.ok).toBe(false);
  });
});

describe('diffJson - 基础场景', () => {
  it('完全相同的对象返回空数组', () => {
    const value = parse('{"a":1,"b":[1,2],"c":{"d":"x"}}');
    expect(diffJson(value, parse(JSON.stringify(value)))).toEqual([]);
  });

  it('完全相同的基本类型返回空数组', () => {
    expect(diffJson(1, 1)).toEqual([]);
    expect(diffJson('hello', 'hello')).toEqual([]);
    expect(diffJson(null, null)).toEqual([]);
    expect(diffJson(true, true)).toEqual([]);
  });

  it('新增 key 报告 added', () => {
    const entries = diffJson(parse('{"a":1}'), parse('{"a":1,"b":2}'));
    expect(entries).toEqual([
      { path: '$.b', type: 'added', leftValue: '', rightValue: '2' },
    ]);
  });

  it('删除 key 报告 removed', () => {
    const entries = diffJson(parse('{"a":1,"b":2}'), parse('{"a":1}'));
    expect(entries).toEqual([
      { path: '$.b', type: 'removed', leftValue: '2', rightValue: '' },
    ]);
  });

  it('值修改报告 changed', () => {
    const entries = diffJson(parse('{"a":1}'), parse('{"a":2}'));
    expect(entries).toEqual([
      { path: '$.a', type: 'changed', leftValue: '1', rightValue: '2' },
    ]);
  });

  it('字符串与布尔值修改也报告 changed', () => {
    const entries = diffJson(parse('{"s":"x","b":true}'), parse('{"s":"y","b":false}'));
    expect(entries).toContainEqual({
      path: '$.s',
      type: 'changed',
      leftValue: '"x"',
      rightValue: '"y"',
    });
    expect(entries).toContainEqual({
      path: '$.b',
      type: 'changed',
      leftValue: 'true',
      rightValue: 'false',
    });
  });

  it('类型变化报告 type-changed', () => {
    const entries = diffJson(parse('{"a":1}'), parse('{"a":"1"}'));
    expect(entries).toEqual([
      { path: '$.a', type: 'type-changed', leftValue: '1', rightValue: '"1"' },
    ]);
  });

  it('对象与数组互换也报告 type-changed', () => {
    const entries = diffJson(parse('{"a":{}}'), parse('{"a":[]}'));
    expect(entries[0]?.type).toBe('type-changed');
    expect(entries[0]?.path).toBe('$.a');
  });
});

describe('diffJson - 嵌套与数组', () => {
  it('嵌套对象递归对比并输出完整 JSONPath', () => {
    const left = parse('{"user":{"name":"张三","age":20}}');
    const right = parse('{"user":{"name":"李四","age":20}}');
    expect(diffJson(left, right)).toEqual([
      {
        path: '$.user.name',
        type: 'changed',
        leftValue: '"张三"',
        rightValue: '"李四"',
      },
    ]);
  });

  it('嵌套对象内部新增 key', () => {
    const left = parse('{"user":{"name":"张三"}}');
    const right = parse('{"user":{"name":"张三","city":"北京"}}');
    expect(diffJson(left, right)).toEqual([
      {
        path: '$.user.city',
        type: 'added',
        leftValue: '',
        rightValue: '"北京"',
      },
    ]);
  });

  it('数组长度差异报告长度变化，多出元素报告 added/removed', () => {
    const entries = diffJson(parse('[1,2]'), parse('[1,2,3]'));
    expect(entries).toContainEqual({
      path: '$',
      type: 'changed',
      leftValue: '数组长度 2',
      rightValue: '数组长度 3',
    });
    expect(entries).toContainEqual({
      path: '$[2]',
      type: 'added',
      leftValue: '',
      rightValue: '3',
    });
  });

  it('数组按索引逐项对比元素差异', () => {
    const entries = diffJson(parse('[{"id":1},{"id":2}]'), parse('[{"id":1},{"id":3}]'));
    expect(entries).toEqual([
      { path: '$[1].id', type: 'changed', leftValue: '2', rightValue: '3' },
    ]);
  });

  it('含特殊字符的 key 使用方括号路径', () => {
    const entries = diffJson(parse('{}'), parse('{"a-b":1}'));
    expect(entries[0]?.path).toBe('$["a-b"]');
    expect(entries[0]?.type).toBe('added');
  });
});

describe('formatValue', () => {
  it('对象按 key 稳定序列化，数组与基本类型安全展示', () => {
    expect(formatValue({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(formatValue([1, 2])).toBe('[1,2]');
    expect(formatValue('text')).toBe('"text"');
    expect(formatValue(null)).toBe('null');
    expect(formatValue(undefined)).toBe('');
  });
});
