/**
 * 基于 BigInt 的精确分数类型，用于矩阵消元时避免浮点误差。
 * 纯函数实现，不依赖 DOM / React。
 */

/** 不可变精确分数（分母恒正） */
export class Fraction {
  readonly numerator: bigint;

  readonly denominator: bigint;

  constructor(numerator: bigint, denominator: bigint = BigInt(1)) {
    if (denominator === BigInt(0)) {
      throw new Error('分数的分母不能为 0');
    }
    let n = numerator;
    let d = denominator;
    if (d < BigInt(0)) {
      n = -n;
      d = -d;
    }
    if (n === BigInt(0)) {
      d = BigInt(1);
    } else {
      const g = bigAbs(gcd(bigAbs(n), d));
      n /= g;
      d /= g;
    }
    this.numerator = n;
    this.denominator = d;
  }

  static zero(): Fraction {
    return new Fraction(BigInt(0));
  }

  static one(): Fraction {
    return new Fraction(BigInt(1));
  }

  add(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator + other.numerator * this.denominator,
      this.denominator * other.denominator,
    );
  }

  sub(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator - other.numerator * this.denominator,
      this.denominator * other.denominator,
    );
  }

  mul(other: Fraction): Fraction {
    return new Fraction(this.numerator * other.numerator, this.denominator * other.denominator);
  }

  div(other: Fraction): Fraction {
    if (other.numerator === BigInt(0)) {
      throw new Error('不能除以零');
    }
    return new Fraction(this.numerator * other.denominator, this.denominator * other.numerator);
  }

  negate(): Fraction {
    return new Fraction(-this.numerator, this.denominator);
  }

  isZero(): boolean {
    return this.numerator === BigInt(0);
  }

  isOne(): boolean {
    return this.numerator === this.denominator;
  }

  /**
   * 转为数字（仅用于小数展示）
   *
   * @returns 浮点近似值
   */
  toNumber(): number {
    return Number(this.numerator) / Number(this.denominator);
  }

  /**
   * 精确分数文本，整数时不带分母
   *
   * @returns 形如 3/4 或 5 的文本
   */
  toString(): string {
    if (this.denominator === BigInt(1)) {
      return this.numerator.toString();
    }
    return `${this.numerator}/${this.denominator}`;
  }
}

/**
 * 从文本解析精确分数：支持整数、小数、a/b
 *
 * @param token - 输入文本
 * @returns 分数
 */
export function parseFraction(token: string): Fraction {
  const text = token.trim();
  if (!text) {
    throw new Error('存在空的数字单元格');
  }
  if (text.includes('/')) {
    const parts = text.split('/');
    if (parts.length !== 2 || parts[0] === undefined || parts[1] === undefined) {
      throw new Error(`无法解析分数 "${text}"`);
    }
    const numerator = parseSignedInteger(parts[0]);
    const denominator = parseSignedInteger(parts[1]);
    return new Fraction(numerator, denominator);
  }
  if (/^[+-]?\d+$/.test(text)) {
    return new Fraction(BigInt(text), BigInt(1));
  }
  const decimal = /^([+-]?)(\d*)\.(\d+)$/.exec(text) ?? /^([+-]?)(\d+)\.(\d*)$/.exec(text);
  if (decimal) {
    const sign = decimal[1] === '-' ? BigInt(-1) : BigInt(1);
    const intPart = decimal[2] ? BigInt(decimal[2]) : BigInt(0);
    const fracText = decimal[3] ?? '';
    const fracPart = fracText ? BigInt(fracText) : BigInt(0);
    const denominator = BigInt(10) ** BigInt(fracText.length);
    return new Fraction(sign * (intPart * denominator + fracPart), denominator);
  }
  throw new Error(`无法识别的数字 "${text}"`);
}

function parseSignedInteger(text: string): bigint {
  const trimmed = text.trim();
  if (!/^[+-]?\d+$/.test(trimmed)) {
    throw new Error(`无法解析整数 "${text}"`);
  }
  return BigInt(trimmed);
}

function bigAbs(n: bigint): bigint {
  return n < BigInt(0) ? -n : n;
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a;
  let y = b;
  while (y !== BigInt(0)) {
    [x, y] = [y, x % y];
  }
  return x === BigInt(0) ? BigInt(1) : x;
}
