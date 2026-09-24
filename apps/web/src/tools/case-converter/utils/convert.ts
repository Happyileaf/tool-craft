import { CaseType } from '../constants';

/**
 * 将输入文本分词，分割成单词数组
 */
function tokenize(text: string): string[] {
  // 先处理常见分隔符，分割成单词
  let words: string[] = [];

  // 按换行分割处理多行
  const lines = text.split('\n');
  for (const line of lines) {
    // 处理 snake_case, kebab-case, CONSTANT_CASE
    const parts = line.split(/[-_]/);
    for (const part of parts) {
      if (!part) continue;
      // 处理 camelCase/PascalCase 分词
      // 在大写字母前分割
      const camelParts = part.split(/(?=[A-Z])/);
      words.push(...camelParts);
    }
  }

  // 转小写并过滤空字符串
  words = words
    .map(w => w.toLowerCase().trim())
    .filter(w => w.length > 0);

  return words;
}

/**
 * 转换为指定格式
 */
export function convertCase(text: string, targetCase: CaseType): string {
  const words = tokenize(text);
  if (words.length === 0) return '';

  switch (targetCase) {
    case CaseType.CAMEL:
      return words[0].toLowerCase() + words.slice(1).map(capitalizeFirst).join('');
    case CaseType.PASCAL:
      return words.map(capitalizeFirst).join('');
    case CaseType.SNAKE:
      return words.join('_');
    case CaseType.KEBAB:
      return words.join('-');
    case CaseType.CONSTANT:
      return words.map(w => w.toUpperCase()).join('_');
    case CaseType.SENTENCE:
      return words.join(' ');
    case CaseType.TITLE:
      return words.map(capitalizeFirst).join(' ');
    default:
      return text;
  }
}

function capitalizeFirst(word: string): string {
  if (!word) return word;
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}
