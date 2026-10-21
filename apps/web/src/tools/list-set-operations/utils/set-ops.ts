/**
 * 列表集合运算纯函数集合，不依赖 DOM 与 React；
 * 输入为每行一项的文本，输出按首次出现顺序保序；
 * 去重关闭时保留左侧（或对应侧）列表中的重复出现次数
 */

/** 列表解析选项 */
export interface ParseOptions {
  /** 是否对每行去除首尾空白（默认开启） */
  trim: boolean;
  /** 是否统一转为小写后再比较（默认关闭） */
  lowercase: boolean;
}

/** 集合运算选项 */
export interface SetOperationOptions {
  /** 结果是否去重（默认开启）；关闭时保留基准侧的重复次数 */
  dedupe: boolean;
}

/** 五组集合运算结果 */
export interface SetOperationResult {
  /** 交集 A∩B（以 A 为基准） */
  intersection: string[];
  /** 并集 A∪B（以 A 为基准，后接 B 中新值） */
  union: string[];
  /** 仅左侧独有 A−B */
  leftOnly: string[];
  /** 仅右侧独有 B−A */
  rightOnly: string[];
  /** 对称差集 (A−B)∪(B−A) */
  symmetricDifference: string[];
}

/**
 * 将多行文本解析为条目数组；按行切分后执行 trim / 小写归一，
 * trim 后为空字符串的行丢弃，不做去重（重复项保留）
 *
 * @param text - 原始多行文本
 * @param options - 解析选项
 * @returns 解析后的条目数组
 */
export function parseList(text: string, options: ParseOptions): string[] {
  if (text === '') {
    return [];
  }
  return text
    .split(/\r?\n/)
    .map((line) => {
      let next = line;
      if (options.trim) {
        next = next.trim();
      }
      if (options.lowercase) {
        next = next.toLowerCase();
      }
      return next;
    })
    .filter((line) => line !== '');
}

/**
 * 统计数组中每个条目的出现次数
 *
 * @param list - 条目数组
 * @returns 条目到次数的映射
 */
function countOccurrences(list: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of list) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return counts;
}

/**
 * 依据基准数组的顺序与重复次数，输出每个键重复出现 key 在基准中次数与上限中的较小值；
 * 用于去重关闭时保留重复（交集取两侧次数较小值，差集取减后剩余次数）
 *
 * @param base - 基准数组（决定顺序与次数）
 * @param remainingCounts - 每个键允许保留的次数
 * @returns 展开后的结果数组
 */
function expandWithCounts(base: string[], remainingCounts: Map<string, number>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of base) {
    if (!seen.has(item)) {
      seen.add(item);
      const times = remainingCounts.get(item) ?? 0;
      for (let index = 0; index < times; index += 1) {
        result.push(item);
      }
    }
  }
  return result;
}

/**
 * 对两个已解析的条目数组执行五种集合运算；
 * 去重开启时每值出现一次，关闭时交集/并集/差集保留基准侧重复次数，
 * 所有结果按首次出现顺序排列
 *
 * @param a - 左侧条目数组
 * @param b - 右侧条目数组
 * @param options - 运算选项
 * @returns 五组运算结果
 */
export function setOperations(
  a: string[],
  b: string[],
  options: SetOperationOptions,
): SetOperationResult {
  const countsA = countOccurrences(a);
  const countsB = countOccurrences(b);
  const uniqueA = new Set(a);
  const uniqueB = new Set(b);

  const intersectionCounts = new Map<string, number>();
  const leftOnlyCounts = new Map<string, number>();
  const rightOnlyCounts = new Map<string, number>();

  for (const [item, countA] of countsA) {
    const countB = countsB.get(item) ?? 0;
    if (countB > 0) {
      intersectionCounts.set(item, countA);
      leftOnlyCounts.set(item, Math.max(countA - countB, 0));
    } else {
      leftOnlyCounts.set(item, countA);
    }
  }
  for (const [item, countB] of countsB) {
    const countA = countsA.get(item) ?? 0;
    rightOnlyCounts.set(item, Math.max(countB - countA, 0));
  }

  if (options.dedupe) {
    const intersection = [...uniqueA].filter((item) => uniqueB.has(item));
    const leftOnly = [...uniqueA].filter((item) => !uniqueB.has(item));
    const rightOnly = [...uniqueB].filter((item) => !uniqueA.has(item));
    const union = [...uniqueA, ...rightOnly];
    return {
      intersection,
      union,
      leftOnly,
      rightOnly,
      symmetricDifference: [...leftOnly, ...rightOnly],
    };
  }

  const intersection = expandWithCounts(a, intersectionCounts);
  const leftOnly = expandWithCounts(a, leftOnlyCounts);
  const rightOnly = expandWithCounts(b, rightOnlyCounts);
  const union = [...a, ...rightOnly];
  return {
    intersection,
    union,
    leftOnly,
    rightOnly,
    symmetricDifference: [...leftOnly, ...rightOnly],
  };
}
