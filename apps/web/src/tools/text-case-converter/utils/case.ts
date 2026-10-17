/**
 * 文本命名风格转换纯函数集合。
 * 负责把任意文本拆分为词元，并在 camelCase / PascalCase / snake_case 等常见命名风格间相互转换，
 * 全部逻辑在浏览器本地执行，确定性输出，不触碰 DOM / React。
 */

import { CaseStyleEnum } from '../constants';

/**
 * 判断字符是否为 ASCII 大写字母
 *
 * @param char - 单个字符
 * @returns 是大写字母返回 true
 */
function isUpper(char: string): boolean {
  return char >= 'A' && char <= 'Z';
}

/**
 * 判断字符是否为 ASCII 小写字母
 *
 * @param char - 单个字符
 * @returns 是小写字母返回 true
 */
function isLower(char: string): boolean {
  return char >= 'a' && char <= 'z';
}

/**
 * 判断字符是否为 ASCII 数字
 *
 * @param char - 单个字符
 * @returns 是数字返回 true
 */
function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

/**
 * 把单个字母数字片段按 camelCase / PascalCase 边界继续拆分，
 * 连续大写缩写保持在一起，仅在缩结尾后接单词处切开（如 HTTPResponse → HTTP / Response）
 *
 * @param chunk - 已按非字母数字字符切分出的片段
 * @returns 拆分后的词元数组，保持原始大小写
 */
function splitChunk(chunk: string): string[] {
  const words: string[] = [];
  let current = '';

  for (let index = 0; index < chunk.length; index += 1) {
    const char = chunk.charAt(index);
    const previous = chunk.charAt(index - 1);
    const next = chunk.charAt(index + 1);
    const isBoundary =
      current !== '' &&
      isUpper(char) &&
      (isLower(previous) || isDigit(previous) || (isUpper(previous) && isLower(next)));

    if (isBoundary) {
      words.push(current);
      current = '';
    }
    current += char;
  }

  if (current !== '') words.push(current);
  return words;
}

/**
 * 把文本拆分为词元数组：先按非字母数字字符切分，再按 camelCase / PascalCase 边界切分
 *
 * @param input - 任意待拆分文本
 * @returns 词元数组，过滤空词且不改变原始大小写
 */
export function splitWords(input: string): string[] {
  return input
    .split(/[^A-Za-z0-9]+/)
    .filter((chunk) => chunk !== '')
    .flatMap((chunk) => splitChunk(chunk));
}

/**
 * 把单词转为「首字母大写 + 其余字母小写」形式
 *
 * @param word - 原始单词
 * @returns 首字母大写的单词
 */
function capitalize(word: string): string {
  if (word === '') return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * 把文本转换为指定命名风格
 *
 * @param input - 任意待转换文本，可为空
 * @param style - 目标命名风格
 * @returns 目标风格文本；空输入或仅含分隔符时返回空串
 */
export function convertCase(input: string, style: CaseStyleEnum): string {
  const words = splitWords(input);
  if (words.length === 0) return '';

  switch (style) {
    case CaseStyleEnum.CAMEL:
      return words.map((word, index) => (index === 0 ? word.toLowerCase() : capitalize(word))).join('');
    case CaseStyleEnum.PASCAL:
      return words.map((word) => capitalize(word)).join('');
    case CaseStyleEnum.SNAKE:
      return words.map((word) => word.toLowerCase()).join('_');
    case CaseStyleEnum.SCREAMING_SNAKE:
      return words.map((word) => word.toUpperCase()).join('_');
    case CaseStyleEnum.KEBAB:
      return words.map((word) => word.toLowerCase()).join('-');
    case CaseStyleEnum.DOT:
      return words.map((word) => word.toLowerCase()).join('.');
    case CaseStyleEnum.TITLE:
      return words.map((word) => capitalize(word)).join(' ');
    case CaseStyleEnum.SENTENCE:
      return words
        .map((word, index) => (index === 0 ? capitalize(word) : word.toLowerCase()))
        .join(' ');
    case CaseStyleEnum.LOWER:
      return words.map((word) => word.toLowerCase()).join(' ');
    case CaseStyleEnum.UPPER:
      return words.map((word) => word.toUpperCase()).join(' ');
    default:
      return '';
  }
}

/**
 * 把文本一次性转换为全部命名风格
 *
 * @param input - 任意待转换文本，可为空
 * @returns 以风格枚举为键、对应转换结果为值的对照表
 */
export function convertAll(input: string): Record<CaseStyleEnum, string> {
  const result = {} as Record<CaseStyleEnum, string>;
  Object.values(CaseStyleEnum).forEach((style) => {
    result[style] = convertCase(input, style);
  });
  return result;
}
