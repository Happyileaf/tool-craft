/**
 * 模运算纯函数集合：模逆元、模幂、模线性方程与中国剩余定理
 *
 * 全部基于 BigInt 实现，不触碰 DOM / React，可在 Vitest 中直接验收。
 */

/** 同余方程组的单条输入：x ≡ remainder (mod modulus) */
export interface Congruence {
  /** 余数 r */
  remainder: bigint;
  /** 模数 m（正整数） */
  modulus: bigint;
}

/** 模线性方程 ax ≡ b (mod m) 的求解结果 */
export interface LinearSolution {
  /** 解的个数，等于 gcd(a, m) */
  count: bigint;
  /** 最小非负特解 */
  particular: bigint;
  /** 相邻解之间的步长 m / gcd(a, m) */
  step: bigint;
  /** 模数（规范化后） */
  modulus: bigint;
  /** 全部最小非负剩余类解 */
  solutions: bigint[];
}

/** 中国剩余定理合并结果 */
export interface CrtResult {
  /** 最小非负解 */
  remainder: bigint;
  /** 合并后的模数 */
  modulus: bigint;
}

/**
 * 解析十进制或 0x 十六进制整数字面量为 BigInt
 *
 * @param input - 用户输入文本
 * @returns 解析得到的大整数
 * @throws 输入为空或格式非法时抛出错误
 */
export function parseBigInt(input: string): bigint {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('输入不能为空');
  }
  const normalized = trimmed.replace(/^\+/, '');
  if (/^0[xX][0-9a-fA-F]+$/.test(normalized)) {
    return BigInt(normalized);
  }
  if (/^-?\d+$/.test(normalized)) {
    return BigInt(normalized);
  }
  throw new Error(`无法解析整数：${trimmed}（仅支持十进制与 0x 十六进制）`);
}

/**
 * 扩展欧几里得算法，返回 gcd(a, b) 与贝祖系数 x、y，满足 ax + by = gcd
 *
 * @param a - 整数 a
 * @param b - 整数 b
 * @returns gcd 与贝祖系数
 */
export function extendedGcd(a: bigint, b: bigint): {
  gcd: bigint;
  x: bigint;
  y: bigint;
} {
  let oldR = a;
  let r = b;
  let oldS = BigInt(1);
  let s = BigInt(0);
  let oldT = BigInt(0);
  let t = BigInt(1);

  while (r !== BigInt(0)) {
    const quotient = oldR / r;
    [oldR, r] = [r, oldR - quotient * r];
    [oldS, s] = [s, oldS - quotient * s];
    [oldT, t] = [t, oldT - quotient * t];
  }

  return { gcd: oldR < BigInt(0) ? -oldR : oldR, x: oldS, y: oldT };
}

/**
 * 求模逆元 a⁻¹ mod m
 *
 * @param a - 底数 a
 * @param m - 模数 m（必须为正整数）
 * @returns 最小非负逆元
 * @throws 模数非正或 gcd(a, m) ≠ 1（逆元不存在）时抛出错误并给出 gcd
 */
export function modularInverse(a: bigint, m: bigint): bigint {
  if (m <= BigInt(0)) {
    throw new Error('模数必须为正整数');
  }
  const base = ((a % m) + m) % m;
  const { gcd, x } = extendedGcd(base, m);
  if (gcd !== BigInt(1)) {
    throw new Error(`逆元不存在：gcd(${a}, ${m}) = ${gcd}，仅当两者互素时才有逆元`);
  }
  return ((x % m) + m) % m;
}

/**
 * 平方-乘快速幂，求 base^exponent mod modulus
 *
 * 指数为负时先求底数逆元；modulus = 1 时结果恒为 0。
 *
 * @param base - 底数
 * @param exponent - 指数（可为负整数，负指数要求逆元存在）
 * @param modulus - 模数（正整数）
 * @returns 最小非负模幂结果
 */
