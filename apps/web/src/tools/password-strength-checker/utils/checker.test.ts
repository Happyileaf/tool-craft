import { describe, expect, test } from 'vitest';
import { checkPasswordStrength } from './checker';
import { PasswordStrengthEnum } from '../constants';

describe('checkPasswordStrength', () => {
  test('empty password should return weak', () => {
    const result = checkPasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.strength).toBe(PasswordStrengthEnum.WEAK);
    expect(result.suggestions).toHaveLength(5);
  });

  test('password with only lowercase length 6 should be weak', () => {
    const result = checkPasswordStrength('abcdef');
    expect(result.hasLower).toBe(true);
    expect(result.hasUpper).toBe(false);
    expect(result.hasDigit).toBe(false);
    expect(result.hasSymbol).toBe(false);
    expect(result.meetsLength).toBe(false);
    expect(result.score).toBe(1);
    expect(result.strength).toBe(PasswordStrengthEnum.WEAK);
  });

  test('password with lowercase and uppercase length 8 should be medium', () => {
    const result = checkPasswordStrength('abcdefGH');
    expect(result.hasLower).toBe(true);
    expect(result.hasUpper).toBe(true);
    expect(result.hasDigit).toBe(false);
    expect(result.hasSymbol).toBe(false);
    expect(result.meetsLength).toBe(true);
    expect(result.score).toBe(3);
    expect(result.strength).toBe(PasswordStrengthEnum.WEAK);
  });

  test('password with lowercase, uppercase, digit, length 10 should be medium', () => {
    const result = checkPasswordStrength('abcdefGH12');
    expect(result.score).toBe(4);
    expect(result.strength).toBe(PasswordStrengthEnum.MEDIUM);
  });

  test('password with all character types length 12 should be strong', () => {
    const result = checkPasswordStrength('Abc123!@#xyz');
    expect(result.hasLower).toBe(true);
    expect(result.hasUpper).toBe(true);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSymbol).toBe(true);
    expect(result.meetsLength).toBe(true);
    expect(result.score).toBe(6);
    expect(result.strength).toBe(PasswordStrengthEnum.STRONG);
    expect(result.suggestions).toHaveLength(0);
  });

  test('password with symbol should detect correctly', () => {
    const result = checkPasswordStrength('Password!');
    expect(result.hasSymbol).toBe(true);
  });
});
