/**
 * NATO 音标字母转换工具内常量
 */

/** 转换方向 */
export enum PhoneticModeEnum {
  /** 普通文本拼写为音标单词 */
  ENCODE = 'encode',
  /** 音标单词还原为普通文本 */
  DECODE = 'decode',
}

/** 转换方向选择项数据源 */
export const MODE_OPTIONS: { label: string; value: PhoneticModeEnum }[] = [
  { label: '拼写（文本 → 音标）', value: PhoneticModeEnum.ENCODE },
  { label: '还原（音标 → 文本）', value: PhoneticModeEnum.DECODE },
];

/** 编码方向的默认示例文本 */
export const DEFAULT_TEXT = 'TRAE 42';

/** 解码方向的默认示例音标（由示例文本拼写生成，保证向量合法） */
export const DEFAULT_PHONETIC =
  'Tango Romeo Alfa Echo / Four Two';

/** 单词分隔符（音标串中区分不同源单词） */
export const WORD_SEPARATOR = '/';
