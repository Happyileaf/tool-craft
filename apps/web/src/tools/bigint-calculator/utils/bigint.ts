/** 任意精度整数（BigInt）运算的纯函数 */

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const MAX_EXPONENT = BigInt(10000);
const MAX_RESULT_DIGITS = 20000;

/** 支持的运算 */
export type BigIntOperation =
  | 'add'
  | 'sub'
  | 'mul'
  | 'div'
  | 'mod'
  | 'pow'
  | 'gcd'
  | 'lcm'
  | 'modPow'
  | 'modInverse'
  | 'factorial';

/** 计算结果 */
export interface BigIntComputation {
  operation: BigIntOperation;
  /** 主结果 */
  value: bigint;
  /** 整除时的商会（仅 div） */
  quotient?: bigint;
  /** 整除时的余数（仅 div） */
  remainder?: bigint;
  /** 十进制分组文本 */
  decimal: string;
  /** 十六进制文本 */
  hexadecimal: string;
  /** 二进制文本 */
  binary: string;
  /** 十进制位数 */
  decimalDigits: number;
  /** 二进制位数 */
  binaryBits: number;
}

/** 运算元数据 */
export const BIGINT_OPERATIONS: Array<{
  value: BigIntOperation;
  label: string;
  needsB: boolean;
  needsModulus: boolean;
  hint: string;
}> = [
  { value: 'add', label: 'A + B', needsB: true, needsModulus: false, hint: '任意精度加法' },
  { value: 'sub', label: 'A − B', needsB: true, needsModulus: false, hint: '任意精度减法' },
  { value: 'mul', label: 'A × B', needsB: true, needsModulus: false, hint: '任意精度乘法' },
  { value: 'div', label: 'A ÷ B（商与余数）', needsB: true, needsModulus: false, hint: '整除并给出商与余数' },
  { value: 'mod', label: 'A mod B', needsB: true, needsModulus: false, hint: '取模' },
  { value: 'pow', label: 'A ^ B', needsB: true, needsModulus: false, hint: '快速幂，指数 0–10000' },
  { value: 'gcd', label: 'gcd(A, B)', needsB: true, needsModulus: false, hint: '最大公约数' },
  { value: 'lcm', label: 'lcm(A, B)', needsB: true, needsModulus: false, hint: '最小公倍数' },
  { value: 'modPow', label: 'A ^ B mod M', needsB: true, needsModulus: true, hint: '模幂' },
  { value: 'modInverse', label: 'A⁻¹ mod M', needsB: false, needsModulus: true, hint: '模逆元，要求 gcd(A, M) = 1' },
  { value: 'factorial', label: 'A!', needsB: false, needsModulus: false, hint: '阶乘，0–10000' },
];

/**
 * 解析十进制大整数，支持正负号与千位逗号
 */
export function parseBigInt(input: string, label = '操作数'): bigint {
  const normalized = input.trim().replace(/,/g, '').replace(/\s/g, '');
  if (normalized === '' || !/^[+-]?\d+$/.test(normalized)) {
    throw new Error(`${label}需为十进制整数，可带正负号与千位逗号`);
  }
  return BigInt(normalized);
}

/**
 * 十进制分组格式化
 */
export function formatDecimal(value: bigint): string {
  const negative = value < ZERO;
  const digits = (negative ? -value : value).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return negative ? `-${grouped}` : grouped;
}

/**
 * 十六进制格式化
 */
export function formatHex(value: bigint): string {
  return value < ZERO ? `-0x${(-value).toString(16)}` : `0x${value.toString(16)}`;
}

/**
 * 二进制格式化
 */
export function formatBinary(value: bigint): string {
  return value < ZERO ? `-0b${(-value).toString(2)}` : `0b${value.toString(2)}`;
}

/**
 * 十进制位数
 */
export function decimalDigits(value: bigint): number {
  return (value < ZERO ? -value : value).toString().length;
}

/**
 * 二进制位数
 */
export function binaryBits(value: bigint): number {
  return (value < ZERO ? -value : value).toString(2).length;
}

function abs(value: bigint): bigint {
  return value < ZERO ? -value : value;
}

/**
 * 最大公约数
 */
export function gcdBigInt(a: bigint, b: bigint): bigint {
  let x = abs(a);
  let y = abs(b);
  while (y !== ZERO) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x;
}

/**
 * 快速幂
 */
