/**
 * 阿拉伯数字 → 中文数字（零依赖纯函数）
 *
 * 支持：
 * - 小写（零一二…）与财务大写（零壹贰…、萬億）两套字形
 * - 节单位 万（10^4）、亿（10^8）、万亿（10^12）
 * - 连续零合并为一个「零」，每节末尾的零不读音
 * - 负数、小数；大写财务模式额外输出角（0.1）/分（0.01）
 */

export type ChineseVariant = 'simple' | 'financial';

const DIGITS_SIMPLE = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const DIGITS_FINANCIAL = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const SMALL_UNITS_SIMPLE = ['', '十', '百', '千'];
const SMALL_UNITS_FINANCIAL = ['', '拾', '佰', '仟'];

/** 节名称：从低到高，节 0 无名、节 1=万、节 2=亿、节 3=万亿 */
const SECTIONS_SIMPLE = ['', '万', '亿', '万亿'];
const SECTIONS_FINANCIAL = ['', '萬', '億', '萬億'];

/** 支持的最大整数位数：万亿节 4 位 + 低 12 位 = 16 位（万亿即 10^12） */
export const MAX_INTEGER_DIGITS = 16;

export interface NumberToChineseOptions {
  variant: ChineseVariant;
}

/** 把 0–9999 的一节转为中文（不含节名），全零时返回空串 */
function sectionToChinese(section: number, variant: ChineseVariant): string {
  const digits = variant === 'financial' ? DIGITS_FINANCIAL : DIGITS_SIMPLE;
  const units = variant === 'financial' ? SMALL_UNITS_FINANCIAL : SMALL_UNITS_SIMPLE;
  const parts: string[] = [];
  let zeroPending = false;
  // 从千位到个位
  for (let pos = 3; pos >= 0; pos -= 1) {
    const divisor = 10 ** pos;
    const digit = Math.floor(section / divisor) % 10;
    if (digit === 0) {
      if (parts.length > 0) zeroPending = true;
    } else {
      if (zeroPending) {
        parts.push(digits[0] as string);
        zeroPending = false;
      }
      parts.push((digits[digit] as string) + (units[pos] as string));
    }
  }
  return parts.join('');
}

/**
 * 将数字转换为中文数字字符串。
 *
 * @param input - 原始输入字符串（支持负号、小数点、千分位逗号）
 * @param options - variant：simple 小写（默认）/ financial 大写财务用字
 * @returns 中文数字文本
 * @throws 空输入、非法字符、超范围或精度不足时抛出错误
 */
export function numberToChinese(
  input: string,
  options: NumberToChineseOptions = { variant: 'simple' },
): string {
  const { variant } = options;
  const digits = variant === 'financial' ? DIGITS_FINANCIAL : DIGITS_SIMPLE;
  const sections = variant === 'financial' ? SECTIONS_FINANCIAL : SECTIONS_SIMPLE;
  const raw = input.trim().replace(/,/g, '');

  if (raw === '') {
    throw new Error('内容不能为空');
  }
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(raw)) {
    throw new Error(`「${input}」不是合法的数字（仅允许数字、小数点、正负号与千分位逗号）`);
  }

  const negative = raw.startsWith('-') || raw.startsWith('+') ? raw[0] === '-' : false;
  const unsigned = raw.replace(/^[+-]/, '');
  const [intPartRaw, fracPartRaw = ''] = unsigned.split('.');
  const intPart = (intPartRaw ?? '').replace(/^0+(?=\d)/, '') || '0';

  if (intPart.length > MAX_INTEGER_DIGITS) {
    throw new Error(`整数部分超出支持范围（最多 ${MAX_INTEGER_DIGITS} 位，即千万亿以内）`);
  }

  // 小数最多支持 2 位（角、分），更长则拒绝以避免静默丢精度
  if (fracPartRaw.length > 2) {
    throw new Error('小数部分最多支持 2 位（对应角、分）');
  }

  let integerText: string;
  if (intPart === '0') {
    integerText = digits[0] as string;
  } else {
    // 从低位每 4 位切节
    const groups: number[] = [];
    let rest = intPart;
    while (rest.length > 0) {
      groups.unshift(Number(rest.slice(-4)));
      rest = rest.slice(0, -4);
    }
    const parts: string[] = [];
    let pendingZero = false;
    for (let i = 0; i < groups.length; i += 1) {
      const group = groups[i] as number;
      const sectionIndex = groups.length - 1 - i;
      if (group === 0) {
        // 空节：若前后还有非空节，需要一个零连接
        if (parts.length > 0) pendingZero = true;
        continue;
      }
      if (pendingZero || (parts.length > 0 && group < 1000)) {
        // 跨空节，或本节不足 1000（节首缺位），补零
        parts.push(digits[0] as string);
      }
      pendingZero = false;
      parts.push(sectionToChinese(group, variant) + (sections[sectionIndex] as string));
    }
    integerText = parts.join('');
  }

  let result = integerText;

  // 小数部分
  if (fracPartRaw.length > 0 && /[1-9]/.test(fracPartRaw)) {
    if (variant === 'financial') {
      const jiao = Number(fracPartRaw[0] ?? 0);
      const fen = Number(fracPartRaw[1] ?? 0);
      const tail: string[] = [];
      if (jiao > 0) tail.push((digits[jiao] as string) + '角');
      if (jiao === 0 && intPart !== '0' && fen > 0) tail.push(digits[0] as string);
      if (fen > 0) tail.push((digits[fen] as string) + '分');
      // 整数部分为 0 时省略「零元」（如 0.05 → 伍分），否则加「元」连接
      result = intPart === '0' ? tail.join('') : `${integerText}元${tail.join('')}`;
    } else {
      const fracDigits = fracPartRaw
        .split('')
        .map((ch) => digits[Number(ch)] as string)
        .join('');
      result = `${integerText}点${fracDigits}`;
    }
  } else if (variant === 'financial') {
    result = `${integerText}元整`;
  }

  return (negative ? '负' : '') + result;
}
