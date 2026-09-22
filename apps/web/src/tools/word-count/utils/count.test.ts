import { describe, it, expect } from 'vitest';
import { countWords, CountResult } from './count';

describe('countWords', () => {
  it('should return all zeros for empty string', () => {
    const result = countWords('');
    expect(result).toEqual({
      characters: 0,
      words: 0,
      lines: 0,
      paragraphs: 0,
    } as CountResult);
  });

  it('should count characters correctly', () => {
    const text = 'Hello world';
    const result = countWords(text);
    expect(result.characters).toBe(11);
  });

  it('should count words correctly', () => {
    const text = 'Hello world! This is a test.';
    const result = countWords(text);
    expect(result.words).toBe(6);
  });

  it('should count lines correctly', () => {
    const text = 'line 1\nline 2\nline 3';
    const result = countWords(text);
    expect(result.lines).toBe(3);
  });

  it('should count paragraphs correctly', () => {
    const text = 'Paragraph 1\n\nParagraph 2\n\n\nParagraph 3';
    const result = countWords(text);
    expect(result.paragraphs).toBe(3);
  });

  it('should handle Chinese text correctly', () => {
    const text = '你好，世界！这是一段测试文本。';
    const result = countWords(text);
    expect(result.characters).toBe(15);
    expect(result.words).toBe(12);
  });

  it('should handle multiple spaces and punctuation', () => {
    const text = '   hello   world  !!  ';
    const result = countWords(text);
    expect(result.words).toBe(2);
    expect(result.characters).toBe(22);
  });
});
