import { ZhDirectionEnum } from '../constants';
import { HK_PHRASES, S2T_CHARS, S2T_PHRASES, TW_PHRASES } from '../data';

/** 一次替换的记录 */
export interface ConversionHit {
  /** 原文片段 */
  from: string;
  /** 转换结果 */
  to: string;
  /** 在原文中的起始偏移 */
  index: number;
}

/** 转换结果 */
export interface ConversionResult {
  /** 转换后的文本 */
  text: string;
  /** 实际发生变化的替换记录 */
  hits: ConversionHit[];
  /** 被替换的原文字符数 */
  changedChars: number;
}

/** 词条字典 */
type Dictionary = Record<string, string>;

function invert(dict: Dictionary): Dictionary {
  const result: Dictionary = {};
  for (const [key, value] of Object.entries(dict)) {
    if (key !== value) {
      result[value] = key;
    }
  }
  return result;
}

const BASE_S2T: Dictionary = { ...S2T_CHARS, ...S2T_PHRASES };
const BASE_T2S: Dictionary = invert(BASE_S2T);
const TW_S2T: Dictionary = { ...BASE_S2T, ...TW_PHRASES };
const TW_T2S: Dictionary = { ...BASE_T2S, ...invert(TW_PHRASES) };
const HK_S2T: Dictionary = { ...BASE_S2T, ...HK_PHRASES };
const HK_T2S: Dictionary = { ...BASE_T2S, ...invert(HK_PHRASES) };

const ALL_DICTIONARIES = [BASE_S2T, BASE_T2S, TW_S2T, TW_T2S, HK_S2T, HK_T2S];

/** 所有字典中最长的词条长度 */
const MAX_KEY_LENGTH = ALL_DICTIONARIES.reduce((max, dict) => {
  for (const key of Object.keys(dict)) {
    const length = Array.from(key).length;
    if (length > max) {
      max = length;
    }
  }
  return max;
}, 1);

/** 单个分块的最大字符数 */
const CHUNK_SIZE = 50_000;

export interface ConvertOptions {
  /** 台湾 / 香港方向是否同时转换地区用词，默认 true */
  regionWords?: boolean;
}

function getDictionary(direction: ZhDirectionEnum, regionWords: boolean): Dictionary {
  switch (direction) {
    case ZhDirectionEnum.S2T:
      return BASE_S2T;
    case ZhDirectionEnum.S2TW:
      return regionWords ? TW_S2T : BASE_S2T;
    case ZhDirectionEnum.S2HK:
      return regionWords ? HK_S2T : BASE_S2T;
    case ZhDirectionEnum.T2S:
      return BASE_T2S;
    case ZhDirectionEnum.TW2S:
      return TW_T2S;
    case ZhDirectionEnum.HK2S:
      return HK_T2S;
    default:
      return BASE_S2T;
  }
}

function convertSegment(
  text: string,
  dict: Dictionary,
  offset: number,
): ConversionResult {
  const hits: ConversionHit[] = [];
  const pieces: string[] = [];
  let index = 0;

  while (index < text.length) {
    const remaining = text.length - index;
    let matched = false;

    for (let length = Math.min(MAX_KEY_LENGTH, remaining); length >= 1; length--) {
      const source = text.slice(index, index + length);
      const target = dict[source];
      if (target !== undefined) {
        pieces.push(target);
        if (source !== target) {
          hits.push({ from: source, to: target, index: offset + index });
        }
        index += length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      pieces.push(text[index]);
      index += 1;
    }
  }

  return {
    text: pieces.join(''),
    hits,
    changedChars: hits.reduce((sum, hit) => sum + Array.from(hit.from).length, 0),
  };
}

/**
 * 选择不会切断词条的分块边界。
 * 若边界落在某个词条中间，则把边界前移到该词条的起点。
 */
function findChunkEnd(
  text: string,
  start: number,
  desiredEnd: number,
  dict: Dictionary,
): number {
  let end = desiredEnd;

  for (let guard = 0; guard < MAX_KEY_LENGTH && end < text.length; guard++) {
    let crossingStart = -1;

    for (let pos = Math.max(start, end - MAX_KEY_LENGTH + 1); pos < end; pos++) {
      const maxLength = Math.min(MAX_KEY_LENGTH, text.length - pos);
      for (let length = 2; length <= maxLength; length++) {
        if (pos + length > end && dict[text.slice(pos, pos + length)] !== undefined) {
          crossingStart = pos;
          break;
        }
      }
      if (crossingStart !== -1) {
        break;
      }
    }

    if (crossingStart === -1 || crossingStart <= start) {
      return end;
    }
    end = crossingStart;
  }

  return end;
}

/** 分块转换文本，保证跨块词条不被切断 */
export function convertText(text: string, dict: Dictionary): ConversionResult {
  if (text.length === 0) {
    return { text: '', hits: [], changedChars: 0 };
  }

  if (text.length <= CHUNK_SIZE) {
    return convertSegment(text, dict, 0);
  }

  const hits: ConversionHit[] = [];
  const pieces: string[] = [];
  let changedChars = 0;
  let start = 0;

  while (start < text.length) {
    const desiredEnd = Math.min(start + CHUNK_SIZE, text.length);
    const end =
      desiredEnd < text.length ? findChunkEnd(text, start, desiredEnd, dict) : desiredEnd;
    const segment = convertSegment(text.slice(start, end), dict, start);
    pieces.push(segment.text);
    hits.push(...segment.hits);
    changedChars += segment.changedChars;
    start = end;
  }

  return { text: pieces.join(''), hits, changedChars };
}

/** 执行简繁转换 */
export function convert(
  text: string,
  direction: ZhDirectionEnum,
  options: ConvertOptions = {},
): ConversionResult {
  const regionWords = options.regionWords ?? true;
  return convertText(text, getDictionary(direction, regionWords));
}
