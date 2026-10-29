/**
 * 银行卡 / 信用卡号识别与格式化纯函数
 */
import { luhnCheck, luhnSum } from './luhn';

export interface CardBrand {
  key: string;
  /** 中文名称 */
  label: string;
  /** 英文名称 */
  labelEn: string;
}

interface BrandRule extends CardBrand {
  /** IIN 前缀正则（锚定号首） */
  prefixes: RegExp;
  /** 允许的卡号长度 */
  lengths: number[];
}

/**
 * 卡组织识别规则（依据公开 IIN 范围与常见长度）
 */
const BRAND_RULES: BrandRule[] = [
  {
    key: 'amex',
    label: 'American Express',
    labelEn: 'American Express',
    prefixes: /^3[47]/,
    lengths: [15],
  },
  {
    key: 'visa',
    label: 'Visa',
    labelEn: 'Visa',
    prefixes: /^4/,
    lengths: [13, 16, 19],
  },
  {
    key: 'mastercard',
    label: 'Mastercard',
    labelEn: 'Mastercard',
    prefixes: /^(?:5[1-5]|2(?:2[2-9]|[3-6]\d|7[01]|720))/,
    lengths: [16],
  },
  {
    key: 'unionpay',
    label: '银联 UnionPay',
    labelEn: 'UnionPay',
    prefixes: /^(?:62|81)/,
    lengths: [16, 17, 18, 19],
  },
  {
    key: 'discover',
    label: 'Discover',
    labelEn: 'Discover',
    prefixes: /^(?:6011|65|64[4-9])/,
    lengths: [16, 19],
  },
  {
    key: 'jcb',
    label: 'JCB',
    labelEn: 'JCB',
    prefixes: /^35(?:2[89]|[3-8]\d)/,
    lengths: [16, 17, 18, 19],
  },
  {
    key: 'diners',
    label: 'Diners Club',
    labelEn: 'Diners Club',
    prefixes: /^3(?:0[0-5]|[689])/,
    lengths: [14, 16, 19],
  },
];

export const UNKNOWN_BRAND: CardBrand = {
  key: 'unknown',
  label: '未知卡种',
  labelEn: 'Unknown',
};

/** 允许出现的分隔符：空格与连字符 */
const SEPARATOR_PATTERN = /[\s-]/g;
const ILLEGAL_CHAR_PATTERN = /[^\d\s-]/;

/**
 * 去除卡号中的空格与连字符
 *
 * @param raw - 用户原始输入
 * @returns 纯数字串
 */
export function sanitizeCardNumber(raw: string): string {
  return raw.replace(SEPARATOR_PATTERN, '');
}

/**
 * 判断输入是否含有除数字、空格、连字符以外的非法字符
 */
export function hasIllegalChars(raw: string): boolean {
  return ILLEGAL_CHAR_PATTERN.test(raw);
}

/**
 * 依据 IIN 前缀与长度规则识别卡组织
 *
 * @param digits - 纯数字卡号
 * @returns 匹配的卡组织；未匹配返回「未知卡种」
 */
export function detectCardBrand(digits: string): CardBrand {
  const matched = BRAND_RULES.find(
    (rule) => rule.prefixes.test(digits) && rule.lengths.includes(digits.length),
  );
  if (matched) {
    return { key: matched.key, label: matched.label, labelEn: matched.labelEn };
  }
  return UNKNOWN_BRAND;
}

/**
 * 按 4 位分组格式化卡号（组间空格连接）
 */
export function formatCardNumber(digits: string): string {
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export interface CardValidationResult {
  /** 去除分隔符后的数字串 */
  digits: string;
  /** 去除分隔符后的长度 */
  length: number;
  /** 输入是否为空 */
  empty: boolean;
  /** 是否含非法字符 */
  illegalChars: boolean;
  /** 长度是否在 12-19 的合法区间 */
  lengthValid: boolean;
  /** 识别出的卡组织 */
  brand: CardBrand;
  /** Luhn 校验是否通过（仅在数字串合法时计算） */
  luhnValid: boolean;
  /** Luhn 求和结果 */
  luhnTotal: number | null;
  /** 综合结论：格式合法且 Luhn 通过 */
  valid: boolean;
}

/**
 * 对原始输入执行完整校验
 *
 * @param raw - 用户输入的卡号（可含空格 / 连字符）
 */
export function validateCardNumber(raw: string): CardValidationResult {
  const trimmed = raw.trim();
  const digits = sanitizeCardNumber(trimmed);
  const empty = digits.length === 0;
  const illegalChars = hasIllegalChars(trimmed);
  const lengthValid = digits.length >= 12 && digits.length <= 19;
  const structurallyOk = !empty && !illegalChars && /^\d+$/.test(digits) && lengthValid;
  const luhnValid = structurallyOk ? luhnCheck(digits) : false;
  const luhnTotal = structurallyOk && /^\d+$/.test(digits) ? luhnSum(digits) : null;
  const brand = structurallyOk ? detectCardBrand(digits) : UNKNOWN_BRAND;

  return {
    digits,
    length: digits.length,
    empty,
    illegalChars,
    lengthValid,
    brand,
    luhnValid,
    luhnTotal,
    valid: structurallyOk && luhnValid,
  };
}
