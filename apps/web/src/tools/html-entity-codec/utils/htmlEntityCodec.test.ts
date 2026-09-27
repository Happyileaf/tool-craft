import { describe, it, expect } from 'vitest';
import { encodeHtmlEntities, decodeHtmlEntities } from './htmlEntityCodec';

describe('encodeHtmlEntities', () => {
  it('should encode special HTML characters', () => {
    const input = '<div class="test">Hello & welcome</div>';
    const expected = '&lt;div class=&quot;test&quot;&gt;Hello &amp; welcome&lt;/div&gt;';
    expect(encodeHtmlEntities(input)).toBe(expected);
  });

  it('should handle single quotes', () => {
    const input = "<div class='test'>It's working</div>";
    const expected = "&lt;div class=&#39;test&#39;&gt;It&#39;s working&lt;/div&gt;";
    expect(encodeHtmlEntities(input)).toBe(expected);
  });

  it('should return empty string for empty input', () => {
    expect(encodeHtmlEntities('')).toBe('');
  });
});

describe('decodeHtmlEntities', () => {
  it('should decode HTML entities to original characters', () => {
    const input = '&lt;div class=&quot;test&quot;&gt;Hello &amp; welcome&lt;/div&gt;';
    const expected = '<div class="test">Hello & welcome</div>';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  it('should decode single quotes', () => {
    const input = "&lt;div class=&#39;test&#39;&gt;It&#39;s working&lt;/div&gt;";
    const expected = "<div class='test'>It's working</div>";
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  it('should return empty string for empty input', () => {
    expect(decodeHtmlEntities('')).toBe('');
  });
});
