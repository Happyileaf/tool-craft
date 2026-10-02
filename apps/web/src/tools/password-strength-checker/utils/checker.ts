import { PasswordStrengthEnum } from '../constants';

/**
 * 检测结果接口
 */
export interface PasswordCheckResult {
  score: number;
  strength: PasswordStrengthEnum;
  hasLower: boolean;
  hasUpper: boolean;
  hasDigit: boolean;
  hasSymbol: boolean;
  meetsLength: boolean;
  suggestions: string[];
}

/**
 * 检测密码强度，基于NIST密码指南和常见安全规则
 * @param password - 待检测的密码
 * @returns 检测结果，包含评分、强度等级和改进建议
 */
export function checkPasswordStrength(password: string): PasswordCheckResult {
  let score = 0;
  const result: PasswordCheckResult = {
    score: 0,
    strength: PasswordStrengthEnum.WEAK,
    hasLower: false,
    hasUpper: false,
    hasDigit: false,
    hasSymbol: false,
    meetsLength: false,
    suggestions: [],
  };

  if (!password) {
    return result;
  }

  // 检查字符类型
  result.hasLower = /[a-z]/.test(password);
  result.hasUpper = /[A-Z]/.test(password);
  result.hasDigit = /[0-9]/.test(password);
  result.hasSymbol = /[^A-Za-z0-9]/.test(password);

  // 加分规则
  // 每个字符类型加 1 分
  if (result.hasLower) score++;
  if (result.hasUpper) score++;
  if (result.hasDigit) score++;
  if (result.hasSymbol) score++;

  // 长度加分：8-11 加 1，>= 12 加 2
  const len = password.length;
  if (len >= 8) {
    result.meetsLength = true;
    if (len >= 12) {
      score += 2;
    } else {
      score += 1;
    }
  }

  result.score = score;

  // 确定强度等级
  if (score < 4) {
    result.strength = PasswordStrengthEnum.WEAK;
  } else if (score < 5) {
    result.strength = PasswordStrengthEnum.MEDIUM;
  } else {
    result.strength = PasswordStrengthEnum.STRONG;
  }

  // 生成改进建议
  if (!result.hasLower) {
    result.suggestions.push('添加小写字母 (a-z)');
  }
  if (!result.hasUpper) {
    result.suggestions.push('添加大写字母 (A-Z)');
  }
  if (!result.hasDigit) {
    result.suggestions.push('添加数字 (0-9)');
  }
  if (!result.hasSymbol) {
    result.suggestions.push('添加特殊符号 (!@#$%^&* 等)');
  }
  if (!result.meetsLength) {
    result.suggestions.push('增加长度到至少 8 个字符');
  }

  return result;
}
