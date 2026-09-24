/**
 * 字符集类型定义
 */
export type CharacterSetType = 'uppercase' | 'lowercase' | 'numbers' | 'symbols';

/**
 * 生成随机密码
 * @param length - 密码长度
 * @param includeUppercase - 是否包含大写字母
 * @param includeLowercase - 是否包含小写字母
 * @param includeNumbers - 是否包含数字
 * @param includeSymbols - 是否包含符号
 * @param excludeSimilar - 是否排除相似字符
 * @returns 生成的随机密码
 */
export function generatePassword(
  length: number,
  includeUppercase: boolean,
  includeLowercase: boolean,
  includeNumbers: boolean,
  includeSymbols: boolean,
  excludeSimilar: boolean,
): string {
  let charset = '';
  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeNumbers) charset += '0123456789';
  if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // 排除相似字符
  if (excludeSimilar) {
    const similar = '0Oo1IlIi';
    charset = charset.split('').filter(c => !similar.includes(c)).join('');
  }

  if (charset.length === 0) {
    return '';
  }

  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    const randomIndex = array[i]! % charset.length;
    password += charset[randomIndex]!;
  }

  return password;
}
