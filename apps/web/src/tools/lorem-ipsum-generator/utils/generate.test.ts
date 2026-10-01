import { describe, expect, it } from 'vitest';
import { generateLoremIpsum } from './generate';

describe('lorem ipsum generator', () => {
  it('should generate correct number of paragraphs', () => {
    const result1 = generateLoremIpsum(1);
    expect(result1.split('\n\n')).toHaveLength(1);

    const result3 = generateLoremIpsum(3);
    expect(result3.split('\n\n')).toHaveLength(3);

    const result5 = generateLoremIpsum(5);
    expect(result5.split('\n\n')).toHaveLength(5);
  });

  it('should generate non-empty text', () => {
    const result = generateLoremIpsum(1);
    expect(result.length).toBeGreaterThan(10);
    expect(result).toContain('.');
  });
});
