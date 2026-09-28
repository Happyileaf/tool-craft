import { describe, it, expect } from 'vitest';
import { generateRegex } from './generator';

// Since this uses OpenAI API, we just test the basic structure
describe('generateRegex function structure', () => {
  it('should export a function', () => {
    expect(typeof generateRegex).toBe('function');
  });
});