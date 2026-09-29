
export enum PasswordStrength {
  WEAK = 0,
  MEDIUM = 1,
  STRONG = 2,
}

export interface CheckResult {
  score: number;
  strength: PasswordStrength;
  suggestions: string[];
}

/**
 * 检查密码强度
 * @param password 要检查的密码
 * @returns 检查结果，包含分数、强度等级和改进建议
 */
export function checkPasswordStrength(password: string): CheckResult {
  let score = 0;
  const suggestions: string[] = [];

  if (!password) {
    return {
      score: 0,
      strength: PasswordStrength.WEAK,
      suggestions: ['密码不能为空'],
    };
  }

  // 长度检查
  if (password.length < 8) {
    suggestions.push('密码长度应至少为8个字符');
  } else if (password.length < 12) {
    score += 1;
  } else {
    score += 2;
  }

  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('建议添加小写字母');
  }

  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('建议添加大写字母');
  }

  // 包含数字
  if (/\d/.test(password)) {
    score += 1;
  } else {
    suggestions.push('建议添加数字');
  }

  // 包含特殊符号
  if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('建议添加特殊符号');
  }

  // 检查常见模式
  if (/^(.)\1+$/.test(password)) {
    score -= 2;
    suggestions.push('避免全部使用相同字符');
  }

  // 检查连续字符
  if (/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    score -= 1;
    suggestions.push('避免使用连续的字符序列');
  }

  // 检查重复模式
  const uniqueChars = new Set(password.split(''));
  if (uniqueChars.size / password.length < 0.5) {
    score -= 1;
    suggestions.push('避免过度重复使用相同字符');
  }

  // 分数最小为0
  score = Math.max(0, score);

  // 确定强度等级
  let strength: PasswordStrength;
  if (score < 3) {
    strength = PasswordStrength.WEAK;
  } else if (score < 5) {
    strength = PasswordStrength.MEDIUM;
  } else {
    strength = PasswordStrength.STRONG;
  }

  return {
    score,
    strength,
    suggestions,
  };
}
