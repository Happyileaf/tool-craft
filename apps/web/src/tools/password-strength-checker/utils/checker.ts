
import { PasswordStrengthLevel } from '../constants';

/**
 * 检测密码强度结果
 */
export interface PasswordCheckResult {
  score: number;
  level: PasswordStrengthLevel;
  suggestions: string[];
}

/**
 * 检测密码强度
 * 评分规则参考：
 * - 长度加分：越长分数越高
 * - 包含小写字母加分
 * - 包含大写字母加分
 * - 包含数字加分
 * - 包含特殊符号加分
 * - 全是同一种字符减分
 * - 连续字符减分
 */
export function checkPasswordStrength(password: string): PasswordCheckResult {
  let score = 0;
  const suggestions: string[] = [];

  // 1. 长度评分
  const length = password.length;
  if (length < 4) {
    score += 0;
    suggestions.push('密码长度太短了，建议至少 8 位');
  } else if (length < 8) {
    score += 1;
    suggestions.push('增加密码长度到 8 位以上会更安全');
  } else if (length < 12) {
    score += 2;
  } else if (length < 16) {
    score += 3;
  } else {
    score += 4;
  }

  // 2. 字符多样性检查
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);

  if (hasLowercase) {
    score += 1;
  } else {
    suggestions.push('添加小写字母增加密码强度');
  }

  if (hasUppercase) {
    score += 1;
  } else {
    suggestions.push('添加大写字母增加密码强度');
  }

  if (hasNumbers) {
    score += 1;
  } else {
    suggestions.push('添加数字增加密码强度');
  }

  if (hasSymbols) {
    score += 2;
  } else {
    suggestions.push('添加特殊符号（如 !@#$%）大幅增加密码强度');
  }

  // 3. 惩罚：只有一种字符类型
  const charTypesCount = [hasLowercase, hasUppercase, hasNumbers, hasSymbols].filter(Boolean).length;
  if (charTypesCount === 1 && length > 2) {
    score -= 1;
    suggestions.push('混合多种字符类型会更安全');
  }

  // 4. 惩罚：连续重复字符
  const consecutiveMatches = password.match(/(.)\1+/g);
  if (consecutiveMatches && consecutiveMatches.length > 0) {
    score -= consecutiveMatches.length;
    suggestions.push('避免连续重复字符');
  }

  // 5. 惩罚：顺序字符（如 abc, 123）
  if (hasSequentialChars(password)) {
    score -= 1;
    suggestions.push('避免顺序字符如 abc 或 123');
  }

  // 6. 惩罚：重复模式（如 aaaaaa, ababab）
  if (hasRepeatingPattern(password)) {
    score -= 1;
    suggestions.push('避免重复的字符模式');
  }

  // 保证分数不为负
  score = Math.max(0, score);

  // 确定等级
  let level: PasswordStrengthLevel;
  if (score <= 1) {
    level = PasswordStrengthLevel.VERY_WEAK;
  } else if (score <= 3) {
    level = PasswordStrengthLevel.WEAK;
  } else if (score <= 5) {
    level = PasswordStrengthLevel.MEDIUM;
  } else if (score <= 8) {
    level = PasswordStrengthLevel.STRONG;
  } else {
    level = PasswordStrengthLevel.VERY_STRONG;
  }

  return {
    score,
    level,
    suggestions,
  };
}

/**
 * 检查是否包含连续顺序字符
 */
function hasSequentialChars(password: string): boolean {
  // 检查字母顺序 a-z
  for (let i = 0; i < password.length - 2; i++) {
    const code1 = password.charCodeAt(i);
    const code2 = password.charCodeAt(i + 1);
    const code3 = password.charCodeAt(i + 2);
    if (code2 === code1 + 1 && code3 === code2 + 1) {
      return true;
    }
  }
  // 检查数字顺序 0-9
  for (let i = 0; i < password.length - 2; i++) {
    const num1 = parseInt(password[i], 10);
    const num2 = parseInt(password[i + 1], 10);
    const num3 = parseInt(password[i + 2], 10);
    if (!isNaN(num1) && !isNaN(num2) && !isNaN(num3)) {
      if (num2 === num1 + 1 && num3 === num2 + 1) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 检查是否有重复模式
 */
function hasRepeatingPattern(password: string): boolean {
  // 检查长度至少为 2 的模式重复 3 次以上
  for (let patternLength = 2; patternLength <= Math.floor(password.length / 3); patternLength++) {
    const pattern = password.slice(0, patternLength);
    let count = 0;
    let pos = 0;
    while (pos + patternLength <= password.length) {
      if (password.slice(pos, pos + patternLength) === pattern) {
        count++;
        pos += patternLength;
      } else {
        break;
      }
    }
    if (count >= 3) {
      return true;
    }
  }
  return false;
}
