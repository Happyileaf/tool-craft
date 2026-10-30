import type { UuMode } from './utils/uuencode';

/** uuencode 工具内常量 */

export interface ModeOption {
  value: UuMode;
  label: string;
  hint: string;
}

/** 编解码方向选择项 */
export const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'encode',
    label: '编码（文本 → uuencode）',
    hint: '文本按 UTF-8 编码为字节，每 45 字节折行并包裹 begin/end',
  },
  {
    value: 'decode',
    label: '解码（uuencode → 文本）',
    hint: '解析 begin 行的权限与文件名，反引号与空格均按 6 位零值处理',
  },
];

/** 默认输入：超过 45 字节的多行英文文本，用于演示自动折行 */
export const DEFAULT_INPUT =
  'The quick brown fox jumps over the lazy dog.\n' +
  'The quick brown fox jumps over the lazy dog.';

/** begin 行默认文件名 */
export const DEFAULT_FILENAME = 'file';

/** begin 行默认权限模式（三位八进制） */
export const DEFAULT_MODE = '644';
