export interface Rational {
  numerator: bigint;
  denominator: bigint;
}

export interface DecimalConversion {
  fraction: Rational;
  mixed: string | null;
  steps: string[];
}

export interface DecimalExpansion {
  sign: '' | '-';
  integerPart: string;
  nonRepeating: string;
  repeating: string | null;
  isTerminating: boolean;
  text: string;
}

const MAX_REPEAT_CYCLE = 1000;

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TEN = BigInt(10);
const HUNDRED = BigInt(100);
const MINUS_ONE = BigInt(-1);

/**
 * 求两个非负整数的最大公约数（欧几里得算法）
 *
 * @param a - 整数 a
 * @param b - 整数 b
 * @returns 最大公约数
 */
export function gcdBigInt(a: bigint, b: bigint): bigint {
  let x = a < ZERO ? -a : a;
  let y = b < ZERO ? -b : b;
  while (y !== ZERO) {
    [x, y] = [y, x % y];
  }
  return x;
}

/**
 * 约分并保证分母为正
 *
 * @param numerator - 分子
 * @param denominator - 分母
 * @returns 最简分数
 */
export function reduceFraction(numerator: bigint, denominator: bigint): Rational {
  if (denominator === ZERO) {
    throw new Error('分母不能为 0');
  }
  let n = numerator;
  let d = denominator;
  if (d < ZERO) {
    n = -n;
    d = -d;
  }
  const divisor = gcdBigInt(n, d);
  return { numerator: n / divisor, denominator: d / divisor };
}

/**
 * 将最简分数格式化为带分数（如 5/2 → 2 又 1/2），真分数或整数时返回 null
 *
 * @param value - 最简分数
 * @returns 带分数字符串或 null
 */
export function toMixedFraction(value: Rational): string | null {
  const { numerator, denominator } = value;
  const absNumerator = numerator < ZERO ? -numerator : numerator;
  if (absNumerator < denominator) {
    return null;
  }
  const whole = absNumerator / denominator;
  const remainder = absNumerator % denominator;
  const sign = numerator < ZERO ? '-' : '';
  if (remainder === ZERO) {
    return `${sign}${whole.toString()}`;
  }
  return `${sign}${whole.toString()} 又 ${remainder.toString()}/${denominator.toString()}`;
}

const DECIMAL_PATTERN = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:\((\d+)\))?$/;

/**
 * 将十进制小数（含循环小数，循环节用圆括号表示，如 0.(3)、0.1(6)、1.2(14)）转为最简分数
 *
 * @param input - 小数字符串
 * @returns 最简分数与约分过程
 */
export function decimalToFraction(input: string): DecimalConversion {
  const trimmed = input.trim();
  const match = DECIMAL_PATTERN.exec(trimmed);
  if (!match) {
    throw new Error('无法识别的小数格式（示例：0.5、-1.25、0.(3)、0.1(6)）');
  }

  const sign = match[1] === '-' ? MINUS_ONE : ONE;
  const integerDigits = match[2] ?? '0';
  const finiteDigits = match[3] ?? match[4] ?? '';
  const repeatDigits = match[5] ?? null;

  if (
    integerDigits.length > MAX_REPEAT_CYCLE ||
    finiteDigits.length > MAX_REPEAT_CYCLE ||
    (repeatDigits !== null && repeatDigits.length > MAX_REPEAT_CYCLE)
  ) {
    throw new Error(`整数部分、不循环部分或循环节最多支持 ${MAX_REPEAT_CYCLE} 位`);
  }

  const powerOfTen = (length: number): bigint =>
    length === 0 ? ONE : TEN ** BigInt(length);
  const finiteValue =
    BigInt(integerDigits) * powerOfTen(finiteDigits.length) +
    (finiteDigits ? BigInt(finiteDigits) : ZERO);

  const steps: string[] = [];
  let numerator: bigint;
  let denominator: bigint;

  if (repeatDigits === null) {
    numerator = finiteValue;
    denominator = powerOfTen(finiteDigits.length);
    if (finiteDigits.length > 0) {
      steps.push(
        `有限小数：${trimmed.replace('-', '')} = ${finiteValue.toString()}/${denominator.toString()}（${finiteDigits.length} 位小数，分母为 10^${finiteDigits.length}）`,
      );
    } else {
      steps.push(`整数：${trimmed.replace('-', '')} = ${finiteValue.toString()}/1`);
    }
  } else {
    const repeatValue = BigInt(repeatDigits);
    const fullValue = finiteValue * powerOfTen(repeatDigits.length) + repeatValue;
    numerator = fullValue - finiteValue;
    denominator =
      powerOfTen(finiteDigits.length) * (powerOfTen(repeatDigits.length) - ONE);
    steps.push(
      `循环小数：设 A = 含整数部分与不循环部分的数字（${finiteValue.toString()}），B = A 后接循环节组成的数字（${fullValue.toString()}）；分子 = B − A = ${numerator.toString()}；分母 = 10^${finiteDigits.length} × (10^${repeatDigits.length} − 1) = ${denominator.toString()}`,
    );
  }

  numerator *= sign;
  const reduced = reduceFraction(numerator, denominator);
  const divisor = gcdBigInt(numerator, denominator);
  if (divisor > ONE) {
    steps.push(
      `约分：gcd(|${numerator.toString()}|, ${denominator.toString()}) = ${divisor.toString()}，分子分母同除得 ${reduced.numerator.toString()}/${reduced.denominator.toString()}`,
    );
  }

  return {
    fraction: reduced,
    mixed: toMixedFraction(reduced),
    steps,
  };
}

