import type { BitWidth, BinaryOp, ShiftOp } from './utils/bitmask';

/** 可选位宽 */
export const WIDTH_OPTIONS: { value: BitWidth; label: string }[] = [
  { value: 8, label: '8 位（byte）' },
  { value: 16, label: '16 位（word）' },
  { value: 32, label: '32 位（dword）' },
  { value: 64, label: '64 位（qword）' },
];

/** 双掩码运算选项 */
export const BINARY_OP_OPTIONS: { value: BinaryOp; label: string }[] = [
  { value: 'and', label: 'AND（与）' },
  { value: 'or', label: 'OR（或）' },
  { value: 'xor', label: 'XOR（异或）' },
];

/** 移位运算选项 */
export const SHIFT_OP_OPTIONS: { value: ShiftOp; label: string }[] = [
  { value: 'shl', label: 'SHL 逻辑左移' },
  { value: 'shr-logical', label: 'SHR 逻辑右移' },
  { value: 'shr-arithmetic', label: 'SAR 算术右移' },
  { value: 'rotl', label: 'ROL 循环左移' },
  { value: 'rotr', label: 'ROR 循环右移' },
];

/** 进制输入选项 */
export const BASE_OPTIONS = [
  { value: 10, label: '十进制 DEC' },
  { value: 16, label: '十六进制 HEX（0x）' },
  { value: 8, label: '八进制 OCT（0o）' },
  { value: 2, label: '二进制 BIN（0b）' },
] as const;
