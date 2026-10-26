export type NumberWordsMode = 'cardinal' | 'ordinal' | 'money';

export interface NumberWordsOptions {
  hyphenate?: boolean;
}

export interface NumberWordsResult {
  words: string;
}

const ZERO = BigInt(0);
const TEN = BigInt(10);
const ONE_THOUSAND = BigInt(1000);
const MAX_ABSOLUTE = BigInt('1000000000000000');

const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
];

const SCALE_WORDS = ['thousand', 'million', 'billion', 'trillion'];

const ORDINAL_IRREGULAR: Record<string, string> = {
  one: 'first',
  two: 'second',
  three: 'third',
  four: 'fourth',
  five: 'fifth',
  six: 'sixth',
  seven: 'seventh',
  eight: 'eighth',
  nine: 'ninth',
  ten: 'tenth',
  eleven: 'eleventh',
  twelve: 'twelfth',
  thirteen: 'thirteenth',
  fourteen: 'fourteenth',
  fifteen: 'fifteenth',
  sixteen: 'sixteenth',
  seventeen: 'seventeenth',
  eighteen: 'eighteenth',
  nineteen: 'nineteenth',
  twenty: 'twentieth',
  thirty: 'thirtieth',
  forty: 'fortieth',
  fifty: 'fiftieth',
  sixty: 'sixtieth',
  seventy: 'seventieth',
  eighty: 'eightieth',
  ninety: 'ninetieth',
  hundred: 'hundredth',
  thousand: 'thousandth',
  million: 'millionth',
  billion: 'billionth',
  trillion: 'trillionth',
};

/**
 * 将 0-999 的整数转换为英文词组
 *
 * @param value - 0 到 999 的整数
 * @param hyphenate - 21-99 的复合词是否使用连字符（twenty-one）
 * @returns 英文词组；0 返回空串
 */
function smallNumberToWords(value: number, hyphenate: boolean): string {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  if (hundreds > 0) {
    parts.push(`${ONES[hundreds]} hundred`);
  }
  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES[remainder] ?? '');
    } else {
      const tensDigit = Math.floor(remainder / 10);
      const onesDigit = remainder % 10;
      const tensWord = TENS[tensDigit] ?? '';
      if (onesDigit === 0) {
        parts.push(tensWord);
      } else {
        parts.push(hyphenate ? `${tensWord}-${ONES[onesDigit]}` : `${tensWord} ${ONES[onesDigit]}`);
      }
    }
  }
  return parts.join(' ');
}

/**
 * 将非负大整数按千分位切分为 0-999 的数组（低位在前）
 *
 * @param value - 非负 BigInt 整数
 * @returns 每个元素小于 1000 的数组，索引 0 为个位数千组
 */
function chunkThousands(value: bigint): number[] {
  const chunks: number[] = [];
  let current = value;
  while (current > ZERO) {
    chunks.push(Number(current % ONE_THOUSAND));
    current = current / ONE_THOUSAND;
  }
  return chunks;
}

/**
 * 将任意安全范围内的整数 BigInt 转换为基数词读法（短级差 short scale）
 *
 * @param value - 整数 BigInt，绝对值须小于 10^15
 * @param hyphenate - 复合词是否使用连字符
 * @returns 英文基数词
 */
export function integerToWords(value: bigint, hyphenate = true): string {
  if (value >= MAX_ABSOLUTE || value <= -MAX_ABSOLUTE) {
    throw new Error('仅支持绝对值小于 1000 万亿（10¹⁵）的整数');
  }
  const negative = value < ZERO;
  const absolute = negative ? -value : value;
  if (absolute === ZERO) {
    return 'zero';
  }
  const chunks = chunkThousands(absolute);
  const groups: string[] = [];
  for (let index = chunks.length - 1; index >= 0; index -= 1) {
    const chunk = chunks[index] ?? 0;
    if (chunk === 0) {
      continue;
    }
    const phrase = smallNumberToWords(chunk, hyphenate);
    if (index > 0) {
      groups.push(`${phrase} ${SCALE_WORDS[index - 1] ?? ''}`.trim());
    } else {
      groups.push(phrase);
    }
  }
  return negative ? `negative ${groups.join(' ')}` : groups.join(' ');
}

/**
 * 将基数词词组的最后一个词转换为序数词（first / twenty-first / hundredth）
 *
 * @param cardinalWords - 基数词词组
 * @returns 序数词词组
 */
function ordinalizeLastWord(cardinalWords: string): string {
  const tokens = cardinalWords.split(' ');
  const lastIndex = tokens.length - 1;
  const lastToken = tokens[lastIndex] ?? '';
  let converted: string;
  if (lastToken.includes('-')) {
    const pieces = lastToken.split('-');
    const finalPiece = pieces[pieces.length - 1] ?? '';
    pieces[pieces.length - 1] = ORDINAL_IRREGULAR[finalPiece] ?? `${finalPiece}th`;
    converted = pieces.join('-');
  } else {
    converted = ORDINAL_IRREGULAR[lastToken] ?? `${lastToken}th`;
  }
  tokens[lastIndex] = converted;
  return tokens.join(' ');
}

/**
 * 将数字文本转换为英文读法
 *
 * - cardinal：整数基数词；含小数时小数部分逐位读出（three point one four）
 * - ordinal：仅支持整数，输出序数词（first / twenty-first / one hundredth）
 * - money：美元 / 美分支票读法，小数至多 2 位（one hundred twenty-three dollars and forty-five cents）
 *
 * @param input - 数字文本，允许千分位逗号与前导正负号
 * @param mode - cardinal / ordinal / money
 * @param options - hyphenate 复合词连字符开关，默认开启
 * @returns 英文读法结果
 */
export function numberToWords(
  input: string,
  mode: NumberWordsMode = 'cardinal',
  options: NumberWordsOptions = {},
): NumberWordsResult {
  const hyphenate = options.hyphenate ?? true;
  const trimmed = input.trim().replace(/,/g, '');
  if (!trimmed) {
    throw new Error('请输入数字');
  }
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(trimmed);
  if (!match) {
    throw new Error('无法识别的数字，请输入如 12345、-42、123.45 的十进制数字（可含千分位逗号）');
  }
  const sign = match[1] ?? '';
  const integerPart = match[2] ?? '0';
  const fractionPart = match[3] ?? '';
  const negative = sign === '-';

  if (mode === 'ordinal' && fractionPart) {
    throw new Error('序数词模式仅支持整数');
  }

  const integerValue = BigInt(integerPart);
  const signedInteger = negative ? -integerValue : integerValue;

  if (mode === 'money') {
    if (fractionPart.length > 2) {
      throw new Error('金额模式的小数部分至多 2 位（美分）');
    }
    const cents = fractionPart ? Number(fractionPart.padEnd(2, '0')) : 0;
    const dollarWords = integerToWords(signedInteger, hyphenate);
    const centWords = cents === 0 ? 'zero' : smallNumberToWords(cents, hyphenate);
    const dollarUnit = integerValue === BigInt(1) && !negative ? 'dollar' : 'dollars';
    const centUnit = cents === 1 ? 'cent' : 'cents';
    return { words: `${dollarWords} ${dollarUnit} and ${centWords} ${centUnit}` };
  }

  let words = integerToWords(signedInteger, hyphenate);
  if (mode === 'ordinal') {
    words = ordinalizeLastWord(words);
  } else if (fractionPart) {
    const digitWords = fractionPart
      .split('')
      .map((digit) => ONES[Number(digit)] ?? '')
      .join(' ');
    words = `${words} point ${digitWords}`;
  }
  return { words };
}
