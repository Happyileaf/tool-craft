/**
 * SMS 短信长度与分段计算内核（3GPP TS 23.038 / TS 23.040）
 *
 * 纯本地零依赖：
 * - 自动判定编码：全部字符可由 GSM 7-bit 基本字母表（含扩展表）表示时走 7-bit，
 *   否则整信走 UCS-2
 * - GSM 7-bit 按 septet 计数，扩展表字符（^{}\[~]|€）占 2 septet
 * - UCS-2 按 UTF-16 码元计数（BMP 外字符如多数 emoji 占 2 码元）
 * - 拼接（concatenated）短信每条要扣除 UDH 开销：7-bit 153 / 条，UCS-2 67 / 条
 */

import {
  GSM_BASE_CHARS,
  GSM_CONCAT_SEGMENT_MAX,
  GSM_EXTENSION_CHARS,
  GSM_SINGLE_MAX,
  UCS2_CONCAT_SEGMENT_MAX,
  UCS2_SINGLE_MAX,
} from '../constants';

/** SMS 编码方式 */
export type SmsEncoding = 'gsm7' | 'ucs2';

/** 非 GSM 字符定位信息 */
export interface NonGsmChar {
  /** 出错字符 */
  char: string;
  /** 在原文中的位置（按 UTF-16 码元） */
  index: number;
}

/** 分段计算结果 */
export interface SmsAnalysis {
  /** 采用的编码方式；空文本时为 null */
  encoding: SmsEncoding | null;
  /** 计费使用的字符 / septet 总量：GSM 为 septet 数，UCS-2 为 UTF-16 码元数 */
  totalUnits: number;
  /** 文本的 UTF-16 码元长度 */
  charCount: number;
  /** 分条数量（0 表示空文本） */
  segments: number;
  /** 当前编码下每条可用容量 */
  perSegmentMax: number;
  /** 是否为拼接长短信（>1 条） */
  isConcatenated: boolean;
  /** 触发 UCS-2 的非 GSM 字符（最多展示前若干个） */
  nonGsmChars: NonGsmChar[];
}

/** 构造 GSM 字符集合，避免每次重复构造 */
const GSM_BASE_SET = new Set(GSM_BASE_CHARS);
const GSM_EXTENSION_SET = new Set(GSM_EXTENSION_CHARS);

/**
 * 扫描文本中的非 GSM 7-bit 字符
 *
 * @param text - 短信原文
 * @param limit - 最多返回的非 GSM 字符数
 * @returns 非 GSM 字符及其位置列表
 */
export function findNonGsmChars(text: string, limit = 20): NonGsmChar[] {
  const result: NonGsmChar[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === undefined) {
      continue;
    }
    if (!GSM_BASE_SET.has(char) && !GSM_EXTENSION_SET.has(char)) {
      result.push({ char, index });
      if (result.length >= limit) {
        break;
      }
    }
  }
  return result;
}

/**
 * 计算 GSM 7-bit 编码占用的 septet 总数（扩展表字符算 2）
 *
 * @param text - 短信原文（假定全部可由 GSM 字符集表示）
 * @returns septet 总数
 */
export function countGsmSeptets(text: string): number {
  let septets = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === undefined) {
      continue;
    }
    septets += GSM_EXTENSION_SET.has(char) ? 2 : 1;
  }
  return septets;
}

/**
 * 综合分析短信文本的编码、长度与分段
 *
 * @param text - 短信原文
 * @returns 分段分析结果
 */
export function analyzeSms(text: string): SmsAnalysis {
  const charCount = text.length;
  if (charCount === 0) {
    return {
      encoding: null,
      totalUnits: 0,
      charCount: 0,
      segments: 0,
      perSegmentMax: 0,
      isConcatenated: false,
      nonGsmChars: [],
    };
  }

  const nonGsmChars = findNonGsmChars(text);
  const encoding: SmsEncoding = nonGsmChars.length > 0 ? 'ucs2' : 'gsm7';

  if (encoding === 'gsm7') {
    const totalUnits = countGsmSeptets(text);
    // 注意：是否单条只看总量是否 ≤160；即便其中含扩展字符，
    // 只要不超过 160 septet 就仍是单条（扩展字符只是多占 septet，不强制拼接）
    const single = totalUnits <= GSM_SINGLE_MAX;
    if (single) {
      return {
        encoding,
        totalUnits,
        charCount,
        segments: 1,
        perSegmentMax: GSM_SINGLE_MAX,
        isConcatenated: false,
        nonGsmChars: [],
      };
    }
    return {
      encoding,
      totalUnits,
      charCount,
      segments: Math.ceil(totalUnits / GSM_CONCAT_SEGMENT_MAX),
      perSegmentMax: GSM_CONCAT_SEGMENT_MAX,
      isConcatenated: true,
      nonGsmChars: [],
    };
  }

  // UCS-2：按 UTF-16 码元数（String.length）计
  const totalUnits = charCount;
  if (totalUnits <= UCS2_SINGLE_MAX) {
    return {
      encoding,
      totalUnits,
      charCount,
      segments: 1,
      perSegmentMax: UCS2_SINGLE_MAX,
      isConcatenated: false,
      nonGsmChars,
    };
  }
  return {
    encoding,
    totalUnits,
    charCount,
    segments: Math.ceil(totalUnits / UCS2_CONCAT_SEGMENT_MAX),
    perSegmentMax: UCS2_CONCAT_SEGMENT_MAX,
    isConcatenated: true,
    nonGsmChars,
  };
}

/**
 * 返回当前编码在单条 / 多条两种形态下的容量，供 UI 展示边界
 */
export function getCapacityBounds(encoding: SmsEncoding): { single: number; concat: number } {
  return encoding === 'gsm7'
    ? { single: GSM_SINGLE_MAX, concat: GSM_CONCAT_SEGMENT_MAX }
    : { single: UCS2_SINGLE_MAX, concat: UCS2_CONCAT_SEGMENT_MAX };
}
