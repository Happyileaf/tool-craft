/**
 * URL encode a string
 */
export function encodeUrl(input: string): string {
  return encodeURIComponent(input);
}

/**
 * URL decode a string
 */
export function decodeUrl(encoded: string): string {
  return decodeURIComponent(encoded);
}