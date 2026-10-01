import { describe, expect, it } from 'vitest';
import { calculateCRC32 } from './crc32';

// Mock TextEncoder which is available in browser but need global for test
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

describe('calculateCRC32', () => {
  it('should calculate correct CRC32 for empty string', () => {
    expect(calculateCRC32('')).toBe('00000000');
  });

  it('should calculate correct CRC32 for "The quick brown fox jumps over the lazy dog"', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    expect(calculateCRC32(text)).toBe('414fa339');
  });

  it('should calculate correct CRC32 for "Hello World"', () => {
    expect(calculateCRC32('Hello World')).toBe('4a17b156');
  });

  it('should calculate correct CRC32 for Chinese text "你好，世界"', () => {
    expect(calculateCRC32('你好，世界')).toBe('acf5da54');
  });

  it('should return 8-character hex string', () => {
    const result = calculateCRC32('test');
    expect(result).toMatch(/^[0-9a-f]{1,8}$/);
  });
});
