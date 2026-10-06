import { describe, expect, it } from 'vitest';
import { checkPasswordStrength } from './checker';

describe('checkPasswordStrength', () => {
  it('should detect no characters when password is empty', () => {
    const result = checkPasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.level).toBe('weak');
    expect(result.hasLower).toBe(false);
    expect(result.hasUpper).toBe(false);
    expect(result.hasDigit).toBe(false);
    expect(result.hasSymbol).toBe(false);
  });

  it('should give low score for short password with only lowercase', () => {
    const result = checkPasswordStrength('abcdef');
    expect(result.score).toBe(1); // 0 length (<8) + 1 lowercase
    expect(result.level).toBe('weak');
    expect(result.hasLower).toBe(true);
    expect(result.hasUpper).toBe(false);
    expect(result.hasDigit).toBe(false);
    expect(result.hasSymbol).toBe(false);
    expect(result.suggestions).toContain('增加密码长度到至少 8 位');
  });

  it('should detect all character types', () => {
    const result = checkPasswordStrength('Abc123!');
    expect(result.hasLower).toBe(true);
    expect(result.hasUpper).toBe(true);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSymbol).toBe(true);
  });

  it('should give strong score for long mixed password', () => {
    const result = checkPasswordStrength('P@ssw0rd123!');
    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(result.level).toBe('strong');
  });

  it('should give correct suggestions for incomplete password', () => {
    const result = checkPasswordStrength('password');
    expect(result.suggestions).toContain('添加大写字母 (A-Z)');
    expect(result.suggestions).toContain('添加数字 (0-9)');
    expect(result.suggestions).toContain('添加特殊符号 (!@#$%...)');
  });

  it('should handle mixed cases correctly', () => {
    const result = checkPasswordStrength('Hello123!');
    expect(result.score).toBe(4);
    expect(result.level).toBe('strong');
  });
});
