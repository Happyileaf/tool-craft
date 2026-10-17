/**
 * Base32 编解码工具内常量
 */

/** 编解码方向 */
export enum CodecModeEnum {
  /** 文本编码为 Base32 */
  ENCODE = 'encode',
  /** Base32 解码为文本 */
  DECODE = 'decode',
}

/** 编解码方向选择项数据源 */
export const MODE_OPTIONS: { label: string; value: CodecModeEnum }[] = [
  { label: '编码（文本 → Base32）', value: CodecModeEnum.ENCODE },
  { label: '解码（Base32 → 文本）', value: CodecModeEnum.DECODE },
];

/** 编码方向的默认示例文本 */
export const DEFAULT_TEXT = 'foobar';

/** 解码方向的默认示例 Base32 字符串 */
export const DEFAULT_BASE32 = 'MZXW6YTBOI======';
