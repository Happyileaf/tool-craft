import { HTML_ENTITY_MAP, REVERSE_HTML_ENTITY_MAP } from '../constants';

/**
 * Encode HTML special characters to entities
 */
export function encodeHtmlEntities(html: string): string {
  return html.replace(/[&<>"']/g, (char) => HTML_ENTITY_MAP[char] || char);
}

/**
 * Decode HTML entities to original characters
 */
export function decodeHtmlEntities(encoded: string): string {
  let result = encoded;
  for (const [entity, char] of Object.entries(REVERSE_HTML_ENTITY_MAP)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }
  return result;
}
