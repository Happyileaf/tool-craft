import { PasswordStrength } from '../constants';

export const SuggestionKey = {
  EMPTY: 'suggestionEmpty',
  LOWERCASE: 'suggestionLowercase',
  UPPERCASE: 'suggestionUppercase',
  NUMBERS: 'suggestionNumbers',
  SYMBOLS: 'suggestionSymbols',
  MIN_LENGTH: 'suggestionMinLength',
} as const;

export type SuggestionKey = (typeof SuggestionKey)[keyof typeof SuggestionKey];

export interface PasswordCheckResult {
  score: number;
  strength: PasswordStrength;
  suggestions: SuggestionKey[];
}

const hasLowercase = /[a-z]/;
const hasUppercase = /[A-Z]/;
const hasNumber = /[0-9]/;
const hasSymbol = /[^A-Za-z0-9]/;
const hasMinLength = /.{8,}/;
const hasMediumLength = /.{12,}/;

/**
 * 检测密码强度，基于多个规则给出评分，建议项返回稳定 key 由界面层翻译
 * @param password 要检测的密码
 * @returns 检测结果，包含分数、强度等级和建议 key 列表
 */
export function checkPassword(password: string): PasswordCheckResult {
  let score = 0;
  const suggestions: SuggestionKey[] = [];

  if (!password) {
    return {
      score: 0,
      strength: PasswordStrength.WEAK,
      suggestions: [SuggestionKey.EMPTY],
    };
  }

  if (hasLowercase.test(password)) {
    score += 1;
  } else {
    suggestions.push(SuggestionKey.LOWERCASE);
  }

  if (hasUppercase.test(password)) {
    score += 1;
  } else {
    suggestions.push(SuggestionKey.UPPERCASE);
  }

  if (hasNumber.test(password)) {
    score += 1;
  } else {
    suggestions.push(SuggestionKey.NUMBERS);
  }

  if (hasSymbol.test(password)) {
    score += 1;
  } else {
    suggestions.push(SuggestionKey.SYMBOLS);
  }

  if (hasMediumLength.test(password)) {
    score += 2;
  } else if (hasMinLength.test(password)) {
    score += 1;
  } else {
    suggestions.push(SuggestionKey.MIN_LENGTH);
  }

  let strength: PasswordStrength;
  if (score <= 2) {
    strength = PasswordStrength.WEAK;
  } else if (score <= 4) {
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
