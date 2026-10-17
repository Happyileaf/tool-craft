/**
 * 进制互转、位可视化与位运算的纯函数实现，不依赖 DOM 与 React。
 * 全程使用 BigInt，避免超出 32 位的大整数精度丢失。
 */

/** 工具支持的进制基数集合 */
export const SUPPORTED_BASES = [2, 8, 10, 16] as const;

/** 工具支持的进制基数类型 */
export type SupportedBase = (typeof SUPPORTED_BASES)[number];

/** 工具支持的位宽集合 */
export const SUPPORTED_WIDTHS = [8, 16, 32, 64] as const;

/** 工具支持的位宽类型 */
export type SupportedWidth = (typeof SUPPORTED_WIDTHS)[number];

/** 二进制位分支的默认分组大小 */
export const DEFAULT_BIT_GROUP_SIZE = 4;

/** 数字字符表（小写），下标即对应数值 */
const DIGIT_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';

/** 常用 BigInt 常量，规避 TS 编译目标不支持 BigInt 字面量的限制 */
const ZERO = BigInt(0);
const ONE = BigInt(1);

/** 进制转换结果 */
export interface BaseConversionResult {
  /** 解析是否成功 */
  valid: boolean;
  /** 失败时的错误信息 */
  error: string | null;
  /** 解析得到的整数，成功时非空 */
  value: bigint | null;
  /** 二进制字符串（不含前缀，负数带负号） */
  binary: string;
  /** 八进制字符串 */
  octal: string;
  /** 十进制字符串 */
  decimal: string;
  /** 十六进制字符串（小写） */
  hex: string;
}

/** 位运算类型 */
export enum BitwiseOpEnum {
  /** 按位与 */
  AND = 'and',
  /** 按位或 */
  OR = 'or',
  /** 按位异或 */
  XOR = 'xor',
}

/** 位移方向 */
export enum ShiftDirectionEnum {
  /** 左移 */
  LEFT = 'left',
  /** 右移 */
  RIGHT = 'right',
}

/**
 * 将单个字符转换为对应数值，非法字符返回 -1
 *
 * @param char - 单个字符
 * @returns 数值或 -1
 */
function digitValue(char: string): number {
  return DIGIT_CHARS.indexOf(char.toLowerCase());
}

/**
 * 解析整数字符串为 BigInt，支持正负号、下划线分隔与常见进制前缀
 *
 * @param input - 待解析的整数字符串
 * @param base - 输入进制
 * @returns 解析结果，失败时 `value` 为 null 且 `error` 非空
 */
export function parseInteger(
  input: string,
  base: SupportedBase,
): { value: bigint | null; error: string | null } {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { value: null, error: '请输入数值' };
  }

  let sign = ONE;
  let body = trimmed;
  if (body.startsWith('-')) {
    sign = -ONE;
    body = body.slice(1);
  } else if (body.startsWith('+')) {
    body = body.slice(1);
  }

  body = body.replace(/_/g, '');

  const lower = body.toLowerCase();
  if (base === 16 && lower.startsWith('0x')) {
    body = body.slice(2);
  } else if (base === 2 && lower.startsWith('0b')) {
    body = body.slice(2);
  } else if (base === 8 && lower.startsWith('0o')) {
    body = body.slice(2);
  } else if (base === 10 && lower.startsWith('0d')) {
    body = body.slice(2);
  }

  if (body === '') {
    return { value: null, error: '请输入数值' };
  }

  const radix = BigInt(base);
  let value = ZERO;
  for (const char of body) {
    const digit = digitValue(char);
    if (digit < 0 || digit >= base) {
      return {
        value: null,
        error: `字符 “${char}” 不是合法的 ${base} 进制数字`,
      };
    }
    value = value * radix + BigInt(digit);
  }

  return { value: sign * value, error: null };
}

/**
 * 将 BigInt 转换为指定进制的字符串（不含前缀）
 *
 * @param value - 待转换的整数
 * @param base - 目标进制
 * @param uppercase - 是否输出大写字母，默认 false
 * @returns 目标进制字符串，负数带前导负号
 */
