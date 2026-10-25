/**
 * Ascii85 编解码工具内常量
 */

/** 编解码方向 */
export enum CodecModeEnum {
  /** 文本编码为 Ascii85 */
  ENCODE = 'encode',
  /** Ascii85 解码为文本 */
  DECODE = 'decode',
}

/** 编解码方向选择项数据源 */
export const MODE_OPTIONS: { label: string; value: CodecModeEnum }[] = [
  { label: '编码（文本 → Ascii85）', value: CodecModeEnum.ENCODE },
  { label: '解码（Ascii85 → 文本）', value: CodecModeEnum.DECODE },
];

/** Ascii85 字母表变体 */
export enum VariantEnum {
  /** 标准 Ascii85（Adobe/PostScript，<~ ~> 定界，z 压缩） */
  STANDARD = 'standard',
  /** btoa v4.2（xbtoa Begin/End 定界，额外支持 y=4 空格） */
  BTOA = 'btoa',
}

/** 变体选择项数据源 */
export const VARIANT_OPTIONS: { label: string; value: VariantEnum }[] = [
  { label: '标准 Ascii85（Adobe）', value: VariantEnum.STANDARD },
  { label: 'btoa v4.2', value: VariantEnum.BTOA },
];

/** 编码方向的默认示例文本 */
export const DEFAULT_TEXT = 'foobar';

/** 解码方向的默认示例 Ascii85 字符串 */
export const DEFAULT_ASCII85 = '<~AoDTs@<)~>';
