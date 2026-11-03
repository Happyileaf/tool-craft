/**
 * 化学式解析与摩尔质量计算纯函数。
 * 支持：元素符号 + 数字下标、()/[] 嵌套括号、结晶水 ·nH2O（兼容 • 与 *）、
 * 电荷后缀（如 SO4^2-、SO4{2-}，不影响质量）。
 */
import { ELEMENT_MAP, HYDRATE_SPLIT_PATTERN, type ElementInfo } from '../constants';

/** 单个元素的展开统计 */
export interface ElementBreakdown {
  /** 元素符号 */
  symbol: string;
  /** 元素名称 */
  name: string;
  /** 化学式中的原子总数 */
  count: number;
  /** 该元素的质量贡献（g/mol） */
  massContribution: number;
  /** 质量百分比 0-100 */
  massPercent: number;
  /** 原子量是否为方括号近似值 */
  bracketed: boolean;
}

/** 单个化学式的解析计算结果 */
export interface MolarResult {
  /** 去除空白后的输入 */
  formula: string;
  /** 规范化展示形式（统一使用 · 连接加合物） */
  normalized: string;
  /** 摩尔质量（g/mol） */
  molarMass: number;
  /** 各元素组成（按化学式中首次出现顺序） */
  breakdown: ElementBreakdown[];
  /** 原子总数（下标之和） */
  totalAtoms: number;
  /** 加合物组分（如 CuSO4·5H2O 中的 5H2O）提示，供界面展示 */
  parts: Array<{ coefficient: number; segment: string }>;
  /** 计算中使用了方括号近似原子量的元素符号 */
  bracketedSymbols: string[];
}

/** 读取从 index 开始的连续数字下标，返回数值与新位置；无数字时返回 1 */
function readCount(formula: string, index: number): { count: number; next: number } {
  let end = index;
  while (end < formula.length && /[0-9]/.test(formula.charAt(end))) {
    end += 1;
  }
  if (end === index) return { count: 1, next: index };
  return { count: Number(formula.slice(index, end)), next: end };
}

/** 合并元素计数（保持首次出现顺序） */
function merge(
  target: Map<string, number>,
  source: Map<string, number>,
  multiplier: number,
): void {
  source.forEach((cnt, symbol) => {
    target.set(symbol, (target.get(symbol) ?? 0) + cnt * multiplier);
  });
}

/**
 * 解析不含结晶水分隔符的单段化学式（支持嵌套括号）。
 *
 * @param segment - 化学式段
 * @returns 元素符号 → 原子数
 */
export function parseSegment(segment: string): Map<string, number> {
  const counts = new Map<string, number>();
  // 栈：每层保存该括号内的计数
  const stack: Array<Map<string, number>> = [counts];
  let i = 0;

  const current = (): Map<string, number> => {
    const top = stack[stack.length - 1];
    if (!top) throw new Error('解析器内部错误');
    return top;
  };

  while (i < segment.length) {
    const ch = segment.charAt(i);

    if (ch === '(' || ch === '[') {
      stack.push(new Map());
      i += 1;
      continue;
    }

    if (ch === ')' || ch === ']') {
      const opening = ch === ')' ? '(' : '[';
      if (stack.length <= 1) {
        throw new Error(`括号不匹配：多余的 "${ch}"。`);
      }
      // 简单校验配对
      const closed = stack.pop();
      if (!closed) throw new Error('解析器内部错误');
      void opening;
      i += 1;
      const { count, next } = readCount(segment, i);
      if (count === 0) throw new Error('括号后的下标不能为 0。');
      i = next;
      merge(current(), closed, count);
      continue;
    }

    if (ch >= 'A' && ch <= 'Z') {
      let symbol = ch;
      i += 1;
      if (i < segment.length && segment.charAt(i) >= 'a' && segment.charAt(i) <= 'z') {
        symbol += segment.charAt(i);
        i += 1;
      }
      if (!ELEMENT_MAP.has(symbol)) {
        throw new Error(`未知元素符号："${symbol}"。`);
      }
      const { count, next } = readCount(segment, i);
      if (count === 0) throw new Error(`元素 ${symbol} 的下标不能为 0。`);
      i = next;
      current().set(symbol, (current().get(symbol) ?? 0) + count);
      continue;
    }

    if (ch >= '0' && ch <= '9') {
      throw new Error(`位置 ${i + 1} 的数字 "${ch}" 前缺少元素或右括号。`);
    }

    throw new Error(`无法识别的字符："${ch}"（位置 ${i + 1}）。`);
  }

  if (stack.length > 1) {
    throw new Error('括号不匹配：存在未闭合的左括号。');
  }
  if (counts.size === 0) {
    throw new Error('化学式为空或不含任何元素。');
  }
  return counts;
}