export function modularPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus <= BigInt(0)) {
    throw new Error('模数必须为正整数');
  }
  if (modulus === BigInt(1)) {
    return BigInt(0);
  }
  if (exponent < BigInt(0)) {
    const inverse = modularInverse(base, modulus);
    return positivePow(inverse, -exponent, modulus);
  }
  return positivePow(((base % modulus) + modulus) % modulus, exponent, modulus);
}

/**
 * 非负指数的平方-乘实现
 *
 * @param base - 已规范化到 [0, modulus) 的底数
 * @param exponent - 非负指数
 * @param modulus - 模数
 * @returns 模幂结果
 */
function positivePow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = BigInt(1);
  let current = base;
  let exp = exponent;

  while (exp > BigInt(0)) {
    if (exp & BigInt(1)) {
      result = (result * current) % modulus;
    }
    current = (current * current) % modulus;
    exp >>= BigInt(1);
  }
  return result;
}

/**
 * 求解模线性方程 ax ≡ b (mod m) 的全部最小非负剩余类解
 *
 * @param a - 系数 a
 * @param b - 右端项 b
 * @param m - 模数 m（正整数）
 * @returns 解的个数、特解、步长与全部剩余类解
 * @throws 模数非正或 gcd(a, m) 不整除 b（无解）时抛出错误
 */
export function solveLinearCongruence(
  a: bigint,
  b: bigint,
  m: bigint,
): LinearSolution {
  if (m <= BigInt(0)) {
    throw new Error('模数必须为正整数');
  }
  const normalizedA = ((a % m) + m) % m;
  const normalizedB = ((b % m) + m) % m;
  const { gcd, x } = extendedGcd(normalizedA, m);

  if (normalizedB % gcd !== BigInt(0)) {
    throw new Error(`方程无解：gcd(${a}, ${m}) = ${gcd} 不整除右端项 ${b}`);
  }

  const reducedModulus = m / gcd;
  const particular =
    (((x * (normalizedB / gcd)) % reducedModulus) + reducedModulus) %
    reducedModulus;

  const solutions: bigint[] = [];
  for (let k = BigInt(0); k < gcd; k += BigInt(1)) {
    solutions.push((particular + k * reducedModulus) % m);
  }

  return {
    count: gcd,
    particular,
    step: reducedModulus,
    modulus: m,
    solutions,
  };
}

/**
 * 中国剩余定理：合并同余方程组
 *
 * 两两互素时直接合并；模数不互素时先做可解性判定
 * （两组同余冲突即无解），再按 lcm 合并。
 *
 * @param congruences - 同余方程数组，每项为 x ≡ remainder (mod modulus)
 * @returns 最小非负解与合并模数
 * @throws 方程组为空、模数非正或同余冲突时抛出错误
 */
export function chineseRemainder(congruences: Congruence[]): CrtResult {
  if (congruences.length === 0) {
    throw new Error('同余方程组不能为空');
  }

  let remainder = BigInt(0);
  let modulus = BigInt(1);

  congruences.forEach((item, index) => {
    if (item.modulus <= BigInt(0)) {
      throw new Error(`第 ${index + 1} 个方程的模数必须为正整数`);
    }
    const r = ((item.remainder % item.modulus) + item.modulus) % item.modulus;
    const { gcd } = extendedGcd(modulus, item.modulus);
    const diff = r - remainder;

    if (diff % gcd !== BigInt(0)) {
      throw new Error(
        `同余冲突：第 ${index + 1} 个方程与前面的方程无公共解（余数差 ${diff} 不能被 gcd ${gcd} 整除）`,
      );
    }

    const lcm = (modulus / gcd) * item.modulus;
    // 在 lcm 范围内求满足两组同余的解：remainder + modulus * k ≡ r (mod item.modulus)
    const step = modulus / gcd;
    const target = (diff / gcd) % (item.modulus / gcd);
    const k = (modularInverse(step, item.modulus / gcd) * target) %
      (item.modulus / gcd);
    const normalizedK = k < BigInt(0) ? k + item.modulus / gcd : k;

    remainder = (remainder + modulus * normalizedK) % lcm;
    modulus = lcm;
    remainder = ((remainder % modulus) + modulus) % modulus;
  });

  return { remainder, modulus };
}
