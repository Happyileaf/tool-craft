import { describe, it, expect } from 'vitest';
import { decodeHtmlEntities, encodeHtmlEntities } from './codec';

describe('decodeHtmlEntities', () => {
  it('should decode named entities', () => {
    expect(decodeHtmlEntities('Hello &amp; welcome')).toBe('Hello & welcome');
    expect(decodeHtmlEntities('&lt;div&gt;')).toBe('<div>');
    expect(decodeHtmlEntities('&quot;quoted&quot;')).toBe('"quoted"');
  });

  it('should decode decimal entities', () => {
    expect(decodeHtmlEntities('&#65;')).toBe('A');
    expect(decodeHtmlEntities('Hello &#32; world')).toBe('Hello   world');
  });

  it('should decode hex entities', () => {
    expect(decodeHtmlEntities('&#x41;')).toBe('A');
    expect(decodeHtmlEntities('&#x20;')).toBe(' ');
  });

  it('should handle mixed entities', () => {
    expect(decodeHtmlEntities('&lt;a href=&quot;http://example.com&quot;&gt;')).toBe('<a href="http://example.com">');
  });
});

describe('encodeHtmlEntities', () => {
  it('should encode special characters', () => {
    expect(encodeHtmlEntities('Hello & welcome')).toBe('Hello &amp; welcome');
    expect(encodeHtmlEntities('<div>')).toBe('&lt;div&gt;');
    expect(encodeHtmlEntities('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it('should encode named entities', () => {
    expect(encodeHtmlEntities('© 2026')).toBe('&copy; 2026');
    expect(encodeHtmlEntities('€ 100')).toBe('&euro; 100');
  });
});
