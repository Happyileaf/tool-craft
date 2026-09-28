const entityMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

const reverseEntityMap: Record<string, string> = Object.entries(entityMap).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {} as Record<string, string>);

/**
 * HTML entity encode a string
 */
export function encodeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => entityMap[char]!);
}

/**
 * HTML entity decode a string
 */
export function decodeHtml(str: string): string {
  // Decode entities - first handle named entities, then numeric if needed
  let result = str;
  for (const [entity, char] of Object.entries(reverseEntityMap)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }
  // Handle numeric entities like &#123; or &#x123;
  result = result.replace(/&#(\d+);/g, (_, dec: string) => String.fromCharCode(parseInt(dec, 10)));
  result = result.replace(/&#x([a-fA-F0-9]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
  return result;
}