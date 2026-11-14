/** 七段数码管字形编解码的纯函数 */

import { GLYPH_DEFINITIONS, SEGMENT_NAMES } from '../constants';
import type { GlyphDefinition, SegmentName } from '../constants';

/** 编码选项 */
export interface CodecOptions {
  /** true 为共阴极（段码高电平点亮），false 为共阳极（低电平点亮） */
  activeHigh: boolean;
  /** 段名到位序的映射顺序 */
  order: SegmentName[];
  /** true 表示最高位在字节最左侧 */
  msbFirst: boolean;
}

/** 默认选项：共阴、a→dp、LSB 优先 */
export const DEFAULT_OPTIONS: CodecOptions = {
  activeHigh: true,
  order: [...SEGMENT_NAMES],
  msbFirst: false,
};

/** 小数点对应的规范位 */
const DP_BIT = 1 << SEGMENT_NAMES.indexOf('dp');

/** 单个字符的编码结果 */
export interface EncodedGlyph {
  char: string;
  mask: number;
  byte: number;
  hex: string;
  binary: string;
  segments: SegmentName[];
}

/** 文本编码结果 */
export interface EncodeTextResult {
  glyphs: EncodedGlyph[];
  skipped: string[];
}

/** 字节解码结果 */
export interface DecodeResult {
  mask: number;
  segments: SegmentName[];
  chars: string[];
  baseChars: string[];
  hasDecimalPoint: boolean;
}

const GLYPH_MASKS = new Map<string, number>(
  GLYPH_DEFINITIONS.map((definition) => [
    definition.char,
    segmentsToMask(definition.segments),
  ]),
);

/**
 * 把 a–g 段名串转换为规范位掩码
 */
function segmentsToMask(segments: string): number {
  let mask = 0;
  for (const segment of segments) {
    const index = SEGMENT_NAMES.indexOf(segment as SegmentName);
    if (index >= 0) {
      mask |= 1 << index;
    }
  }
  return mask;
}

/**
 * 查找字符对应的规范位掩码，未收录时回退到大写形式
 */
export function glyphMask(char: string): number | null {
  if (GLYPH_MASKS.has(char)) {
    return GLYPH_MASKS.get(char) ?? null;
  }
  const upper = char.toUpperCase();
  if (GLYPH_MASKS.has(upper)) {
    return GLYPH_MASKS.get(upper) ?? null;
  }
  return null;
}

/**
 * 查找字符的字形定义
 */
export function findGlyph(char: string): GlyphDefinition | null {
  const exact = GLYPH_DEFINITIONS.find((glyph) => glyph.char === char);
  if (exact) {
    return exact;
  }
  return GLYPH_DEFINITIONS.find((glyph) => glyph.char === char.toUpperCase()) ?? null;
}

/**
 * 把规范位掩码展开为点亮的段名列表
 */
export function maskToSegments(mask: number): SegmentName[] {
  return SEGMENT_NAMES.filter((segment) => (mask & (1 << SEGMENT_NAMES.indexOf(segment))) !== 0);
}

/**
 * 按段序、位序与极性把规范位掩码转换为字节
 */
export function byteFromMask(mask: number, options: CodecOptions): number {
  let byte = 0;
  options.order.forEach((segment, index) => {
    const canonicalIndex = SEGMENT_NAMES.indexOf(segment);
    if (canonicalIndex >= 0 && (mask & (1 << canonicalIndex)) !== 0) {
      const position = options.msbFirst ? 7 - index : index;
      byte |= 1 << position;
    }
  });
  return options.activeHigh ? byte : (~byte) & 0xff;
}

/**
 * 按段序、位序与极性把字节还原为规范位掩码
 */
export function maskFromByte(byte: number, options: CodecOptions): number {
  const litByte = options.activeHigh ? byte : (~byte) & 0xff;
  let mask = 0;
  options.order.forEach((segment, index) => {
    const position = options.msbFirst ? 7 - index : index;
    if ((litByte & (1 << position)) !== 0) {
      mask |= 1 << SEGMENT_NAMES.indexOf(segment);
    }
  });
  return mask;
}

