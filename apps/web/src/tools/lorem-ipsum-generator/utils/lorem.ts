/**
 * Lorem Ipsum 占位文本生成纯函数集合。
 * 全部逻辑基于浏览器本地随机数，不触碰 DOM / React，也不发起任何网络请求。
 */

/** 生成计量单位：段落 / 句子 / 单词 */
export type LoremUnit = 'paragraph' | 'sentence' | 'word';

/** 生成选项 */
export interface LoremOptions {
  /** 计量单位，默认为段落 */
  unit?: LoremUnit;
  /** 生成数量，默认为 1；为 0 或负数时返回空串 */
  count?: number;
  /** 是否以经典「Lorem ipsum dolor sit amet...」开头，默认为 false */
  startWithClassic?: boolean;
}

/** 各计量单位允许的最大生成数量，避免极端输入导致卡顿 */
export const LOREM_MAX_COUNT: Record<LoremUnit, number> = {
  paragraph: 100,
  sentence: 500,
  word: 2000,
};

/** 经典拉丁词库 */
const WORD_BANK: string[] = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'eu',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
];

/** 经典开头词序列（对应 Lorem ipsum 起始词） */
const CLASSIC_WORDS: string[] = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
];

/** 经典开头完整句子 */
const CLASSIC_OPENING = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

/**
 * 生成 [min, max] 区间内的随机整数
 *
 * @param min - 下界（含）
 * @param max - 上界（含）
 * @returns 区间内随机整数
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 从词库中随机取一个单词
 *
 * @returns 随机单词
 */
function randomWord(): string {
  const index = randomInt(0, WORD_BANK.length - 1);
  return WORD_BANK[index] ?? 'lorem';
}

/**
 * 把单词首字母大写
 *
 * @param word - 待处理单词
 * @returns 首字母大写后的单词
 */
function capitalize(word: string): string {
  if (word === '') return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * 由随机单词拼出一个句子（句首大写、句末带句号）
 *
 * @returns 生成的句子
 */
function randomSentence(): string {
  const wordCount = randomInt(6, 12);
  const words: string[] = [];
  for (let index = 0; index < wordCount; index += 1) {
    words.push(randomWord());
  }
  const first = words[0];
  if (first !== undefined) {
    words[0] = capitalize(first);
  }
  return `${words.join(' ')}.`;
}

/**
 * 按单词数量生成文本
 *
 * @param count - 目标单词数量
 * @param startWithClassic - 是否以经典开头词起始
 * @returns 以空格分隔的单词文本
 */
function buildWords(count: number, startWithClassic: boolean): string {
  const words: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const classic = startWithClassic ? CLASSIC_WORDS[index] : undefined;
    words.push(classic ?? randomWord());
  }
  const first = words[0];
  if (first !== undefined) {
    words[0] = capitalize(first);
  }
  return words.join(' ');
}

/**
 * 按句子数量生成文本
 *
 * @param count - 目标句子数量
 * @param startWithClassic - 首句是否使用经典开头
 * @returns 以空格连接的句群文本
 */
function buildSentences(count: number, startWithClassic: boolean): string {
  const sentences: string[] = [];
  for (let index = 0; index < count; index += 1) {
    if (index === 0 && startWithClassic) {
      sentences.push(CLASSIC_OPENING);
    } else {
      sentences.push(randomSentence());
    }
  }
  return sentences.join(' ');
}

/**
 * 按段落数量生成文本
 *
 * @param count - 目标段落数量
 * @param startWithClassic - 首段首句是否使用经典开头
 * @returns 以空行分隔的段落文本
 */
function buildParagraphs(count: number, startWithClassic: boolean): string {
  const paragraphs: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const sentenceCount = randomInt(3, 6);
    const sentences: string[] = [];
    for (let inner = 0; inner < sentenceCount; inner += 1) {
      if (index === 0 && inner === 0 && startWithClassic) {
        sentences.push(CLASSIC_OPENING);
      } else {
        sentences.push(randomSentence());
      }
    }
    paragraphs.push(sentences.join(' '));
  }
  return paragraphs.join('\n\n');
}

/**
 * 生成 Lorem Ipsum 占位文本
 *
 * @param options - 生成选项
 * @returns 纯文本占位内容；数量为 0 或负数时返回空串
 */
export function generateLorem(options: LoremOptions = {}): string {
  const unit = options.unit ?? 'paragraph';
  const rawCount = Math.floor(options.count ?? 1);
  const count = Number.isFinite(rawCount)
    ? Math.min(Math.max(rawCount, 0), LOREM_MAX_COUNT[unit])
    : 0;
  if (count === 0) return '';

  const startWithClassic = options.startWithClassic ?? false;
  if (unit === 'word') return buildWords(count, startWithClassic);
  if (unit === 'sentence') return buildSentences(count, startWithClassic);
  return buildParagraphs(count, startWithClassic);
}
