/**
 * 排列组合计算器工具内常量
 */
import type { CombinatoricKey } from './utils/combinatorics';

/** 默认 n */
export const DEFAULT_N = '5';

/** 默认 r */
export const DEFAULT_R = '3';

/** 各变体的展示元信息 */
export interface ItemMeta {
  /** 中文名 */
  label: string;
  /** 记号 */
  notation: string;
  /** 数学公式 */
  formula: string;
  /** 说明 */
  description: string;
}

/** 按展示顺序排列的变体元信息 */
export const ITEM_METAS: Record<CombinatoricKey, ItemMeta> = {
  factorial: {
    label: '阶乘',
    notation: 'n!',
    formula: 'n × (n−1) × … × 1',
    description: 'n 个不同元素的全排列数',
  },
  permutation: {
    label: '排列',
    notation: 'P(n, r)',
    formula: 'n! / (n−r)!',
    description: '从 n 个元素中有序选出 r 个（不放回）',
  },
  combination: {
    label: '组合',
    notation: 'C(n, r)',
    formula: 'n! / (r! · (n−r)!)',
    description: '从 n 个元素中无序选出 r 个（不放回）',
  },
  repetitionPermutation: {
    label: '重复排列',
    notation: 'nʳ',
    formula: 'n 的 r 次方',
    description: 'r 个位置各有 n 种选择（可放回、计顺序）',
  },
  repetitionCombination: {
    label: '重复组合',
    notation: 'C(n+r−1, r)',
    formula: '(n+r−1)! / (r! · (n−1)!)',
    description: '从 n 种元素中可放回选 r 个、不计顺序',
  },
  circularPermutation: {
    label: '圆排列',
    notation: '(n−1)!',
    formula: '(n−1) × (n−2) × … × 1',
    description: 'n 个不同元素围成一圈，旋转视为同一种',
  },
};

/** 变体展示顺序 */
export const ITEM_ORDER: CombinatoricKey[] = [
  'factorial',
  'permutation',
  'combination',
  'repetitionPermutation',
  'repetitionCombination',
  'circularPermutation',
];
