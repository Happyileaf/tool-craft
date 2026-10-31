import { describe, it, expect } from 'vitest';
import {
  percentEncode,
  encodeFormComponent,
  decodeFormComponent,
  jsonToForm,
  formToJson,
} from './formurlencoded';

describe('component encode/decode', () => {
  it('percent-encodes per RFC 3986 unreserved set', () => {
    expect(percentEncode("abc-_.~!*'()")).toBe("abc-_.~%21%2A%27%28%29");
    expect(percentEncode('a+b=c&d')).toBe('a%2Bb%3Dc%26d');
    expect(percentEncode('你好')).toBe('%E4%BD%A0%E5%A5%BD');
  });

  it('uses + for space in form encoding and switches to %20', () => {
    expect(encodeFormComponent('hello world', 'plus')).toBe('hello+world');
    expect(encodeFormComponent('hello world', 'percent')).toBe('hello%20world');
  });

  it('decodes + and percent sequences', () => {
    expect(decodeFormComponent('hello+world')).toBe('hello world');
    expect(decodeFormComponent('a%2Bb')).toBe('a+b');
    expect(decodeFormComponent('%E4%BD%A0%E5%A5%BD')).toBe('你好');
  });
});

describe('jsonToForm fixed vectors', () => {
  it('encodes a flat object (bracket style)', () => {
    const r = jsonToForm({ name: 'alice', age: 30, active: true });
    expect(r.error).toBeNull();
    expect(r.output).toBe('name=alice&age=30&active=true');
  });

  it('encodes special characters with + for spaces', () => {
    const r = jsonToForm({ q: 'hello world', eq: 'a=b' });
    expect(r.error).toBeNull();
    expect(r.output).toBe('q=hello+world&eq=a%3Db');
  });

  it('encodes null and boolean deterministically', () => {
    const r = jsonToForm({ a: null, b: false, c: true });
    expect(r.output).toBe('a=&b=false&c=true');
  });

  it('encodes arrays as repeated keys with explicit bracket indices by default', () => {
    const r = jsonToForm({ a: [1, 2] });
    expect(r.error).toBeNull();
    expect(r.output).toBe('a%5B0%5D=1&a%5B1%5D=2');
  });

  it('encodes PHP-style arrays with a[] and nested objects with a[i][key]', () => {
    const r = jsonToForm({ tags: ['x', 'y'], users: [{ id: 1 }] }, {
      space: 'plus',
      nestStyle: 'php',
    });
    expect(r.error).toBeNull();
    // tags[]=x&tags[]=y&users[0][id]=1（已百分号编码 [] ）
    expect(r.output).toBe('tags%5B%5D=x&tags%5B%5D=y&users%5B0%5D%5Bid%5D=1');
  });

  it('encodes nested objects in bracket and dot styles', () => {
    const input = { user: { name: 'bob', addr: { city: 'SH' } } };
    expect(jsonToForm(input, { space: 'plus', nestStyle: 'bracket' }).output).toBe(
      'user%5Bname%5D=bob&user%5Baddr%5D%5Bcity%5D=SH',
    );
    expect(jsonToForm(input, { space: 'plus', nestStyle: 'dot' }).output).toBe(
      'user.name=bob&user.addr.city=SH',
    );
  });

  it('rejects non-object top level and non-JSON values', () => {
    expect(jsonToForm(42).error).toMatch(/顶层必须是/);
    expect(jsonToForm('str').error).toMatch(/顶层必须是/);
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(jsonToForm(circular).error).toMatch(/JSON/);
  });

  it('encodes a top-level array by numeric keys', () => {
    const r = jsonToForm(['a', 'b'], { space: 'plus', nestStyle: 'bracket' });
    expect(r.output).toBe('0=a&1=b');
  });
});

