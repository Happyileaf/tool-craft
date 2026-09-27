export type CaseType = 'lowercase' | 'uppercase' | 'capitalize' | 'title' | 'sentence';

export function convertCase(text: string, caseType: CaseType): string {
  switch (caseType) {
    case 'lowercase':
      return text.toLowerCase();
    case 'uppercase':
      return text.toUpperCase();
    case 'capitalize':
      return capitalizeFirstLetter(text);
    case 'title':
      return toTitleCase(text);
    case 'sentence':
      return toSentenceCase(text);
    default:
      return text;
  }
}

function capitalizeFirstLetter(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word)
    .map(word => capitalizeFirstLetter(word))
    .join(' ');
}

function toSentenceCase(text: string): string {
  const sentences = text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .filter(sentence => sentence.trim());

  return sentences
    .map(sentence => {
      const trimmed = sentence.trim();
      if (!trimmed) return trimmed;
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    })
    .join(' ');
}
