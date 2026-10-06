import { describe, expect, test } from 'vitest';
import { encode, decode } from './convert';

describe('encode', () => {
  test('should encode special HTML characters', () => {
    const text = '<div class="test">Hello & world</div>';
    const result = encode(text);
    expect(result).toBe('&lt;div&nbsp;class&#61;&quot;test&quot;&gt;Hello&nbsp;&amp;&nbsp;world&lt;&#47;div&gt;');
  });

  test('should encode non-breaking space', () => {
    const text = 'Hello  world';
    const result = encode(text);
    expect(result).toBe('Hello&nbsp;&nbsp;world');
  });
});

describe('decode', () => {
  test('should decode named entities', () => {
    const text = '&lt;div class=&quot;test&quot;&gt;Hello &amp; world&lt;/div&gt;';
    const result = decode(text);
    expect(result).toBe('<div class="test">Hello & world</div>');
  });

  test('should decode decimal entities', () => {
    const text = 'Hello &#39;world&#39;';
    const result = decode(text);
    expect(result).toBe("Hello 'world'");
  });

  test('should decode hex entities', () => {
    const text = 'Hello &#x27;world&#x27;';
    const result = decode(text);
    expect(result).toBe("Hello 'world'");
  });

  test('should decode nbsp', () => {
    const text = 'Hello&nbsp;world';
    const result = decode(text);
    expect(result).toBe('Hello world');
  });
});
