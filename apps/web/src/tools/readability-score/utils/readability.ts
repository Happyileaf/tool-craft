/**
 * 英文文本可读性评分核心逻辑：
 * 句子 / 单词 / 启发式音节计数与 Flesch、Flesch–Kincaid 公式，纯函数零依赖，仅支持英文。
 */

/** 可读性分析结果 */
export interface ReadabilityResult {
  /** 句子数 */
  sentences: number;
  /** 单词数 */
  words: number;
  /** 音节总数 */
  syllables: number;
  /** 平均句长 ASL（词 / 句） */
  averageSentenceLength: number;
  /** 平均每词音节数 ASY（音节 / 词） */
  averageSyllablesPerWord: number;
  /** Flesch Reading Ease（0–100 常见区间，短文本可超出） */
  readingEase: number;
  /** Flesch–Kincaid Grade Level（可能为负或超过 12） */
  gradeLevel: number;
}

/** 单词切分：字母与撇号 / 连字符组成的序列 */
const WORD_PATTERN = /[A-Za-z'’-]+/g;

const VOWELS = 'aeiouy';

/**
 * 切分句子：在 . ! ? 后接空白处切分；仅统计含字母单词的片段。
 * 小数（如 3.14，标点后无空白）不会被切开。
 *
 * @param text - 原始英文文本
 * @returns 有效句子数
 */
export function countSentences(text: string): number {
  const segments = text
    .split(/(?<=[.!?])\s+/)
    .map((segment) => segment.trim())
    .filter((segment) => /[A-Za-z]/.test(segment));
  return segments.length;
}

/**
 * 切分单词：撇号 / 连字符词（don't、well-known）整体计为 1 个；
 * 纯标点匹配（如独立的连字符）会被剔除。
 *
 * @param text - 原始英文文本
 * @returns 小写化后的单词数组
 */
export function tokenizeWords(text: string): string[] {
  return (text.match(WORD_PATTERN) ?? [])
    .map((word) => word.toLowerCase())
    .filter((word) => /[a-z]/.test(word));
}

/**
 * 基于固定启发式规则的单词音节计数（不依赖词典，每词至少 1 音节）：
 * 连续元音组（含 y）计 1；词尾静默 e 减 1，但「辅音 + le」保留；
 * 静默 -ed / -es（前邻非 t/d、s/x/z 等）减 1。
 *
 * @param input - 单个单词
 * @returns 估计音节数
 */
export function countSyllables(input: string): number {
  const word = input.toLowerCase().replace(/[^a-z]/g, '');
  if (word === '') {
    return 0;
  }

  let groups = 0;
  let previousVowel = false;
  for (const char of word) {
    const isVowel = VOWELS.includes(char);
    if (isVowel && !previousVowel) {
      groups += 1;
    }
    previousVowel = isVowel;
  }

  // 辅音 + le 自成音节，词尾 e 不静默；其余词尾静默 e 减 1
  if (word.endsWith('e') && !(word.endsWith('le') && word.length > 2 && !VOWELS.includes(word[word.length - 3]!))) {
    groups -= 1;
  }

  // 静默屈折后缀 -ed（started / needed 等 t、d 前保留）
  if (word.endsWith('ed') && word.length > 2 && !'td'.includes(word[word.length - 3]!)) {
    groups -= 1;
  }

  // 静默屈折后缀 -es（buses / cases 等 s、x、z 前保留）
  if (word.endsWith('es') && word.length > 2 && !'sxz'.includes(word[word.length - 3]!)) {
    groups -= 1;
  }

  return Math.max(1, groups);
}

/**
 * 计算英文文本的可读性指标；无单词时返回 null（调用方提示「文本过短」）。
 *
 * @param text - 原始英文文本
 * @returns 指标结果；文本过短无法计算时返回 null
 */
export function analyzeReadability(text: string): ReadabilityResult | null {
  const words = tokenizeWords(text);
  if (words.length === 0) {
    return null;
  }

  const sentences = Math.max(1, countSentences(text));
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const averageSentenceLength = words.length / sentences;
  const averageSyllablesPerWord = syllables / words.length;
  const readingEase =
    206.835 -
    1.015 * averageSentenceLength -
    84.6 * averageSyllablesPerWord;
  const gradeLevel =
    0.39 * averageSentenceLength +
    11.8 * averageSyllablesPerWord -
    15.59;

  return {
    sentences,
    words: words.length,
    syllables,
    averageSentenceLength,
    averageSyllablesPerWord,
    readingEase,
    gradeLevel,
  };
}

/** Flesch Reading Ease 分级 */
export interface ReadingEaseBand {
  /** 等级英文短名 */
  label: string;
  /** 等级中文说明 */
  description: string;
  /** 对应学龄（中文） */
  schoolLevel: string;
  /** antd 进度条状态色 token */
  color: string;
}

/**
 * 按 Flesch Reading Ease 分值映射等级（90+ 至 30 以下共 7 档）。
 *
 * @param score - Reading Ease 分值
 * @returns 分级文案
 */
export function getReadingEaseBand(score: number): ReadingEaseBand {
  if (score >= 90) {
    return {
      label: 'Very Easy',
      description: '非常容易',
      schoolLevel: '约 5 年级',
      color: '#52c41a',
    };
  }
  if (score >= 80) {
    return {
      label: 'Easy',
      description: '容易',
      schoolLevel: '约 6 年级',
      color: '#73d13d',
    };
  }
  if (score >= 70) {
    return {
      label: 'Fairly Easy',
      description: '较容易',
      schoolLevel: '约 7 年级',
      color: '#a0d911',
    };
  }
  if (score >= 60) {
    return {
      label: 'Plain English',
      description: '通俗英文（8–9 年级可流畅阅读）',
      schoolLevel: '约 8–9 年级',
      color: '#faad14',
    };
  }
  if (score >= 50) {
    return {
      label: 'Fairly Difficult',
      description: '较难',
      schoolLevel: '约 10–12 年级',
      color: '#fa8c16',
    };
  }
  if (score >= 30) {
    return {
      label: 'Difficult',
      description: '困难',
      schoolLevel: '大学水平',
      color: '#f5222d',
    };
  }
  return {
    label: 'Very Confusing',
    description: '非常晦涩',
    schoolLevel: '大学毕业生水平',
    color: '#a8071a',
  };
}

/**
 * 把 Flesch–Kincaid 年级值转成可读学龄文案（负数与超 12 做端点说明）。
 *
 * @param grade - 年级值
 * @returns 学龄说明
 */
export function describeGradeLevel(grade: number): string {
  if (grade < 1) {
    return '低于 1 年级（幼儿也能读）';
  }
  if (grade <= 12) {
    return `约美国 ${grade.toFixed(1)} 年级`;
  }
  return `大学阶段（年级值 ${grade.toFixed(1)}）`;
}
