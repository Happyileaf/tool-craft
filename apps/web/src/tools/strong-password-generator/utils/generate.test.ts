import { generatePassword } from './generate';

describe('generatePassword', () => {
  it('should generate password with default options', () => {
    const password = generatePassword();
    expect(password.length).toBe(16);
  });

  it('should generate password with custom length', () => {
    const password = generatePassword({ length: 32 });
    expect(password.length).toBe(32);
  });

  it('should only include lowercase when only lowercase is selected', () => {
    const password = generatePassword({
      includeLowercase: true,
      includeUppercase: false,
      includeDigits: false,
      includeSymbols: false,
    });
    expect(password).toMatch(/^[a-z]+$/);
  });

  it('should only include uppercase when only uppercase is selected', () => {
    const password = generatePassword({
      includeLowercase: false,
      includeUppercase: true,
      includeDigits: false,
      includeSymbols: false,
    });
    expect(password).toMatch(/^[A-Z]+$/);
  });

  it('should only include digits when only digits is selected', () => {
    const password = generatePassword({
      includeLowercase: false,
      includeUppercase: false,
      includeDigits: true,
      includeSymbols: false,
    });
    expect(password).toMatch(/^[0-9]+$/);
  });
});
