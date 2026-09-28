
import { describe, expect, it } from 'vitest';
import { generatePassword, PasswordOptions } from './generator';

describe('generatePassword', () => {
  it('should generate empty string when no character types selected', () => {
    const options: PasswordOptions = {
      length: 10,
      includeLowercase: false,
      includeUppercase: false,
      includeNumbers: false,
      includeSymbols: false,
    };
    expect(generatePassword(options)).toBe('');
  });

  it('should generate password with correct length when only lowercase selected', () => {
    const options: PasswordOptions = {
      length: 8,
      includeLowercase: true,
      includeUppercase: false,
      includeNumbers: false,
      includeSymbols: false,
    };
    const password = generatePassword(options);
    expect(password.length).toBe(8);
    expect(password).toMatch(/^[a-z]+$/);
  });

  it('should include at least one character from each selected type', () => {
    const options: PasswordOptions = {
      length: 4,
      includeLowercase: true,
      includeUppercase: true,
      includeNumbers: true,
      includeSymbols: true,
    };
    const password = generatePassword(options);
    expect(password.length).toBe(4);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
  });

  it('should generate passwords of different lengths correctly', () => {
    const options: PasswordOptions = {
      length: 16,
      includeLowercase: true,
      includeUppercase: true,
      includeNumbers: true,
      includeSymbols: true,
    };
    expect(generatePassword(options).length).toBe(16);

    options.length = 32;
    expect(generatePassword(options).length).toBe(32);

    options.length = 4;
    expect(generatePassword(options).length).toBe(4);
  });

  it('should generate different passwords on each call', () => {
    const options: PasswordOptions = {
      length: 12,
      includeLowercase: true,
      includeUppercase: true,
      includeNumbers: true,
      includeSymbols: true,
    };
    const password1 = generatePassword(options);
    const password2 = generatePassword(options);
    expect(password1).not.toBe(password2);
  });
});
