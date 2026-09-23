import { describe, it, expect } from 'vitest';
import { removeDuplicateLines } from './remover';

describe('removeDuplicateLines', () => {
  it('should remove duplicate lines', () => {
    const input = 'apple\nbanana\napple\ncherry\nbanana';
    const result = removeDuplicateLines(input, true, false);
    expect(result.split('\n')).toEqual(['apple', 'banana', 'cherry']);
  });

  it('should handle case-insensitive deduplication', () => {
    const input = 'Apple\napple\nBanana\nbanana';
    const result = removeDuplicateLines(input, false, false);
    expect(result.split('\n')).toEqual(['Apple', 'Banana']);
  });

  it('should handle case-sensitive deduplication with different cases', () => {
    const input = 'Apple\napple\nBanana\nbanana';
    const result = removeDuplicateLines(input, true, false);
    expect(result.split('\n')).toEqual(['Apple', 'apple', 'Banana', 'banana']);
  });

  it('should sort lines after deduplication', () => {
    const input = 'zoo\napple\ncherry\nbanana\napple';
    const result = removeDuplicateLines(input, true, true);
    expect(result.split('\n')).toEqual(['apple', 'banana', 'cherry', 'zoo']);
  });

  it('should sort case-insensitively', () => {
    const input = 'Banana\napple\nCherry';
    const result = removeDuplicateLines(input, false, true);
    expect(result.split('\n')).toEqual(['apple', 'Banana', 'Cherry']);
  });

  it('should return empty for empty input', () => {
    const result = removeDuplicateLines('', true, false);
    expect(result).toBe('');
  });
});
