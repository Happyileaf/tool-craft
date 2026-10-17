/**
 * Lorem Ipsum generator 工具内常量
 */

import type { LoremUnit } from './utils/lorem';

/**
 * 生成计量单位选项，供单位选择控件渲染
 */
export const LOREM_UNIT_OPTIONS: { label: string; value: LoremUnit }[] = [
  { label: '段落', value: 'paragraph' },
  { label: '句子', value: 'sentence' },
  { label: '单词', value: 'word' },
];

/**
 * 默认生成单位
 */
export const DEFAULT_LOREM_UNIT: LoremUnit = 'paragraph';

/**
 * 默认生成数量
 */
export const DEFAULT_LOREM_COUNT = 3;

/**
 * 默认是否以经典开头起始
 */
export const DEFAULT_START_WITH_CLASSIC = true;
