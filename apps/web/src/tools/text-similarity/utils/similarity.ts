/**
 * 文本相似度纯函数：Levenshtein 编辑距离与对齐、最长公共子序列、
 * Jaro-Winkler 相似度、Sørensen–Dice 双字组系数。
 * 不依赖 DOM / React，可直接在 Node 测试环境运行。
 */

/** 比较选项 */
export interface SimilarityOptions {
  /** 是否忽略大小写（默认关闭） */
  ignoreCase?: boolean;
}

/** 对齐操作类型 */
export type EditType = 'equal' | 'replace' | 'delete' | 'insert';

/** 单条编辑对齐记录 */
export interface EditOp {
  type: EditType;
  /** A 侧字符（equal/replace/delete 时存在） */
  aChar?: string;
  /** B 侧字符（equal/replace/insert 时存在） */
  bChar?: string;
}

/** 全部相似度指标 */
export interface SimilarityResult {
  /** A 的长度 */
  lengthA: number;
  /** B 的长度 */
  lengthB: number;
  /** Levenshtein 编辑距离 */
  levenshtein: number;
  /** 归一化 Levenshtein 相似度（0–1） */
  levenshteinRatio: number;
  /** 最长公共子序列长度 */
  lcs: number;
  /** LCS 归一化相似度（0–1，2·LCS/(|A|+|B|)） */
  lcsRatio: number;
  /** Jaro-Winkler 相似度（0–1） */
  jaroWinkler: number;
  /** Sørensen–Dice 双字组系数（0–1） */
  dice: number;
  /** 编辑对齐序列 */
  alignment: EditOp[];
}

/**
 * 按选项规范化文本
 *
 * @param text - 原文
 * @param options - 比较选项
 * @returns 规范化后的文本
 */
function normalize(text: string, options?: SimilarityOptions): string {
  return options?.ignoreCase ? text.toLocaleLowerCase() : text;
}

/**
 * Levenshtein 编辑距离（两行 DP）
 *
 * @param a - 文本 A
 * @param b - 文本 B
 * @returns 最少插入 / 删除 / 替换次数
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  let current = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1]! + 1,
        previous[j]! + 1,
        previous[j - 1]! + cost,
      );
    }
    [previous, current] = [current, previous];
  }
  return previous[b.length]!;
}

/**
 * 最长公共子序列长度
 *
 * @param a - 文本 A
 * @param b - 文本 B
 * @returns LCS 长度
 */
export function lcsLength(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) {
    return 0;
  }
  let previous = new Array<number>(b.length + 1).fill(0);
  let current = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        current[j] = previous[j - 1]! + 1;
      } else {
        current[j] = Math.max(previous[j]!, current[j - 1]!);
      }
    }
    [previous, current] = [current, previous];
  }
  return previous[b.length]!;
}

/**
 * Jaro 相似度（0–1）
 *
 * @param a - 文本 A
 * @param b - 文本 B
 * @returns Jaro 相似度
 */
function jaro(a: string, b: string): number {
  if (a === b) {
    return 1;
  }
  if (a.length === 0 || b.length === 0) {
    return 0;
  }
  const matchDistance = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatches = new Array<boolean>(a.length).fill(false);
  const bMatches = new Array<boolean>(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i += 1) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, b.length);
    for (let j = start; j < end; j += 1) {
      if (bMatches[j]) {
        continue;
      }
      if (a[i] !== b[j]) {
        continue;
      }
      aMatches[i] = true;
      bMatches[j] = true;
      matches += 1;
      break;
    }
  }
  if (matches === 0) {
    return 0;
  }
  let halfTranspositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (!aMatches[i]) {
      continue;
    }
    while (!bMatches[k]) {
      k += 1;
    }
    if (a[i] !== b[k]) {
      halfTranspositions += 1;
    }
    k += 1;
  }
  const transpositions = halfTranspositions / 2;
  return (
    (matches / a.length + matches / b.length + (matches - transpositions) / matches) / 3
  );
}

/**
 * Jaro-Winkler 相似度（0–1），前缀加成最多 4 个字符，缩放系数 0.1
 *
 * @param a - 文本 A
 * @param b - 文本 B
 * @returns Jaro-Winkler 相似度
 */
