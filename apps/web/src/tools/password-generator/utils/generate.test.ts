import { describe, expect, it } from 'vitest';
import { generatePassword, calculateStrength, type PasswordOptions } from './generate';

describe('password generator', () => {
  const defaultOptions: PasswordOptions = {
    length: 16,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true,
  };

  it('should generate password with correct length', () => {
    const password8 = generatePassword({ ...defaultOptions, length: 8 });
    expect(password8).toHaveLength(8);

    const password16 = generatePassword({ ...defaultOptions, length: 16 });
    expect(password16).toHaveLength(16);
  });

  it('should return empty when no character types selected', () => {
    const password = generatePassword({
      ...defaultOptions,
      includeLowercase: false,
      includeUppercase: false,
      includeNumbers: false,
      includeSymbols: false,
    });
    expect(password).toBe('');
  });

  it('should only use selected character types', () => {
    const lowercaseOnly = generatePassword({
      ...defaultOptions,
      includeUppercase: false,
      includeNumbers: false,
      includeSymbols: false,
    });
    expect(lowercaseOnly).toMatch(/^[a-z]+$/);

    const numbersOnly = generatePassword({
      ...defaultOptions,
      includeLowercase: false,
      includeUppercase: false,
      includeNumbers: true,
      includeSymbols: false,
    });
    expect(numbersOnly).toMatch(/^[0-9]+$/);
  });

  it('should calculate strength correctly', () => {
    expect(calculateStrength('')).toBe(0);
    expect(calculateStrength('abc')).toBe(1);
    expect(calculateStrength('abcdefgh')).toBe(2);
    expect(calculateStrength('Abcdefgh')).toBe(3);
    expect(calculateStrength('Abcdefgh123')).toBe(4);
    expect(calculateStrength('Abcdefgh123!')).toBe(6);
  });
});
