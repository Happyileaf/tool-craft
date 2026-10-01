export interface PasswordStrengthResult {
  score: number; // 0-4
  level: 'weak' | 'medium' | 'strong';
  suggestions: string[];
}

/**
 * 检测密码强度
 * @param password 待检测的密码
 * @returns 检测结果，包含分数、等级和改进建议
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  const suggestions: string[] = [];

  // 长度检查
  if (password.length < 8) {
    suggestions.push('增加密码长度到至少 8 位');
  } else if (password.length >= 8 && password.length < 12) {
    score += 1;
    suggestions.push('增加密码长度到 12 位以上可以提高安全性');
  } else if (password.length >= 12) {
    score += 2;
  }

  // 小写字母检查
  if (!/[a-z]/.test(password)) {
    suggestions.push('添加小写字母');
  } else {
    score += 1;
  }

  // 大写字母检查
  if (!/[A-Z]/.test(password)) {
    suggestions.push('添加大写字母');
  } else {
    score += 1;
  }

  // 数字检查
  if (!/[0-9]/.test(password)) {
    suggestions.push('添加数字');
  } else {
    score += 1;
  }

  // 特殊符号检查
  if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
    suggestions.push('添加特殊符号（!@#$%^&* 等）');
  } else {
    score += 1;
  }

  // 常见弱密码检查
  const commonPatterns = [
    /^password$/i,
    /^123456/,
    /^qwerty/i,
    /^abc123/,
    /^admin/i,
    /^letmein/i,
    /^dragon/i,
    /^baseball/i,
    /^iloveyou/i,
  ];
  for (const pattern of commonPatterns) {
    if (pattern.test(password.toLowerCase())) {
      score = Math.max(0, score - 2);
      suggestions.push('避免使用常见单词或序列作为密码');
      break;
    }
  }

  // 连续字符检查
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push('避免连续重复相同字符');
  }

  // 顺序字符检查
  const sequences = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiopasdfghjklzxcvbnm'];
  for (const seq of sequences) {
    for (let i = 0; i < seq.length - 3; i++) {
      const substring = seq.slice(i, i + 4);
      if (password.toLowerCase().includes(substring)) {
        score = Math.max(0, score - 1);
        suggestions.push('避免使用连续顺序字符');
        break;
      }
    }
  }

  // 分数限制在 0-4 范围内
  score = Math.max(0, Math.min(4, score));

  // 确定等级
  let level: 'weak' | 'medium' | 'strong';
  if (score <= 1) {
    level = 'weak';
  } else if (score === 2 || score === 3) {
    level = 'medium';
  } else {
    level = 'strong';
  }

  return {
    score,
    level,
    suggestions: [...new Set(suggestions)], // 去重
  };
}
