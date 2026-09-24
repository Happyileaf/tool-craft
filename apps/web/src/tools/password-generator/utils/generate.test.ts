import { describe, expect, test } from 'vitest';
import { generatePassword } from './generate';

describe('generatePassword', () => {
  test('should generate password of correct length', () => {
    const password = generatePassword(16, true, true, true, true, false);
    expect(password.length).toBe(16);
  });

  test('should generate empty password when no character sets selected', () => {
    const password = generatePassword(16, false, false, false, false, false);
    expect(password).toBe('');
  });

  test('should only include uppercase when only uppercase selected', () => {
    const password = generatePassword(10, true, false, false, false, false);
    expect(password).toMatch(/^[A-Z]+$/);
  });

  test('should only include lowercase when only lowercase selected', () => {
    const password = generatePassword(10, false, true, false, false, false);
    expect(password).toMatch(/^[a-z]+$/);
  });

  test('should only include numbers when only numbers selected', () => {
    const password = generatePassword(10, false, false, true, false, false);
    expect(password).toMatch(/^[0-9]+$/);
  });

  test('should exclude similar characters when excludeSimilar is true', () => {
    const password = generatePassword(100, true, true, true, false, true);
    const similar = '0Oo1IlIi';
    for (const c of similar) {
      expect(password).not.toContain(c);
    }
  });

  test('should generate different passwords on each call', () => {
    const p1 = generatePassword(8, true, true, true, true, false);
    const p2 = generatePassword(8, true, true, true, true, false);
    expect(p1).not.toBe(p2);
  });
});
