import { describe, it, expect } from 'vitest';
import { jsonToYaml } from './converter';

describe('jsonToYaml', () => {
  it('输入为空时返回空串', () => {
    expect(jsonToYaml('')).toBe('');
    expect(jsonToYaml('   \n\t ')).toBe('');
  });

  it('转换简单键值对', () => {
    const input = JSON.stringify({
      name: 'John',
      age: 30,
      isStudent: false,
      gpa: 3.5,
      nickname: null,
    });
    expect(jsonToYaml(input)).toBe(
      ['name: John', 'age: 30', 'isStudent: false', 'gpa: 3.5', 'nickname: null'].join(
        '\n',
      ),
    );
  });

  it('转换嵌套对象并保持缩进层级', () => {
    const input = JSON.stringify({
      person: {
        name: 'Alice',
        address: { street: '123 Main St', city: 'New York' },
      },
    });
    expect(jsonToYaml(input)).toBe(
      [
        'person:',
        '  name: Alice',
        '  address:',
        '    street: 123 Main St',
        '    city: New York',
      ].join('\n'),
    );
  });

  it('转换标量数组', () => {
    const input = JSON.stringify({ tags: ['a', 'b', 'c'] });
    expect(jsonToYaml(input)).toBe(['tags:', '  - a', '  - b', '  - c'].join('\n'));
  });

  it('转换对象数组', () => {
    const input = JSON.stringify([
      { name: 'A', id: 1 },
      { name: 'B', id: 2 },
    ]);
    expect(jsonToYaml(input)).toBe(
      ['- name: A', '  id: 1', '- name: B', '  id: 2'].join('\n'),
    );
  });

  it('为会被误判类型或含特殊字符的字符串加引号', () => {
    const input = JSON.stringify({
      num: '123',
      flag: 'true',
      empty: '',
      spaced: ' hi ',
      colon: 'a: b',
      hash: 'a # b',
    });
    expect(jsonToYaml(input)).toBe(
      [
        'num: "123"',
        'flag: "true"',
        'empty: ""',
        'spaced: " hi "',
        'colon: "a: b"',
        'hash: "a # b"',
      ].join('\n'),
    );
  });

  it('支持自定义缩进宽度', () => {
    const input = JSON.stringify({ a: { b: 1 } });
    expect(jsonToYaml(input, { indentSize: 4 })).toBe(['a:', '    b: 1'].join('\n'));
  });

  it('处理空对象与空数组', () => {
    expect(jsonToYaml(JSON.stringify({ a: {}, b: [] }))).toBe(
      ['a: {}', 'b: []'].join('\n'),
    );
    expect(jsonToYaml('{}')).toBe('{}');
    expect(jsonToYaml('[]')).toBe('[]');
  });

  it('非法 JSON 输入抛出可读错误并且不产出结果', () => {
    expect(() => jsonToYaml('{ bad json')).toThrowError(/JSON 解析失败/);
  });
});
