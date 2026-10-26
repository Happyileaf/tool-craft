/**
 * NATO 音标字母（International Radiotelephony Spelling Alphabet, ITU/ICAO）
 * 双向转换的纯函数实现，不依赖 DOM 与 React。
 * 编码把 A–Z、0–9 逐字符拼写为标准单词，解码按单词边界（空白或斜杠）还原；
 * 解码同时兼容常见异写 Alfa/Alpha、Juliett/Juliet。
 */

import { WORD_SEPARATOR } from '../constants';

/** 单个字符的音标拼写表（A–Z 与 0–9，共 36 项） */
export const NATO_TABLE: Readonly<Record<string, string>> = {
  A: 'Alfa',
  B: 'Bravo',
  C: 'Charlie',
  D: 'Delta',
  E: 'Echo',
  F: 'Foxtrot',
  G: 'Golf',
  H: 'Hotel',
  I: 'India',
  J: 'Juliett',
  K: 'Kilo',
  L: 'Lima',
  M: 'Mike',
  N: 'November',
  O: 'Oscar',
  P: 'Papa',
  Q: 'Quebec',
  R: 'Romeo',
  S: 'Sierra',
  T: 'Tango',
  U: 'Uniform',
  V: 'Victor',
  W: 'Whiskey',
  X: 'X-ray',
  Y: 'Yankee',
  Z: 'Zulu',
  '0': 'Zero',
  '1': 'One',
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Niner',
};

/**
 * 解码时可接受的异写 → 标准单词。
 * Alfa/Alpha 是 ICAO 规范拼写与常见美式写法之差；
 * Juliett 是规范双 t 写法，Juliet 为常见异写；Niner 与 Nine 互通。
 */
const DECODE_ALIASES: Readonly<Record<string, string>> = {
  Alpha: 'Alfa',
  Juliet: 'Juliett',
  Nine: 'Niner',
};

/** 音标单词 → 源字符的反向映射（由 NATO_TABLE 派生，再叠加异写） */
const REVERSE_TABLE: Readonly<Record<string, string>> = (() => {
  const map: Record<string, string> = {};
  for (const [char, word] of Object.entries(NATO_TABLE)) {
    map[word.toLowerCase()] = char;
  }
  for (const [alias, canonical] of Object.entries(DECODE_ALIASES)) {
    const char = map[canonical.toLowerCase()];
    if (char !== undefined) {
      map[alias.toLowerCase()] = char;
    }
  }
  return map;
})();

/** 转换结果 */
export interface PhoneticResult {
  /** 成功时的输出文本；失败为 null */
  output: string | null;
  /** 失败时的错误信息；成功为 null */
  error: string | null;
}

/** 逐字符拼写单元（用于界面展示字符与音标的一一对应） */
export interface SpellToken {
  /** 源字符（A–Z、0–9） */
  char: string;
  /** 对应的音标单词 */
  word: string;
}

/** 一个源单词对应的拼写结果 */
export interface SpellGroup {
  /** 源单词（已大写） */
  source: string;
  /** 逐字符拼写单元 */
  tokens: SpellToken[];
}

/**
 * 把普通文本拼写为 NATO 音标。
 * 字母统一大写；源文本中的空白作为单词边界，输出以
 * 「空格 + / + 空格」分隔单词，单词内部各字符音标以空格分隔。
 * A–Z、0–9 以外的字符无法拼写，返回错误。
 *
 * @param text - 原始文本
 * @returns 拼写结果（含错误信息）
 */
export function encodePhonetic(text: string): PhoneticResult {
  const groups = buildSpellGroups(text);
  if (groups instanceof Error) {
    return { output: null, error: groups.message };
  }
  return {
    output: groups.map((group) => group.tokens.map((token) => token.word).join(' ')).join(` ${WORD_SEPARATOR} `),
    error: null,
  };
}

/**
 * 把输入文本切分为逐字符的拼写分组（以空白为单词边界）。
 *
 * @param text - 原始文本
 * @returns 拼写分组；遇到不支持的字符时返回 Error
 */
export function buildSpellGroups(text: string): SpellGroup[] | Error {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return [];
  }
  const groups: SpellGroup[] = [];
  for (const word of trimmed.split(/\s+/)) {
    const tokens: SpellToken[] = [];
    for (const ch of word) {
      const upper = ch.toUpperCase();
      const phonetic = NATO_TABLE[upper];
      if (phonetic === undefined) {
        return new Error(`字符 "${ch}" 无法拼写，仅支持字母 A–Z 与数字 0–9`);
      }
      tokens.push({ char: upper, word: phonetic });
    }
    groups.push({ source: word.toUpperCase(), tokens });
  }
  return groups;
}

/**
 * 把 NATO 音标串还原为普通文本。
 * 斜杠（/）或连续空白分隔源单词；音标单词之间以空白分隔。
 * 单词匹配忽略大小写，兼容 Alpha / Juliet / Nine 等常见异写。
 *
 * @param phonetic - 音标串
 * @returns 还原结果（含错误信息）
 */
export function decodePhonetic(phonetic: string): PhoneticResult {
  const trimmed = phonetic.trim();
  if (trimmed.length === 0) {
    return { output: '', error: null };
  }
  if (/[^A-Za-z\s/-]/.test(trimmed)) {
    return {
      output: null,
      error: '音标串只能包含音标单词（允许连字符，如 X-ray）、空白与单词分隔符（/）',
    };
  }

  const words: string[] = [];
  for (const part of trimmed
    .split(WORD_SEPARATOR)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)) {
    const letters: string[] = [];
    for (const token of part.split(/\s+/).filter((item) => item.length > 0)) {
      const char = REVERSE_TABLE[token.toLowerCase()];
      if (char === undefined) {
        return { output: null, error: `无法识别的音标单词 "${token}"` };
      }
      letters.push(char);
    }
    if (letters.length > 0) {
      words.push(letters.join(''));
    }
  }

  return { output: words.join(' '), error: null };
}
