import { describe, expect, it } from 'vitest';
import { generateStrongPassword } from './generate';

// Mock window for testing
global.window = { crypto: require('crypto').webcrypto } as any;

describe('generateStrongPassword', () => {
  it('should generate password with correct length', () => {
    const password = generateStrongPassword(16, true, true, true, true);
    expect(password.length).toBe(16);
  });

  it('should include lowercase when selected', () => {
    const password = generateStrongPassword(8, true, false, false, false);
    expect(password).toMatch(/^[a-z]+$/);
  });

  it('should include uppercase when selected', () => {
    const password = generateStrongPassword(8, false, true, false, false);
    expect(password).toMatch(/^[A-Z]+$/);
  });

  it('should include numbers when selected', () => {
    const password = generateStrongPassword(8, false, false, true, false);
    expect(password).toMatch(/^[0-9]+$/);
  });

  it('should include symbols when selected', () => {
    const password = generateStrongPassword(8, false, false, false, true);
    expect(password).toMatch(/^[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/);
  });

  it('should include all selected character types', () => {
    const password = generateStrongPassword(12, true, true, true, true);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
  });

  it('should default to lowercase when nothing is selected', () => {
    const password = generateStrongPassword(8, false, false, false, false);
    expect(password).toMatch(/^[a-z]+$/);
  });
});
