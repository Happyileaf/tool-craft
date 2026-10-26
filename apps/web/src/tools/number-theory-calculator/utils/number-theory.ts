export const MIN_NUMBER_COUNT = 2;
export const MAX_NUMBER_COUNT = 10;

export interface PrimeFactor {
  prime: number;
  exponent: number;
}

export interface NumberTheoryResult {
  n: number;
  absolute: number;
  factors: PrimeFactor[];
  factorExpression: string;
  divisors: number[];
  divisorCount: number;
  isPrime: boolean | null;
  classification: 'prime' | 'composite' | 'neutral' | 'zero';
}

/**
 * 解析单个整数输入：仅接受安全整数，支持正负号
 *
 * @param raw - 原始字符串
 * @returns 解析后的整数
 */
export function parseInteger(raw: string): number {
  const trimmed = raw.trim();
  if (!/^[+-]?\d+$/.test(trimmed)) {
    throw new Error(`「${trimmed || '空'}」不是合法整数`);
  }
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value)) {
    throw new Error(`「${trimmed}」超出安全整数范围（±${Number.MAX_SAFE_INTEGER}）`);
  }
  return value;
}

/**
 * 解析一组整数（逗号、空格或换行分隔）
 *
 * @param input - 原始输入
 * @returns 整数数组
 */
export function parseIntegerList(input: string): number[] {
  return input
    .split(/[\s,，、;；]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parseInteger);
}

/**
 * 欧几里得算法求两个非负整数的最大公约数
 */
export function gcdPair(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

/**
 * 两个非负整数的最小公倍数（先除后乘防溢出）
 */
export function lcmPair(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0;
  }
  const x = Math.abs(a);
  const y = Math.abs(b);
  return (x / gcdPair(x, y)) * y;
}

/**
 * 多个整数的最大公约数（2–10 个）
 */
export function gcdMany(numbers: number[]): number {
  if (numbers.length < MIN_NUMBER_COUNT || numbers.length > MAX_NUMBER_COUNT) {
    throw new Error(`请输入 ${MIN_NUMBER_COUNT}–${MAX_NUMBER_COUNT} 个整数`);
  }
  return numbers.reduce((acc, value) => gcdPair(acc, value), 0);
}

/**
 * 多个整数的最小公倍数（2–10 个，含 0 时 LCM 为 0）
 */
export function lcmMany(numbers: number[]): number {
  if (numbers.length < MIN_NUMBER_COUNT || numbers.length > MAX_NUMBER_COUNT) {
    throw new Error(`请输入 ${MIN_NUMBER_COUNT}–${MAX_NUMBER_COUNT} 个整数`);
  }
  return numbers.reduce((acc, value) => lcmPair(acc, value), 1);
}

/**
 * 质数判定：试除到 √n；n < 2 既不是质数也不是合数
 */
export function isPrime(n: number): boolean | null {
  const value = Math.abs(n);
  if (value < 2) {
    return null;
  }
  if (value === 2) {
    return true;
  }
  if (value % 2 === 0) {
    return false;
  }
  for (let divisor = 3; divisor <= Math.sqrt(value); divisor += 2) {
    if (value % divisor === 0) {
      return false;
    }
  }
  return true;
}

/**
 * 质因数分解（试除法），返回按质数升序排列的质因数与指数
 */
export function primeFactorize(n: number): PrimeFactor[] {
  const value = Math.abs(n);
  if (value < 2) {
    return [];
  }
  const factors: PrimeFactor[] = [];
  let remaining = value;
  let exponent = 0;
  while (remaining % 2 === 0) {
    remaining /= 2;
    exponent += 1;
  }
  if (exponent > 0) {
    factors.push({ prime: 2, exponent });
  }
  for (let divisor = 3; divisor <= Math.sqrt(remaining); divisor += 2) {
    exponent = 0;
    while (remaining % divisor === 0) {
      remaining /= divisor;
      exponent += 1;
    }
    if (exponent > 0) {
      factors.push({ prime: divisor, exponent });
    }
  }
  if (remaining > 1) {
    factors.push({ prime: remaining, exponent: 1 });
  }
  return factors;
}

/**
 * 把质因数分解结果格式化为 n = p1^e1 × p2^e2 形式
 */
export function formatFactorExpression(n: number, factors: PrimeFactor[]): string {
  const value = Math.abs(n);
  if (factors.length === 0) {
    return `${value}（不进行质因数分解）`;
  }
  const body = factors
    .map(({ prime, exponent }) => (exponent === 1 ? `${prime}` : `${prime}^${exponent}`))
    .join(' × ');
  return `${value} = ${body}`;
}

/**
 * 成对枚举至 √n，返回升序排列的全部正因数
 */
export function listDivisors(n: number): number[] {
  const value = Math.abs(n);
  if (value === 0) {
    return [];
  }
  const small: number[] = [];
  const large: number[] = [];
  for (let divisor = 1; divisor <= Math.sqrt(value); divisor += 1) {
    if (value % divisor === 0) {
      small.push(divisor);
      const paired = value / divisor;
      if (paired !== divisor) {
        large.push(paired);
      }
    }
  }
  return [...small, ...large.reverse()];
}

/**
 * 对单个整数执行完整数论分析
 */
export function analyzeNumber(raw: string | number): NumberTheoryResult {
  const n = typeof raw === 'number' ? raw : parseInteger(raw);
  const absolute = Math.abs(n);
  const factors = primeFactorize(absolute);
  const divisors = listDivisors(absolute);
  const prime = isPrime(absolute);
  let classification: NumberTheoryResult['classification'];
  if (absolute === 0) {
    classification = 'zero';
  } else if (absolute === 1) {
    classification = 'neutral';
  } else if (prime) {
    classification = 'prime';
  } else {
    classification = 'composite';
  }
  return {
    n,
    absolute,
    factors,
    factorExpression: formatFactorExpression(absolute, factors),
    divisors,
    divisorCount: divisors.length,
    isPrime: prime,
    classification,
  };
}
