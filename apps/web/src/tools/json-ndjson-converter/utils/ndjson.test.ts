import { describe, it, expect } from 'vitest';
import { jsonToNdjson, ndjsonToJson } from './ndjson';

describe('jsonToNdjson', () => {
  it('输入为空时返回空串', () => {
    expect(jsonToNdjson('')).toBe('');
    expect(jsonToNdjson('  \n ')).toBe('');
  });

  it('把 JSON 数组逐元素输出为每行一个紧凑 JSON', () => {
    const input = JSON.stringify(
      [
        { name: 'John', age: 30 },
        { name: 'Jane', city: 'London' },
      ],
      null,
      2,
    );
    const result = jsonToNdjson(input);
    expect(result.split('\n')).toEqual([
      '{"name":"John","age":30}',
      '{"name":"Jane","city":"London"}',
    ]);
  });

  it('支持标量与嵌套结构元素', () => {
    expect(jsonToNdjson('[1, "x", true, null, [1, 2], {"a": {"b": 1}}]')).toBe(
      '1\n"x"\ntrue\nnull\n[1,2]\n{"a":{"b":1}}',
    );
  });

  it('空数组输出空串', () => {
    expect(jsonToNdjson('[]')).toBe('');
  });

  it('元素中的换行等字符被正确转义，不会破坏行结构', () => {
    const result = jsonToNdjson('[{"note": "line1\\nline2"}]');
    expect(result.split('\n')).toHaveLength(1);
    expect(JSON.parse(result)).toEqual({ note: 'line1\nline2' });
  });

  it('输入非法 JSON 时报错', () => {
    expect(() => jsonToNdjson('[{"a": 1},]')).toThrow(/合法的 JSON/);
  });

  it('输入为非数组 JSON 时报错并提示必须是数组', () => {
    expect(() => jsonToNdjson('{"a": 1}')).toThrow(/数组/);
    expect(() => jsonToNdjson('"hello"')).toThrow(/数组/);
  });
});

describe('ndjsonToJson', () => {
  it('输入为空时返回空串', () => {
    expect(ndjsonToJson('')).toBe('');
    expect(ndjsonToJson('\n  \n\t\n')).toBe('');
  });

  it('把每行 JSON 解析为数组元素并按 2 空格缩进输出', () => {
    const input = '{"name":"John","age":30}\n{"name":"Jane","city":"London"}';
    const result = ndjsonToJson(input);
    expect(JSON.parse(result)).toEqual([
      { name: 'John', age: 30 },
      { name: 'Jane', city: 'London' },
    ]);
    expect(result).toContain('\n    "name"');
  });

  it('跳过空行并兼容 CRLF', () => {
    const input = '\r\n{"a":1}\r\n\r\n{"b":2}\r\n';
    expect(JSON.parse(ndjsonToJson(input))).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('忽略每行前后空白', () => {
    expect(JSON.parse(ndjsonToJson('  {"a":1}  \n  {"b":2}'))).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('支持自定义缩进', () => {
    expect(ndjsonToJson('{"a":1}', { indent: 0 })).toBe('[{"a":1}]');
  });

  it('非法行报错并指出行号', () => {
    const input = '{"a":1}\n{"a": }\n{"b":2}';
    expect(() => ndjsonToJson(input)).toThrow(/第 2 行/);
  });

  it('跨行对象（多行 JSON）不被支持，报具体行号', () => {
    expect(() => ndjsonToJson('{\n  "a": 1\n}')).toThrow(/第 1 行|第 2 行/);
  });
});

describe('双向往返', () => {
  it('JSON 数组 → NDJSON → JSON 数组保持数据一致', () => {
    const original = [
      { id: 1, tags: ['a', 'b'], meta: { active: true } },
      { id: 2, tags: [], meta: { active: false, note: 'x' } },
    ];
    const ndjson = jsonToNdjson(JSON.stringify(original));
    const back = JSON.parse(ndjsonToJson(ndjson));
    expect(back).toEqual(original);
  });
});