/** 剥离电荷后缀，如 Fe^3+、SO4{2-}、Na+、Cl-、2H2O 前的系数 */
function stripCharge(segment: string): string {
  return segment.replace(/\^?\{?[+-]?\d*[+-]\}?$/, '');
}

/**
 * 解析完整化学式（含 · 结晶水），返回元素计数与组分信息。
 */
export function parseFormula(input: string): {
  counts: Map<string, number>;
  parts: Array<{ coefficient: number; segment: string }>;
  normalized: string;
} {
  const trimmed = input.replace(/\s+/g, '');
  if (trimmed === '') throw new Error('请输入化学式。');

  const rawParts = trimmed.split(HYDRATE_SPLIT_PATTERN);
  const total = new Map<string, number>();
  const parts: Array<{ coefficient: number; segment: string }> = [];

  rawParts.forEach((raw) => {
    if (raw === '') {
      throw new Error('结晶水分隔符 "·" 两侧必须有化学式。');
    }
    let coefficient = 1;
    let segment = raw;
    const leadMatch = /^(\d+)(?=[A-Z([])/.exec(raw);
    if (leadMatch && leadMatch[1] !== undefined) {
      coefficient = Number(leadMatch[1]);
      segment = raw.slice(leadMatch[1].length);
    }
    segment = stripCharge(segment);
    if (segment === '') throw new Error('存在空的化学式段。');
    const parsed = parseSegment(segment);
    merge(total, parsed, coefficient);
    parts.push({ coefficient, segment });
  });

  const normalized = parts
    .map((p) => (p.coefficient === 1 ? p.segment : `${p.coefficient}${p.segment}`))
    .join('·');
  return { counts: total, parts, normalized };
}

/** 计算摩尔质量与元素组成 */
export function calculateMolarMass(input: string): MolarResult {
  const trimmed = input.replace(/\s+/g, '');
  const { counts, parts, normalized } = parseFormula(input);

  let molarMass = 0;
  const order: string[] = [];
  counts.forEach((_cnt, symbol) => order.push(symbol));

  const contributions = new Map<string, number>();
  const bracketedSymbols: string[] = [];
  order.forEach((symbol) => {
    const info: ElementInfo | undefined = ELEMENT_MAP.get(symbol);
    if (!info) throw new Error(`未知元素符号："${symbol}"。`);
    const cnt = counts.get(symbol) ?? 0;
    const mass = info.atomicWeight * cnt;
    contributions.set(symbol, mass);
    molarMass += mass;
    if (info.bracketed) bracketedSymbols.push(symbol);
  });

  const breakdown: ElementBreakdown[] = order.map((symbol) => {
    const info = ELEMENT_MAP.get(symbol);
    if (!info) throw new Error(`未知元素符号："${symbol}"。`);
    const count = counts.get(symbol) ?? 0;
    const massContribution = contributions.get(symbol) ?? 0;
    return {
      symbol,
      name: info.name,
      count,
      massContribution,
      massPercent: molarMass > 0 ? (massContribution / molarMass) * 100 : 0,
      bracketed: info.bracketed,
    };
  });

  const totalAtoms = order.reduce((sum, s) => sum + (counts.get(s) ?? 0), 0);

  return {
    formula: trimmed,
    normalized,
    molarMass,
    breakdown,
    totalAtoms,
    parts,
    bracketedSymbols,
  };
}

/** 批量计算多个化学式；每个独立返回结果或错误，不互相影响 */
export function calculateBatch(input: string, splitPattern: RegExp): Array<{
  raw: string;
  result: MolarResult | null;
  error: string | null;
}> {
  const formulas = input
    .split(splitPattern)
    .map((s) => s.trim())
    .filter((s) => s !== '');
  return formulas.map((raw) => {
    try {
      return { raw, result: calculateMolarMass(raw), error: null };
    } catch (error) {
      return { raw, result: null, error: error instanceof Error ? error.message : '解析失败' };
    }
  });
}

/** 固定精度展示：去除多余尾零，最多保留 decimals 位小数 */
export function formatMass(value: number, decimals = 4): string {
  return Number(value.toFixed(decimals)).toString();
}
