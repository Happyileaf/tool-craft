import { describe, expect, it } from 'vitest';
import { encodeUrl, decodeUrl } from './codec';

describe('url codec', () => {
  it('should encode url components correctly', () => {
    expect(encodeUrl('https://example.com')).toBe('https%3A%2F%2Fexample.com');
    expect(encodeUrl('中文')).toBe('%E4%B8%AD%E6%96%87');
    expect(encodeUrl('test 123')).toBe('test%20123');
  });

  it('should decode url components correctly', () => {
    expect(decodeUrl('https%3A%2F%2Fexample.com')).toBe('https://example.com');
    expect(decodeUrl('%E4%B8%AD%E6%96%87')).toBe('中文');
    expect(decodeUrl('test%20123')).toBe('test 123');
  });

  it('should encode and decode round trip', () => {
    const testCases = [
      'https://example.com/query?name=test',
      '中文测试',
      'test 123!@#$%^&*()',
      '',
    ];
    testCases.forEach((test) => {
      expect(decodeUrl(encodeUrl(test))).toBe(test);
    });
  });
});
