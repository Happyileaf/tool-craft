/**
 * 凯撒密码（Caesar cipher）与 ROT13 的纯函数实现，不依赖 DOM 与 React。
 * 仅对 A–Z / a–z 英文字母做循环位移，其余字符原样保留；
 * 位移量统一按 26 取模归一化，支持任意整数（含负数与超过 26 的值）。
 */

/** 一个字母表周期长度 */
export const ALPHABET_SIZE = 26;

/** ROT13 特例的位移量（加解密同一变换） */
export const ROT13_SHIFT = 13;

/** 允许在界面上选择的最小位移量 */
export const MIN_SHIFT = 0;

/** 允许在界面上选择的最大位移量 */
export const MAX_SHIFT = 25;

/**
 * 把任意整数位移量归一化到 0–25
 *
 * @param shift - 原始位移量
 * @returns 归一化后的非负位移量
 */
export function normalizeShift(shift: number): number {
  return ((Math.trunc(shift) % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
}

/**
 * 对单个英文字母按字母表循环位移，非字母字符原样返回。
 *
 * @param char - 待位移的单个字符
 * @param shift - 已归一化的位移量（0–25）
 * @returns 位移后的字符
 */
function shiftChar(char: string, shift: number): string {
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return String.fromCharCode(65 + ((code - 65 + shift) % ALPHABET_SIZE));
  }
  if (code >= 97 && code <= 122) {
    return String.fromCharCode(97 + ((code - 97 + shift) % ALPHABET_SIZE));
  }
  return char;
}

/**
 * 对文本执行凯撒位移。
 * 加密方向为正向位移；传入负值（或 26 - shift）即为解密。
 * 非英文字母（数字、标点、空白、CJK 等）原样保留，大小写保持不变。
 *
 * @param text - 原始文本
 * @param shift - 位移量（任意整数，内部按 26 取模）
 * @returns 位移后的文本；输入为空串时返回空串
 */
export function caesarShift(text: string, shift: number): string {
  if (text.length === 0) {
    return '';
  }
  const normalized = normalizeShift(shift);
  let output = '';
  for (const char of text) {
    output += shiftChar(char, normalized);
  }
  return output;
}

/**
 * 凯撒加密：字母沿字母表正移 shift 位
 *
 * @param text - 明文
 * @param shift - 位移量
 * @returns 密文
 */
export function caesarEncrypt(text: string, shift: number): string {
  return caesarShift(text, shift);
}

/**
 * 凯撒解密：字母沿字母表反移 shift 位
 *
 * @param text - 密文
 * @param shift - 加密时使用的位移量
 * @returns 明文
 */
export function caesarDecrypt(text: string, shift: number): string {
  return caesarShift(text, -shift);
}

/**
 * 执行 ROT13 变换（位移 13）。两次变换互为逆运算。
 *
 * @param text - 原始文本
 * @returns ROT13 变换后的文本
 */
export function rot13(text: string): string {
  return caesarShift(text, ROT13_SHIFT);
}
