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

const reverseEntityMap: Record<string, string> = Object.entries(entityMap).reduce(
  (acc, [char, entity]) => {
    acc[entity] = char;
    return acc;
  },
  {},
);

export function encodeHtml(value: string): string {
  return value.replace(/[&<>"'`=/]/g, (char) => entityMap[char]);
}

export function decodeHtml(value: string): string {
  let result = value;
  // eslint-disable-next-line no-restricted-syntax
  for (const [entity, char] of Object.entries(reverseEntityMap)) {
    result = result.replaceAll(entity, char);
  }
  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(Number(dec)));
  result = result.replace(/&#x([0-9a-f]+);/gi, (_match, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  return result;
}
