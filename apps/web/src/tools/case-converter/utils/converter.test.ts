import { describe, it, expect } from 'vitest';
import { convertCase } from './converter';
import { CaseConversionMode } from '../constants';

describe('convertCase', () => {
  const testText = 'hello WORLD. this IS a TEST.';

  it('should convert to lowercase', () => {
    const result = convertCase(testText, CaseConversionMode.LOWERCASE);
    expect(result).toBe('hello world. this is a test.');
  });

  it('should convert to uppercase', () => {
    const result = convertCase(testText, CaseConversionMode.UPPERCASE);
    expect(result).toBe('HELLO WORLD. THIS IS A TEST.');
  });

  it('should capitalize first letter', () => {
    const result = convertCase('hello world', CaseConversionMode.CAPITALIZE_FIRST);
    expect(result).toBe('Hello world');
  });

  it('should handle empty string for capitalize first', () => {
    const result = convertCase('', CaseConversionMode.CAPITALIZE_FIRST);
    expect(result).toBe('');
  });

  it('should convert to sentence case', () => {
    const input = 'hello world. this is a test sentence! another one here? end.';
    const result = convertCase(input, CaseConversionMode.SENTENCE);
    expect(result).toBe('Hello world. This is a test sentence! Another one here? End.');
  });
});
