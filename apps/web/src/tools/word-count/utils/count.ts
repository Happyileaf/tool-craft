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

  // 分词统计：按空格、标点等分隔，统计非空单词数量
  const words = text.trim()
    .split(/[\s\n\r\t.,!?;：；。，！？、]+/)
    .filter(word => word.length > 0)
    .length;

  return {
    characters,
    words,
    lines,
    paragraphs,
  };
}
