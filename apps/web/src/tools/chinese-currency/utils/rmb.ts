/**
 * 阿拉伯数字金额转中文大写（人民币）纯逻辑集合。
 * 依据《支付结算办法》附一「正确填写票据和结算凭证的基本规定」：
 * 中文大写金额数字到「元」为止的，在「元」之后应写「整」（或「正」）字；
 * 到「角」为止的，在「角」之后可以不写「整」字；金额数字有「分」的，
 * 「分」后面不写「整」字。本实现按发票常用习惯统一处理（见下文规则）。
 * 不触碰 DOM / React。
 */

/** 大写数字 0-9 */
const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];

/** 节内位权：拾、佰、仟 */
const SMALL_UNITS = ['', '拾', '佰', '仟'];

/** 节位权：万、亿、万亿 */
const BIG_UNITS = ['', '万', '亿', '万亿'];

/** 允许的最大整数部分位数（元）：16 位即千万亿，覆盖到「万亿」节 */
export const MAX_INTEGER_LENGTH = 16;

/** 转换结果 */
export interface RmbResult {
  /** 转换成功时的中文大写金额 */
  text: string | null;
  /** 失败时的错误信息 */
  error: string | null;
}

/**
 * 把 4 位以内的一节数字转为大写（不含节单位）
 *
 * @param section - 0-9999 的整数
 * @returns 节内大写，如 1005 → 壹仟零伍
 */
function convertSection(section: number): string {
  let result = '';
  let zeroPending = false;
  let value = section;

  const digits: number[] = [];
  while (value > 0) {
    digits.push(value % 10);
    value = Math.floor(value / 10);
  }

  for (let position = digits.length - 1; position >= 0; position -= 1) {
    const digit = digits[position] ?? 0;
    if (digit === 0) {
      if (result !== '') {
        zeroPending = true;
      }
    } else {
      if (zeroPending) {
        result += DIGITS[0];
        zeroPending = false;
      }
      result += (DIGITS[digit] ?? '') + (SMALL_UNITS[position] ?? '');
    }
  }

  return result;
}

/**
 * 转换整数部分（按 4 位一节，支持 万 / 亿 / 万亿 节单位）
 *
 * @param integerPart - 整数字符串（无前导符号，可能含前导零）
 * @returns 整数大写（不含「元」）
 */
function convertInteger(integerPart: string): string {
  const normalized = integerPart.replace(/^0+/, '');
  if (normalized === '') {
    return '';
  }

  const sections: number[] = [];
  let rest = normalized;
  while (rest.length > 0) {
    sections.unshift(Number(rest.slice(-4)));
    rest = rest.slice(0, -4);
  }

  let result = '';
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index] ?? 0;
    const bigUnit = BIG_UNITS[sections.length - 1 - index] ?? '';
    if (section === 0) {
      if (!result.endsWith(DIGITS[0]!)) {
        result += DIGITS[0];
      }
      continue;
    }
    if (index > 0 && section < 1000 && !result.endsWith(DIGITS[0]!)) {
      result += DIGITS[0];
    }
    result += convertSection(section) + bigUnit;
  }

  return result.replace(/零+$/, '');
}

/**
 * 把阿拉伯数字金额转换为中文大写（人民币）
 *
 * 规则要点：
 * - 仅接受非负金额；整数最多 16 位（千万亿），小数最多 2 位（角分），更多位四舍五入
 * - 零元输出「零元整」；整数为 0 且有角分时不输出「零元」
 * - 角为 0 而分非 0 时用「零」连接（如 0.05 → 人民币伍分）
 * - 含角无分：角后不写「整」；有分：分后不写「整」；整数金额：元后写「整」
 *
 * @param input - 金额字符串，允许千分位逗号与首尾空白，如 "1,234.56"
 * @returns 中文大写金额或错误信息
 */
export function convertToRmb(input: string): RmbResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { text: null, error: null };
  }
  const plainPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
  const groupedPattern = /^[1-9]\d{0,2}(?:,\d{3})*(?:\.\d+)?$/;
  if (!plainPattern.test(trimmed) && !groupedPattern.test(trimmed)) {
    return { text: null, error: '请输入合法的非负数字金额' };
  }
  const cleaned = trimmed.replace(/,/g, '');

  let [integerPart = '0', decimalPartRaw = ''] = cleaned.split('.');
  integerPart = integerPart.replace(/^0+(?=\d)/, '') || '0';

  if (integerPart.length > MAX_INTEGER_LENGTH) {
    return {
      text: null,
      error: `整数部分不能超过 ${MAX_INTEGER_LENGTH} 位（千万元亿级以内）`,
    };
  }

  let decimalPart = decimalPartRaw;
  if (decimalPart.length > 2) {
    const rounded = (Number(`0.${decimalPart}`) * 100).toFixed(0);
    if (rounded === '100') {
      const increased = (BigInt(integerPart) + BigInt(1)).toString();
      return finalizeRmb(increased === '0' ? '0' : increased, 0, 0);
    }
    decimalPart = rounded.padStart(2, '0');
  }

  const jiao = Number(decimalPart[0] ?? '0');
  const fen = Number(decimalPart[1] ?? '0');

  return finalizeRmb(integerPart, jiao, fen);
}

/**
 * 根据整数部分与角、分拼装最终大写结果
 *
 * @param integerPart - 规范后的整数字符串
 * @param jiao - 角（0-9）
 * @param fen - 分（0-9）
 * @returns 最终结果
 */
function finalizeRmb(
  integerPart: string,
  jiao: number,
  fen: number,
): RmbResult {
  const integerNumeric = Number(integerPart);
  let result = '';

  if (integerNumeric > 0) {
    result += convertInteger(integerPart) + '元';
  }

  if (jiao === 0 && fen === 0) {
    if (result === '') {
      return { text: '零元整', error: null };
    }
    return { text: result + '整', error: null };
  }

  if (jiao > 0) {
    result += DIGITS[jiao] + '角';
  } else if (integerNumeric > 0 && fen > 0) {
    result += DIGITS[0];
  }

  if (fen > 0) {
    result += DIGITS[fen] + '分';
  }

  return { text: result, error: null };
}
