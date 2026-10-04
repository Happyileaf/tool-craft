import {
  LOWERCASE_CHARS,
  UPPERCASE_CHARS,
  DIGITS,
  SYMBOLS,
  DEFAULT_LENGTH,
} from '../constants';

export interface GeneratePasswordOptions {
  length: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeDigits: boolean;
  includeSymbols: boolean;
}

/**
 * 生成强随机密码
 */
export function generatePassword(options: Partial<GeneratePasswordOptions> = {}): string {
  const {
    length = DEFAULT_LENGTH,
    includeLowercase = true,
    includeUppercase = true,
    includeDigits = true,
    includeSymbols = true,
  } = options;

  let charset = '';
  if (includeLowercase) {
    charset += LOWERCASE_CHARS;
  }
  if (includeUppercase) {
    charset += UPPERCASE_CHARS;
  }
  if (includeDigits) {
    charset += DIGITS;
  }
  if (includeSymbols) {
    charset += SYMBOLS;
  }

  if (charset.length === 0) {
    charset = LOWERCASE_CHARS;
  }

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i]! % charset.length];
  }

  return password;
}
