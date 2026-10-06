export type ConvertDirection = 'encode' | 'decode';

const htmlEntities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#47;',
  '`': '&#96;',
  '=': '&#61;',
  ' ': '&nbsp;',
};

const reverseEntities: Record<string, string> = {};
for (const [char, entity] of Object.entries(htmlEntities)) {
  reverseEntities[entity] = char;
}

export const encode = (text: string): string => {
  return text.replace(/[&<>"'`=\\/ ]/g, char => htmlEntities[char as keyof typeof htmlEntities]);
};

export const decode = (text: string): string => {
  // Decode named entities
  let result = text;
  for (const [entity, char] of Object.entries(reverseEntities)) {
    result = result.replaceAll(entity, char);
  }
  // Decode decimal entities like &#39;
  result = result.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  // Decode hex entities like &#x27;
  result = result.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return result;
};
