/**
 * 维吉尼亚（Vigenère）多表替换密码的纯函数实现，不依赖 DOM 与 React。
 * 关键词只取 A–Z / a–z 字母（大小写不敏感）并按字母循环复用；
 * 仅对文本中的英文字母做位移，其余字符（数字、标点、空白、CJK 等）
 * 原样保留且不消耗密钥位；原字母大小写保持不变。
 */

export const ALPHABET_SIZE = 26;

export interface VigenereResult {
  text: string | null;
  error: string | null;
}

/**
 * 将密钥规范化为 0–25 的位移序列（仅保留字母，大小写不敏感）。
 *
 * @param key - 原始密钥
 * @returns 位移序列；密钥不含任何字母时返回 null
 */
export function normalizeKey(key: string): number[] | null {
  const shifts: number[] = [];
  for (const char of key) {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      shifts.push(code - 65);
    } else if (code >= 97 && code <= 122) {
      shifts.push(code - 97);
    }
  }
  return shifts.length > 0 ? shifts : null;
}

/**
 * 对单个英文字母施加给定位移，非字母字符原样返回。
 *
 * @param char - 待变换的单个字符
 * @param shift - 位移量（0–25）
 * @param decrypt - 为 true 时反向位移
 * @returns 变换后的字符
 */
function transformChar(char: string, shift: number, decrypt: boolean): string {
  const code = char.charCodeAt(0);
  const delta = decrypt ? ALPHABET_SIZE - shift : shift;
  if (code >= 65 && code <= 90) {
    return String.fromCharCode(65 + ((code - 65 + delta) % ALPHABET_SIZE));
  }
  if (code >= 97 && code <= 122) {
    return String.fromCharCode(97 + ((code - 97 + delta) % ALPHABET_SIZE));
  }
  return char;
}

/**
 * 执行维吉尼亚加 / 解密。
 *
 * @param text - 明文（加密）或密文（解密）
 * @param key - 关键词，仅其中字母参与位移并循环复用
 * @param decrypt - 是否解密方向，默认 false
 * @returns 变换结果；密钥无字母时返回带错误信息的结果
 */
export function vigenere(text: string, key: string, decrypt = false): VigenereResult {
  if (text.length === 0) {
    return { text: '', error: null };
  }

  const shifts = normalizeKey(key);
  if (shifts === null) {
    return { text: null, error: '密钥必须至少包含一个英文字母（A–Z）。' };
  }

  let output = '';
  let keyIndex = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    const isLetter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    if (isLetter) {
      const shift = shifts[keyIndex % shifts.length] ?? 0;
      output += transformChar(char, shift, decrypt);
      keyIndex += 1;
    } else {
      output += char;
    }
  }

  return { text: output, error: null };
}

/**
 * 维吉尼亚加密：Ci = (Pi + Ki) mod 26
 *
 * @param plaintext - 明文
 * @param key - 关键词
 * @returns 加密结果
 */
export function vigenereEncrypt(plaintext: string, key: string): VigenereResult {
  return vigenere(plaintext, key, false);
}

/**
 * 维吉尼亚解密：Pi = (Ci - Ki) mod 26
 *
 * @param ciphertext - 密文
 * @param key - 关键词
 * @returns 解密结果
 */
export function vigenereDecrypt(ciphertext: string, key: string): VigenereResult {
  return vigenere(ciphertext, key, true);
}
