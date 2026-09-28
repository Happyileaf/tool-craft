import { describe, expect, it } from 'vitest';
import { htmlEntityEncode, htmlEntityDecode } from './converter';

describe('htmlEntityEncode', () => {
  it('should encode special HTML characters', () => {
    const input = '<div class="test">Hello & World</div>';
    const result = htmlEntityEncode(input);
    expect(result).toBe('&lt;div&nbsp;class&#x3D;&quot;test&quot;&gt;Hello&nbsp;&amp;&nbsp;World&lt;&#x2F;div&gt;');
  });

  it('should encode newlines and spaces', () => {
    const input = 'Hello World\nNext line';
    const result = htmlEntityEncode(input);
    expect(result).toBe('Hello&nbsp;World<br>Next&nbsp;line');
  });
});

describe('htmlEntityDecode', () => {
  it('should decode named HTML entities', () => {
    const input = '&lt;div class=&quot;test&quot;&gt;Hello &amp; World&lt;&#x2F;div&gt;';
    const result = htmlEntityDecode(input);
    expect(result).toBe('<div class="test">Hello & World</div>');
  });

  it('should decode decimal numeric entities', () => {
    const input = 'A is &#65;';
    const result = htmlEntityDecode(input);
    expect(result).toBe('A is A');
  });

  it('should decode hexadecimal numeric entities', () => {
    const input = 'A is &#x41;';
    const result = htmlEntityDecode(input);
    expect(result).toBe('A is A');
  });

  it('should leave unknown entities unchanged', () => {
    const input = '&unknown; test';
    const result = htmlEntityDecode(input);
    expect(result).toBe('&unknown; test');
  });
});
