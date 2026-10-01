/**
 * 生成强密码
 * @param length 密码长度
 * @param includeLower 包含小写字母
 * @param includeUpper 包含大写字母
 * @param includeNumbers 包含数字
 * @param includeSymbols 包含特殊符号
 * @returns 生成的密码
 */
export function generateStrongPassword(
  length: number,
  includeLower: boolean,
  includeUpper: boolean,
  includeNumbers: boolean,
  includeSymbols: boolean
): string {
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let allChars = '';
  let password = '';

  if (includeLower) {
    allChars += lowerChars;
    // 确保至少包含一个小写
    password += lowerChars[Math.floor(Math.random() * lowerChars.length)];
  }

  if (includeUpper) {
    allChars += upperChars;
    // 确保至少包含一个大写
    password += upperChars[Math.floor(Math.random() * upperChars.length)];
  }

  if (includeNumbers) {
    allChars += numberChars;
    // 确保至少包含一个数字
    password += numberChars[Math.floor(Math.random() * numberChars.length)];
  }

  if (includeSymbols) {
    allChars += symbolChars;
    // 确保至少包含一个特殊符号
    password += symbolChars[Math.floor(Math.random() * symbolChars.length)];
  }

  // 如果没有选择任何字符集，默认使用小写
  if (allChars === '') {
    allChars = lowerChars;
    password += lowerChars[Math.floor(Math.random() * lowerChars.length)];
  }

  // 填充剩余长度
  const remainingLength = length - password.length;
  // Using non-null assertion because allChars can't be empty here
  const cryptoObj = window.crypto;
  if (!cryptoObj) {
    // Fallback for browsers without crypto API (should not happen in modern browsers)
    for (let i = 0; i < remainingLength; i++) {
      const randomIndex = Math.floor(Math.random() * allChars.length);
      password += allChars[randomIndex]!;
    }
  } else {
    const randomArr = new Uint32Array(1);
    const cryptoNonNull = cryptoObj!;
    for (let i = 0; i < remainingLength; i++) {
      const randomValue = cryptoNonNull.getRandomValues(randomArr)[0]!;
      const randomIndex = Math.floor(randomValue % allChars.length);
      password += allChars[randomIndex]!;
    }
  }

  // 打乱密码顺序（Fisher-Yates 洗牌算法）
  const passwordArray = password.split('');
  if (!cryptoObj) {
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordArray[i], passwordArray[j]] = [passwordArray[j]!, passwordArray[i]!];
    }
  } else {
    const randomArr = new Uint32Array(1);
    const cryptoNonNull = cryptoObj!;
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const randomValue = cryptoNonNull.getRandomValues(randomArr)[0]!;
      const j = Math.floor(randomValue % (i + 1));
      [passwordArray[i], passwordArray[j]] = [passwordArray[j]!, passwordArray[i]!];
    }
  }

  return passwordArray.join('');
}
