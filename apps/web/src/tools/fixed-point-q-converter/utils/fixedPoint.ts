/**
 * Qm.n 有符号二进制定点数转换与运算，纯 BigInt 整数算术、零依赖。
 *
 * Qm.n：总位宽 bits = m + n + 1（含 1 位符号），n 为小数位数，
 * 定标因子 scale = 2^n，真实值 = raw / scale。
 * 为兼容项目 ES2017 编译目标，全部 BigInt 均以 BigInt(...) 构造，不使用 bigint 字面量。
 */

/** 支持的总位宽 */
export const SUPPORTED_BITS = [8, 16, 32] as const;

/** 舍入模式：截断（向零）或四舍五入到最近值（.5 向远离零方向） */
export type RoundingMode = 'truncate' | 'nearest';

/** 转换/运算结果附带的告警与元信息 */
export interface FixedResult {
  /** 定标后的补码整数（已按位宽收敛到有符号表示范围） */
  raw: bigint;
  /** 由 raw 反解出的实际小数值 */
  value: number;
  /** 是否因越界被饱和处理 */
  saturated: boolean;
  /** 量化（舍入）误差：实际存储值 − 输入值 */
  quantizationError: number;
}

/** 加法/乘法运算结果 */
export interface ArithResult {
  /** 运算定标后的补码整数 */
  raw: bigint;
  /** 反解小数值 */
  value: number;
  /** 是否发生饱和/溢出 */
  overflow: boolean;
  /** 舍入模式（仅乘法可能产生非零舍入） */
  rounding: RoundingMode;
  /** 舍入误差 */
  roundingError: number;
}

/**
 * 校验位宽与小数位组合
 *
 * @param bits - 总位宽
 * @param fracBits - 小数位数 n
 */
export function validateFormat(bits: number, fracBits: number): void {
  if (!SUPPORTED_BITS.includes(bits as (typeof SUPPORTED_BITS)[number])) {
    throw new Error(`位宽仅支持 ${SUPPORTED_BITS.join('/')} 位，实际为 ${bits} 位`);
  }
  if (!Number.isInteger(fracBits) || fracBits < 0 || fracBits > bits - 1) {
    throw new Error(`小数位数 n 必须满足 0 ≤ n ≤ ${bits - 1}，实际为 ${fracBits}`);
  }
}

/**
 * 定标因子 2^n
 *
 * @param fracBits - 小数位数
 * @returns BigInt 定标因子
 */
function scaleOf(fracBits: number): bigint {
  return BigInt(1) << BigInt(fracBits);
}

/**
 * 指定位宽的有符号补码上下限
 *
 * @param bits - 总位宽
 * @returns 最小值与最大 raw
 */
export function rawRange(bits: number): { min: bigint; max: bigint } {
  const min = -(BigInt(1) << BigInt(bits - 1));
  const max = (BigInt(1) << BigInt(bits - 1)) - BigInt(1);
  return { min, max };
}

/**
 * 定点格式元信息：精度、可表示真实值范围、m（整数位数）
 *
 * @param bits - 总位宽
 * @param fracBits - 小数位数 n
 * @returns 精度、最小/最大可表示值与 m
 */
export function formatInfo(bits: number, fracBits: number): {
  m: number;
  precision: number;
  minRepresentable: number;
  maxRepresentable: number;
} {
  validateFormat(bits, fracBits);
  const { min, max } = rawRange(bits);
  const scale = scaleOf(fracBits);
  return {
    m: bits - fracBits - 1,
    precision: Math.pow(2, -fracBits),
    minRepresentable: Number(min) / Number(scale),
    maxRepresentable: Number(max) / Number(scale),
  };
}

/**
 * 把十进制小数转换为 Qm.n 定点补码整数，越界自动饱和。
 *
 * @param value - 输入小数
 * @param bits - 总位宽
 * @param fracBits - 小数位数 n
 * @param mode - 舍入模式，默认四舍五入
 * @returns 含 raw、反解值、饱和标记与量化误差的结果
 */
export function floatToFixed(
  value: number,
  bits: number,
  fracBits: number,
  mode: RoundingMode = 'nearest',
): FixedResult {
  validateFormat(bits, fracBits);
  if (!Number.isFinite(value)) {
    throw new Error('输入必须是有限数值，不支持 NaN 或 Infinity');
  }
  const scale = scaleOf(fracBits);
  const { min, max } = rawRange(bits);

  // 先在 Number 域完成定标与舍入，再转 BigInt，避免小数直接转 BigInt 抛异常
  const scaledReal = value * Number(scale);
  const roundedNumber =
    mode === 'truncate' ? Math.trunc(scaledReal) : Math.round(scaledReal);
  const rounded = BigInt(roundedNumber);
  const saturated = rounded > max || rounded < min;
  const raw = saturated ? (rounded > max ? max : min) : rounded;
  const stored = Number(raw) / Number(scale);
  return {
    raw,
    value: stored,
    saturated,
    quantizationError: stored - value,
  };
}

