
import { describe, it, expect } from 'vitest';
import { computeCRC32 } from './crc32';

describe('computeCRC32', () => {
  it('should compute correct CRC32 for empty string', () => {
    expect(computeCRC32('')).toBe('00000000');
  });

  it('should compute correct CRC32 for known string', () => {
    // The quick brown fox jumps over the lazy dog
    expect(computeCRC32('The quick brown fox jumps over the lazy dog')).toBe('414fa339');
  });

  it('should compute correct CRC32 for "Hello World"', () => {
    expect(computeCRC32('Hello World')).toBe('d4a1185');
  });

  it('should handle Chinese characters', () => {
    expect(computeCRC32('你好，世界')).toBe('a931d6a9');
  });
});
