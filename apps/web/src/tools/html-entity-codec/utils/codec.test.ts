import { describe, it, expect } from 'vitest';
import { encodeHtml, decodeHtml } from './codec';

describe('encodeHtml', () => {
  it('should encode special HTML characters', () => {
    const input = '<div class="test">Hello & goodbye</div>';
    const result = encodeHtml(input);
    expect(result).toBe('&lt;div class&#x3D;&quot;test&quot;&gt;Hello &amp; goodbye&lt;&#x2F;div&gt;');
  });
});

describe('decodeHtml', () => {
  it('should decode encoded HTML', () => {
    const input = '&lt;div class=&quot;test&quot;&gt;Hello &amp; goodbye&lt;/div&gt;';
    const result = decodeHtml(input);
    expect(result).toBe('<div class="test">Hello & goodbye</div>');
  });

  it('should decode numeric entities', () => {
    const input = '&#60;&#34;test&#34;&#62;';
    const result = decodeHtml(input);
    expect(result).toBe('<"test">');
  });

  it('should decode hex entities', () => {
    const input = '&#x3C;&#x22;test&#x22;&#x3E;';
    const result = decodeHtml(input);
    expect(result).toBe('<"test">');
  });
});