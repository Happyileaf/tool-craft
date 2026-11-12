import { describe, expect, it } from 'vitest';
import {
  countItems,
  escapeAssertionValue,
  parseLdapFilter,
  serializeFilter,
  unescapeAssertionValue,
  walkFilter,
  type FilterItem,
} from './ldap';

describe('parseLdapFilter leaf items', () => {
  it('parses an equality filter', () => {
    const { root, normalized } = parseLdapFilter('(cn=John Doe)');
    expect(root.kind).toBe('item');
    if (root.kind === 'item') {
      expect(root.attribute).toBe('cn');
      expect(root.operator).toBe('=');
      expect(root.value).toBe('John Doe');
      expect(root.presence).toBe(false);
    }
    expect(normalized).toBe('(cn=John Doe)');
  });

  it('parses a presence filter', () => {
    const { root } = parseLdapFilter('(objectClass=*)');
    if (root.kind === 'item') {
      expect(root.presence).toBe(true);
      expect(root.value).toBe('*');
    }
  });

  it('parses >=, <= and ~= operators', () => {
    expect((parseLdapFilter('(age>=18)').root as FilterItem).operator).toBe('>=');
    expect((parseLdapFilter('(age<=65)').root as FilterItem).operator).toBe('<=');
    expect((parseLdapFilter('(sn~=Smith)').root as FilterItem).operator).toBe('~=');
  });

  it('parses substring filter with initial, any and final parts', () => {
    const { root } = parseLdapFilter('(cn=Jo*ohn*Doe)');
    if (root.kind === 'item') {
      expect(root.substrings).toEqual({ initial: 'Jo', any: ['ohn'], final: 'Doe' });
    }
  });

  it('parses prefix-only and suffix-only substrings', () => {
    const prefix = parseLdapFilter('(cn=Jo*)').root as FilterItem;
    expect(prefix.substrings).toEqual({ initial: 'Jo', any: [], final: null });
    const suffix = parseLdapFilter('(cn=*Doe)').root as FilterItem;
    expect(suffix.substrings).toEqual({ initial: null, any: [], final: 'Doe' });
    const contains = parseLdapFilter('(cn=*mid*)').root as FilterItem;
    expect(contains.substrings).toEqual({ initial: null, any: ['mid'], final: null });
  });

  it('unescapes \\HH sequences in values', () => {
    const { root } = parseLdapFilter('(cn=Jo\\28hn\\29)');
    if (root.kind === 'item') {
      expect(root.value).toBe('Jo(hn)');
    }
  });

  it('rejects empty input', () => {
    expect(() => parseLdapFilter('   ')).toThrow('不能为空');
  });

  it('rejects unbalanced parenthesis', () => {
    expect(() => parseLdapFilter('(cn=John')).toThrow('期望「)」');
  });

  it('rejects missing operator', () => {
    expect(() => parseLdapFilter('(cnJohn)')).toThrow('比较操作符');
  });

  it('rejects a bad escape sequence', () => {
    expect(() => parseLdapFilter('(cn=Jo\\zz)')).toThrow('两位十六进制');
  });

  it('rejects an unescaped opening paren inside a value', () => {
    expect(() => parseLdapFilter('(cn=Jo(hn)')).toThrow('未转义');
  });
});

describe('parseLdapFilter logical nodes', () => {
  it('parses an AND of two items', () => {
    const { root } = parseLdapFilter('(&(cn=John)(objectClass=person))');
    expect(root.kind).toBe('and');
    if (root.kind === 'and') {
      expect(root.children).toHaveLength(2);
    }
  });

  it('parses nested AND/OR/NOT', () => {
    const filter = '(&(ou=Sales)(|(title=Manager)(!(status=Archived))))';
    const { root, normalized } = parseLdapFilter(filter);
    expect(root.kind).toBe('and');
    if (root.kind === 'and') {
      const orNode = root.children[1]!;
      expect(orNode.kind).toBe('or');
      if (orNode.kind === 'or') {
        expect(orNode.children[1]!.kind).toBe('not');
      }
    }
    expect(normalized).toBe(filter);
    expect(countItems(root)).toBe(3);
  });

  it('rejects an empty AND group', () => {
    expect(() => parseLdapFilter('(&)')).toThrow('至少需要一个子过滤器');
  });

  it('rejects trailing characters', () => {
    expect(() => parseLdapFilter('(cn=John)x')).toThrow('未消费的字符');
  });
});

describe('escape helpers and round trip', () => {
  it('escapes reserved characters', () => {
    expect(escapeAssertionValue('a*b(c)d\\e')).toBe('a\\2ab\\28c\\29d\\5ce');
  });

  it('escapes non-ASCII as UTF-8 bytes', () => {
    // 中 = E4 B8 AD
    expect(escapeAssertionValue('中')).toBe('\\e4\\b8\\ad');
  });

  it('unescapes hex back to readable text', () => {
    expect(unescapeAssertionValue('Jo\\28hn')).toBe('Jo(hn');
  });

  it('round-trips an escaped equality filter', () => {
    const original = '(cn=Jo\\28hn\\29 Doe)';
    const { root } = parseLdapFilter(original);
    expect(serializeFilter(root)).toBe(original);
  });

  it('walks nodes in pre-order', () => {
    const { root } = parseLdapFilter('(&(a=1)(b=2))');
    const kinds: string[] = [];
    walkFilter(root, (node) => kinds.push(node.kind));
    expect(kinds).toEqual(['and', 'item', 'item']);
  });
});
