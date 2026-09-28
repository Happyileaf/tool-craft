import { describe, expect, test } from 'vitest';
import { calculateCRC32 } from './crc32';

describe('calculateCRC32', () => {
  test('empty string', () => {
    expect(calculateCRC32('')).toBe('00000000');
  });

  test('hello world', () => {
    expect(calculateCRC32('Hello World')).toBe('4a17b156');
  });

  test('the quick brown fox jumps over the lazy dog', () => {
    expect(calculateCRC32('The quick brown fox jumps over the lazy dog')).toBe('414fa339');
  });

  test('special characters', () => {
    expect(calculateCRC32('!@#$%^&*()_+')).toBe('0e034e58');
  });

  test('unicode chinese', () => {
    expect(calculateCRC32('你好，世界')).toBe('acf5da54');
  });
});
