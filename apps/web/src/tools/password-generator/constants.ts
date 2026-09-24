import { CharacterSetType } from './utils/generate';

/**
 * 默认密码长度
 */
export const DEFAULT_LENGTH = 16;

/**
 * 字符集定义
 */
export const CHARACTER_SETS: Record<CharacterSetType, string> = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * 相似字符（容易混淆的字符）
 */
export const SIMILAR_CHARACTERS = '0Oo1IlIi';

/**
 * 默认输入样例（其实这里不需要输入，只是占位）
 */
export const DEFAULT_INPUT = '';