/**
 * 格式化为两位大写十六进制
 */
export function formatHex(byte: number): string {
  return `0x${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

/**
 * 格式化为 8 位二进制字符串
 */
export function formatBinary(byte: number): string {
  return byte.toString(2).padStart(8, '0');
}

/**
 * 编码单个字符（含小数点叠加）
 */
function toEncoded(char: string, mask: number, options: CodecOptions): EncodedGlyph {
  const byte = byteFromMask(mask, options);
  return {
    char,
    mask,
    byte,
    hex: formatHex(byte),
    binary: formatBinary(byte),
    segments: maskToSegments(mask),
  };
}

/**
 * 把文本逐字符编码为段码，小数点会叠加到前一个字形上
 */
export function encodeText(text: string, options: CodecOptions): EncodeTextResult {
  const items: { char: string; mask: number }[] = [];
  const skipped: string[] = [];

  for (const char of text) {
    if (char === '.') {
      const previous = items[items.length - 1];
      if (previous) {
        previous.mask |= DP_BIT;
      } else {
        skipped.push(char);
      }
      continue;
    }
    if (char === ' ') {
      items.push({ char, mask: 0 });
      continue;
    }
    const mask = glyphMask(char);
    if (mask === null) {
      skipped.push(char);
    } else {
      items.push({ char, mask });
    }
  }

  return { glyphs: items.map((item) => toEncoded(item.char, item.mask, options)), skipped };
}

/**
 * 把字节解码为可能的字形，同时返回去掉小数点后的基础字形
 */
export function decodeByte(byte: number, options: CodecOptions): DecodeResult {
  const mask = maskFromByte(byte, options);
  const baseMask = mask & ~DP_BIT;
  const chars = GLYPH_DEFINITIONS.filter((glyph) => glyphMask(glyph.char) === mask).map(
    (glyph) => glyph.char,
  );
  const baseChars = GLYPH_DEFINITIONS.filter(
    (glyph) => glyphMask(glyph.char) === baseMask,
  ).map((glyph) => glyph.char);

  return {
    mask,
    segments: maskToSegments(mask),
    chars,
    baseChars,
    hasDecimalPoint: (mask & DP_BIT) !== 0,
  };
}

/**
 * 解析用户输入的字节值，支持 0x 十六进制、0b 二进制与十进制
 */
export function parseByteInput(input: string): number {
  const text = input.trim();
  if (text === '') {
    throw new Error('请输入字节值，例如 0x3F、0b00111111 或 63');
  }
  const lower = text.toLowerCase();
  let value: number;

  if (lower.startsWith('0b')) {
    if (!/^0b[01]{1,8}$/.test(lower)) {
      throw new Error('二进制格式应为 0b 加上最多 8 位 0/1');
    }
    value = Number.parseInt(lower.slice(2), 2);
  } else if (lower.startsWith('0x')) {
    if (!/^0x[0-9a-f]{1,2}$/.test(lower)) {
      throw new Error('十六进制格式应为 0x 加上 1–2 位十六进制数字');
    }
    value = Number.parseInt(lower.slice(2), 16);
  } else if (/^\d{1,3}$/.test(lower)) {
    value = Number(lower);
  } else if (/^[0-9a-f]{1,2}$/.test(lower)) {
    value = Number.parseInt(lower, 16);
  } else {
    throw new Error('无法识别字节值，支持 0x3F、0b00111111、63 或 3F');
  }

  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new Error('字节值需在 0–255 范围内');
  }
  return value;
}

/**
 * 取得同一字形在共阴与共阳下的默认段码
 */
export function getBytePair(mask: number): { cathode: number; anode: number } {
  return {
    cathode: byteFromMask(mask, DEFAULT_OPTIONS),
    anode: byteFromMask(mask, { ...DEFAULT_OPTIONS, activeHigh: false }),
  };
}
