import { crc32 } from './crc32';

describe('crc32', () => {
  it('should calculate correct crc32 for empty string', () => {
    expect(crc32('')).toBe('00000000');
  });

  it('should calculate correct crc32 for "hello world"', () => {
    expect(crc32('hello world')).toBe('d4a1185');
  });

  it('should calculate correct crc32 for "The quick brown fox jumps over the lazy dog"', () => {
    expect(crc32('The quick brown fox jumps over the lazy dog')).toBe('414fa339');
  });
});
