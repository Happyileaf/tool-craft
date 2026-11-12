import type { FletcherVariant, InputMode } from './utils/fletcher';

export const DEFAULT_TEXT_INPUT = 'abcdefgh';

export const DEFAULT_HEX_INPUT = '61 62 63 64 65 66 67 68';

export const INPUT_MODE_OPTIONS: Array<{ value: InputMode; label: string }> = [
  { value: 'text', label: 'UTF-8 文本' },
  { value: 'hex', label: '十六进制字节' },
];

export const VARIANT_OPTIONS: Array<{ value: FletcherVariant; label: string; modulus: string }> = [
  { value: 'fletcher16', label: 'Fletcher-16', modulus: '模 255，8 位字' },
  { value: 'fletcher32', label: 'Fletcher-32', modulus: '模 65535，16 位字' },
  { value: 'fletcher64', label: 'Fletcher-64', modulus: '模 2³²−1，32 位字' },
];

export const HEX_PLACEHOLDER = '例如：61 62 63 或 0x61,0x62,0x63';
