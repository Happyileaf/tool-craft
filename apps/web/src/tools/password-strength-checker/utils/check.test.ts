
import { describe, it, expect } from 'vitest';
import { checkPasswordStrength, PasswordStrength } from './check';

describe('checkPasswordStrength', () => {
  it('should return weak for empty password', () => {
    const result = checkPasswordStrength('');
    expect(result.strength).toBe(PasswordStrength.WEAK);
    expect(result.score).toBe(0);
    expect(result.suggestions).toContain('密码不能为空');
  });

  it('should detect short password', () => {
    const result = checkPasswordStrength('Abc1');
    expect(result.score).toBeLessThan(3);
    expect(result.strength).toBe(PasswordStrength.WEAK);
    expect(result.suggestions).toContain('密码长度应至少为8个字符');
  });

  it('should give good score for strong password', () => {
    const result = checkPasswordStrength('Str0ng!Pass');
    expect(result.score).toBeGreaterThanOrEqual(5);
    expect(result.strength).toBe(PasswordStrength.STRONG);
    expect(result.suggestions).toHaveLength(0);
  });

  it('should suggest adding lowercase when missing', () => {
    const result = checkPasswordStrength('ABC123!@#');
    expect(result.suggestions).toContain('建议添加小写字母');
  });

  it('should suggest adding uppercase when missing', () => {
    const result = checkPasswordStrength('abc123!@#');
    expect(result.suggestions).toContain('建议添加大写字母');
  });

  it('should suggest adding digits when missing', () => {
    const result = checkPasswordStrength('Abcdef!@#');
    expect(result.suggestions).toContain('建议添加数字');
  });

  it('should suggest adding symbols when missing', () => {
    const result = checkPasswordStrength('Abcdef123');
    expect(result.suggestions).toContain('建议添加特殊符号');
  });

  it('should penalize repeated characters', () => {
    const result = checkPasswordStrength('aaaaaaaaaaaaaaaa');
    expect(result.score).toBeLessThan(3);
    expect(result.suggestions).toContain('避免全部使用相同字符');
  });

  it('should penalize sequential characters', () => {
    const result = checkPasswordStrength('abcd123!');
    expect(result.suggestions).toContain('避免使用连续的字符序列');
  });
});
