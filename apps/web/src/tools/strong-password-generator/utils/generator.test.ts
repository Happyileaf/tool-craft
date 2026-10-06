import { describe, expect, it } from 'vitest';
import { generateStrongPassword } from './generator';

describe('generateStrongPassword', () => {
  it('should return empty string when no character set is selected', () => {
    const password = generateStrongPassword({
      length: 10,
      includeLowercase: false,
      includeUppercase: false,
      includeDigits: false,
      includeSymbols: false,
    });
    expect(password).toBe('');
  });

  it('should generate password with correct length', () => {
    const password = generateStrongPassword({
      length: 8,
      includeLowercase: true,
      includeUppercase: false,
      includeDigits: false,
      includeSymbols: false,
    });
    expect(password.length).toBe(8);
  });

  it('should include at least one lowercase when enabled', () => {
    const password = generateStrongPassword({
      length: 10,
      includeLowercase: true,
      includeUppercase: true,
      includeDigits: true,
      includeSymbols: true,
    });
    const hasLowercase = /[a-z]/.test(password);
    expect(hasLowercase).toBe(true);
  });

  it('should include at least one uppercase when enabled', () => {
    const password = generateStrongPassword({
      length: 10,
      includeLowercase: true,
      includeUppercase: true,
      includeDigits: true,
      includeSymbols: true,
    });
    const hasUppercase = /[A-Z]/.test(password);
    expect(hasUppercase).toBe(true);
  });

  it('should include at least one digit when enabled', () => {
    const password = generateStrongPassword({
      length: 10,
      includeLowercase: true,
      includeUppercase: true,
      includeDigits: true,
      includeSymbols: true,
    });
    const hasDigit = /[0-9]/.test(password);
    expect(hasDigit).toBe(true);
  });

  it('should include at least one symbol when enabled', () => {
    const password = generateStrongPassword({
      length: 10,
      includeLowercase: true,
      includeUppercase: true,
      includeDigits: true,
      includeSymbols: true,
    });
    const hasSymbol = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password);
    expect(hasSymbol).toBe(true);
  });

  it('should only contain lowercase when only lowercase is enabled', () => {
    const password = generateStrongPassword({
      length: 20,
      includeLowercase: true,
      includeUppercase: false,
      includeDigits: false,
      includeSymbols: false,
    });
    expect(password).toMatch(/^[a-z]+$/);
  });
});
