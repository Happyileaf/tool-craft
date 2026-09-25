import { describe, it, expect } from 'vitest';
import { generateLoremIpsum } from './generate';

describe('generateLoremIpsum', () => {
  it('should generate specified number of paragraphs', () => {
    const result = generateLoremIpsum(3);
    const paragraphs = result.split('\n\n');
    expect(paragraphs.length).toBe(3);
  });

  it('should generate non-empty text', () => {
    const result = generateLoremIpsum(1);
    expect(result.length).toBeGreaterThan(0);
    expect(result.endsWith('.')).toBe(true);
  });

  it('should start with capital letter', () => {
    const result = generateLoremIpsum(1);
    expect(result[0]).toBe(result[0].toUpperCase());
  });
});
