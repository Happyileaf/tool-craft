import { CharSetEnum, CHARSET_MAP } from '../constants';

/**
 * 使用加密安全随机数生成强密码
 * @param length - 期望密码长度，必须 >= 4
 * @param charSets - 选中的字符集数组，必须至少包含一个
 * @returns 生成的密码字符串
 */
export function generateStrongPassword(
  length: number,
  charSets: CharSetEnum[],
): string {
  // 确保至少选中一个字符集
  if (charSets.length === 0) {
    return '';
  }

  // 构建完整字符集
  let fullChars = '';
  charSets.forEach((cs) => {
    fullChars += CHARSET_MAP[cs];
  });

  const charArray = fullChars.split('');
  const charCount = charArray.length;
  let result = '';

  // 使用 crypto.getRandomValues 生成安全随机数
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    const randomIndex = randomValues[i] % charCount;
    result += charArray[randomIndex];
  }

  // 确保每个选中的字符集至少有一个字符出现在结果中
  // 避免出现用户选中了特殊符号但结果中没有的情况
  if (charSets.length > 1) {
    const hasRequiredChars = charSets.every((cs) => {
      const chars = CHARSET_MAP[cs];
      return result.split('').some((c) => chars.includes(c));
    });

    if (!hasRequiredChars) {
      // 如果不满足要求，递归重新生成
      return generateStrongPassword(length, charSets);
    }
  }

  return result;
}
