import { describe, expect, it } from 'vitest';

import { removeDotSegments, resolveReference, splitUri } from './urlResolve';

// Base URI shared by RFC 3986 §5.4.1 and §5.4.2.
const BASE = 'http://a/b/c/d;p?q';

describe('resolveReference — RFC 3986 §5.4.1 normal examples', () => {
  const cases: Array<[string, string]> = [
    ['g:h', 'g:h'],
    ['g', 'http://a/b/c/g'],
    ['./g', 'http://a/b/c/g'],
    ['g/', 'http://a/b/c/g/'],
    ['/g', 'http://a/g'],
    ['//g', 'http://g'],
    ['?y', 'http://a/b/c/d;p?y'],
    ['g?y', 'http://a/b/c/g?y'],
    ['#s', 'http://a/b/c/d;p?q#s'],
    ['g#s', 'http://a/b/c/g#s'],
    ['g?y#s', 'http://a/b/c/g?y#s'],
    [';x', 'http://a/b/c/;x'],
    ['g;x', 'http://a/b/c/g;x'],
    ['g;x?y#s', 'http://a/b/c/g;x?y#s'],
    ['.', 'http://a/b/c/'],
    ['./', 'http://a/b/c/'],
    ['..', 'http://a/b/'],
    ['../', 'http://a/b/'],
    ['../g', 'http://a/b/g'],
    ['../..', 'http://a/'],
    ['../../', 'http://a/'],
    ['../../g', 'http://a/g'],
  ];

  for (const [reference, expected] of cases) {
    it(`resolves "${reference}" → "${expected}"`, () => {
      const result = resolveReference(BASE, reference);
      expect(result.ok).toBe(true);
      expect(result.target).toBe(expected);
    });
  }
});

describe('resolveReference — RFC 3986 §5.4.2 abnormal examples', () => {
  const cases: Array<[string, string]> = [
    ['../../../g', 'http://a/g'],
    ['../../../../g', 'http://a/g'],
    ['/./g', 'http://a/g'],
    ['/../g', 'http://a/g'],
    ['g.', 'http://a/b/c/g.'],
    ['.g', 'http://a/b/c/.g'],
    ['g..', 'http://a/b/c/g..'],
    ['..g', 'http://a/b/c/..g'],
    ['./../g', 'http://a/b/g'],
    ['./g/.', 'http://a/b/c/g/'],
    ['g/./h', 'http://a/b/c/g/h'],
    ['g/../h', 'http://a/b/c/h'],
    ['g;x=1/./y', 'http://a/b/c/g;x=1/y'],
    ['g;x=1/../y', 'http://a/b/c/y'],
    ['g?y/./x', 'http://a/b/c/g?y/./x'],
    ['g?y/../x', 'http://a/b/c/g?y/../x'],
    ['g#s/./x', 'http://a/b/c/g#s/./x'],
    ['g#s/../x', 'http://a/b/c/g#s/../x'],
    ['http:g', 'http:g'],
  ];

  for (const [reference, expected] of cases) {
    it(`resolves "${reference}" → "${expected}"`, () => {
      const result = resolveReference(BASE, reference);
      expect(result.ok).toBe(true);
      expect(result.target).toBe(expected);
    });
  }
});

describe('removeDotSegments — RFC 3986 §5.2.4', () => {
  it('matches the RFC worked examples', () => {
    expect(removeDotSegments('/a/b/c/./../../g')).toBe('/a/g');
    expect(removeDotSegments('mid/content=5/../6')).toBe('mid/6');
  });
});

describe('splitUri', () => {
  it('splits all five components', () => {
    expect(splitUri('http://user@host:80/a/b?x=1#frag')).toEqual({
      scheme: 'http',
      authority: 'user@host:80',
      path: '/a/b',
      query: 'x=1',
      fragment: 'frag',
    });
  });

  it('handles a relative reference without scheme', () => {
    expect(splitUri('../g?y#s')).toEqual({
      scheme: '',
      authority: '',
      path: '../g',
      query: 'y',
      fragment: 's',
    });
  });
});

describe('resolveReference validation', () => {
  it('rejects an empty base', () => {
    expect(resolveReference('', 'g').ok).toBe(false);
  });

  it('rejects a relative base without scheme', () => {
    const result = resolveReference('/not/absolute', 'g');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('scheme');
  });
});
