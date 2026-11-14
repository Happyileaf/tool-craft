/** 二进制补码转换与有符号整数运算的纯函数，全部基于 BigInt */

/** 支持的字长 */
export type BitWidth = 8 | 16 | 32 | 64;

/** 可选字长列表 */
export const BIT_WIDTHS: readonly BitWidth[] = [8, 16, 32, 64];

/** 补码运算类型 */
export type TwosComplementOperation = 'add' | 'sub' | 'mul' | 'shl' | 'sar' | 'shr';

/** 单个数值的补码视图 */
export interface BitPatternView {
  /** 字长 */
  width: BitWidth;
  /** 位模式（无符号 BigInt） */
  bits: bigint;
  /** 有符号解释 */
  signed: bigint;
  /** 无符号解释 */
  unsigned: bigint;
  /** 定宽二进制字符串 */
  binary: string;
  /** 定宽十六进制字符串（含 0x 前缀） */
  hex: string;
  /** 有符号最小值 */
  min: bigint;
  /** 有符号最大值 */
  max: bigint;
  /** 无符号最大值 */
  unsignedMax: bigint;
  /** 符号位，0 或 1 */
  signBit: 0 | 1;
}

/** 运算结果 */
export interface OperationResult {
  /** 运算类型 */
  operation: TwosComplementOperation;
  /** 字长 */
  width: BitWidth;
  /** 数学上的精确结果 */
  exact: bigint;
  /** 回绕后的位模式 */
  bits: bigint;
  /** 回绕后的有符号值 */
  signed: bigint;
  /** 定宽二进制字符串 */
  binary: string;
  /** 定宽十六进制字符串 */
  hex: string;
  /** 是否超出该字长的有符号范围 */
  overflow: boolean;
}

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);

/**
 * 校验字长必须是 8 / 16 / 32 / 64 之一
 */
function assertWidth(width: number): asserts width is BitWidth {
  if (width !== 8 && width !== 16 && width !== 32 && width !== 64) {
    throw new Error('字长需为 8 / 16 / 32 / 64 位');
  }
}

/**
 * 返回指定字长的全 1 掩码
 */
export function bitMask(width: BitWidth): bigint {
  return (ONE << BigInt(width)) - ONE;
}

/**
 * 返回指定字长的有符号范围与无符号最大值
 */
export function signedRange(width: BitWidth): { min: bigint; max: bigint; unsignedMax: bigint } {
  const unsignedMax = bitMask(width);
  const half = ONE << BigInt(width - 1);
  return { min: -half, max: half - ONE, unsignedMax };
}

/**
 * 把位模式解释为有符号整数
 */
function interpretSigned(bits: bigint, width: BitWidth): bigint {
  const { max, unsignedMax } = signedRange(width);
  return bits > max ? bits - unsignedMax - ONE : bits;
}

/**
 * 生成定宽二进制字符串
 */
export function toBinaryString(bits: bigint, width: BitWidth): string {
  return (bits & bitMask(width)).toString(2).padStart(width, '0');
}

/**
 * 生成定宽十六进制字符串
 */
export function toHexString(bits: bigint, width: BitWidth): string {
  return `0x${(bits & bitMask(width))
    .toString(16)
    .toUpperCase()
    .padStart(width / 4, '0')}`;
}

/**
 * 由位模式构造补码视图
 */
export function viewFromBits(rawBits: bigint, width: BitWidth): BitPatternView {
  assertWidth(width);
  const { min, max, unsignedMax } = signedRange(width);
  if (rawBits < ZERO || rawBits > unsignedMax) {
    throw new Error(`位模式超出 ${width} 位的无符号范围 0–${unsignedMax}`);
  }
  const bits = rawBits;
  const signed = interpretSigned(bits, width);
  return {
    width,
    bits,
    signed,
    unsigned: bits,
    binary: toBinaryString(bits, width),
    hex: toHexString(bits, width),
    min,
    max,
    unsignedMax,
    signBit: bits >> BigInt(width - 1) === ONE ? 1 : 0,
  };
}

