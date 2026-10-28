/**
 * basE91 编解码工具内常量
 */

/** 编解码方向 */
export enum CodecModeEnum {
  /** 文本/字节编码为 basE91 */
  ENCODE = 'encode',
  /** basE91 解码为文本/字节 */
  DECODE = 'decode',
}

/** 输入载体类型 */
export enum InputTypeEnum {
  /** UTF-8 文本 */
  TEXT = 'text',
  /** 十六进制字节 */
  HEX = 'hex',
}

/** 编解码方向选择项数据源 */
export const MODE_OPTIONS: { label: string; value: CodecModeEnum }[] = [
  { label: '编码（文本/字节 → basE91）', value: CodecModeEnum.ENCODE },
  { label: '解码（basE91 → 文本/字节）', value: CodecModeEnum.DECODE },
];

/** 输入载体选择项数据源 */
export const INPUT_TYPE_OPTIONS: { label: string; value: InputTypeEnum }[] = [
  { label: '文本（UTF-8）', value: InputTypeEnum.TEXT },
  { label: '十六进制字节', value: InputTypeEnum.HEX },
];

/** 编码方向的默认示例文本（官方向量） */
export const DEFAULT_TEXT = 'The quick brown fox jumps over the lazy dog';

/** 编码方向的默认示例十六进制（"Hi"） */
export const DEFAULT_HEX = '48 69';

/** 解码方向的默认示例 basE91 字符串（官方向量） */
export const DEFAULT_BASE91 = 'nX^Iz?T1s!2t:aRn#o>vf>6C9#`##mlLK#_1:Wzv;RG!,a%q3Lc=Z';
