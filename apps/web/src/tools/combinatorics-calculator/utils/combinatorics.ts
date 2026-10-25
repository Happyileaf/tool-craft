/**
 * 排列组合计算纯函数集合
 *
 * 所有计数结果均使用 BigInt 精确计算，避免大整数（如 1000!）超出安全整数范围。
 * 注意：项目编译目标为 ES2017，禁止使用 BigInt 字面量（如 1n），统一通过 BigInt() 构造。
 */

/** 支持的最大 n / r，避免阶乘与幂运算耗时过长 */
export const MAX_INPUT = 1000;

/** 可计算的排列组合变体标识 */
export type CombinatoricKey =
  | 'factorial'
  | 'permutation'
  | 'combination'
  | 'repetitionPermutation'
  | 'repetitionCombination'
  | 'circularPermutation';

/** 单项计算结果 */
export interface CombinatoricResultItem {
  /** 变体标识 */
  key: CombinatoricKey;
  /** 是否适用于当前输入 */
  available: boolean;
  /** 不可用时的原因说明 */
  reason: string | null;
  /** 精确值（十进制字符串），不可用时为 null */
  exact: string | null;
  /** 科学计数法近似值（如 9.33262154e+157），小整数为 null */
  scientific: string | null;
}

/** 整体计算结果 */
export interface CombinatoricResult {
  /** 规范化后的 n */
  n: number;
  /** 规范化后的 r */
  r: number;
  /** 各变体结果，按固定展示顺序排列 */
  items: CombinatoricResultItem[];
}

/** 输入校验错误 */
export interface CombinatoricError {
  /** 出错字段 */
  field: 'n' | 'r';
  /** 错误信息 */
  message: string;
}

/** 解析单个非负整数输入，非法时返回错误信息 */
export function parseNonNegativeInteger(raw: string, field: 'n' | 'r'): CombinatoricError | null {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { field, message: '不能为空' };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { field, message: '必须为非负整数（不接受小数、负数或非数字字符）' };
  }
  const value = Number(trimmed);
  if (value > MAX_INPUT) {
    return { field, message: `不能超过 ${MAX_INPUT}` };
  }
  return null;
}

/** 计算非负整数阶乘 n! */
export function factorial(n: number): bigint {
  let result = BigInt(1);
  for (let i = 2; i <= n; i += 1) {
    result *= BigInt(i);
  }
  return result;
}

/**
 * 排列数 P(n,r) = n! / (n-r)!
 * 调用前需保证 0 <= r <= n
 */
export function permutation(n: number, r: number): bigint {
  let result = BigInt(1);
  for (let i = 0; i < r; i += 1) {
    result *= BigInt(n - i);
  }
  return result;
}

/**
 * 组合数 C(n,r) = n! / (r! (n-r)!)
 * 调用前需保证 0 <= r <= n；内部利用对称性并通过乘除交替保持整除
 */
export function combination(n: number, r: number): bigint {
  const k = Math.min(r, n - r);
  let result = BigInt(1);
  for (let i = 1; i <= k; i += 1) {
    result = (result * BigInt(n - k + i)) / BigInt(i);
  }
  return result;
}

/**
 * 重复排列数 n^r（可放回排列，r 个位置各有 n 种选择）
 * 使用快速幂计算
 */
export function repetitionPermutation(n: number, r: number): bigint {
  let base = BigInt(n);
  let exponent = r;
  let result = BigInt(1);
  while (exponent > 0) {
    if (exponent % 2 === 1) {
      result *= base;
    }
    base *= base;
    exponent = Math.floor(exponent / 2);
  }
  return result;
}

/**
 * 重复组合数 C(n+r-1, r)（可放回组合，不计顺序）
 */
export function repetitionCombination(n: number, r: number): bigint {
  return combination(n + r - 1, r);
}

/**
 * 圆排列数 (n-1)!，n 个不同元素围成一圈（旋转视为同一种）
 * 调用前需保证 n >= 1
 */
export function circularPermutation(n: number): bigint {
  return factorial(n - 1);
}

/**
 * 将 BigInt 精确值转换为科学计数法字符串（保留 10 位有效数字）。
 * 绝对值小于 1e15 时返回 null，由界面直接展示精确值。
 */
export function toScientific(value: bigint): string | null {
  if (value < BigInt(0)) {
    return null;
  }
  const digits = value.toString();
  if (digits.length <= 15) {
    return null;
  }
  const SIGNIFICANT = 10;
  const head = BigInt(digits.slice(0, SIGNIFICANT + 1));
  const rounded = head / BigInt(10) + (head % BigInt(10) >= BigInt(5) ? BigInt(1) : BigInt(0));
  const roundedDigits = rounded.toString();
  const carry = roundedDigits.length > SIGNIFICANT;
  const mantissaDigits = carry ? roundedDigits.slice(0, SIGNIFICANT) : roundedDigits;
  const mantissa = trimMantissa(
    `${mantissaDigits.charAt(0)}.${mantissaDigits.slice(1).padEnd(SIGNIFICANT - 1, '0')}`,
  );
  const exponent = digits.length - 1 + (carry ? 1 : 0);
  return `${mantissa}e+${exponent}`;
}

/** 去掉尾数末尾多余的 0 与小数点 */
function trimMantissa(mantissa: string): string {
  return mantissa.replace(/0+$/, '').replace(/\.$/, '');
}

/** 为十进制数字串添加千位分隔符 */
export function groupThousands(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 单项计算描述 */
interface ItemSpec {
  key: CombinatoricKey;
  available: boolean;
  reason: string | null;
  compute: () => bigint;
}

/**
 * 根据 n、r 计算全部排列组合变体。
 * 调用前需保证 n、r 已通过 parseNonNegativeInteger 校验且 n + r - 1 不超限。
 */
export function calculateCombinatorics(n: number, r: number): CombinatoricResult {
  const specs: ItemSpec[] = [
    { key: 'factorial', available: true, reason: null, compute: () => factorial(n) },
    {
      key: 'permutation',
      available: r <= n,
      reason: `要求 r ≤ n（当前 r=${r} > n=${n}）`,
      compute: () => permutation(n, r),
    },
    {
      key: 'combination',
      available: r <= n,
      reason: `要求 r ≤ n（当前 r=${r} > n=${n}）`,
      compute: () => combination(n, r),
    },
    {
      key: 'repetitionPermutation',
      available: true,
      reason: null,
      compute: () => repetitionPermutation(n, r),
    },
    {
      key: 'repetitionCombination',
      available: n >= 1,
      reason: '可放回组合要求 n ≥ 1',
      compute: () => repetitionCombination(n, r),
    },
    {
      key: 'circularPermutation',
      available: n >= 1,
      reason: '圆排列要求 n ≥ 1（至少一个元素才能成环）',
      compute: () => circularPermutation(n),
    },
  ];

  const items: CombinatoricResultItem[] = specs.map((spec) => {
    if (!spec.available) {
      return { key: spec.key, available: false, reason: spec.reason, exact: null, scientific: null };
    }
    const value = spec.compute();
    const exact = value.toString();
    return {
      key: spec.key,
      available: true,
      reason: null,
      exact,
      scientific: toScientific(value),
    };
  });

  return { n, r, items };
}
