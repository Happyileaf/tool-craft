/**
 * Base45 编解码工具内常量
 */

/** 编解码方向 */
export enum CodecModeEnum {
  /** 文本编码为 Base45 */
  ENCODE = 'encode',
  /** Base45 解码为文本 */
  DECODE = 'decode',
}

/** 编解码方向选择项数据源 */
export const MODE_OPTIONS: { label: string; value: CodecModeEnum }[] = [
  { label: '编码（文本 → Base45）', value: CodecModeEnum.ENCODE },
  { label: '解码（Base45 → 文本）', value: CodecModeEnum.DECODE },
];

/** 编码方向的默认示例文本（RFC 9285 官方向量） */
export const DEFAULT_TEXT = 'Hello!!';

/** 解码方向的默认示例 Base45 字符串（RFC 9285 官方向量） */
export const DEFAULT_BASE45 = '%69 VD92EX0';
