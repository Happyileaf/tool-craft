export interface PasswordStrengthResult {
  score: number;
  level: 'weak' | 'medium' | 'strong';
  suggestions: string[];
}

const lowercaseRegex = /[a-z]/;
const uppercaseRegex = /[A-Z]/;
const digitRegex = /\d/;
const symbolRegex = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/;

const hasLowercase = (password: string) => lowercaseRegex.test(password);
const hasUppercase = (password: string) => uppercaseRegex.test(password);
const hasDigit = (password: string) => digitRegex.test(password);
const hasSymbol = (password: string) => symbolRegex.test(password);

const MIN_LENGTH_WEAK = 6;
const MIN_LENGTH_MEDIUM = 8;
const MIN_LENGTH_STRONG = 12;

/**
 * 检测密码强度
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const suggestions: string[] = [];
  let score = 0;

  if (!password) {
    return {
      score: 0,
      level: 'weak',
      suggestions: ['请输入密码进行检测'],
    };
  }

  // 长度评分
  if (password.length >= MIN_LENGTH_STRONG) {
    score += 3;
  } else if (password.length >= MIN_LENGTH_MEDIUM) {
    score += 2;
    suggestions.push('增加密码长度到12位以上提升安全性');
  } else if (password.length >= MIN_LENGTH_WEAK) {
    score += 1;
    suggestions.push('增加密码长度到8位以上提升安全性');
  } else {
    suggestions.push('密码长度至少需要6位');
  }

  // 包含小写字母
  if (hasLowercase(password)) {
    score += 1;
  } else {
    suggestions.push('添加小写字母增加密码复杂度');
  }

  // 包含大写字母
  if (hasUppercase(password)) {
    score += 1;
  } else {
    suggestions.push('添加大写字母增加密码复杂度');
  }

  // 包含数字
  if (hasDigit(password)) {
    score += 1;
  } else {
    suggestions.push('添加数字增加密码复杂度');
  }

  // 包含特殊符号
  if (hasSymbol(password)) {
    score += 1;
  } else {
    suggestions.push('添加特殊符号增加密码复杂度');
  }

  // 判断强度等级
  let level: 'weak' | 'medium' | 'strong';
  if (score <= 3) {
    level = 'weak';
  } else if (score <= 5) {
    level = 'medium';
  } else {
    level = 'strong';
  }

  if (level === 'strong' && suggestions.length === 0) {
    suggestions.push('这是一个强度很高的密码');
  }

  return {
    score,
    level,
    suggestions,
  };
}
