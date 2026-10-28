import type { EanMode } from './utils/ean13';

export interface ModeOption {
  value: EanMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'ean13', label: 'EAN-13（12/13 位）', hint: '输入 12 位补全校验位，输入 13 位校验合法性' },
  { value: 'upca', label: 'UPC-A（11/12 位）', hint: '输入 11 位补全校验位，输入 12 位校验合法性' },
];

export const DEFAULT_INPUT = '590123412345\n400638133393\n5901234123457';
