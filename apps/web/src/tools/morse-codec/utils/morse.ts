/**
 * 摩尔斯电码（International Morse Code）双向转换的纯函数实现，
 * 不依赖 DOM 与 React。编码支持可调的字符 / 单词间隔（以点长为时间单位），
 * 解码对分隔符做容错（任意长度空格或斜杠组合）。
 */

/** 点 */
export const DOT = '.';
/** 划 */
export const DASH = '-';

/** 默认字符间隔（3 个点长，ITU-R M.1677-1 标准） */
export const DEFAULT_CHAR_GAP_UNITS = 3;
/** 默认单词间隔（7 个点长，ITU-R M.1677-1 标准） */
export const DEFAULT_WORD_GAP_UNITS = 7;
/** 允许的最小间隔单位数 */
export const MIN_GAP_UNITS = 1;
/** 允许的最大间隔单位数 */
export const MAX_GAP_UNITS = 20;

/** 编码选项 */
export interface MorseEncodeOptions {
  /** 字符间隔（点长单位，标准为 3） */
  charGapUnits?: number;
  /** 单词间隔（点长单位，标准为 7） */
  wordGapUnits?: number;
}

/** 转换结果 */
export interface MorseConvertResult {
  /** 成功时的输出文本；失败为 null */
  output: string | null;
  /** 失败时的错误信息；成功为 null */
  error: string | null;
}

/**
 * 字母、数字与常用标点的国际摩尔斯电码映射
 */
const MORSE_MAP: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
};

/** 摩尔斯码 → 字符的反向映射（由 MORSE_MAP 派生） */
const REVERSE_MAP: Record<string, string> = Object.entries(MORSE_MAP).reduce<
  Record<string, string>
>((acc, [char, code]) => {
  acc[code] = char;
  return acc;
}, {});

/**
 * 校验并归一化间隔单位数
 *
 * @param value - 输入值
 * @param fallback - 缺省时的默认值
 * @returns 归一化后的整数
 */
function normalizeGap(value: number | undefined, fallback: number): number {
  if (value === undefined || Number.isNaN(value)) {
    return fallback;
  }
  const rounded = Math.round(value);
  if (rounded < MIN_GAP_UNITS) {
    return MIN_GAP_UNITS;
  }
  if (rounded > MAX_GAP_UNITS) {
    return MAX_GAP_UNITS;
  }
  return rounded;
}

/**
 * 把普通文本编码为摩尔斯电码。
 * 字母统一大写；字符之间以 charGapUnits 个点长的空白表示，
 * 单词之间以 wordGapUnits 个点长的空白表示；无法编码的字符返回错误。
 *
 * @param text - 原始文本
 * @param options - 间隔选项
 * @returns 编码结果（含错误信息）
 */
export function encodeMorse(
  text: string,
  options: MorseEncodeOptions = {},
): MorseConvertResult {
  const charGapUnits = normalizeGap(options.charGapUnits, DEFAULT_CHAR_GAP_UNITS);
  const wordGapUnits = normalizeGap(options.wordGapUnits, DEFAULT_WORD_GAP_UNITS);
  if (wordGapUnits <= charGapUnits) {
    return {
      output: null,
      error: `单词间隔（${wordGapUnits}）必须大于字符间隔（${charGapUnits}），否则无法区分字符边界与单词边界`,
    };
  }

  const charGap = ' '.repeat(charGapUnits);
  const wordGap = ' '.repeat(wordGapUnits);
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { output: '', error: null };
  }

  const words = trimmed.split(/\s+/);
  const encodedWords: string[] = [];
  for (const [wordIndex, word] of words.entries()) {
    const chars: string[] = [];
    for (const ch of word) {
      const code = MORSE_MAP[ch.toUpperCase()];
      if (code === undefined) {
        return {
          output: null,
          error: `字符 "${ch}" 不在支持的摩尔斯字符集中（支持 A–Z、0–9 与常用标点）`,
        };
      }
      chars.push(code);
    }
    if (chars.length > 0) {
      encodedWords[wordIndex] = chars.join(charGap);
    }
  }

  return { output: encodedWords.filter(Boolean).join(wordGap), error: null };
}

/**
 * 把摩尔斯电码解码为普通文本。
 * 仅允许点（.）、划（-）、空白与斜杠（/ 作为可选单词分隔符）；
 * 1–4 个空格视为字符间隔（对手写输入容错），斜杠或 5 个及以上空格视为单词间隔。
 *
 * @param morse - 摩尔斯电码文本
 * @returns 解码结果（含错误信息）
 */
export function decodeMorse(morse: string): MorseConvertResult {
  const trimmed = morse.trim();
  if (trimmed.length === 0) {
    return { output: '', error: null };
  }
  if (/[^.\-\s/]/.test(trimmed)) {
    return {
      output: null,
      error: '摩尔斯电码只能包含点（.）、划（-）、空白以及单词分隔符（/）',
    };
  }

  const words: string[] = [];
  const wordParts = trimmed
    .split(/\s*\/\s*|\s{5,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  for (const part of wordParts) {
    const letters: string[] = [];
    for (const code of part.split(/\s+/).filter((item) => item.length > 0)) {
      const ch = REVERSE_MAP[code];
      if (ch === undefined) {
        return { output: null, error: `无法识别的摩尔斯码组 "${code}"` };
      }
      letters.push(ch);
    }
    if (letters.length > 0) {
      words.push(letters.join(''));
    }
  }

  return { output: words.join(' '), error: null };
}

/**
 * 生成摩尔斯电码的播放时序（单位为点长倍数）。
 * 发声段对应点（1 单位）/ 划（3 单位）；码元间隔 1 单位，
 * 字符间隔取实际空白长度（或斜杠前后的空白，至少为 charGapUnits），
 * 达到 wordGapUnits 的空白或独立斜杠视为单词间隔。
 *
 * @param morse - 已编码的摩尔斯电码
 * @param charGapUnits - 编码时使用的字符间隔
 * @param wordGapUnits - 编码时使用的单词间隔
 * @returns 时序段数组
 */
export function buildMorseTiming(
  morse: string,
  charGapUnits = DEFAULT_CHAR_GAP_UNITS,
  wordGapUnits = DEFAULT_WORD_GAP_UNITS,
): Array<{ units: number; on: boolean }> {
  const segments: Array<{ units: number; on: boolean }> = [];
  const tokenRegex = /([.-]+)|(\s*\/\s*)|(\s+)/g;
  let match: RegExpExecArray | null;
  let pendingGap = 0;

  /**
   * 追加一个静默段
   *
   * @param units - 时长（点长单位）
   */
  function pushSilence(units: number) {
    if (units > 0) {
      segments.push({ units, on: false });
    }
  }

  while ((match = tokenRegex.exec(morse)) !== null) {
    if (match[1] !== undefined) {
      const code = match[1];
      pushSilence(pendingGap);
      pendingGap = 0;
      const symbols = Array.from(code);
      symbols.forEach((symbol, symbolIndex) => {
        segments.push({ units: symbol === DOT ? 1 : 3, on: true });
        if (symbolIndex < symbols.length - 1) {
          segments.push({ units: 1, on: false });
        }
      });
    } else if (match[2] !== undefined) {
      pendingGap = wordGapUnits;
    } else if (match[3] !== undefined) {
      const gapLength = match[3].length;
      if (gapLength >= wordGapUnits) {
        pendingGap = wordGapUnits;
      } else {
        pendingGap = Math.max(gapLength, charGapUnits);
      }
    }
  }
  return segments;
}