export function toBaseString(
  value: bigint,
  base: SupportedBase,
  uppercase = false,
): string {
  const negative = value < ZERO;
  const absolute = negative ? -value : value;
  const text = absolute.toString(base);
  const result = uppercase ? text.toUpperCase() : text;
  return negative ? `-${result}` : result;
}

/**
 * 进制互转，输出同一数值的 2 / 8 / 10 / 16 进制结果一览
 *
 * @param input - 待转换的整数字符串
 * @param base - 输入进制
 * @returns 各进制结果或错误信息
 */
export function convertBase(input: string, base: SupportedBase): BaseConversionResult {
  const parsed = parseInteger(input, base);
  if (parsed.error !== null || parsed.value === null) {
    return {
      valid: false,
      error: parsed.error,
      value: null,
      binary: '',
      octal: '',
      decimal: '',
      hex: '',
    };
  }

  const value = parsed.value;
  return {
    valid: true,
    error: null,
    value,
    binary: toBaseString(value, 2),
    octal: toBaseString(value, 8),
    decimal: toBaseString(value, 10),
    hex: toBaseString(value, 16),
  };
}

/**
 * 取整数在指定位宽下的无符号表示（负值按二进制补码处理）
 *
 * @param value - 整数
 * @param width - 位宽
 * @returns 无符号表示
 */
function toUnsigned(value: bigint, width: number): bigint {
  const mod = ONE << BigInt(width);
  return ((value % mod) + mod) % mod;
}

/**
 * 按位宽生成二进制位串并按分组大小加空格展示
 *
 * @param value - 整数
 * @param width - 位宽
 * @param groupSize - 分组大小，默认 4
 * @returns 以空格分隔的位串
 */
export function formatBitGroups(
  value: bigint,
  width: number,
  groupSize: number = DEFAULT_BIT_GROUP_SIZE,
): string {
  const bits = toUnsigned(value, width).toString(2).padStart(width, '0');
  const groups: string[] = [];
  for (let index = 0; index < bits.length; index += groupSize) {
    groups.push(bits.slice(index, index + groupSize));
  }
  return groups.join(' ');
}

/**
 * 统计整数在位宽下二进制表示中置位（1）的个数
 *
 * @param value - 整数
 * @param width - 位宽
 * @returns 置位个数
 */
export function popcount(value: bigint, width: number): number {
  let remaining = toUnsigned(value, width);
  let count = 0;
  while (remaining > ZERO) {
    count += Number(remaining & ONE);
    remaining >>= ONE;
  }
  return count;
}

/**
 * 对两个整数执行 AND / OR / XOR 位运算
 *
 * @param a - 左操作数
 * @param b - 右操作数
 * @param op - 运算类型
 * @returns 运算结果
 */
export function applyBitwise(a: bigint, b: bigint, op: BitwiseOpEnum): bigint {
  switch (op) {
    case BitwiseOpEnum.AND:
      return a & b;
    case BitwiseOpEnum.OR:
      return a | b;
    case BitwiseOpEnum.XOR:
      return a ^ b;
    default:
      return ZERO;
  }
}

/**
 * 对单个整数按指定位宽执行按位取反
 *
 * @param value - 待取反的整数
 * @param width - 位宽
 * @returns 取反后的无符号结果
 */
export function applyBitwiseNot(value: bigint, width: number): bigint {
  const mask = (ONE << BigInt(width)) - ONE;
  return mask ^ toUnsigned(value, width);
}

/**
 * 按指定位宽执行左移或右移，结果截断在指定位宽内
 *
 * @param value - 待位移的整数
 * @param amount - 位移位数
 * @param width - 位宽
 * @param direction - 位移方向
 * @returns 位移后的无符号结果
 */
export function applyShift(
  value: bigint,
  amount: number,
  width: number,
  direction: ShiftDirectionEnum,
): bigint {
  const shift = BigInt(Math.max(0, Math.trunc(amount)));
  if (direction === ShiftDirectionEnum.LEFT) {
    const mask = (ONE << BigInt(width)) - ONE;
    return (toUnsigned(value, width) << shift) & mask;
  }
  return toUnsigned(value, width) >> shift;
}
