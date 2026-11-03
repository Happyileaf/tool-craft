/**
 * 字节数组代码生成器常量
 */

/** 输入数据类型 */
export type InputType = 'hex' | 'base64' | 'text';

/** 目标语言 */
export type Language = 'c' | 'java' | 'python' | 'go';

/** 输入类型选项 */
export const INPUT_TYPES: Array<{ label: string; value: InputType }> = [
  { label: 'Hex', value: 'hex' },
  { label: 'Base64', value: 'base64' },
  { label: '文本（UTF-8）', value: 'text' },
];

/** 目标语言选项 */
export const LANGUAGES: Array<{ label: string; value: Language }> = [
  { label: 'C / C++（unsigned char[]）', value: 'c' },
  { label: 'Java（byte[]）', value: 'java' },
  { label: 'Python（bytes）', value: 'python' },
  { label: 'Go（[]byte）', value: 'go' },
];

/** 默认每行字节数 */
export const DEFAULT_BYTES_PER_LINE = 12;

/** 每行字节数可选范围 */
export const MIN_BYTES_PER_LINE = 1;
export const MAX_BYTES_PER_LINE = 64;

/** 默认变量名 */
export const DEFAULT_VARIABLE_NAME = 'data';

/** 生成模式示例输入（"Hello, 世界" 的 Hex） */
export const EXAMPLE_HEX = '48 65 6C 6C 6F 2C 20 E4 B8 96 E7 95 8C';

/** 反向解析模式示例：C 风格数组 */
export const EXAMPLE_ARRAY_LITERAL = `const unsigned char data[] = {
  0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x2C, 0x20,
  0xE4, 0xB8, 0x96, 0xE7, 0x95, 0x8C
};`;

/** 文件读取大小上限（字节），防止误传超大文件卡死页面 */
export const MAX_FILE_BYTES = 1_048_576;
