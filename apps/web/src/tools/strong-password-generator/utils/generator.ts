import {
  DIGIT_CHARS,
  LOWERCASE_CHARS,
  SYMBOL_CHARS,
  UPPERCASE_CHARS,
} from '../constants';

/**
 * 密码生成选项
 */
export interface GenerateOptions {
  length: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeDigits: boolean;
  includeSymbols: boolean;
}

/**
 * 从指定字符集中随机获取一个字符
 */
function getRandomChar(chars: string): string {
  const array = new Uint32Array(1);
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : crypto;
  (cryptoObj as Crypto).getRandomValues(array);
  const index = (array[0] as number) % chars.length;
  return chars[index] as string;
}

/**
 * 生成强密码
 * @param options 生成选项
 * @returns 生成的密码字符串
 */
export function generateStrongPassword(options: GenerateOptions): string {
  const {
    length,
    includeLowercase,
    includeUppercase,
    includeDigits,
    includeSymbols,
  } = options;

  // 收集选中的字符集
  let allChars = '';
  const requiredSets: string[] = [];

  if (includeLowercase) {
    allChars += LOWERCASE_CHARS;
    requiredSets.push(LOWERCASE_CHARS);
  }
  if (includeUppercase) {
    allChars += UPPERCASE_CHARS;
    requiredSets.push(UPPERCASE_CHARS);
  }
  if (includeDigits) {
    allChars += DIGIT_CHARS;
    requiredSets.push(DIGIT_CHARS);
  }
  if (includeSymbols) {
    allChars += SYMBOL_CHARS;
    requiredSets.push(SYMBOL_CHARS);
  }

  // 如果没有选中任何字符集，返回空字符串
  if (allChars.length === 0) {
    return '';
  }

  // 确保至少从每个选中的字符集中取出一个字符
  let password = '';
  for (const set of requiredSets) {
    password += getRandomChar(set);
  }

  // 填充剩余长度
  const remainingLength = length - password.length;
  for (let i = 0; i < remainingLength; i++) {
    password += getRandomChar(allChars);
  }

  // 打乱顺序（Fisher-Yates 洗牌算法），确保第一个字符不一定来自第一个集合
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const array = new Uint32Array(1);
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : crypto;
    (cryptoObj as Crypto).getRandomValues(array);
    const j = (array[0] as number) % (i + 1);
    const temp = passwordArray[i];
    passwordArray[i] = passwordArray[j]!;
    passwordArray[j] = temp!;
  }

  return passwordArray.join('');
}
