
import { describe, expect, it } from 'vitest';
import { checkPasswordStrength } from './checker';
import { PasswordStrengthLevel } from '../constants';

describe('checkPasswordStrength', () => {
  it('should return very weak for short password', () => {
    const result = checkPasswordStrength('abc');
    expect(result.level).toBe(PasswordStrengthLevel.VERY_WEAK);
  });

  it('should detect weak password with only lowercase', () => {
    const result = checkPasswordStrength('abcdefgh');
    expect(result.level).toBe(PasswordStrengthLevel.WEAK);
    expect(result.suggestions).toContainEqual(expect.stringContaining('大写字母'));
    expect(result.suggestions).toContainEqual(expect.stringContaining('数字'));
    expect(result.suggestions).toContainEqual(expect.stringContaining('特殊符号'));
  });

  it('should detect medium password with lowercase and numbers', () => {
    const result = checkPasswordStrength('abc12345');
    expect(result.level).toBe(PasswordStrengthLevel.MEDIUM);
  });

  it('should detect strong password with mixed types', () => {
    const result = checkPasswordStrength('Abc123!@#');
    expect(result.level).toBe(PasswordStrengthLevel.STRONG);
  });

  it('should detect very strong password', () => {
    const result = checkPasswordStrength('K9@q!xY2#pZ7$d');
    expect(result.level).toBe(PasswordStrengthLevel.VERY_STRONG);
  });

  it('should suggest adding special symbols', () => {
    const result = checkPasswordStrength('Password123');
    expect(result.suggestions).toContainEqual(expect.stringContaining('特殊符号'));
  });

  it('should penalize sequential characters', () => {
    const result1 = checkPasswordStrength('abc123!');
    const result2 = checkPasswordStrength('123abc!');
    expect(result1.score).toBeLessThan(6);
    expect(result2.score).toBeLessThan(6);
  });

  it('should penalize repeated pattern', () => {
    const result = checkPasswordStrength('abababab');
    expect(result.suggestions).toContainEqual(expect.stringContaining('重复'));
  });

  it('should handle empty password', () => {
    const result = checkPasswordStrength('');
    expect(result.level).toBe(PasswordStrengthLevel.VERY_WEAK);
  });
});
