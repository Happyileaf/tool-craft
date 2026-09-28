/**
 * URL 编码 (encodeURIComponent 版本)
 */
export function urlEncode(input: string): string {
  return encodeURIComponent(input);
}

/**
 * URL 解码
 */
export function urlDecode(input: string): string {
  return decodeURIComponent(input);
}

/**
 * 对整个 URL 进行编码 (使用 encodeURI)
 */
export function fullUrlEncode(input: string): string {
  return encodeURI(input);
}

/**
 * 对整个 URL 进行解码
 */
export function fullUrlDecode(input: string): string {
  return decodeURI(input);
}
