/**
 * 盲文编解码器常量
 */

/** 默认样例输入 */
export const DEFAULT_INPUT = 'hello 2026';

/** 编解码方向 */
export type BrailleDirection = 'encode' | 'decode';

/** 方向选项 */
export const DIRECTION_OPTIONS: { value: BrailleDirection; label: string }[] = [
  { value: 'encode', label: '文本 → 盲文' },
  { value: 'decode', label: '盲文 → 文本' },
];
