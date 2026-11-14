/** 七段数码管工具的内置常量与字形表 */

/** 段名，a–g 为七个笔画，dp 为小数点 */
export type SegmentName = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'dp';

/** 段名的标准顺序（a 为最低位，dp 为最高位） */
export const SEGMENT_NAMES: SegmentName[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'];

/** 段序预设 */
export const SEGMENT_ORDER_OPTIONS = [
  { label: 'a→g→dp（dp 最高位）', value: 'a-to-dp' },
  { label: 'dp→g→a（dp 最低位）', value: 'dp-to-a' },
];

/** 位序选项 */
export const BIT_ORDER_OPTIONS = [
  { label: 'MSB 优先（最高位在最左）', value: 'msb' },
  { label: 'LSB 优先（最低位在最左）', value: 'lsb' },
];

/** 字形定义：字符与其点亮的段 */
export interface GlyphDefinition {
  char: string;
  segments: string;
  label: string;
}

/**
 * 常见七段数码管字形表（段名按 a,b,c,d,e,f,g 顺序书写，dp 单独叠加）
 * 字母按数码管惯例使用大写 A/C/E/F 与小写 b/d 以区分字形
 */
export const GLYPH_DEFINITIONS: GlyphDefinition[] = [
  { char: '0', segments: 'abcdef', label: '数字 0' },
  { char: '1', segments: 'bc', label: '数字 1' },
  { char: '2', segments: 'abdeg', label: '数字 2' },
  { char: '3', segments: 'abcdg', label: '数字 3' },
  { char: '4', segments: 'bcfg', label: '数字 4' },
  { char: '5', segments: 'acdfg', label: '数字 5' },
  { char: '6', segments: 'acdefg', label: '数字 6' },
  { char: '7', segments: 'abc', label: '数字 7' },
  { char: '8', segments: 'abcdefg', label: '数字 8' },
  { char: '9', segments: 'abcdfg', label: '数字 9' },
  { char: 'A', segments: 'abcefg', label: '十六进制 A' },
  { char: 'b', segments: 'cdefg', label: '十六进制 b' },
  { char: 'C', segments: 'adef', label: '十六进制 C' },
  { char: 'd', segments: 'bcdeg', label: '十六进制 d' },
  { char: 'E', segments: 'adefg', label: '十六进制 E' },
  { char: 'F', segments: 'aefg', label: '十六进制 F' },
  { char: 'G', segments: 'acdefg', label: '字母 G' },
  { char: 'H', segments: 'bcefg', label: '字母 H' },
  { char: 'h', segments: 'cefg', label: '小写 h' },
  { char: 'J', segments: 'bcde', label: '字母 J' },
  { char: 'L', segments: 'def', label: '字母 L' },
  { char: 'n', segments: 'ceg', label: '小写 n' },
  { char: 'o', segments: 'cdeg', label: '小写 o' },
  { char: 'P', segments: 'abefg', label: '字母 P' },
  { char: 'r', segments: 'efg', label: '小写 r' },
  { char: 'S', segments: 'acdfg', label: '字母 S' },
  { char: 't', segments: 'defg', label: '小写 t' },
  { char: 'U', segments: 'bcdef', label: '字母 U' },
  { char: 'y', segments: 'bcdefg', label: '小写 y' },
  { char: '-', segments: 'g', label: '连字符' },
  { char: '_', segments: 'd', label: '下划线' },
  { char: '=', segments: 'dg', label: '等号' },
  { char: ' ', segments: '', label: '空白' },
];

/** 默认示例字符 */
export const DEFAULT_SAMPLE_TEXT = 'A.8';

/** 反向解析的默认字节 */
export const DEFAULT_BYTE_INPUT = '0x3F';

/** 单次最多展示的字形数量 */
export const MAX_GLYPHS = 12;
