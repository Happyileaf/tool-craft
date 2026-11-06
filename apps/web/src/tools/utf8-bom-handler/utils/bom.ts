/**
 * UTF-8 BOM（Byte Order Mark，U+FEFF）处理纯函数集合。
 * BOM 在 UTF-8 编码下固定为字节序列 EF BB BF（3 字节）。
 * 全部函数不依赖 DOM，可在主线程与测试环境直接运行。
 */

/** BOM 字符（零宽不换行空格 ZERO WIDTH NO-BREAK SPACE） */
export const BOM_CHAR = '﻿';

/** BOM 的 UTF-8 字节序列 */
export const BOM_BYTES = [0xef, 0xbb, 0xbf] as const;

/** BOM 占用的 UTF-8 字节数 */
export const BOM_BYTE_LENGTH = 3;

/**
 * BOM 处理模式
 * - detect：仅检测，不修改文本
 * - add：在开头添加 BOM（幂等，已有 BOM 不重复添加）
 * - strip-leading：仅剥离开头的一个 BOM
 * - strip-all：剥离文本中全部 U+FEFF
 */
export type BomMode = 'detect' | 'add' | 'strip-leading' | 'strip-all';

/**
 * BOM 检测结果
 */
export interface BomAnalysis {
  /** 开头是否带 BOM */
  hasLeadingBom: boolean;
  /** 文本内部（不含开头）出现 U+FEFF 的次数 */
  innerBomCount: number;
  /** 全文 U+FEFF 总数 */
  totalBomCount: number;
  /** 当前文本的 UTF-8 字节长度 */
  byteLength: number;
  /** 去除全部 U+FEFF 后的 UTF-8 字节长度 */
  byteLengthWithoutBom: number;
}

/**
 * 使用 TextEncoder 计算字符串的 UTF-8 字节长度；
 * 在不支持 TextEncoder 的环境回退到 Blob 估算（测试环境通常原生支持）。
 *
 * @param text - 输入文本
 * @returns UTF-8 编码后的字节数
 */
export function getUtf8ByteLength(text: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text).length;
  }
  return new Blob([text]).size;
}

/**
 * 统计字符串中 U+FEFF 的出现次数。
 *
 * @param text - 输入文本
 * @returns U+FEFF 出现次数
 */
export function countBom(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === BOM_CHAR) {
      count += 1;
    }
  }
  return count;
}

/**
 * 检测文本的 BOM 状态与字节信息。
 *
 * @param text - 输入文本
 * @returns 结构化检测结果
 */
export function analyzeBom(text: string): BomAnalysis {
  const hasLeadingBom = text.startsWith(BOM_CHAR);
  const totalBomCount = countBom(text);
  const innerBomCount = totalBomCount - (hasLeadingBom ? 1 : 0);
  const byteLength = getUtf8ByteLength(text);
  const byteLengthWithoutBom = byteLength - totalBomCount * BOM_BYTE_LENGTH;
  return {
    hasLeadingBom,
    innerBomCount,
    totalBomCount,
    byteLength,
    byteLengthWithoutBom,
  };
}

/**
 * 按指定模式处理 BOM。
 *
 * @param text - 输入文本
 * @param mode - 处理模式
 * @returns 处理后的文本
 */
export function processBom(text: string, mode: BomMode): string {
  switch (mode) {
    case 'detect':
      return text;
    case 'add':
      return text.startsWith(BOM_CHAR) ? text : BOM_CHAR + text;
    case 'strip-leading':
      return text.startsWith(BOM_CHAR) ? text.slice(BOM_CHAR.length) : text;
    case 'strip-all':
      return text.split(BOM_CHAR).join('');
    default:
      return text;
  }
}
