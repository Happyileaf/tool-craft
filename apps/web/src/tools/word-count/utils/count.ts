export interface CountResult {
  characters: number;
  words: number;
  lines: number;
  paragraphs: number;
}

export function countWords(text: string): CountResult {
  if (!text) {
    return {
      characters: 0,
      words: 0,
      lines: 0,
      paragraphs: 0,
    };
  }

  const characters = text.length;
  const lines = text.split('\n').length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

  // Get all tokens including individual Chinese characters and English words
  const tokens = text.trim().match(/([\u4e00-\u9fa5]|[a-zA-Z0-9]+)/g) || [];
  const words = tokens.filter(token => token.length > 0).length;

  return {
    characters,
    words,
    lines,
    paragraphs,
  };
}