export function powBigInt(base: bigint, exponent: bigint): bigint {
  let result = ONE;
  let current = base;
  let remaining = exponent;
  while (remaining > ZERO) {
    if ((remaining & ONE) === ONE) {
      result *= current;
    }
    remaining >>= ONE;
    if (remaining > ZERO) {
      current *= current;
    }
  }
  return result;
}

/**
 * 模幂（模数为正）
 */
export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = ONE;
  let current = base % modulus;
  if (current < ZERO) {
    current += modulus;
  }
  let remaining = exponent;
  while (remaining > ZERO) {
    if ((remaining & ONE) === ONE) {
      result = (result * current) % modulus;
    }
    remaining >>= ONE;
    if (remaining > ZERO) {
      current = (current * current) % modulus;
    }
  }
  return result;
}

/**
 * 扩展欧几里得求模逆元，要求 gcd(a, modulus) = 1
 */
export function modInverse(value: bigint, modulus: bigint): bigint {
  let old = ((value % modulus) + modulus) % modulus;
  let next = modulus;
  let oldCoefficient = ONE;
  let nextCoefficient = ZERO;

  while (next !== ZERO) {
    const quotient = old / next;
    [old, next] = [next, old - quotient * next];
    [oldCoefficient, nextCoefficient] = [nextCoefficient, oldCoefficient - quotient * nextCoefficient];
  }

  if (old !== ONE) {
    throw new Error('模逆元不存在：A 与 M 必须互质');
  }
  return ((oldCoefficient % modulus) + modulus) % modulus;
}

/**
 * 阶乘
 */
export function factorialBigInt(value: bigint): bigint {
  if (value < ZERO) {
    throw new Error('阶乘要求非负整数');
  }
  if (value > MAX_EXPONENT) {
    throw new Error('阶乘上限为 10000');
  }
  let result = ONE;
  for (let index = TWO; index <= value; index += ONE) {
    result *= index;
  }
  return result;
}

function assertNonNegativeExponent(exponent: bigint): void {
  if (exponent < ZERO) {
    throw new Error('指数不能为负数');
  }
  if (exponent > MAX_EXPONENT) {
    throw new Error('指数上限为 10000');
  }
}

/**
 * 按运算类型计算并返回展示所需的完整结果
 */
export function computeBigInt(
  operation: BigIntOperation,
  aText: string,
  bText: string,
  modulusText: string,
): BigIntComputation {
  const a = parseBigInt(aText, '操作数 A');
  const b =
    operation === 'factorial' || operation === 'modInverse'
      ? ZERO
      : parseBigInt(bText, '操作数 B');
  let value: bigint;
  let quotient: bigint | undefined;
  let remainder: bigint | undefined;

  switch (operation) {
    case 'add':
      value = a + b;
      break;
    case 'sub':
      value = a - b;
      break;
    case 'mul':
      value = a * b;
      break;
    case 'div':
      if (b === ZERO) {
        throw new Error('除数不能为 0');
      }
      quotient = a / b;
      remainder = a % b;
      value = quotient;
      break;
    case 'mod':
      if (b === ZERO) {
        throw new Error('模数不能为 0');
      }
      value = a % b;
      break;
    case 'pow': {
      assertNonNegativeExponent(b);
      const digits = decimalDigits(a);
      if (digits * Number(b) > MAX_RESULT_DIGITS) {
        throw new Error(`结果规模过大（约 ${digits * Number(b)} 位），请减小底数或指数`);
      }
      value = powBigInt(a, b);
      break;
    }
    case 'gcd':
      value = gcdBigInt(a, b);
      break;
    case 'lcm':
      if (a === ZERO || b === ZERO) {
        value = ZERO;
      } else {
        value = abs((a / gcdBigInt(a, b)) * b);
      }
      break;
    case 'modPow': {
      const modulus = parseBigInt(modulusText, '模数 M');
      if (modulus <= ZERO) {
        throw new Error('模数 M 必须为正整数');
      }
      assertNonNegativeExponent(b);
      value = modPow(a, b, modulus);
      break;
    }
    case 'modInverse': {
      const modulus = parseBigInt(modulusText, '模数 M');
      if (modulus <= ZERO) {
        throw new Error('模数 M 必须为正整数');
      }
      value = modInverse(a, modulus);
      break;
    }
    case 'factorial':
      value = factorialBigInt(a);
      break;
    default:
      throw new Error('未知的运算类型');
  }

  return {
    operation,
    value,
    quotient,
    remainder,
    decimal: formatDecimal(value),
    hexadecimal: formatHex(value),
    binary: formatBinary(value),
    decimalDigits: decimalDigits(value),
    binaryBits: binaryBits(value),
  };
}
