/**
 * 集合相似度计算纯函数集合，不依赖 DOM 与 React；
 * 输入为分隔文本解析出的命名集合，输出 Jaccard / Sørensen–Dice / Overlap 系数、
 * 两两配对明细与对称矩阵，所有结果确定性可复现
 */

/** 单个命名集合 */
export interface NamedSet {
  /** 集合名称 */
  name: string;
  /** 去重后的元素，按首次出现顺序保序 */
  elements: string[];
}

/** 两个集合的配对计算结果 */
export interface SetPair {
  /** 左侧集合名称 */
  a: string;
  /** 右侧集合名称 */
  b: string;
  /** 交集元素个数 */
  intersectionSize: number;
  /** 并集元素个数 */
  unionSize: number;
  /** Jaccard 指数 |A∩B| / |A∪B| */
  jaccard: number;
  /** Sørensen–Dice 系数 2|A∩B| / (|A|+|B|) */
  dice: number;
  /** 重叠系数 |A∩B| / min(|A|,|B|) */
  overlap: number;
  /** 交集元素明细 */
  intersection: string[];
  /** 并集元素明细 */
  union: string[];
}

/** 相似度计算完整结果 */
export interface SimilarityResult {
  /** 参与计算的命名集合 */
  sets: NamedSet[];
  /** 两两配对结果（按集合下标组合，不含自身配对） */
  pairs: SetPair[];
  /** Jaccard 对称矩阵，matrix[i][j] 为集合 i 与 j 的 Jaccard 系数 */
  matrix: number[][];
}

/** 文本解析选项 */
export interface ParseSetsOptions {
  /** 是否统一转为小写后再比较（默认关闭） */
  lowercase: boolean;
}

/**
 * 将多段文本解析为命名集合；每段文本的第一个非空 token 作为集合名，
 * 其余 token 按换行 / 逗号 / 空白拆分；自动 trim、丢弃空 token 并去重保序
 *
 * @param texts - 每段对应一个集合的原始文本
 * @param options - 解析选项
 * @returns 解析后的命名集合数组
 */
export function parseNamedSets(texts: string[], options: ParseSetsOptions): NamedSet[] {
  const sets: NamedSet[] = [];
  texts.forEach((text, index) => {
    const tokens = text
      .split(/[\n,，\s]+/)
      .map((token) => {
        const trimmed = token.trim();
        return options.lowercase ? trimmed.toLowerCase() : trimmed;
      })
      .filter((token) => token !== '');

    if (tokens.length === 0) {
      return;
    }

    const name = tokens[0];
    const seen = new Set<string>();
    const elements: string[] = [];
    for (const token of tokens.slice(1)) {
      if (!seen.has(token)) {
        seen.add(token);
        elements.push(token);
      }
    }
    sets.push({ name: name || `集合 ${index + 1}`, elements });
  });
  return sets;
}

/**
 * 安全除法：分母为 0 时返回兜底值，避免 NaN
 *
 * @param numerator - 分子
 * @param denominator - 分母
 * @param fallback - 分母为 0 时的返回值
 * @returns 比值或兜底值
 */
function safeDivide(numerator: number, denominator: number, fallback: number): number {
  return denominator === 0 ? fallback : numerator / denominator;
}

/**
 * 计算两个集合的三种相似度系数与交并集明细；
 * 两者皆空时系数定义为 1，仅一方为空时系数为 0
 *
 * @param a - 左侧命名集合
 * @param b - 右侧命名集合
 * @returns 配对计算结果
 */
export function computePair(a: NamedSet, b: NamedSet): SetPair {
  const setA = new Set(a.elements);
  const setB = new Set(b.elements);
  const intersection = a.elements.filter((element) => setB.has(element));
  const unionSet = new Set([...a.elements, ...b.elements]);
  const union = [...unionSet];

  const intersectionSize = intersection.length;
  const sizeA = setA.size;
  const sizeB = setB.size;
  const unionSize = unionSet.size;

  const bothEmpty = sizeA === 0 && sizeB === 0;
  return {
    a: a.name,
    b: b.name,
    intersectionSize,
    unionSize,
    jaccard: bothEmpty ? 1 : safeDivide(intersectionSize, unionSize, 0),
    dice: bothEmpty ? 1 : safeDivide(2 * intersectionSize, sizeA + sizeB, 0),
    overlap: bothEmpty ? 1 : safeDivide(intersectionSize, Math.min(sizeA, sizeB), 0),
    intersection,
    union,
  };
}

/**
 * 对一组命名集合计算全部两两配对与 Jaccard 对称矩阵；
 * 集合数小于 2 时返回空配对，矩阵对角线恒为 1
 *
 * @param sets - 命名集合数组
 * @returns 配对明细与对称矩阵
 */
export function computeSimilarity(sets: NamedSet[]): SimilarityResult {
  const count = sets.length;
  const pairs: SetPair[] = [];
  const matrix: number[][] = Array.from({ length: count }, () => new Array<number>(count).fill(0));

  for (let i = 0; i < count; i += 1) {
    matrix[i]![i] = 1;
    for (let j = i + 1; j < count; j += 1) {
      const pair = computePair(sets[i]!, sets[j]!);
      pairs.push(pair);
      matrix[i]![j] = pair.jaccard;
      matrix[j]![i] = pair.jaccard;
    }
  }

  return { sets, pairs, matrix };
}
