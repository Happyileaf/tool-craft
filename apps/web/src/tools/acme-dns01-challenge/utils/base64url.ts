/**
 * Base64URL（RFC 4648 §5）编解码纯函数，无填充（不输出 `=`）。
 * 与 ACME / JWK 规范一致：`+` → `-`、`/` → `_`，去除 `=` padding。
 */

export class Base64UrlError extends Error {}

const BASE64_PADDED = /^[A-Za-z0-9+/]*={0,2}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]*$/;

/** 字节数组 → 无填充 Base64URL 字符串 */
export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 无填充 Base64URL 字符串 → 字节数组。
 * 兼容标准 Base64（含 `+`/`/`/`=`），但拒绝含空白或其他非法字符的输入。
 */
export function base64UrlDecode(input: string): Uint8Array {
  const text = input.trim();
  if (!text) {
    throw new Base64UrlError('Base64URL 输入为空');
  }
  const isUrlSafe = !text.includes('+') && !text.includes('/') && !text.includes('=');
  if (isUrlSafe) {
    if (!BASE64URL_PATTERN.test(text)) {
      throw new Base64UrlError('Base64URL 字符串包含字母表之外的字符');
    }
  } else if (!BASE64_PADDED.test(text)) {
    throw new Base64UrlError('标准 Base64 字符串包含字母表之外的字符');
  }
  const standard = text.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard.padEnd(Math.ceil(standard.length / 4) * 4, '=');
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Base64UrlError('Base64URL 格式非法，无法解码');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** 判断字符串是否为合法的无填充 Base64URL（仅 A-Z a-z 0-9 - _，且非空） */
export function isBase64Url(input: string): boolean {
  return input.length > 0 && BASE64URL_PATTERN.test(input);
}
