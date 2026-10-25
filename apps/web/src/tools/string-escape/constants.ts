/**
 * 编程语言字符串字面量转义 / 反转义工具内常量
 */

import type { EscapeLanguage } from './utils/escape';

/** 转义：原始文本 → 字面量内容 */
export const DIRECTION_ESCAPE = 'escape' as const;

/** 反转义：字面量内容 → 原始文本 */
export const DIRECTION_UNESCAPE = 'unescape' as const;

/** 语言选项描述 */
export interface LanguageOption {
  /** 控件值 */
  value: EscapeLanguage;
  /** 展示标签 */
  label: string;
  /** 语言说明 */
  hint: string;
}

/** 语言候选列表 */
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    value: 'js',
    label: 'JavaScript / JSON',
    hint: '支持 \\n \\t \\uXXXX、\\u{码点} 与 JSON 的 \\/ 序列',
  },
  {
    value: 'python',
    label: 'Python',
    hint: '支持 \\n \\t \\xHH、\\Uxxxxxxxx、\\a \\v 与行连接反斜杠',
  },
  {
    value: 'java',
    label: 'Java',
    hint: '支持 \\n \\t \\uXXXX 等双引号字面量转义',
  },
];

/** 工具首次载入的原始文本示例 */
export const DEFAULT_RAW_SAMPLE = `第一行 "quoted"
第二行	with tab
路径 C:\\temp\\new、中文与 emoji 😀`;

/** 工具首次载入的转义文本示例 */
export const DEFAULT_ESCAPED_SAMPLE =
  '第一行 \\"quoted\\"\\n第二行\\twith tab\\n路径 C:\\\\temp\\\\new、中文与 emoji \\ud83d\\ude00';
