import { describe, it, expect } from 'vitest';
import { encodeUrl, decodeUrl, encodeUri, decodeUri } from './codec';

describe('encodeUrl', () => {
  it('should encode special characters', () => {
    expect(encodeUrl('hello world')).toBe('hello%20world');
    expect(encodeUrl('http://example.com/path?query=hello world')).toBe('http%3A%2F%2Fexample.com%2Fpath%3Fquery%3Dhello%20world');
  });
});

describe('decodeUrl', () => {
  it('should decode encoded string', () => {
    expect(decodeUrl('hello%20world')).toBe('hello world');
    expect(decodeUrl('http%3A%2F%2Fexample.com')).toBe('http://example.com');
  });

  it('should throw error on invalid encoding', () => {
    expect(() => decodeUrl('%')).toThrow();
  });
});

describe('encodeUri', () => {
  it('should keep URI structure', () => {
    expect(encodeUri('http://example.com/path?query=hello world')).toBe('http://example.com/path?query=hello%20world');
  });
});

describe('decodeUri', () => {
  it('should decode encoded URI', () => {
    expect(decodeUri('http://example.com/path?query=hello%20world')).toBe('http://example.com/path?query=hello world');
  });
});
