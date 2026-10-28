import type { SizeStandard } from './utils/file-size';

export type SizeDirection = 'format' | 'parse';

export interface DirectionOption {
  value: SizeDirection;
  label: string;
}

export interface StandardOption {
  value: SizeStandard;
  label: string;
  hint: string;
}

export const DIRECTION_OPTIONS: DirectionOption[] = [
  { value: 'format', label: '字节 → 可读大小' },
  { value: 'parse', label: '可读大小 → 字节' },
];

export const STANDARD_OPTIONS: StandardOption[] = [
  { value: 'iec', label: '二进制 1024（KiB）', hint: '1 KiB = 1024 B，单位 KiB/MiB/GiB…' },
  { value: 'si', label: '十进制 1000（KB）', hint: '1 KB = 1000 B，单位 KB/MB/GB…' },
];

export const DEFAULT_INPUT = '0\n512\n1023\n1024\n1536\n1048576\n1073741824';
