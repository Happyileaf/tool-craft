import { REGEX_PATTERNS } from '../constants';

export type PatternKey = keyof typeof REGEX_PATTERNS;

export const getPatternByKey = (key: PatternKey): string => {
  return REGEX_PATTERNS[key].pattern;
};

export const generateRegex = (pattern: string, flags: string): RegExp => {
  return new RegExp(pattern, flags);
};
