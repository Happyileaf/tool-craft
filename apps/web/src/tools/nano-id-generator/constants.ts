/**
 * Nano ID 生成器内常量
 */
import { DEFAULT_ALPHABET, DEFAULT_SIZE } from './utils/nanoid';

/** 长度选项 */
export const SIZE_OPTIONS: { label: string; value: number }[] = [
  { label: '12', value: 12 },
  { label: '21（默认）', value: DEFAULT_SIZE },
  { label: '32', value: 32 },
  { label: '64', value: 64 },
];

/** 数量选项 */
export const COUNT_OPTIONS: { label: string; value: number }[] = [
  { label: '1', value: 1 },
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '20', value: 20 },
];

/** 默认字母表（URL-safe，64 字符） */
export { DEFAULT_ALPHABET };

/** 默认长度 */
export { DEFAULT_SIZE };

/** 默认生成数量 */
export const DEFAULT_COUNT = 5;

/** 字母表预设 */
export const ALPHABET_PRESETS: { label: string; value: string }[] = [
  { label: '默认（A-Za-z0-9_-）', value: DEFAULT_ALPHABET },
  { label: '仅数字（0-9）', value: '0123456789' },
  { label: '小写字母数字（a-z0-9）', value: 'abcdefghijklmnopqrstuvwxyz0123456789' },
  { label: '十六进制小写（0-9a-f）', value: '0123456789abcdef' },
  { label: '自定义', value: '__custom__' },
];
