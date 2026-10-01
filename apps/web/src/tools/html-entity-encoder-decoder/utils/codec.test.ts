import { describe, expect, it } from 'vitest';
import { encodeHtml, decodeHtml } from './codec';

describe('html entity codec', () => {
  it('should encode html entities correctly', () => {
    expect(encodeHtml('<h1>Hello</h1>')).toBe('&lt;h1&gt;Hello&lt;&#x2F;h1&gt;');
    expect(encodeHtml('Hello & Goodbye')).toBe('Hello &amp; Goodbye');
    expect(encodeHtml('"test"')).toBe('&quot;test&quot;');
  });

  it('should decode html entities correctly', () => {
    expect(decodeHtml('&lt;h1&gt;Hello&lt;&#x2F;h1&gt;')).toBe('<h1>Hello</h1>');
    expect(decodeHtml('Hello &amp; Goodbye')).toBe('Hello & Goodbye');
    expect(decodeHtml('&quot;test&quot;')).toBe('"test"');
    expect(decodeHtml('&#65;')).toBe('A');
    expect(decodeHtml('&#x41;')).toBe('A');
  });

  it('should encode and decode round trip', () => {
    const testCases = [
      '<div class="test">Hello World!</div>',
      'Hello & "World" <foo>',
      'A & B > C',
      '',
    ];
    testCases.forEach((test) => {
      expect(decodeHtml(encodeHtml(test))).toBe(test);
    });
  });
});
