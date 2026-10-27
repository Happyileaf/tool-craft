/**
 * ASCII 码表工具常量
 */

/** 分类筛选项 */
export const CATEGORY_OPTIONS: { label: string; value: 'all' | 'control' | 'printable' | 'delete' }[] = [
  { label: '全部（0–127）', value: 'all' },
  { label: '控制字符（0–31）', value: 'control' },
  { label: '可打印字符（32–126）', value: 'printable' },
  { label: 'DEL（127）', value: 'delete' },
];

/** 双向检索框占位提示 */
export const LOOKUP_PLACEHOLDER = '输入字符（如 A）、十进制（65）或十六进制（0x41 / 41h）';

/** 码表每页行数 */
export const TABLE_PAGE_SIZE = 16;
