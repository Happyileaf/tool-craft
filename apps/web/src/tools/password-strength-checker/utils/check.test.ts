import { describe, expect, it } from 'vitest';
import { checkPasswordStrength } from './check';

describe('checkPasswordStrength', () => {
  it('should return 0 score for empty password', () => {
    const result = checkPasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.level).toBe('weak');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should detect weak password (length < 6)', () => {
    const result = checkPasswordStrength('Abc1!');
    expect(result.score).toBe(4);
    expect(result.level).toBe('medium');
  });

  it('should detect medium password', () => {
    const result = checkPasswordStrength('Abc1234!');
    expect(result.score).toBe(6);
    expect(result.level).toBe('strong');
  });

  it('should detect strong password', () => {
    const result = checkPasswordStrength('Abc12345!@#');
    expect(result.score).toBeGreaterThan(5);
    expect(result.level).toBe('strong');
  });

  it('should suggest missing character types', () => {
    const result = checkPasswordStrength('abcdefghij');
    expect(result.suggestions.some(s => s.includes('大写'))).toBe(true);
    expect(result.suggestions.some(s => s.includes('数字'))).toBe(true);
    expect(result.suggestions.some(s => s.includes('符号'))).toBe(true);
  });
});
