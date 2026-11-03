/**
 * VIN 校验位算法（ISO 3779 / GB 16735，算法口径同 49 CFR 565.15）
 *
 * 17 位字符逐位转码后乘权重求和，对 11 取模；余数 0-9 即校验数字，
 * 余数 10 对应字母 X。第 9 位为校验位，权重为 0、不参与求和。
 */
import {
  CHECK_DIGIT_POSITION,
  FORBIDDEN_LETTERS,
  VALID_VIN_PATTERN,
  VIN_LENGTH,
  VIN_TRANSLITERATION,
  VIN_WEIGHTS,
} from '../constants';

export interface VinPositionDetail {
  /** 1-基位置 */
  position: number;
  /** 该位字符 */
  char: string;
  /** 转码值 */
  value: number;
  /** 权重（第 9 位为 0） */
  weight: number;
  /** value × weight */
  product: number;
  /** 是否校验位 */
  isCheckDigit: boolean;
}

export interface VinValidationResult {
  /** 规范化后的 VIN（大写、去空白） */
  normalized: string;
  valid: boolean;
  /** 计算出的校验位（合法长度时存在） */
  expectedCheckDigit: string | null;
  /** 输入第 9 位实际字符（合法长度时存在） */
  actualCheckDigit: string | null;
  /** 加权求和 */
  weightedSum: number | null;
  /** 对 11 取模的余数 */
  remainder: number | null;
  /** 逐位明细（合法长度时存在） */
  details: VinPositionDetail[];
  /** 词法/结构错误（长度、非法字符、禁用字母） */
  errors: string[];
}

/** 余数映射为校验字符：0-9 原样，10 → X */
function remainderToCheckDigit(remainder: number): string {
  return remainder === 10 ? 'X' : String(remainder);
}

/**
 * 规范化 VIN 输入：转大写、去除所有空白与连字符。
 *
 * @param input - 原始输入
 * @returns 规范化字符串
 */
export function normalizeVin(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * 校验 VIN 并返回校验位计算明细。
 *
 * @param input - 用户输入的 VIN（可含小写/空白）
 * @returns 校验结果与逐位计算过程
 */
export function validateVin(input: string): VinValidationResult {
  const normalized = normalizeVin(input);
  const errors: string[] = [];

  if (normalized.length === 0) {
    return {
      normalized,
      valid: false,
      expectedCheckDigit: null,
      actualCheckDigit: null,
      weightedSum: null,
      remainder: null,
      details: [],
      errors: ['请输入 VIN。'],
    };
  }

  if (normalized.length !== VIN_LENGTH) {
    errors.push(`VIN 必须为 ${VIN_LENGTH} 位，当前为 ${normalized.length} 位。`);
  }

  // 非法字符与禁用字母（I/O/Q）逐位提示
  const invalidChars: string[] = [];
  const forbiddenChars: string[] = [];
  for (const ch of normalized) {
    if (!/[0-9A-Z]/.test(ch) && !invalidChars.includes(ch)) invalidChars.push(ch);
    if (FORBIDDEN_LETTERS.has(ch) && !forbiddenChars.includes(ch)) forbiddenChars.push(ch);
  }
  if (invalidChars.length > 0) {
    errors.push(`包含非法字符：${invalidChars.join('、')}（仅允许数字与大写字母）。`);
  }
  if (forbiddenChars.length > 0) {
    errors.push(`VIN 中禁止使用字母 ${forbiddenChars.join('、')}（易与数字 1/0 混淆）。`);
  }

  // 长度不合法无法做逐位校验
  if (normalized.length !== VIN_LENGTH) {
    return {
      normalized,
      valid: false,
      expectedCheckDigit: null,
      actualCheckDigit: null,
      weightedSum: null,
      remainder: null,
      details: [],
      errors,
    };
  }

  const details: VinPositionDetail[] = [];
  let weightedSum = 0;
  let hasUnmapped = false;

  for (let i = 0; i < VIN_LENGTH; i += 1) {
    const char = normalized.charAt(i);
    const value = VIN_TRANSLITERATION[char];
    const weight = VIN_WEIGHTS[i] ?? 0;
    if (value === undefined) {
      hasUnmapped = true;
      details.push({
        position: i + 1,
        char,
        value: 0,
        weight,
        product: 0,
        isCheckDigit: i + 1 === CHECK_DIGIT_POSITION,
      });
      continue;
    }
    const product = value * weight;
    weightedSum += product;
    details.push({
      position: i + 1,
      char,
      value,
      weight,
      product,
      isCheckDigit: i + 1 === CHECK_DIGIT_POSITION,
    });
  }

  const actualCheckDigit = normalized.charAt(CHECK_DIGIT_POSITION - 1);
  let expectedCheckDigit: string | null = null;
  let remainder: number | null = null;
  let valid = false;

  if (!hasUnmapped && !VALID_VIN_PATTERN.test(normalized)) {
    // 兜底：正则覆盖不到的情况（理论上已被逐位检查拦截）
    errors.push('VIN 字符集不符合 ISO 3779 规定。');
  }

  if (!hasUnmapped) {
    remainder = weightedSum % 11;
    expectedCheckDigit = remainderToCheckDigit(remainder);
    valid = errors.length === 0 && expectedCheckDigit === actualCheckDigit;
  }

  return {
    normalized,
    valid,
    expectedCheckDigit,
    actualCheckDigit,
    weightedSum,
    remainder,
    details,
    errors,
  };
}
