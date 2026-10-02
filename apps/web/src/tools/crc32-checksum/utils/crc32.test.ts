import { describe, expect, test } from 'vitest';
import { computeCrc32 } from './crc32';

describe('computeCrc32', () => {
  test('empty string should return 00000000', () => {
    expect(computeCrc32('')).toBe('00000000');
  });

  test('known string should match expected checksum', () => {
    // 维基百科测试用例: "The quick brown fox jumps over the lazy dog"
    // expected CRC32: 0x414fa339 -> "414fa339"
    const text = 'The quick brown fox jumps over the lazy dog';
    expect(computeCrc32(text)).toBe('414fa339');
  });

  test('another test case', () => {
    expect(computeCrc32('Hello World')).toBe('4a17b156');
  });
});
