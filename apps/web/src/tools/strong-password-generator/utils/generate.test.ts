
import { describe, it, expect } from 'vitest';
import { generatePassword } from './generate';

describe('generatePassword', () => {
  it('should generate password with correct length', () => {
    const password = generatePassword({
      length: 16,
      includeLowercase: true,
      includeUppercase: false,
      includeDigits: false,
      includeSymbols: false,
    });
    expect(password.length).toBe(16);
  });
  
  it('should include at least one lowercase when enabled', () => {
    const password = generatePassword({
      length: 8,
      includeLowercase: true,
      includeUppercase: false,
      includeDigits: false,
      includeSymbols: false,
    });
    expect(password).toMatch(/[a-z]/);
  });
  
  it('should include lowercase and uppercase when both enabled', () => {
    const password = generatePassword({
      length: 10,
      includeLowercase: true,
      includeUppercase: true,
      includeDigits: false,
      includeSymbols: false,
    });
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
  });
  
  it('should include all character types when all enabled', () => {
    const password = generatePassword({
      length: 12,
      includeLowercase: true,
      includeUppercase: true,
      includeDigits: true,
      includeSymbols: true,
    });
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
  });
  
  it('should return empty string when no character types selected', () => {
    const password = generatePassword({
      length: 8,
      includeLowercase: false,
      includeUppercase: false,
      includeDigits: false,
      includeSymbols: false,
    });
    expect(password).toBe('');
  });
  
  it('should generate different passwords on each call', () => {
    const password1 = generatePassword({
      length: 16,
      includeLowercase: true,
      includeUppercase: true,
      includeDigits: true,
      includeSymbols: true,
    });
    const password2 = generatePassword({
      length: 16,
      includeLowercase: true,
      includeUppercase: true,
      includeDigits: true,
      includeSymbols: true,
    });
    expect(password1).not.toBe(password2);
  });
});
