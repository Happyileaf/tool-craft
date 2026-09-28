import { describe, expect, test } from 'vitest';
import { checkPassword, SuggestionKey } from './checker';
import { PasswordStrength } from '../constants';

describe('checkPassword', () => {
  test('empty password', () => {
    const result = checkPassword('');
    expect(result.score).toBe(0);
    expect(result.strength).toBe(PasswordStrength.WEAK);
    expect(result.suggestions).toContain(SuggestionKey.EMPTY);
  });

  test('very short password, only lowercase', () => {
    const result = checkPassword('abc');
    expect(result.score).toBe(1);
    expect(result.strength).toBe(PasswordStrength.WEAK);
    expect(result.suggestions).toContain(SuggestionKey.UPPERCASE);
    expect(result.suggestions).toContain(SuggestionKey.NUMBERS);
    expect(result.suggestions).toContain(SuggestionKey.SYMBOLS);
    expect(result.suggestions).toContain(SuggestionKey.MIN_LENGTH);
  });

  test('8 characters, mixed case no numbers or symbols', () => {
    const result = checkPassword('Abcdefgh');
    expect(result.score).toBe(3);
    expect(result.strength).toBe(PasswordStrength.MEDIUM);
    expect(result.suggestions).toContain(SuggestionKey.NUMBERS);
    expect(result.suggestions).toContain(SuggestionKey.SYMBOLS);
    expect(result.suggestions).not.toContain(SuggestionKey.MIN_LENGTH);
  });

  test('12 characters, all character types', () => {
    const result = checkPassword('Abc123!@#xyz');
    expect(result.score).toBe(6);
    expect(result.strength).toBe(PasswordStrength.STRONG);
    expect(result.suggestions).toHaveLength(0);
  });

  test('10 characters, all character types', () => {
    const result = checkPassword('Abc123!@#x');
    expect(result.score).toBe(5);
    expect(result.strength).toBe(PasswordStrength.STRONG);
    expect(result.suggestions).toHaveLength(0);
  });

  test('only numbers 8 digits', () => {
    const result = checkPassword('12345678');
    expect(result.score).toBe(2);
    expect(result.strength).toBe(PasswordStrength.WEAK);
    expect(result.suggestions).toContain(SuggestionKey.LOWERCASE);
    expect(result.suggestions).toContain(SuggestionKey.UPPERCASE);
    expect(result.suggestions).toContain(SuggestionKey.SYMBOLS);
  });
});
