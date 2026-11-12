import { describe, expect, it } from 'vitest';
import {
  generateForwardedHeader,
  parseForwardedHeader,
  validateNode,
  type ForwardedElement,
} from './forwarded';

describe('parseForwardedHeader', () => {
  it('parses RFC 7239 Section 7.4 example header', () => {
    const header = 'for=192.0.2.60;proto=http;by=203.0.113.43';
    const result = parseForwardedHeader(header);
    expect(result.valid).toBe(true);
    expect(result.elements).toEqual([
      { for: '192.0.2.60', proto: 'http', by: '203.0.113.43' },
    ]);
  });

  it('parses quoted IPv6 node with port and multi-hop comma chain', () => {
    const header =
      'for=192.0.2.60;by=203.0.113.43, for="[2001:db8:cafe::17]:4711";host=example.com;proto=https';
    const result = parseForwardedHeader(header);
    expect(result.valid).toBe(true);
    expect(result.elements).toHaveLength(2);
    expect(result.elements[1]).toEqual({
      for: '[2001:db8:cafe::17]:4711',
      host: 'example.com',
      proto: 'https',
    });
  });

  it('tolerates whitespace, mixed case parameter names and empty segments', () => {
    const header = ' For = 198.51.100.1 ; Proto = HTTPS , , by=_hidden';
    const result = parseForwardedHeader(header);
    expect(result.valid).toBe(true);
    expect(result.elements).toHaveLength(2);
    expect(result.elements[0]).toEqual({ for: '198.51.100.1', proto: 'HTTPS' });
    expect(result.elements[1]).toEqual({ by: '_hidden' });
  });

  it('accepts unknown and obfuscated nodes', () => {
    const result = parseForwardedHeader('for=unknown, by="_proxy-1"');
    expect(result.valid).toBe(true);
    expect(result.elements[0]?.for).toBe('unknown');
    expect(result.elements[1]?.by).toBe('_proxy-1');
  });

  it('rejects malformed IPv4 and bad ports with element-indexed errors', () => {
    const result = parseForwardedHeader('for=999.1.1.1:abc, for=10.0.0.1:70000');
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('第 1 跳'))).toBe(true);
    expect(result.errors.some((error) => error.includes('第 2 跳'))).toBe(true);
  });

  it('flags parameters missing "=" and empty values', () => {
    const result = parseForwardedHeader('for=1.2.3.4;bogus, host=');
    expect(result.valid).toBe(false);
    expect(result.errors.join('')).toContain('bogus');
    expect(result.errors.join('')).toContain('host');
  });

  it('rejects empty header', () => {
    expect(parseForwardedHeader('   ').valid).toBe(false);
  });

  it('does not treat commas inside quoted strings as separators', () => {
    const result = parseForwardedHeader('for="[2001:db8::1], name";by=1.1.1.1');
    // 引号内的逗号不拆分；该值不是合法节点，应报错但仅产生一跳
    expect(result.elements).toHaveLength(1);
    expect(result.valid).toBe(false);
  });
});

describe('validateNode', () => {
  it('accepts IPv4, IPv4:port, bracketed IPv6 and obfuscated nodes', () => {
    expect(validateNode('10.0.0.1')).toBeUndefined();
    expect(validateNode('10.0.0.1:8080')).toBeUndefined();
    expect(validateNode('[2001:db8::1]')).toBeUndefined();
    expect(validateNode('[2001:db8::1]:443')).toBeUndefined();
    expect(validateNode('2001:db8::1')).toBeUndefined();
    expect(validateNode('unknown')).toBeUndefined();
    expect(validateNode('_secret')).toBeUndefined();
  });

  it('rejects invalid addresses', () => {
    expect(validateNode('256.0.0.1')).toBeDefined();
    expect(validateNode('[gg::1]')).toBeDefined();
    expect(validateNode('not-a-node')).toBeDefined();
  });
});

describe('generateForwardedHeader', () => {
  it('round-trips a parsed multi-hop header', () => {
    const elements: ForwardedElement[] = [
      { for: '192.0.2.60', proto: 'http', by: '203.0.113.43' },
      { for: '[2001:db8:cafe::17]:4711', proto: 'https', host: 'example.com' },
    ];
    const generated = generateForwardedHeader(elements);
    expect(generated).toBe(
      'for=192.0.2.60;by=203.0.113.43;proto=http, for="[2001:db8:cafe::17]:4711";host=example.com;proto=https',
    );
    const reparsed = parseForwardedHeader(generated);
    expect(reparsed.valid).toBe(true);
    expect(reparsed.elements).toEqual(elements);
  });

  it('quotes values containing spaces or special chars and escapes inner quotes', () => {
    const generated = generateForwardedHeader([{ host: 'a b"c', for: '1.1.1.1' }]);
    expect(generated).toBe('for=1.1.1.1;host="a b\\"c"');
  });

  it('emits stable parameter order for/by/host/proto and skips empty fields', () => {
    const generated = generateForwardedHeader([
      { proto: 'https', host: 'h', by: '', for: undefined },
    ]);
    expect(generated).toBe('host=h;proto=https');
  });
});
