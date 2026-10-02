/**
 * 字符集枚举，定义四种可选字符类型
 */
export enum CharSetEnum {
  /** 小写字母 a-z */
  LOWERCASE = 'lowercase',
  /** 大写字母 A-Z */
  UPPERCASE = 'uppercase',
  /** 数字 0-9 */
  DIGITS = 'digits',
  /** 特殊符号 !@#$%^&*()_+-=[]{}|;:,.<>? */
  SYMBOLS = 'symbols',
}

/**
 * 默认选中的字符集，包含全部四种类型
 */
export const DEFAULT_CHARSETS: CharSetEnum[] = [
  CharSetEnum.LOWERCASE,
  CharSetEnum.UPPERCASE,
  CharSetEnum.DIGITS,
  CharSetEnum.SYMBOLS,
];

/**
 * 各字符集对应的实际字符
 */
export const CHARSET_MAP: Record<CharSetEnum, string> = {
  [CharSetEnum.LOWERCASE]: 'abcdefghijklmnopqrstuvwxyz',
  [CharSetEnum.UPPERCASE]: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  [CharSetEnum.DIGITS]: '0123456789',
  [CharSetEnum.SYMBOLS]: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * 密码长度范围配置
 */
export const MIN_PASSWORD_LENGTH = 4;
export const MAX_PASSWORD_LENGTH = 64;
export const DEFAULT_PASSWORD_LENGTH = 16;

/**
 * 默认样例输入，无实际输入时生成默认长度密码
 */
export const DEFAULT_SAMPLE_INPUT = '';
