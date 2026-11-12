import { describe, expect, it } from 'vitest';
import { EdnError, ednToJson, jsonToEdn, parseEdn } from './edn';

describe('parseEdn primitives', () => {
  it('parses nil, booleans, numbers and strings with escapes', () => {
    expect(parseEdn('nil')).toBeNull();
    expect(parseEdn('true')).toBe(true);
    expect(parseEdn('false')).toBe(false);
    expect(parseEdn('42')).toBe(42);
    expect(parseEdn('-3.14e2')).toBe(-314);
    expect(parseEdn('"hello\\nworld\\u0041"')).toBe('hello\nworldA');
  });

  it('parses keywords and symbols with namespaces', () => {
    expect(parseEdn(':foo/bar')).toEqual({ ___edn_type: 'keyword', value: ':foo/bar' });
    expect(parseEdn('clojure.core/plus')).toEqual({
      ___edn_type: 'symbol',
      value: 'clojure.core/plus',
    });
  });

  it('parses tagged inst and uuid values', () => {
    expect(parseEdn('#uuid "550e8400-e29b-41d4-a716-446655440000"')).toEqual({
      ___edn_type: 'uuid',
      value: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(parseEdn('#inst "2026-11-12T10:00:00Z"')).toEqual({
      ___edn_type: 'inst',
      value: '2026-11-12T10:00:00Z',
    });
  });
});

describe('parseEdn collections', () => {
  it('parses vectors, lists and sets with distinct wrappers', () => {
    expect(parseEdn('[1 2 3]')).toEqual([1, 2, 3]);
    expect(parseEdn('(1 2 3)')).toEqual({
      ___edn_type: 'list',
      items: [1, 2, 3],
    });
    expect(parseEdn('#{:a :b}')).toEqual({
      ___edn_type: 'set',
      items: [
        { ___edn_type: 'keyword', value: ':a' },
        { ___edn_type: 'keyword', value: ':b' },
      ],
    });
  });

  it('parses maps with keyword keys and nested structures', () => {
    const result = parseEdn('{:name "Alice" :roles ["admin" nil] :meta {:active true}}') as Record<
      string,
      unknown
    >;
    expect(result[':name']).toBe('Alice');
    expect(result[':roles']).toEqual(['admin', null]);
    expect(result[':meta']).toEqual({ ':active': true });
  });

  it('ignores commas as whitespace and semicolon comments', () => {
    const result = parseEdn(`
      ; leading comment
      [1, 2, ; inline comment
       3]
    `);
    expect(result).toEqual([1, 2, 3]);
  });

  it('throws position-aware errors for malformed input', () => {
    expect(() => parseEdn('(1 2')).toThrow(EdnError);
    expect(() => parseEdn('{:a}')).toThrow(/缺少对应的值/);
    expect(() => parseEdn('"unterminated')).toThrow(/闭合引号/);
    expect(() => parseEdn('[1] [2]')).toThrow(/多余的 token/);
  });
});

describe('ednToJson', () => {
  it('converts a realistic EDN document to valid JSON', () => {
    const edn = '{:id 1, :name "Bob", :tags #{:x}, :login #inst "2026-01-01T00:00:00Z"}';
    const json = ednToJson(edn);
    const parsed = JSON.parse(json);
    expect(parsed[':id']).toBe(1);
    expect(parsed[':name']).toBe('Bob');
    expect(parsed[':tags']).toEqual({
      ___edn_type: 'set',
      items: [{ ___edn_type: 'keyword', value: ':x' }],
    });
    expect(parsed[':login']).toEqual({
      ___edn_type: 'inst',
      value: '2026-01-01T00:00:00Z',
    });
  });
});

describe('jsonToEdn', () => {
  it('serializes plain JSON values to EDN syntax', () => {
    expect(jsonToEdn('null', 0)).toBe('nil');
    expect(jsonToEdn('true', 0)).toBe('true');
    expect(jsonToEdn('"a\\"b"', 0)).toBe('"a\\"b"');
    expect(jsonToEdn('[1, 2, 3]', 0)).toBe('[1 2 3]');
    expect(jsonToEdn('{}', 0)).toBe('{}');
  });

  it('restores keywords, sets, lists, inst and uuid from type markers', () => {
    const json = JSON.stringify({
      ':id': 1,
      ':set': { ___edn_type: 'set', items: [1, 2] },
      ':list': { ___edn_type: 'list', items: ['a'] },
      ':when': { ___edn_type: 'inst', value: '2026-11-12T10:00:00Z' },
      ':uid': { ___edn_type: 'uuid', value: '550e8400-e29b-41d4-a716-446655440000' },
    });
    const edn = jsonToEdn(json, 0);
    expect(edn).toContain(':id 1');
    expect(edn).toContain('#{1 2}');
    expect(edn).toContain('("a")');
    expect(edn).toContain('#inst "2026-11-12T10:00:00Z"');
    expect(edn).toContain('#uuid "550e8400-e29b-41d4-a716-446655440000"');
    expect(edn.startsWith('{')).toBe(true);
  });

  it('round-trips EDN -> JSON -> EDN preserving all type markers', () => {
    const original = '{:name "Alice" :roles ["owner" "writer"] :flags #{:admin true} :nested {:x 1}}';
    const json = ednToJson(original, 0);
    const regenerated = jsonToEdn(json, 0);
    // 再解析一次，结构应与原始解析结果一致
    expect(parseEdn(regenerated)).toEqual(parseEdn(original));
  });

  it('throws on invalid JSON input', () => {
    expect(() => jsonToEdn('{bad json}')).toThrow(SyntaxError);
  });
});
