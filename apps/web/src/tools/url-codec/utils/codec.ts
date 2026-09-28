/**
 * URL 编码（encodeURIComponent）
 * @param text 原始文本
 * @returns 编码后的文本
 */
export function encodeUrl(text: string): string {
  return encodeURIComponent(text);
}

/**
 * URL 解码（decodeURIComponent）
 * @param text 编码后的文本
 * @returns 解码后的文本
 */
export function decodeUrl(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch (e) {
    throw new Error('解码失败：' + (e as Error).message);
  }
}

/**
 * 完整 URI 编码（encodeURI）
 * @param uri 原始 URI
 * @returns 编码后的 URI
 */
export function encodeUri(uri: string): string {
  return encodeURI(uri);
}

/**
 * 完整 URI 解码（decodeURI）
 * @param uri 编码后的 URI
 * @returns 解码后的 URI
 */
export function decodeUri(uri: string): string {
  try {
    return decodeURI(uri);
  } catch (e) {
    throw new Error('解码失败：' + (e as Error).message);
  }
}
