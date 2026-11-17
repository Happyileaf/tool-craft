import {
  HONGKONG_PHRASE_MAP,
  PHRASE_S2T,
  S2T_CHAR_MAP,
  TAIWAN_PHRASE_MAP,
} from '../constants';

/** 地区用词变体：通用繁体、台湾用词、香港用词 */
export type Variant = 'standard' | 'taiwan' | 'hongkong';

/** 转换方向 */
export type Direction = 's2t' | 't2s';

/** 单条转换统计 */
export interface ConvertStat {
  /** 发生替换的字符 / 词组次数（按替换事件计数） */
  replacements: number;
  /** 输入总字符数（按码点计） */
  inputLength: number;
  /** 输出总字符数（按码点计） */
  outputLength: number;
}

/** 转换结果 */
export interface ConvertResult {
  text: string;
  stat: ConvertStat;
}

/**
 * 由简体→繁体映射反向构造繁体→简体映射。
 *
 * 反向映射遇到一对多（如 發/髮 都映射自发）时保留首个来源，
 * 因此繁体转简体是「合并式」转换，符合简繁关系的固有不对称性。
 */
function buildReverseMap(map: Record<string, string>): Record<string, string> {
  const reverse: Record<string, string> = {};
  for (const [simple, traditional] of Object.entries(map)) {
    if (!(traditional in reverse)) {
      reverse[traditional] = simple;
    }
  }
  return reverse;
}

const T2S_CHAR_MAP = buildReverseMap(S2T_CHAR_MAP);
const PHRASE_T2S = buildReverseMap(PHRASE_S2T);
const TAIWAN_TO_STANDARD = buildReverseMap(TAIWAN_PHRASE_MAP);
const HK_TO_STANDARD = buildReverseMap(HONGKONG_PHRASE_MAP);

/** 按码点切分字符串（兼容代理对） */
function toCodePoints(text: string): string[] {
  return Array.from(text);
}

/**
 * 对文本做最长匹配的词组替换。
 *
 * @param text - 原始文本
 * @param phraseMap - 词组映射（键长度不一，运行时按最长键优先匹配）
 * @returns 替换后的文本与替换事件次数
 */
function replacePhrases(text: string, phraseMap: Record<string, string>): { text: string; count: number } {
  const keys = Object.keys(phraseMap).sort((a, b) => b.length - a.length);
  if (keys.length === 0) {
    return { text, count: 0 };
  }
  const maxLen = keys[0].length;
  const lookup = new Set(keys);
  const chars = toCodePoints(text);
  const output: string[] = [];
  let count = 0;

  for (let i = 0; i < chars.length; ) {
    let matched = '';
    const upper = Math.min(maxLen, chars.length - i);
    for (let len = upper; len >= 1; len -= 1) {
      const candidate = chars.slice(i, i + len).join('');
      if (lookup.has(candidate)) {
        matched = candidate;
        break;
      }
    }
    if (matched) {
      const replacement = phraseMap[matched] ?? matched;
      output.push(replacement);
      if (replacement !== matched) {
        count += 1;
      }
      i += Array.from(matched).length;
    } else {
      output.push(chars[i] ?? '');
      i += 1;
    }
  }

  return { text: output.join(''), count };
}

/**
 * 按码点逐字做单字映射，未命中的字符原样保留。
 */
function mapChars(text: string, charMap: Record<string, string>): { text: string; count: number } {
  let count = 0;
  const output = toCodePoints(text)
    .map((ch) => {
      const mapped = charMap[ch];
      if (mapped !== undefined && mapped !== ch) {
        count += 1;
        return mapped;
      }
      return ch;
    })
    .join('');
  return { text: output, count };
}

/**
 * 简体 → 繁体转换。
 *
 * 流程：地区用词替换（简体键 → 地区繁体值，先于单字映射）→
 * 词组级最长匹配（消解 发/面 等歧义）→ 单字级兜底。
 */
export function simplifyToTraditional(text: string, variant: Variant = 'standard'): ConvertResult {
  let working = text;
  let regionalCount = 0;
  if (variant === 'taiwan') {
    const r = replacePhrases(working, TAIWAN_PHRASE_MAP);
    working = r.text;
    regionalCount = r.count;
  } else if (variant === 'hongkong') {
    const r = replacePhrases(working, HONGKONG_PHRASE_MAP);
    working = r.text;
    regionalCount = r.count;
  }

  const phraseStep = replacePhrases(working, PHRASE_S2T);
  const charStep = mapChars(phraseStep.text, S2T_CHAR_MAP);

  return {
    text: charStep.text,
    stat: {
      replacements: regionalCount + phraseStep.count + charStep.count,
      inputLength: Array.from(text).length,
      outputLength: Array.from(charStep.text).length,
    },
  };
}

/**
 * 繁体 → 简体转换。
 *
 * 流程：地区用词先归一为通用繁体 → 词组级最长匹配 → 单字级兜底。
 * 繁体一对多的歧义在反向时合并为单一简体字形，这是简繁转换的固有特性。
 */
export function traditionalToSimplify(text: string, variant: Variant = 'standard'): ConvertResult {
  let working = text;
  let count = 0;

  if (variant === 'taiwan') {
    const r = replacePhrases(working, TAIWAN_TO_STANDARD);
    working = r.text;
    count += r.count;
  } else if (variant === 'hongkong') {
    const r = replacePhrases(working, HK_TO_STANDARD);
    working = r.text;
    count += r.count;
  }

  const phraseStep = replacePhrases(working, PHRASE_T2S);
  const charStep = mapChars(phraseStep.text, T2S_CHAR_MAP);

  return {
    text: charStep.text,
    stat: {
      replacements: count + phraseStep.count + charStep.count,
      inputLength: Array.from(text).length,
      outputLength: Array.from(charStep.text).length,
    },
  };
}

/** 统一入口：按方向与地区变体执行转换 */
export function convertChinese(
  text: string,
  direction: Direction,
  variant: Variant = 'standard',
): ConvertResult {
  return direction === 's2t'
    ? simplifyToTraditional(text, variant)
    : traditionalToSimplify(text, variant);
}
