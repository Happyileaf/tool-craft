/**
 * 补码计算器工具内常量
 */

import type { BitWidth, TwosComplementOperation } from './utils/twos-complement';

/** 默认字长 */
export const DEFAULT_WIDTH: BitWidth = 8;

/** 默认十进制数值 */
export const DEFAULT_DECIMAL_INPUT = '-42';

/** 默认位模式输入 */
export const DEFAULT_BITS_INPUT = '0b11010110';

/** 默认运算操作数 a */
export const DEFAULT_OPERAND_A = '100';

/** 默认运算操作数 b */
export const DEFAULT_OPERAND_B = '27';

/** 默认运算类型 */
export const DEFAULT_OPERATION: TwosComplementOperation = 'add';

/** 字长选择项 */
export const WIDTH_OPTIONS = [
  { label: '8 位（int8_t）', value: 8 },
  { label: '16 位（int16_t）', value: 16 },
  { label: '32 位（int32_t）', value: 32 },
  { label: '64 位（int64_t）', value: 64 },
];

/** 运算类型选项 */
export const OPERATION_OPTIONS: readonly {
  label: string;
  value: TwosComplementOperation;
}[] = [
  { label: '加 a + b', value: 'add' },
  { label: '减 a − b', value: 'sub' },
  { label: '乘 a × b', value: 'mul' },
  { label: '左移 a << b', value: 'shl' },
  { label: '算术右移 a >> b', value: 'sar' },
  { label: '逻辑右移 a >>> b', value: 'shr' },
];
