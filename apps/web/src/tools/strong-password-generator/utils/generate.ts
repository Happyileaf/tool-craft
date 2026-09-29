
import { LOWERCASE_CHARS, UPPERCASE_CHARS, DIGIT_CHARS, SYMBOL_CHARS } from '../constants';

export interface GeneratePasswordOptions {
  length: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeDigits: boolean;
  includeSymbols: boolean;
}

/**
 * 生成强密码
 * @param options 生成选项
 * @returns 生成的密码字符串
 */
export function generatePassword(options: GeneratePasswordOptions): string {
  const { length, includeLowercase, includeUppercase, includeDigits, includeSymbols } = options;
  
  let charPool = '';
  let password = '';
  
  if (includeLowercase) {
    charPool += LOWERCASE_CHARS;
    // 确保至少包含一个小写字母
    password += getRandomChar(LOWERCASE_CHARS);
  }
  
  if (includeUppercase) {
    charPool += UPPERCASE_CHARS;
    password += getRandomChar(UPPERCASE_CHARS);
  }
  
  if (includeDigits) {
    charPool += DIGIT_CHARS;
    password += getRandomChar(DIGIT_CHARS);
  }
  
  if (includeSymbols) {
    charPool += SYMBOL_CHARS;
    password += getRandomChar(SYMBOL_CHARS);
  }
  
  if (charPool === '') {
    return '';
  }
  
  // 填充剩余长度
  const remainingLength = length - password.length;
  if (charPool) {
    for (let i = 0; i < remainingLength; i++) {
      password += getRandomChar(charPool);
    }
  
    // 打乱字符顺序，避免强制字符集中在开头
    return shuffleString(password);
  }
  return '';
}

/**
 * 从字符池中获取一个随机字符
 * @param charPool 字符池
 * @returns 随机字符
 */
function getRandomChar(charPool: string): string {
  const array = new Uint32Array(1);
  const result = crypto.getRandomValues(array);
  const index = result[0]! % charPool.length;
  return charPool[index]!;
}

/**
 * Fisher-Yates 洗牌算法打乱字符串
 * @param str 原始字符串
 * @returns 打乱后的字符串
 */
function shuffleString(str: string): string {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const randomValue = crypto.getRandomValues(new Uint32Array(1));
    const j = Math.floor(randomValue[0]! % (i + 1));
    [array[i], array[j]] = [array[j]!, array[i]!];
  }
  return array.join('');
}
