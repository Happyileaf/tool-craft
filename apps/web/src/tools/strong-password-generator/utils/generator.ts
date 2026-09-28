const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export interface GeneratePasswordOptions {
  length: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

/**
 * 使用浏览器原生 crypto API 生成安全随机数
 * @param max 最大值（不包含）
 * @returns 0 ~ max-1 之间的随机整数
 */
function getSecureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] as number) % max;
}

/**
 * 生成强随机密码
 * @param options 生成选项
 * @returns 生成的密码
 */
export function generatePassword(options: GeneratePasswordOptions): string {
  const {
    length,
    includeLowercase,
    includeUppercase,
    includeNumbers,
    includeSymbols,
  } = options;

  let charset = '';
  let password = '';

  if (includeLowercase) {
    charset += LOWERCASE_CHARS;
    // 确保至少包含一个小写字符
    password += LOWERCASE_CHARS[getSecureRandomInt(LOWERCASE_CHARS.length)];
  }

  if (includeUppercase) {
    charset += UPPERCASE_CHARS;
    // 确保至少包含一个大写字符
    password += UPPERCASE_CHARS[getSecureRandomInt(UPPERCASE_CHARS.length)];
  }

  if (includeNumbers) {
    charset += NUMBER_CHARS;
    // 确保至少包含一个数字
    password += NUMBER_CHARS[getSecureRandomInt(NUMBER_CHARS.length)];
  }

  if (includeSymbols) {
    charset += SYMBOL_CHARS;
    // 确保至少包含一个特殊符号
    password += SYMBOL_CHARS[getSecureRandomInt(SYMBOL_CHARS.length)];
  }

  // 如果没有选择任何字符集，默认使用小写
  if (charset === '') {
    charset = LOWERCASE_CHARS;
  }

  // 生成剩余长度的字符
  const remainingLength = length - password.length;
  for (let i = 0; i < remainingLength; i++) {
    const randomIndex = getSecureRandomInt(charset.length);
    password += charset[randomIndex];
  }

  // 打乱密码顺序（因为开头几个字符是按类别强制加入的）
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = passwordArray[i]!;
    passwordArray[i] = passwordArray[j]!;
    passwordArray[j] = temp!;
  }

  return passwordArray.join('');
}
