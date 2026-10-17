/**
 * 进制互转与位运算工具内常量
 */
import {
  BitwiseOpEnum,
  ShiftDirectionEnum,
  type SupportedBase,
  type SupportedWidth,
} from './utils/base';

/** 进制互转区块的默认输入值（十进制 255） */
export const DEFAULT_INPUT = '255';

/** 位运算区块的默认右操作数 */
export const DEFAULT_OPERAND_B = '16';

/** 进制选择项数据源 */
export const BASE_OPTIONS: { label: string; value: SupportedBase }[] = [
  { label: '二进制 (2)', value: 2 },
  { label: '八进制 (8)', value: 8 },
  { label: '十进制 (10)', value: 10 },
  { label: '十六进制 (16)', value: 16 },
];

/** 位宽选择项数据源 */
export const WIDTH_OPTIONS: { label: string; value: SupportedWidth }[] = [
  { label: '8 位', value: 8 },
  { label: '16 位', value: 16 },
  { label: '32 位', value: 32 },
  { label: '64 位', value: 64 },
];

/** 二元位运算选择项数据源 */
export const BITWISE_OP_OPTIONS: { label: string; value: BitwiseOpEnum }[] = [
  { label: 'AND（按位与）', value: BitwiseOpEnum.AND },
  { label: 'OR（按位或）', value: BitwiseOpEnum.OR },
  { label: 'XOR（按位异或）', value: BitwiseOpEnum.XOR },
];

/** 一元运算模式 */
export enum UnaryOpEnum {
  /** 按位取反 */
  NOT = 'not',
  /** 左移 */
  SHL = 'shl',
  /** 右移 */
  SHR = 'shr',
}

/** 一元运算选择项数据源 */
export const UNARY_OP_OPTIONS: { label: string; value: UnaryOpEnum }[] = [
  { label: 'NOT（按位取反）', value: UnaryOpEnum.NOT },
  { label: '左移 <<', value: UnaryOpEnum.SHL },
  { label: '右移 >>', value: UnaryOpEnum.SHR },
];

/** 位移方向的展示标签 */
export const SHIFT_DIRECTION_LABELS: Record<ShiftDirectionEnum, string> = {
  [ShiftDirectionEnum.LEFT]: '左移',
  [ShiftDirectionEnum.RIGHT]: '右移',
};
