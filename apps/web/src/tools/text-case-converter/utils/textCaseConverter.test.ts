import { describe, it, expect } from 'vitest';
import { convertCase, type CaseType } from './textCaseConverter';

describe('convertCase', () => {
  it('should convert to lowercase', () => {
    expect(convertCase('HELLO WORLD', 'lowercase')).toBe('hello world');
    expect(convertCase('Hello World', 'lowercase')).toBe('hello world');
  });

  it('should convert to uppercase', () => {
    expect(convertCase('hello world', 'uppercase')).toBe('HELLO WORLD');
    expect(convertCase('Hello World', 'uppercase')).toBe('HELLO WORLD');
  });

  it('should capitalize first letter', () => {
    expect(convertCase('hello world', 'capitalize')).toBe('Hello world');
    expect(convertCase('HELLO WORLD', 'capitalize')).toBe('Hello world');
  });

  it('should convert to title case', () => {
    expect(convertCase('the quick brown fox', 'title')).toBe('The Quick Brown Fox');
    expect(convertCase('THE QUICK BROWN FOX', 'title')).toBe('The Quick Brown Fox');
  });

  it('should convert to sentence case', () => {
    expect(convertCase('hello world. how are you? i am fine.', 'sentence'))
      .toBe('Hello world. How are you? I am fine.');
    expect(convertCase('HELLO WORLD. HOW ARE YOU?', 'sentence'))
      .toBe('Hello world. How are you?');
  });

  it('should handle empty string', () => {
    expect(convertCase('', 'lowercase')).toBe('');
    expect(convertCase('', 'title')).toBe('');
  });

  it('should handle single word', () => {
    expect(convertCase('test', 'title')).toBe('Test');
    expect(convertCase('TEST', 'lowercase')).toBe('test');
  });
});
