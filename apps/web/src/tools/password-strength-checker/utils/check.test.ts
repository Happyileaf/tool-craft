import { checkPasswordStrength } from './check';

describe('checkPasswordStrength', () => {
  it('should return 0 score for empty password', () => {
    const result = checkPasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.level).toBe('weak');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should detect weak password (length < 6)', () => {
    const result = checkPasswordStrength('Abc1!');
    expect(result.score).toBeLessThanOrEqual(3);
    expect(result.level).toBe('weak');
  });

  it('should detect medium password', () => {
    const result = checkPasswordStrength('Abc1234!');
    expect(result.score).toBeGreaterThan(3);
    expect(result.score).toBeLessThanOrEqual(5);
    expect(result.level).toBe('medium');
  });

  it('should detect strong password', () => {
    const result = checkPasswordStrength('Abc12345!@#');
    expect(result.score).toBeGreaterThan(5);
    expect(result.level).toBe('strong');
  });

  it('should suggest missing character types', () => {
    const result = checkPasswordStrength('abcdefghij');
    expect(result.suggestions.some(s => s.includes('uppercase'))).toBe(true);
    expect(result.suggestions.some(s => s.includes('digit'))).toBe(true);
    expect(result.suggestions.some(s => s.includes('symbol'))).toBe(true);
  });
});
