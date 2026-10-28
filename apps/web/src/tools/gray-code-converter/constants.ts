import type { GrayMode } from './utils/grayCode';

export interface ModeOption {
  value: GrayMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'bin2gray', label: '二进制 → Gray', hint: 'G = B xor (B >> 1)' },
  { value: 'gray2bin', label: 'Gray → 二进制', hint: '从最高位起逐位异或累加还原' },
];

export const DEFAULT_INPUT = '110110';