export function jaroWinkler(a: string, b: string): number {
  const jaroScore = jaro(a, b);
  let prefix = 0;
  const maxPrefix = Math.min(4, a.length, b.length);
  for (let i = 0; i < maxPrefix; i += 1) {
    if (a[i] === b[i]) {
      prefix += 1;
    } else {
      break;
    }
  }
  return jaroScore + prefix * 0.1 * (1 - jaroScore);
}

/**
 * 构造字符二元组（bigram）多重集合
 *
 * @param text - 输入文本
 * @returns bigram → 出现次数
 */
function bigrams(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (let i = 0; i < text.length - 1; i += 1) {
    const pair = text.slice(i, i + 2);
    counts.set(pair, (counts.get(pair) ?? 0) + 1);
  }
  return counts;
}

/**
 * Sørensen–Dice 双字组系数：2·|A∩B| / (|A|+|B|)，按多重集合计数
 *
 * @param a - 文本 A
 * @param b - 文本 B
 * @returns Dice 系数（0–1）
 */
export function diceCoefficient(a: string, b: string): number {
  if (a === b) {
    return 1;
  }
  const aBigrams = bigrams(a);
  const bBigrams = bigrams(b);
  let aTotal = 0;
  let bTotal = 0;
  aBigrams.forEach((count) => {
    aTotal += count;
  });
  bBigrams.forEach((count) => {
    bTotal += count;
  });
  if (aTotal + bTotal === 0) {
    return 0;
  }
  let intersection = 0;
  aBigrams.forEach((count, pair) => {
    intersection += Math.min(count, bBigrams.get(pair) ?? 0);
  });
  return (2 * intersection) / (aTotal + bTotal);
}

/**
 * 回溯 Levenshtein 全矩阵，生成编辑对齐序列
 *
 * @param a - 文本 A
 * @param b - 文本 B
 * @returns 对齐操作（按从左到右顺序）
 */
export function levenshteinAlignment(a: string, b: string): EditOp[] {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () =>
    new Array<number>(cols).fill(0),
  );
  for (let i = 0; i < rows; i += 1) {
    dp[i]![0] = i;
  }
  for (let j = 0; j < cols; j += 1) {
    dp[0]![j] = j;
  }
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
    }
  }

  const ops: EditOp[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.push({ type: 'equal', aChar: a[i - 1], bChar: b[j - 1] });
      i -= 1;
      j -= 1;
      continue;
    }
    const current = dp[i]![j]!;
    if (
      i > 0 &&
      j > 0 &&
      current === dp[i - 1]![j - 1]! + 1
    ) {
      ops.push({ type: 'replace', aChar: a[i - 1], bChar: b[j - 1] });
      i -= 1;
      j -= 1;
    } else if (i > 0 && current === dp[i - 1]![j]! + 1) {
      ops.push({ type: 'delete', aChar: a[i - 1] });
      i -= 1;
    } else {
      ops.push({ type: 'insert', bChar: b[j - 1] });
      j -= 1;
    }
  }
  return ops.reverse();
}

/**
 * 一次性计算全部相似度指标
 *
 * @param rawA - 文本 A
 * @param rawB - 文本 B
 * @param options - 比较选项
 * @returns 全部指标与对齐序列
 */
export function compareTexts(
  rawA: string,
  rawB: string,
  options?: SimilarityOptions,
): SimilarityResult {
  const a = normalize(rawA, options);
  const b = normalize(rawB, options);
  const distance = levenshtein(a, b);
  const lcs = lcsLength(a, b);
  const maxLength = Math.max(a.length, b.length);
  const totalLength = a.length + b.length;
  return {
    lengthA: a.length,
    lengthB: b.length,
    levenshtein: distance,
    levenshteinRatio: maxLength === 0 ? 1 : 1 - distance / maxLength,
    lcs,
    lcsRatio: totalLength === 0 ? 1 : (2 * lcs) / totalLength,
    jaroWinkler: jaroWinkler(a, b),
    dice: diceCoefficient(a, b),
    alignment: levenshteinAlignment(a, b),
  };
}
