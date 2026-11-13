import { describe, expect, it } from 'vitest';

import { buildLinkHeader, parseLinkHeader } from './linkHeader';

const SAMPLE_HEADER =
  '<https://a.test/next>; rel="next"; hreflang=en, </feed>; rel="alternate"; type="application/atom+xml"';

describe('parseLinkHeader', () => {
  it('parses two comma-separated link-values with well-known params', () => {
    const result = parseLinkHeader(SAMPLE_HEADER);
    expect(result.ok).toBe(true);
    expect(result.links).toHaveLength(2);
    const first = result.links[0];
    const second = result.links[1];
    expect(first?.uriReference).toBe('https://a.test/next');
    expect(first?.rel).toEqual(['next']);
    expect(first?.hreflang).toBe('en');
    expect(second?.uriReference).toBe('/feed');
    expect(second?.rel).toEqual(['alternate']);
    expect(second?.type).toBe('application/atom+xml');
  });

  it('does not split on commas or semicolons inside quoted strings', () => {
    const header = '<https://a.test/x>; rel="next, prev"; title="a; b, c"';
    const result = parseLinkHeader(header);
    expect(result.ok).toBe(true);
    expect(result.links).toHaveLength(1);
    expect(result.links[0]?.rel).toEqual(['next,', 'prev']);
    expect(result.links[0]?.title).toBe('a; b, c');
  });

  it('splits multi-value rel on whitespace and lowercases relation types', () => {
    const result = parseLinkHeader('<https://a.test/x>; rel="Next PRELOAD"');
    expect(result.ok).toBe(true);
    expect(result.links[0]?.rel).toEqual(['next', 'preload']);
  });

  it('resolves relative URI-References against the supplied base', () => {
    const result = parseLinkHeader('<feed>; rel="alternate"', 'https://a.test/b/c/d;p?q');
    expect(result.ok).toBe(true);
    expect(result.links[0]?.uriReference).toBe('feed');
    expect(result.links[0]?.resolvedUri).toBe('https://a.test/b/c/feed');
  });

  it('leaves relative references untouched when no base is supplied', () => {
    const result = parseLinkHeader('</feed>; rel="alternate"');
    expect(result.ok).toBe(true);
    expect(result.links[0]?.resolvedUri).toBeUndefined();
    expect(result.links[0]?.uriReference).toBe('/feed');
  });

  it('returns an empty array for blank input', () => {
    const result = parseLinkHeader('   ');
    expect(result.ok).toBe(true);
    expect(result.links).toEqual([]);
  });

  it('captures anchor, media and extension parameters', () => {
    const header =
      '<https://a.test/x>; rel="chapter"; anchor="https://a.test/toc"; media="screen"; data-page=3';
    const result = parseLinkHeader(header);
    expect(result.ok).toBe(true);
    const link = result.links[0];
    expect(link?.anchor).toBe('https://a.test/toc');
    expect(link?.media).toBe('screen');
    expect(link?.params.map((param) => param.name)).toContain('data-page');
  });

  it('handles quoted-pair backslash escapes inside quoted strings', () => {
    const result = parseLinkHeader('<https://a.test/x>; title="say \\"hi\\""');
    expect(result.ok).toBe(true);
    expect(result.links[0]?.title).toBe('say "hi"');
  });

  it('reports a readable error when the opening angle bracket is missing', () => {
    const result = parseLinkHeader('https://a.test/next; rel=next');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('尖括号');
  });

  it('reports a readable error for an empty URI-Reference', () => {
    const result = parseLinkHeader('<>; rel=next');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('不能为空');
  });

  it('reports a readable error for an unterminated quoted string', () => {
    const result = parseLinkHeader('<https://a.test/x>; title="oops');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('引号');
  });
});

describe('buildLinkHeader', () => {
  it('round-trips structured entries through the parser', () => {
    const header = buildLinkHeader([
      { uriReference: 'https://a.test/next', rel: ['next'], hreflang: 'en' },
      {
        uriReference: '/feed',
        rel: ['alternate'],
        type: 'application/atom+xml',
      },
    ]);
    const reparsed = parseLinkHeader(header);
    expect(reparsed.ok).toBe(true);
    expect(reparsed.links).toHaveLength(2);
    expect(reparsed.links[0]?.uriReference).toBe('https://a.test/next');
    expect(reparsed.links[0]?.rel).toEqual(['next']);
    expect(reparsed.links[0]?.hreflang).toBe('en');
    expect(reparsed.links[1]?.uriReference).toBe('/feed');
    expect(reparsed.links[1]?.type).toBe('application/atom+xml');
  });

  it('quotes media queries and keeps bare token values unquoted', () => {
    const header = buildLinkHeader([
      { uriReference: '/style.css', rel: ['preload'], media: 'screen and (max-width: 600px)' },
    ]);
    expect(header).toContain('media="screen and (max-width: 600px)"');
    expect(header).toContain('rel="preload"');
  });

  it('skips entries with blank URI-References', () => {
    const header = buildLinkHeader([
      { uriReference: '   ' },
      { uriReference: '/x', rel: ['next'] },
    ]);
    expect(header).toBe('</x>; rel="next"');
  });
});