const SIMPLE_FRACTION_PATTERN = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/;
const MIXED_FRACTION_PATTERN = /^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/;

/**
 * 解析分数输入，支持假分数（3/4）、负分数（-1/2）与带分数（1 又 1/2 写作 1 1/2）
 *
 * @param input - 分数字符串
 * @returns 最简分数
 */
export function parseFraction(input: string): Rational {
  const trimmed = input.trim();
  const simple = SIMPLE_FRACTION_PATTERN.exec(trimmed);
  if (simple) {
    return reduceFraction(BigInt(simple[1] as string), BigInt(simple[2] as string));
  }
  const mixed = MIXED_FRACTION_PATTERN.exec(trimmed);
  if (mixed) {
    const sign = mixed[1] === '-' ? MINUS_ONE : ONE;
    const whole = BigInt(mixed[2] as string);
    const partNumerator = BigInt(mixed[3] as string);
    const denominator = BigInt(mixed[4] as string);
    if (partNumerator >= denominator) {
      throw new Error('带分数的真分数部分分子必须小于分母');
    }
    return reduceFraction(sign * (whole * denominator + partNumerator), denominator);
  }
  if (/^\d+$/.test(trimmed)) {
    return reduceFraction(BigInt(trimmed), ONE);
  }
  throw new Error('无法识别的分数格式（示例：3/4、-5/2、1 1/2）');
}

/**
 * 对最简分数做长除法，给出小数展开并标出循环节（圆括号表示）
 *
 * @param value - 最简分数
 * @returns 小数展开结果
 */
export function fractionToDecimal(value: Rational): DecimalExpansion {
  const { numerator, denominator } = value;
  const sign: '' | '-' = numerator < ZERO ? '-' : '';
  const absNumerator = numerator < ZERO ? -numerator : numerator;

  const integerPart = (absNumerator / denominator).toString();
  let remainder = absNumerator % denominator;

  if (remainder === ZERO) {
    return {
      sign,
      integerPart,
      nonRepeating: '',
      repeating: null,
      isTerminating: true,
      text: `${sign}${integerPart}`,
    };
  }

  const digits: string[] = [];
  const remainderPositions = new Map<bigint, number>();

  while (remainder !== ZERO && !remainderPositions.has(remainder)) {
    if (digits.length >= MAX_REPEAT_CYCLE) {
      throw new Error(`小数展开超过 ${MAX_REPEAT_CYCLE} 位，已停止计算`);
    }
    remainderPositions.set(remainder, digits.length);
    remainder *= TEN;
    digits.push((remainder / denominator).toString());
    remainder %= denominator;
  }

  const allDigits = digits.join('');
  let nonRepeating = allDigits;
  let repeating: string | null = null;
  let isTerminating = true;

  if (remainder !== ZERO) {
    const repeatStart = remainderPositions.get(remainder) as number;
    nonRepeating = allDigits.slice(0, repeatStart);
    repeating = allDigits.slice(repeatStart);
    isTerminating = false;
  }

  let text: string;
  if (isTerminating) {
    text = `${sign}${integerPart}.${nonRepeating}`;
  } else {
    text = `${sign}${integerPart}.${nonRepeating}(${repeating ?? ''})`;
  }

  return { sign, integerPart, nonRepeating, repeating, isTerminating, text };
}

/**
 * 百分数转最简分数（如 25% → 1/4、33.(3)% → 1/3）
 *
 * @param input - 百分数字符串
 * @returns 最简分数与约分过程
 */
export function percentToFraction(input: string): DecimalConversion {
  const trimmed = input.trim().replace(/%$/, '').trim();
  if (!trimmed) {
    throw new Error('请输入百分数（如 25%、12.5%）');
  }
  const conversion = decimalToFraction(trimmed);
  const numerator = conversion.fraction.numerator;
  const denominator = conversion.fraction.denominator * HUNDRED;
  const reduced = reduceFraction(numerator, denominator);
  const steps = [
    ...conversion.steps,
    `百分数化分数：${trimmed}% = ${numerator.toString()}/${conversion.fraction.denominator.toString()} × 1/100 = ${numerator.toString()}/${denominator.toString()}`,
  ];
  const divisor = gcdBigInt(numerator, denominator);
  if (divisor > ONE) {
    steps.push(`约分：分子分母同除以 ${divisor.toString()} 得 ${reduced.numerator.toString()}/${reduced.denominator.toString()}`);
  }
  return { fraction: reduced, mixed: toMixedFraction(reduced), steps };
}

/**
 * 分数转百分数（如 1/4 → 25%、1/3 → 33.(3)%）
 *
 * @param input - 分数字符串
 * @returns 百分数文本（循环部分以圆括号表示）
 */
export function fractionToPercent(input: string): string {
  const fraction = parseFraction(input);
  const scaled = reduceFraction(fraction.numerator * HUNDRED, fraction.denominator);
  const expansion = fractionToDecimal(scaled);
  let body: string;
  if (expansion.isTerminating) {
    body = expansion.nonRepeating ? `${expansion.integerPart}.${expansion.nonRepeating}` : expansion.integerPart;
  } else {
    body = `${expansion.integerPart}.${expansion.nonRepeating}(${expansion.repeating ?? ''})`;
  }
  return `${expansion.sign}${body}%`;
}
