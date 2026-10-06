/**
 * 密码强度评分结果
 */
export interface PasswordStrengthResult {
  score: number; // 0-4，分数越高越强
  level: 'weak' | 'medium' | 'strong';
  hasLower: boolean;
  hasUpper: boolean;
  hasDigit: boolean;
  hasSymbol: boolean;
  suggestions: string[];
}

const SYMBOL_REGEX = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/;

/**
 * 检测密码强度
 * @param password - 要检测的密码
 * @returns 检测结果，包含分数、等级、字符类型检查和改进建议
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = SYMBOL_REGEX.test(password);
  const suggestions: string[] = [];

  // 长度加分
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // 字符多样性加分
  if (hasLower) score++;
  if (hasUpper) score++;
  if (hasDigit) score++;
  if (hasSymbol) score++;

  // 上限为 4 分（匹配 UI 的四级评分）
  score = Math.min(score, 4);

  // 生成改进建议
  if (!hasLower) {
    suggestions.push('添加小写字母 (a-z)');
  }
  if (!hasUpper) {
    suggestions.push('添加大写字母 (A-Z)');
  }
  if (!hasDigit) {
    suggestions.push('添加数字 (0-9)');
  }
  if (!hasSymbol) {
    suggestions.push('添加特殊符号 (!@#$%...)');
  }
  if (password.length < 8) {
    suggestions.push('增加密码长度到至少 8 位');
  } else if (password.length < 12 && score < 3) {
    suggestions.push('增加密码长度到至少 12 位可以提高强度');
  }

  // 确定强度等级
  let level: 'weak' | 'medium' | 'strong';
  if (score <= 1) {
    level = 'weak';
  } else if (score <= 2) {
    level = 'medium';
  } else {
    level = 'strong';
  }

  return {
    score,
    level,
    hasLower,
    hasUpper,
    hasDigit,
    hasSymbol,
    suggestions,
  };
}
