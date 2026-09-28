import { describe, expect, it } from 'vitest';
import { getCommonPatterns, generateRegexByName } from './generator';

describe('generateRegexByName', () => {
  it('should generate email regex', () => {
    const result = generateRegexByName('email');
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
    expect(result?.flags).toBe('i');
    const regex = new RegExp(result?.pattern || '', result?.flags);
    expect(regex.test('test@example.com')).toBe(true);
    expect(regex.test('invalid-email')).toBe(false);
  });

  it('should generate phone-cn regex', () => {
    const result = generateRegexByName('phone-cn');
    expect(result).not.toBeNull();
    const regex = new RegExp(result?.pattern || '');
    expect(regex.test('13812345678')).toBe(true);
    expect(regex.test('123456')).toBe(false);
  });

  it('should return null for unknown pattern', () => {
    const result = generateRegexByName('unknown');
    expect(result).toBeNull();
  });

  it('should list all common patterns', () => {
    const patterns = getCommonPatterns();
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns).toContain('email');
    expect(patterns).toContain('ipv4');
  });
});
