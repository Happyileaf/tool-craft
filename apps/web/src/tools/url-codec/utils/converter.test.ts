import { describe, expect, it } from 'vitest';
import { urlEncode, urlDecode, fullUrlEncode, fullUrlDecode } from './converter';

describe('urlEncode', () => {
  it('should encode special characters', () => {
    const input = 'Hello World! https://example.com/path?name=foo bar';
    const result = urlEncode(input);
    expect(result).toBe('Hello%20World!%20https%3A%2F%2Fexample.com%2Fpath%3Fname%3Dfoo%20bar');
  });

  it('should encode Chinese characters', () => {
    const input = '你好 世界';
    const result = urlEncode(input);
    expect(result).toBe('%E4%BD%A0%E5%A5%BD%20%E4%B8%96%E7%95%8C');
  });
});

describe('urlDecode', () => {
  it('should decode encoded URL', () => {
    const input = 'Hello%20World!%20https%3A%2F%2Fexample.com%2Fpath%3Fname%3Dfoo%20bar';
    const result = urlDecode(input);
    expect(result).toBe('Hello World! https://example.com/path?name=foo bar');
  });

  it('should decode Chinese', () => {
    const input = '%E4%BD%A0%E5%A5%BD%20%E4%B8%96%E7%95%8C';
    const result = urlDecode(input);
    expect(result).toBe('你好 世界');
  });
});

describe('fullUrlEncode', () => {
  it('should encode a full URL without encoding special characters like : /', () => {
    const input = 'https://example.com/path?name=foo bar';
    const result = fullUrlEncode(input);
    expect(result).toBe('https://example.com/path?name=foo%20bar');
    // : / ? 这些字符不会被编码
    expect(result).toContain('https://');
  });
});

describe('fullUrlDecode', () => {
  it('should decode a full URL', () => {
    const input = 'https://example.com/path?name=foo%20bar';
    const result = fullUrlDecode(input);
    expect(result).toBe('https://example.com/path?name=foo bar');
  });
});
