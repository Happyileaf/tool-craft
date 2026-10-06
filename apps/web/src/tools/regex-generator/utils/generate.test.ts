import { describe, expect, test } from 'vitest';
import { generateRegex, getPatternByKey } from './generate';

describe('getPatternByKey', () => {
  test('should get correct pattern for email', () => {
    const pattern = getPatternByKey('email');
    expect(pattern).toBe('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
  });
});

describe('generateRegex', () => {
  test('should generate regex with correct pattern and flags', () => {
    const regex = generateRegex('hello', 'gi');
    expect(regex.source).toBe('hello');
    expect(regex.global).toBe(true);
    expect(regex.ignoreCase).toBe(true);
  });

  test('should match emails correctly', () => {
    const regex = generateRegex(getPatternByKey('email'), 'g');
    const text = 'Contact support@example.com or sales@company.co.uk';
    const matches = text.match(regex);
    expect(matches).toEqual(['support@example.com', 'sales@company.co.uk']);
  });
});
