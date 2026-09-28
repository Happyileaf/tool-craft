import { describe, it, expect } from 'vitest';
import { encodeUrl, decodeUrl } from './codec';

describe('encodeUrl', () => {
  it('should encode special characters', () => {
    const input = 'https://example.com/search?q=hello world&lang=en';
    const result = encodeUrl(input);
    expect(result).toBe('https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world%26lang%3Den');
  });
});

describe('decodeUrl', () => {
  it('should decode encoded string', () => {
    const input = 'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world%26lang%3Den';
    const result = decodeUrl(input);
    expect(result).toBe('https://example.com/search?q=hello world&lang=en');
  });
});