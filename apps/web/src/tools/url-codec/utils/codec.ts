/**
 * Encode URI component
 */
export function encodeUriComponent(str: string): string {
  return encodeURIComponent(str);
}

/**
 * Decode URI component
 */
export function decodeUriComponent(str: string): string {
  return decodeURIComponent(str);
}

/**
 * Encode complete URI
 */
export function encodeUri(str: string): string {
  return encodeURI(str);
}

/**
 * Decode complete URI
 */
export function decodeUri(str: string): string {
  return decodeURI(str);
}
