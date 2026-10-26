export type ConvertDirection = 'toHalfwidth' | 'toFullwidth';

export type ConvertScope = 'all' | 'punctuation' | 'alnum';

export interface ConversionResult {
  output: string;
  changedCount: number;
  punctuationChanged: number;
  alnumChanged: number;
  spaceChanged: number;
}

const ASCII_START = 0x21;
const ASCII_END = 0x7e;
const FULLWIDTH_OFFSET = 0xfee0;
const FULLWIDTH_SPACE = 0x3000;
const ASCII_SPACE = 0x20;

/**
 * 判断码位是否属于全角字母数字（全角 A-Z、a-z、0-9）
 *
 * @param codePoint - 全角区码位
 * @returns 是否为字母数字
 */
function isFullWidthAlnum(codePoint: number): boolean {
  const asciiCode = codePoint - FULLWIDTH_OFFSET;
  return (
    (asciiCode >= 0x30 && asciiCode <= 0x39) ||
    (asciiCode >= 0x41 && asciiCode <= 0x5a) ||
    (asciiCode >= 0x61 && asciiCode <= 0x7a)
  );
}

/**
 * 判断半角字符是否为字母数字
 *
 * @param char - 单个半角字符
 * @returns 是否为字母数字
 */
function isHalfWidthAlnum(char: string): boolean {
  return /^[A-Za-z0-9]$/.test(char);
}

/**
 * 全部角字符转为半角（U+FF01–FF5E → U+0021–007E，U+3000 → U+0020）
 *
 * @param input - 原始文本
 * @param scope - 转换范围：all / punctuation / alnum
 * @returns 转换结果与分类计数
 */
export function toHalfwidth(input: string, scope: ConvertScope = 'all'): ConversionResult {
  let output = '';
  let changedCount = 0;
  let punctuationChanged = 0;
  let alnumChanged = 0;
  let spaceChanged = 0;

  for (const char of input) {
    const codePoint = char.codePointAt(0) ?? 0;
    let converted: string | null = null;
    let category: 'punctuation' | 'alnum' | 'space' | null = null;

    if (codePoint === FULLWIDTH_SPACE) {
      converted = ' ';
      category = 'space';
    } else if (codePoint >= 0xff01 && codePoint <= 0xff5e) {
      const asciiCode = codePoint - FULLWIDTH_OFFSET;
      converted = String.fromCodePoint(asciiCode);
      category = isFullWidthAlnum(codePoint) ? 'alnum' : 'punctuation';
    }

    const inScope =
      converted !== null &&
      (scope === 'all' ||
        category === scope ||
        (scope === 'punctuation' && category === 'space'));

    if (inScope && converted !== null && category !== null) {
      output += converted;
      changedCount += 1;
      if (category === 'punctuation') {
        punctuationChanged += 1;
      } else if (category === 'alnum') {
        alnumChanged += 1;
      } else {
        spaceChanged += 1;
      }
    } else {
      output += char;
    }
  }

  return { output, changedCount, punctuationChanged, alnumChanged, spaceChanged };
}

/**
 * 全半角字符转为全角（U+0021–007E → U+FF01–FF5E，U+0020 → U+3000）
 *
 * @param input - 原始文本
 * @param scope - 转换范围：all / punctuation / alnum
 * @returns 转换结果与分类计数
 */
export function toFullwidth(input: string, scope: ConvertScope = 'all'): ConversionResult {
  let output = '';
  let changedCount = 0;
  let punctuationChanged = 0;
  let alnumChanged = 0;
  let spaceChanged = 0;

  for (const char of input) {
    const codePoint = char.codePointAt(0) ?? 0;
    let converted: string | null = null;
    let category: 'punctuation' | 'alnum' | 'space' | null = null;

    if (codePoint === ASCII_SPACE) {
      converted = String.fromCodePoint(FULLWIDTH_SPACE);
      category = 'space';
    } else if (codePoint >= ASCII_START && codePoint <= ASCII_END) {
      converted = String.fromCodePoint(codePoint + FULLWIDTH_OFFSET);
      category = isHalfWidthAlnum(char) ? 'alnum' : 'punctuation';
    }

    const inScope =
      converted !== null &&
      (scope === 'all' ||
        category === scope ||
        (scope === 'punctuation' && category === 'space'));

    if (inScope && converted !== null && category !== null) {
      output += converted;
      changedCount += 1;
      if (category === 'punctuation') {
        punctuationChanged += 1;
      } else if (category === 'alnum') {
        alnumChanged += 1;
      } else {
        spaceChanged += 1;
      }
    } else {
      output += char;
    }
  }

  return { output, changedCount, punctuationChanged, alnumChanged, spaceChanged };
}

/**
 * 按方向执行全角 / 半角批量转换
 *
 * @param input - 原始文本
 * @param direction - toHalfwidth / toFullwidth
 * @param scope - all / punctuation / alnum（punctuation 范围含空格）
 * @returns 转换结果与分类计数
 */
export function convertWidth(
  input: string,
  direction: ConvertDirection,
  scope: ConvertScope = 'all',
): ConversionResult {
  return direction === 'toHalfwidth'
    ? toHalfwidth(input, scope)
    : toFullwidth(input, scope);
}