/**
 * 把 Qm.n 补码整数反解为十进制小数。
 *
 * @param raw - 补码整数
 * @param bits - 总位宽
 * @param fracBits - 小数位数 n
 * @returns 反解小数值
 */
export function fixedToFloat(raw: bigint, bits: number, fracBits: number): number {
  validateFormat(bits, fracBits);
  const { min, max } = rawRange(bits);
  if (raw < min || raw > max) {
    throw new Error(
      `raw 超出 ${bits} 位有符号范围 [${min.toString()}, ${max.toString()}]，实际为 ${raw.toString()}`,
    );
  }
  return Number(raw) / Number(scaleOf(fracBits));
}

/**
 * 输出 raw 的补码二进制字符串（按位宽补零）与无符号十六进制表示。
 *
 * @param raw - 有符号补码整数
 * @param bits - 总位宽
 * @returns 二进制与十六进制字符串
 */
export function toComplementStrings(
  raw: bigint,
  bits: number,
): { binary: string; hex: string } {
  // 负数映射到无符号补码表示：raw + 2^bits
  const modulus = BigInt(1) << BigInt(bits);
  const unsignedValue = raw < BigInt(0) ? raw + modulus : raw;
  const hexWidth = Math.ceil(bits / 4);
  return {
    binary: unsignedValue.toString(2).padStart(bits, '0'),
    hex: `0x${unsignedValue.toString(16).toUpperCase().padStart(hexWidth, '0')}`,
  };
}

/**
 * 两个同格式 Qm.n 定点数相加，越界返回饱和值并标记 overflow。
 *
 * @param a - 操作数 A 的 raw
 * @param b - 操作数 B 的 raw
 * @param bits - 总位宽
 * @param fracBits - 小数位数 n
 * @returns 运算结果
 */
export function fixedAdd(
  a: bigint,
  b: bigint,
  bits: number,
  fracBits: number,
): ArithResult {
  validateFormat(bits, fracBits);
  const { min, max } = rawRange(bits);
  const sum = a + b;
  const overflow = sum > max || sum < min;
  const raw = overflow ? (sum > max ? max : min) : sum;
  return {
    raw,
    value: fixedToFloat(raw, bits, fracBits),
    overflow,
    rounding: 'truncate',
    roundingError: 0,
  };
}

/**
 * 两个同格式 Qm.n 定点数相乘。
 * 整数乘积为 2×bits 位、Q(2m+1).2n，按目标 Qm.n 右移 n 位定标，
 * 支持截断/四舍五入，最终越界饱和并标记 overflow。
 *
 * @param a - 操作数 A 的 raw
 * @param b - 操作数 B 的 raw
 * @param bits - 总位宽
 * @param fracBits - 小数位数 n
 * @param mode - 舍入模式，默认四舍五入
 * @returns 运算结果
 */
export function fixedMul(
  a: bigint,
  b: bigint,
  bits: number,
  fracBits: number,
  mode: RoundingMode = 'nearest',
): ArithResult {
  validateFormat(bits, fracBits);
  const { min, max } = rawRange(bits);
  const product = a * b;

  let scaled: bigint;
  if (fracBits === 0) {
    scaled = product;
  } else if (mode === 'truncate') {
    // 向零取整
    scaled = product >= BigInt(0)
      ? product >> BigInt(fracBits)
      : -((-product) >> BigInt(fracBits));
  } else {
    const half = BigInt(1) << BigInt(fracBits - 1);
    const sign = product >= BigInt(0) ? BigInt(1) : BigInt(-1);
    const abs = product >= BigInt(0) ? product : -product;
    scaled = sign * ((abs + half) >> BigInt(fracBits));
  }

  const overflow = scaled > max || scaled < min;
  const raw = overflow ? (scaled > max ? max : min) : scaled;
  const exactValue = Number(product) / Number(scaleOf(fracBits) * scaleOf(fracBits));
  const stored = fixedToFloat(raw, bits, fracBits);
  return {
    raw,
    value: stored,
    overflow,
    rounding: mode,
    roundingError: stored - exactValue,
  };
}
