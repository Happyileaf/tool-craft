
/**
 * 强密码生成工具
 */

export interface PasswordOptions {
  length: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

/**
 * 从字符池中随机选择一个字符
 */
function getRandomChar(charset: string): string {
  const array = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for older browsers
    array[0] = Math.floor(Math.random() * charset.length);
  }
  const index = array[0]! % charset.length;
  return charset[index]!;
}

/**
 * 打乱密码顺序（Fisher-Yates 洗牌算法）
 * 确保各类字符均匀分布，避免同一类型字符连续出现
 */
function shufflePassword(password: string): string {
  const array = password.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const randomArray = new Uint32Array(1);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomArray);
    } else {
      // Fallback for older browsers
      randomArray[0] = Math.floor(Math.random() * (i + 1));
    }
    const j = Math.floor(randomArray[0]! % (i + 1));
    const temp = array[i];
    array[i] = array[j]!;
    array[j] = temp!;
  }
  return array.join('');
}

/**
 * 生成强密码
 */
export function generatePassword(options: PasswordOptions): string {
  const {
    length,
    includeLowercase,
    includeUppercase,
    includeNumbers,
    includeSymbols,
  } = options;

  let charset = '';
  let password = '';

  // 根据配置构建字符集，并确保至少包含每个选中类型的一个字符
  if (includeLowercase) {
    charset += 'abcdefghijklmnopqrstuvwxyz';
    password += getRandomChar('abcdefghijklmnopqrstuvwxyz');
  }
  if (includeUppercase) {
    charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    password += getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  }
  if (includeNumbers) {
    charset += '0123456789';
    password += getRandomChar('0123456789');
  }
  if (includeSymbols) {
    charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    password += getRandomChar('!@#$%^&*()_+-=[]{}|;:,.<>?');
  }

  // 如果没有选中任何字符类型，返回空字符串
  if (charset === '') {
    return '';
  }

  // 生成剩余字符
  const remainingLength = length - password.length;
  for (let i = 0; i < remainingLength; i++) {
    password += getRandomChar(charset);
  }

  // 打乱顺序，确保字符分布均匀
  return shufflePassword(password);
}
