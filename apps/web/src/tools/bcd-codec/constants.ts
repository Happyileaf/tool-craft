import type { BcdMode, BcdScheme } from './utils/bcd';

export interface ModeOption {
  value: BcdMode;
  label: string;
  hint: string;
}

export interface SchemeOption {
  value: BcdScheme;
  label: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'encode', label: '十进制 → 码组', hint: '逐位映射为 4 位二进制码组' },
  { value: 'decode', label: '码组 → 十进制', hint: '空格分隔的 4 位码组还原为数字' },
  { value: 'pack', label: '打包 BCD', hint: '每两位数字压入一个字节，奇数位末 nibble 补 0xF' },
  { value: 'unpack', label: '解包 BCD', hint: '十六进制字节还原为十进制数字' },
];

export const SCHEME_OPTIONS: SchemeOption[] = [
  { value: '8421', label: '8421 加权码' },
  { value: 'excess3', label: '余 3 码（Excess-3）' },
  { value: '2421', label: '2421 加权码' },
];

/** 码组方向示例：十进制 */
export const DEFAULT_DIGITS = '259\n007\n1234';

/** 解码方向示例：8421 码组 */
export const DEFAULT_GROUPS = '0010 0101 1001\n0000 0000 0111';

/** 打包/解包方向示例：十六进制字节 */
export const DEFAULT_PACKED = '12 34\n98 76 5F';