describe('formToJson fixed vectors', () => {
  it('parses flat pairs and decodes +', () => {
    const r = formToJson('name=alice&q=hello+world');
    expect(r.error).toBeNull();
    expect(r.value).toEqual({ name: 'alice', q: 'hello world' });
  });

  it('aggregates repeated keys into an array in flat mode', () => {
    const r = formToJson('a=1&a=2', { nestStyle: 'flat' });
    expect(r.error).toBeNull();
    expect(r.value).toEqual({ a: ['1', '2'] });
  });

  it('parses bracket-style arrays and nested objects', () => {
    const r = formToJson('a%5B0%5D=1&a%5B1%5D=2&user%5Bname%5D=bob', {
      nestStyle: 'bracket',
    });
    expect(r.error).toBeNull();
    expect(r.value).toEqual({ a: ['1', '2'], user: { name: 'bob' } });
  });

  it('parses PHP-style a[] append syntax', () => {
    const r = formToJson('tags%5B%5D=x&tags%5B%5D=y&users%5B0%5D%5Bid%5D=1', {
      nestStyle: 'php',
    });
    expect(r.error).toBeNull();
    expect(r.value).toEqual({ tags: ['x', 'y'], users: [{ id: '1' }] });
  });

  it('parses dot paths and aggregates repeated leaf keys', () => {
    const r = formToJson('user.name=bob&user.addr.city=SH&tag=a&tag=b', {
      nestStyle: 'dot',
    });
    expect(r.error).toBeNull();
    expect(r.value).toEqual({
      user: { name: 'bob', addr: { city: 'SH' } },
      tag: ['a', 'b'],
    });
  });

  it('treats missing value as empty string', () => {
    const r = formToJson('a=&b', { nestStyle: 'flat' });
    expect(r.value).toEqual({ a: '', b: '' });
  });

  it('reports malformed percent encoding', () => {
    const r = formToJson('a=%E4%BD');
    expect(r.error).toMatch(/百分号编码/);
  });

  it('rejects empty brackets when not using PHP style', () => {
    const r = formToJson('a%5B%5D=1', { nestStyle: 'bracket' });
    expect(r.error).toMatch(/PHP/);
  });

  it('reports conflicting scalar/container usage', () => {
    // a=1 把 a 钉为标量，a[b]=1 又要求 a 为对象
    const r = formToJson('a=1&a%5Bb%5D=2', { nestStyle: 'bracket' });
    expect(r.error).toMatch(/冲突/);
  });
});

describe('round-trip bracket style', () => {
  const samples: unknown[] = [
    { name: '张三', q: 'a+b&c=d', n: 42, ok: true, none: null },
    { tags: ['red', 'green blue'], user: { id: 7, roles: ['admin', 'ops'] } },
    { items: [{ sku: 'A1', qty: 2 }, { sku: 'B2', qty: 1 }] },
  ];

  it.each(samples)('json → form → json preserves structure', (obj) => {
    const enc = jsonToForm(obj, { space: 'plus', nestStyle: 'bracket' });
    expect(enc.error).toBeNull();
    const dec = formToJson(enc.output, { nestStyle: 'bracket' });
    expect(dec.error).toBeNull();
    // 所有叶子还原为字符串（表单协议不含类型信息）
    const leafStringify = (v: unknown): unknown => {
      if (v === null) return '';
      if (Array.isArray(v)) return v.map(leafStringify);
      if (typeof v === 'object' && v !== null) {
        return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, leafStringify(val)]));
      }
      return String(v);
    };
    expect(dec.value).toEqual(leafStringify(obj));
  });
});

describe('round-trip PHP style', () => {
  it('preserves scalar arrays via a[] append', () => {
    const obj = { tags: ['x', 'y', 'z'], nested: [{ a: '1' }] };
    const enc = jsonToForm(obj, { space: 'percent', nestStyle: 'php' });
    expect(enc.error).toBeNull();
    const dec = formToJson(enc.output, { nestStyle: 'php' });
    expect(dec.error).toBeNull();
    expect(dec.value).toEqual({ tags: ['x', 'y', 'z'], nested: [{ a: '1' }] });
  });
});
