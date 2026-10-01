import { describe, expect, it } from 'vitest';
import { checkPasswordStrength } from './check';

// No window needed for this pure function, everything is string operations

describe('checkPasswordStrength', () => {
  it('should return weak score for empty password', () => {
    const result = checkPasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.level).toBe('weak');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should return weak score for short password with only lowercase', () => {
    const result = checkPasswordStrength('abcd');
    // length: 0 (< 8), lowercase: +1 → total 1, but 'abcd' is a sequential sequence → -1 → total 0
    expect(result.score).toBe(0);
    expect(result.level).toBe('weak');
  });

  it('should return medium score for 8 characters with mixed case and numbers', () => {
    const result = checkPasswordStrength('Abcd1234');
    // length: +1 (8 >= 8 and < 12), lowercase: +1, uppercase: +1, numbers: +1 → total 4
    // 'abcd' and '1234' are both sequential sequences → -2 → total 2
    expect(result.score).toBe(2);
    expect(result.level).toBe('medium');
    // 8 characters still get suggestion about increasing length
    expect(result.suggestions).toContain('增加密码长度到 12 位以上可以提高安全性');
  });

  it('should return strong score for 12+ characters with all character types', () => {
    const result = checkPasswordStrength('A3bC!x#yZ7qK');
    // length: +2, lowercase: +1, uppercase: +1, numbers: +1, symbols: +1 → total 6 → clamped to 4 max
    expect(result.score).toBe(4);
    expect(result.level).toBe('strong');
    expect(result.suggestions).toHaveLength(0);
  });

  it('should penalize common weak passwords', () => {
    const result = checkPasswordStrength('password');
    expect(result.score).toBeLessThan(2);
    expect(result.level).toBe('weak');
    expect(result.suggestions).toContain('避免使用常见单词或序列作为密码');
  });

  it('should penalize consecutive repeated characters', () => {
    const result = checkPasswordStrength('AAAABbbb123!');
    expect(result.suggestions).toContain('避免连续重复相同字符');
  });

  it('should penalize sequential characters', () => {
    const result = checkPasswordStrength('abcd1234!');
    expect(result.suggestions).toContain('避免使用连续顺序字符');
  });

  it('should deduplicate suggestions', () => {
    const result = checkPasswordStrength('');
    const uniqueSuggestions = new Set(result.suggestions);
    expect(result.suggestions.length).toBe(uniqueSuggestions.size);
  });
});
