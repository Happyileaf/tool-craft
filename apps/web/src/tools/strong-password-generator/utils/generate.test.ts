import { describe, expect, test } from 'vitest';
import { generateStrongPassword } from './generate';
import { CharSetEnum } from '../constants';

describe('generateStrongPassword', () => {
  test('should generate password of correct length', () => {
    const length = 16;
    const password = generateStrongPassword(length, [CharSetEnum.LOWERCASE]);
    expect(password).toHaveLength(length);
  });

  test('should only contain selected character set', () => {
    const password = generateStrongPassword(20, [CharSetEnum.DIGITS]);
    expect(password).toMatch(/^[0-9]+$/);
  });

  test('should contain at least one character from each selected set', () => {
    const password = generateStrongPassword(8, [
      CharSetEnum.LOWERCASE,
      CharSetEnum.UPPERCASE,
      CharSetEnum.DIGITS,
    ]);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
  });

  test('should return empty string when no character set selected', () => {
    const password = generateStrongPassword(8, []);
    expect(password).toBe('');
  });

  test('should work with all character sets', () => {
    const allSets = [
      CharSetEnum.LOWERCASE,
      CharSetEnum.UPPERCASE,
      CharSetEnum.DIGITS,
      CharSetEnum.SYMBOLS,
    ];
    const password = generateStrongPassword(32, allSets);
    expect(password).toHaveLength(32);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
  });
});
