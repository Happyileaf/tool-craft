// C99 hexadecimal floating-point literal (hexfloat) parsing and generation.
// Grammar (C99 §6.4.4.2):
//   hex-float = [sign] ("0x" | "0X")
//     ( hex-digit-seq ["." hex-digit-seq?] | "." hex-digit-seq )
//     [binary-exponent] [float-suffix]
//   binary-exponent = ("p" | "P") [sign] digit-seq
// Value = (-1)^sign * mantissa * 2^(exponent), mantissa = sum(d_i * 16^-i).

export interface ParseHexfloatResult {
  ok: boolean;
  value: number;
  error?: string;
}

const HEX_DIGIT: Record<string, number> = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
  a: 10, b: 11, c: 12, d: 13, e: 14, f: 15,
  A: 10, B: 11, C: 12, D: 13, E: 14, F: 15,
};

/** Parse a C99 hexfloat literal into a JS number. */
export function parseHexfloat(input: string): ParseHexfloatResult {
  const raw = input.trim();
  if (!raw) {
    return { ok: false, value: 0, error: '输入为空' };
  }

  let i = 0;
  let negative = false;
  const signChar = raw[i];
  if (signChar === '+' || signChar === '-') {
    negative = signChar === '-';
    i += 1;
  }

  // Prefix 0x / 0X
  if (raw[i] !== '0' || (raw[i + 1] !== 'x' && raw[i + 1] !== 'X')) {
    return { ok: false, value: 0, error: '缺少 0x / 0X 十六进制前缀' };
  }
  i += 2;

  let mantissa = 0;
  let fracDigits = 0;
  let intDigits = 0;

  let char = raw[i];
  while (char !== undefined && char in HEX_DIGIT) {
    const digit = HEX_DIGIT[char];
    if (digit === undefined) {
      break;
    }
    mantissa = mantissa * 16 + digit;
    intDigits += 1;
    i += 1;
    char = raw[i];
  }

  if (raw[i] === '.') {
    i += 1;
    char = raw[i];
    while (char !== undefined && char in HEX_DIGIT) {
      const digit = HEX_DIGIT[char];
      if (digit === undefined) {
        break;
      }
      mantissa = mantissa * 16 + digit;
      fracDigits += 1;
      i += 1;
      char = raw[i];
    }
  }
  if (intDigits === 0 && fracDigits === 0) {
    return { ok: false, value: 0, error: '缺少十六进制尾数数字' };
  }

  // Optional binary exponent (decimal digits, base 2).
  let exponent = 0;
  if (raw[i] === 'p' || raw[i] === 'P') {
    i += 1;
    let expNegative = false;
    if (raw[i] === '+' || raw[i] === '-') {
      expNegative = raw[i] === '-';
      i += 1;
    }
    const expStart = i;
    let expValue = 0;
    let expChar = raw[i];
    while (expChar !== undefined && expChar >= '0' && expChar <= '9') {
      expValue = expValue * 10 + (raw.charCodeAt(i) - 48);
      i += 1;
      expChar = raw[i];
    }
    if (i === expStart) {
      return { ok: false, value: 0, error: 'p 指数后缺少十进制数字' };
    }
    exponent = expNegative ? -expValue : expValue;
  }

  // Optional float suffix (f, F, l, L) — tolerated, does not change the value.
  const suffixChar = raw[i];
  if (suffixChar !== undefined && 'fFlL'.includes(suffixChar)) {
    i += 1;
  }

  if (i !== raw.length) {
    return { ok: false, value: 0, error: `无法识别的字符：${raw[i] ?? '末尾'}` };
  }

  if (mantissa === 0) {
    return { ok: true, value: negative ? -0 : 0 };
  }

  // value = mantissa * 2^exponent, with fracDigits contributing *16^-frac = *2^(-4*frac).
  // Scale the mantissa in stages so extreme exponents (subnormals down to 2^-1074)
  // do not underflow to zero in a single pow() multiplication.
  const totalExp = exponent - fracDigits * 4;
  let scaled = mantissa;
  let exp = totalExp;
  while (exp > 1023) {
    scaled *= 2 ** 1023;
    exp -= 1023;
  }
  while (exp < -1074) {
    scaled *= 2 ** -1074;
    exp += 1074;
  }
  const value = scaled * 2 ** exp;
  return { ok: true, value: negative ? -value : value };
}

/** Read the 64-bit IEEE-754 representation of a number (BigInt bit pattern). */
function toBigUint64(value: number): bigint {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setFloat64(0, value, false);
  return new DataView(buf).getBigUint64(0, false);
}

// ES2017 target forbids BigInt literals (1n); construct constants via BigInt().
const BI_52 = BigInt(52);
const BI_EXP_MASK = BigInt(0x7ff);
const BI_FRAC_MASK = BigInt('4503599627370495'); // 2^52 - 1, the 52 fraction bits
const BI_IMPLICIT_BIT = BigInt('4503599627370496'); // 2^52, implicit leading 1 position
const BI_ZERO = BigInt(0);
const BI_ONE = BigInt(1);

/**
 * Produce the canonical lowercase hexfloat literal for a finite number:
 * 0x1.<fraction>p<exponent>. Subnormals and signed zero are handled explicitly.
 */
export function toHexfloat(value: number): string {
  if (Number.isNaN(value)) {
    return 'nan';
  }
  if (!Number.isFinite(value)) {
    return value < 0 ? '-inf' : 'inf';
  }
  if (Object.is(value, -0)) {
    return '-0x0p+0';
  }
  if (value === 0) {
    return '0x0p+0';
  }

  const negative = value < 0;
  const bits = toBigUint64(Math.abs(value));
  const biasedExp = Number((bits >> BI_52) & BI_EXP_MASK);
  const fracBits = bits & BI_FRAC_MASK;
  const sign = negative ? '-' : '';

  // Subnormal: unbiased exponent is -1022 and the implicit bit is absent.
  if (biasedExp === 0) {
    // Normalize the 52-bit fraction into a leading-1 mantissa.
    let f = fracBits;
    let shift = 0;
    while ((f & BI_IMPLICIT_BIT) === BI_ZERO) {
      f <<= BI_ONE;
      shift += 1;
    }
    const mantissaFrac = f & BI_FRAC_MASK;
    const exponent = -1022 - shift;
    return `${sign}0x1.${fracToHex(mantissaFrac)}p${formatExponent(exponent)}`;
  }

  const exponent = biasedExp - 1023;
  return `${sign}0x1.${fracToHex(fracBits)}p${formatExponent(exponent)}`;
}

/** Convert the 52 fractional bits (after the implicit leading 1) to 13 hex digits. */
function fracToHex(frac52: bigint): string {
  return frac52.toString(16).padStart(13, '0');
}

function formatExponent(exp: number): string {
  return exp >= 0 ? `+${exp}` : `${exp}`;
}
