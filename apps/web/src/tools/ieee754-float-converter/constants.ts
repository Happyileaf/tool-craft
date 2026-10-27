/**
 * IEEE 754 浮点数转换器常量定义
 */

/** 浮点精度 */
export enum PrecisionEnum {
  /** 单精度 32 位 */
  SINGLE_32 = 'single32',
  /** 双精度 64 位 */
  DOUBLE_64 = 'double64',
}

/** 转换模式 */
export enum ModeEnum {
  /** 十进制 → IEEE 754 位表示 */
  DECIMAL_TO_BITS = 'decimalToBits',
  /** IEEE 754 位表示 → 十进制 */
  BITS_TO_DECIMAL = 'bitsToDecimal',
}

/** 精度选项 */
export const PRECISION_OPTIONS: { label: string; value: PrecisionEnum }[] = [
  { label: '单精度（32 位 / float）', value: PrecisionEnum.SINGLE_32 },
  { label: '双精度（64 位 / double）', value: PrecisionEnum.DOUBLE_64 },
];

/** 模式选项 */
export const MODE_OPTIONS: { label: string; value: ModeEnum }[] = [
  { label: '十进制 → 二进制 / 十六进制', value: ModeEnum.DECIMAL_TO_BITS },
  { label: '二进制 / 十六进制 → 十进制', value: ModeEnum.BITS_TO_DECIMAL },
];

/** 各精度的位域参数：总位宽、符号位、指数位、尾数位、指数偏置 */
export const PRECISION_CONFIG: Record<
  PrecisionEnum,
  { totalBits: number; signBits: number; exponentBits: number; mantissaBits: number; bias: number }
> = {
  [PrecisionEnum.SINGLE_32]: {
    totalBits: 32,
    signBits: 1,
    exponentBits: 8,
    mantissaBits: 23,
    bias: 127,
  },
  [PrecisionEnum.DOUBLE_64]: {
    totalBits: 64,
    signBits: 1,
    exponentBits: 11,
    mantissaBits: 52,
    bias: 1023,
  },
};

/** 默认样例输入 */
export const DEFAULT_SAMPLE = '0.1';
