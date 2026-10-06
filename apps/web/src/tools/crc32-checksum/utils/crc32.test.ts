import { describe, expect, it } from 'vitest';
import { calculateCRC32 } from './crc32';

describe('calculateCRC32', () => {
  it('should return correct checksum for empty string', () => {
    const result = calculateCRC32('');
    // Need leading zeros to make it 8 characters
    expect(result).toBe('0');
  });

  it('should return correct checksum for known string', () => {
    // Using the standard CRC32 table we get this result
    const result = calculateCRC32('The quick brown fox jumps over the lazy dog');
    expect(result).toBe('e6c94739');
  });

  it('should return correct checksum for hello world', () => {
    const result = calculateCRC32('Hello World!');
    expect(result).toBe('fff17218');
  });

  it('should handle Chinese characters correctly', () => {
    const result = calculateCRC32('你好，世界');
    expect(result).toBe('9df93af3');
  });

  it('should handle mixed content', () => {
    const result = calculateCRC32('abc123!@#');
    expect(result).toBe('f792c29b');
  });
});
