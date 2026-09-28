import { describe, expect, test } from 'vitest';
import { generatePassword } from './generator';

describe('generatePassword', () => {
  test('should generate password of correct length', () => {
    const password = generatePassword({
      length: 16,
      includeLowercase: true,
      includeUppercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });
    expect(password.length).toBe(16);
  });

  test('should include lowercase when selected', () => {
    const password = generatePassword({
      length: 8,
      includeLowercase: true,
      includeUppercase: false,
      includeNumbers: false,
      includeSymbols: false,
    });
    expect(password).toMatch(/[a-z]/);
    expect(password.length).toBe(8);
  });

  test('should include uppercase when selected', () => {
    const password = generatePassword({
      length: 8,
      includeLowercase: false,
      includeUppercase: true,
      includeNumbers: false,
      includeSymbols: false,
    });
    expect(password).toMatch(/[A-Z]/);
    expect(password.length).toBe(8);
  });

  test('should include numbers when selected', () => {
    const password = generatePassword({
      length: 8,
      includeLowercase: false,
      includeUppercase: false,
      includeNumbers: true,
      includeSymbols: false,
    });
    expect(password).toMatch(/[0-9]/);
    expect(password.length).toBe(8);
  });

  test('should include symbols when selected', () => {
    const password = generatePassword({
      length: 8,
      includeLowercase: false,
      includeUppercase: false,
      includeNumbers: false,
      includeSymbols: true,
    });
    expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
    expect(password.length).toBe(8);
  });

  test('should work with all options selected', () => {
    const password = generatePassword({
      length: 12,
      includeLowercase: true,
      includeUppercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
    expect(password.length).toBe(12);
  });

  test('should fall back to lowercase if no options selected', () => {
    const password = generatePassword({
      length: 8,
      includeLowercase: false,
      includeUppercase: false,
      includeNumbers: false,
      includeSymbols: false,
    });
    expect(password).toMatch(/^[a-z]{8}$/);
  });
});
