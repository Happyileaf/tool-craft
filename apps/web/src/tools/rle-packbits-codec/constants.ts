/**
 * RLE / PackBits 编解码器常量
 */
import type { RleDirection, RleMode } from './utils/rle';

export interface ModeOption {
  value: RleMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'text',
    label: '文本 RLE',
    hint: '格式为「计数 + 字符」（如 AAAA → 4A），计数为 1 时省略；逐行处理，注意数字字符会与计数字段歧义，不建议处理含数字的文本',
  },
  {
    value: 'byte',
    label: '字节级 RLE',
    hint: '输入按 UTF-8 字节序列处理，每个游程为「1 字节计数（1..255）+ 1 字节数据」，产物以十六进制展示，解码时粘贴 Hex',
  },
  {
    value: 'packbits',
    label: 'PackBits',
    hint: 'Apple PackBits 变体：重复 n 字节 → -(n-1) 标记 + 数据字节；连续字面量 → (n-1) 标记 + n 字节，产物以十六进制展示',
  },
];

export const DIRECTION_OPTIONS: { label: string; value: RleDirection }[] = [
  { label: '编码', value: 'encode' },
  { label: '解码', value: 'decode' },
];

export const DEFAULT_INPUT = 'AAAABBBCCCC\nHello, RLE!\n没有重复就会膨胀的文本';
