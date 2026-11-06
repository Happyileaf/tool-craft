import type { BomMode } from './utils/bom';

/**
 * BOM 处理模式选项
 */
export const MODE_OPTIONS: ReadonlyArray<{ label: string; value: BomMode; description: string }> = [
  {
    label: '仅检测',
    value: 'detect',
    description: '不改写文本，只报告 BOM 状态与字节统计',
  },
  {
    label: '添加 BOM',
    value: 'add',
    description: '在开头插入 U+FEFF（已有 BOM 时不重复添加）',
  },
  {
    label: '剥离开头 BOM',
    value: 'strip-leading',
    description: '仅移除开头的一个 U+FEFF，内部保留',
  },
  {
    label: '剥离全部 U+FEFF',
    value: 'strip-all',
    description: '移除文本中所有 U+FEFF（含内部零宽字符）',
  },
];

/**
 * 默认示例输入（带开头 BOM 与一个内部 U+FEFF）
 */
export const DEFAULT_INPUT = '﻿name, city\nAlice, New York﻿\nBob, London';

/**
 * 输入框占位提示
 */
export const INPUT_PLACEHOLDER = '粘贴或输入需要检测 / 处理 BOM 的文本';