/**
 * 由十进制有符号整数构造补码视图，超出范围时抛出错误
 */
export function viewFromSigned(value: bigint, width: BitWidth): BitPatternView {
  assertWidth(width);
  const { min, max } = signedRange(width);
  if (value < min || value > max) {
    throw new Error(`数值 ${value} 超出 ${width} 位有符号整数范围 ${min}–${max}`);
  }
  const bits = value < ZERO ? value + bitMask(width) + ONE : value;
  return viewFromBits(bits, width);
}

/**
 * 将位模式符号位延伸到 64 位并返回二进制字符串
 */
export function signExtendedBinary(bits: bigint, width: BitWidth): string {
  const view = viewFromBits(bits, width);
  const highMask = bitMask(64) & ~bitMask(width);
  const extended = view.signBit === 1 ? view.bits | highMask : view.bits;
  return toBinaryString(extended, 64);
}

/**
 * 解析十进制 / 0x 十六进制 / 0b 二进制 / 0o 八进制整数输入
 */
export function parseIntegerInput(input: string): bigint {
  const trimmed = input.trim().replace(/_/g, '');
  if (trimmed === '') {
    throw new Error('请输入整数，例如 -42、0xD6 或 0b11010110');
  }
  const match = /^([+-]?)(?:0x([0-9a-fA-F]+)|0b([01]+)|0o([0-7]+)|([0-9]+))$/.exec(trimmed);
  if (!match) {
    throw new Error(`无法识别整数「${input.trim()}」，支持十进制、0x 十六进制、0b 二进制与 0o 八进制`);
  }
  const sign = match[1] === '-' ? -ONE : ONE;
  if (match[2] !== undefined) {
    return sign * BigInt(`0x${match[2]}`);
  }
  if (match[3] !== undefined) {
    return sign * BigInt(`0b${match[3]}`);
  }
  if (match[4] !== undefined) {
    return sign * BigInt(`0o${match[4]}`);
  }
  return sign * BigInt(match[5] ?? '0');
}

/**
 * 按指定字长执行补码加减乘与移位，返回精确结果、回绕值与溢出标记
 */
export function computeOperation(
  a: bigint,
  b: bigint,
  width: BitWidth,
  operation: TwosComplementOperation,
): OperationResult {
  assertWidth(width);
  const { min, max, unsignedMax } = signedRange(width);
  if (a < min || a > max) {
    throw new Error(`操作数 ${a} 超出 ${width} 位有符号整数范围 ${min}–${max}`);
  }

  let exact: bigint;
  let bits: bigint;
  let overflow: boolean;

  if (operation === 'shl' || operation === 'sar' || operation === 'shr') {
    if (b < ZERO || b > BigInt(width)) {
      throw new Error(`移位位数需在 0–${width} 之间`);
    }
    if (operation === 'shl') {
      exact = a * TWO ** b;
      bits = exact & unsignedMax;
    } else if (operation === 'sar') {
      exact = a >> b;
      bits = exact & unsignedMax;
    } else {
      bits = (a & unsignedMax) >> b;
      exact = interpretSigned(bits, width);
    }
    overflow = operation === 'shr' ? false : exact < min || exact > max;
  } else {
    if (b < min || b > max) {
      throw new Error(`操作数 ${b} 超出 ${width} 位有符号整数范围 ${min}–${max}`);
    }
    exact = operation === 'add' ? a + b : operation === 'sub' ? a - b : a * b;
    bits = exact & unsignedMax;
    overflow = exact < min || exact > max;
  }

  return {
    operation,
    width,
    exact,
    bits,
    signed: interpretSigned(bits, width),
    binary: toBinaryString(bits, width),
    hex: toHexString(bits, width),
    overflow,
  };
}
