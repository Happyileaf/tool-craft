/**
 * 文本词频统计：分词、停用词过滤、排序、Top N 与 CSV 导出
 */

/** 分词模式 */
export type TokenizeMode = 'latin' | 'cjk-chars' | 'cjk-bigrams';

/** 单个词条的统计结果 */
export interface WordCount {
  /** 词条 */
  word: string;
  /** 出现次数 */
  count: number;
  /** 占总词次的频率（0–1） */
  frequency: number;
}

/** 排序方式 */
export type SortOrder = 'count-desc' | 'count-asc' | 'alpha';

/** 内置英文停用词 */
const DEFAULT_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in',
  'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the',
  'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will',
  'with',
]);

/** CJK 统一表意文字（含常用扩展 A 区与兼容汉字） */
const CJK_PATTERN = /[㐀-䶿一-鿿豈-﫿]/;

/**
 * 判断字符是否为 CJK 汉字
 *
 * @param char - 单字符
 * @returns 是否为汉字
 */
function isCJK(char: string): boolean {
  return CJK_PATTERN.test(char);
}

/**
 * 从文本中切分词条
 *
 * - latin：拉丁字母 / 数字组成的词（Unicode 感知，下划线连字）
 * - cjk-chars：拉丁词 + 逐字汉字
 * - cjk-bigrams：拉丁词 + 汉字二元组（相邻汉字组成 2 字词）
 *
 * @param text - 原始文本
 * @param mode - 分词模式
 * @returns 词条序列（小写拉丁词）
 */
export function tokenize(text: string, mode: TokenizeMode): string[] {
  const tokens: string[] = [];
  const latinPattern = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
  let match: RegExpExecArray | null;
  while ((match = latinPattern.exec(text)) !== null) {
    const word = match[0];
    // 汉字由 CJK 分支单独处理，避免整段中文被当作一个拉丁词
    if (word !== undefined && /\p{L}/u.test(word) && !/\p{Script=Han}/u.test(word)) {
      tokens.push(word.toLowerCase());
    }
  }

  if (mode === 'latin') {
    return tokens;
  }

  const cjkChars: string[] = [];
  for (const char of text) {
    if (isCJK(char)) {
      cjkChars.push(char);
    }
  }

  if (mode === 'cjk-chars') {
    return [...tokens, ...cjkChars];
  }

  // cjk-bigrams：单字文本退化为单字词
  const cjkTokens: string[] = [];
  if (cjkChars.length === 1) {
    cjkTokens.push(cjkChars[0] as string);
  } else {
    for (let i = 0; i + 1 < cjkChars.length; i += 1) {
      cjkTokens.push((cjkChars[i] as string) + (cjkChars[i + 1] as string));
    }
  }
  return [...tokens, ...cjkTokens];
}

/**
 * 解析自定义停用词（逗号 / 空白分隔）
 *
 * @param raw - 停用词输入
 * @returns 停用词集合（拉丁词转小写）
 */
export function parseStopWords(raw: string): Set<string> {
  return new Set(
    raw
      .split(/[,\s]+/)
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length > 0),
  );
}

/**
 * 统计词频
 *
 * @param text - 原始文本
 * @param options - 统计选项
 * @param options.mode - 分词模式
 * @param options.useDefaultStopWords - 是否启用内置英文停用词
 * @param options.customStopWords - 自定义停用词集合
 * @param options.minLength - 最短词长（含），默认 1
 * @returns 排序前的词条统计与总词次
 */
export function countWords(
  text: string,
  options: {
    mode: TokenizeMode;
    useDefaultStopWords?: boolean;
    customStopWords?: Set<string>;
    minLength?: number;
  },
): { words: WordCount[]; totalTokens: number } {
  const { mode, useDefaultStopWords = true, customStopWords, minLength = 1 } = options;
  const tokens = tokenize(text, mode).filter((token) => {
    if (token.length < minLength) {
      return false;
    }
    if (useDefaultStopWords && DEFAULT_STOP_WORDS.has(token)) {
      return false;
    }
    if (customStopWords && customStopWords.has(token)) {
      return false;
    }
    return true;
  });
  const counts = new Map<string, number>();
  const totalTokens = tokens.length;

  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const words: WordCount[] = [];
  counts.forEach((count, word) => {
    words.push({ word, count, frequency: totalTokens > 0 ? count / totalTokens : 0 });
  });
  return { words, totalTokens };
}

/**
 * 排序并截取 Top N
 *
 * @param words - 词条统计
 * @param order - 排序方式
 * @param limit - 返回条数上限（0 = 全部）
 * @returns 处理后的词条列表
 */
export function sortWords(words: WordCount[], order: SortOrder, limit = 0): WordCount[] {
  const sorted = [...words];
  if (order === 'count-desc') {
    sorted.sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
  } else if (order === 'count-asc') {
    sorted.sort((a, b) => a.count - b.count || a.word.localeCompare(b.word));
  } else {
    sorted.sort((a, b) => a.word.localeCompare(b.word));
  }
  return limit > 0 ? sorted.slice(0, limit) : sorted;
}

/**
 * 将词频结果导出为 CSV（RFC 4180 风格转义）
 *
 * @param words - 词条统计
 * @returns CSV 文本
 */
export function toCsv(words: WordCount[]): string {
  const escape = (value: string): string => {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  const lines = ['word,count,frequency'];
  for (const item of words) {
    lines.push(`${escape(item.word)},${item.count},${item.frequency.toFixed(6)}`);
  }
  return lines.join('\n');
}
