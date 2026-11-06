/**
 * 骰子表达式解析、随机投掷与点数和精确概率分布纯函数；
 * 不依赖 DOM / React，随机源可注入以便固定向量测试
 */

/** 骰子数量上限 */
export const MAX_DICE_COUNT = 20;
/** 骰子面数上限 */
export const MAX_DICE_SIDES = 100;
/** 骰子面数下限 */
export const MIN_DICE_SIDES = 2;

/** keep / drop 规则 */
export interface KeepDropRule {
  /** 规则类型：保留最高 / 保留最低 / 丢弃最高 / 丢弃最低 */
  mode: 'kh' | 'kl' | 'dh' | 'dl';
  /** 作用的骰子数量 */
  amount: number;
}

/** 解析后的骰子表达式 AST */
export interface DiceExpression {
  /** 骰子项列表 */
  dice: { count: number; sides: number }[];
  /** 常量修正值 */
  modifier: number;
  /** keep/drop 规则（可选，作用于全部骰子的汇总结果） */
  rule: KeepDropRule | null;
  /** 参与投掷的骰子总数 */
  totalDice: number;
}

/** 单次投掷的单粒骰子结果 */
export interface RolledDie {
  /** 来源面数 */
  sides: number;
  /** 掷出点数 */
  value: number;
  /** 在 keep/drop 规则下是否被保留 */
  kept: boolean;
}

/** 一次投掷结果 */
export interface RollResult {
  /** 逐粒骰子明细 */
  dice: RolledDie[];
  /** 保留骰子点数之和（无规则时为全部骰子之和） */
  diceSum: number;
  /** 加上常量修正后的最终总和 */
  total: number;
}

/** 单个点数和的概率分布项 */
export interface DistributionEntry {
  /** 点数和（含常量修正） */
  sum: number;
  /** 概率，0–1 */
  probability: number;
  /** 累积概率 P(X ≤ sum) */
  cumulative: number;
}

/** 完整分布结果 */
export interface DistributionResult {
  /** 分布表 */
  entries: DistributionEntry[];
  /** 期望值 */
  expected: number;
  /** 最小可能总和 */
  min: number;
  /** 最大可能总和 */
  max: number;
}

/** 可注入的随机源：返回 [0,1) 的伪随机数 */
export type Rng = () => number;

/** 默认随机源，基于 Web Crypto */
export const cryptoRng: Rng = () => {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0]! / 4294967296;
};

/**
 * 解析骰子表达式；白名单字符与语法校验，非法时抛出带中文信息的 Error
 *
 * 支持：NdS（N 可省略）、+/- 常量、多个骰子项相加、kh/kl/dh/dl 规则
 *
 * @param input - 原始表达式
 * @returns 结构化 AST
 */
export function parseDiceExpression(input: string): DiceExpression {
  const normalized = input.replace(/\s+/g, '').toLowerCase();
  if (normalized === '') {
    throw new Error('表达式为空');
  }
  if (!/^[0-9dkhld+\-]+$/.test(normalized)) {
    throw new Error('表达式含非法字符，仅允许数字、d、k、h、l、+、-');
  }

  // 拆出结尾的 keep/drop 规则
  let rule: KeepDropRule | null = null;
  let body = normalized;
  const ruleMatch = normalized.match(/(kh|kl|dh|dl)(\d*)$/);
  if (ruleMatch) {
    const mode = ruleMatch[1] as KeepDropRule['mode'];
    const amount = ruleMatch[2] === '' ? 1 : Number(ruleMatch[2]);
    if (!Number.isInteger(amount) || amount < 1) {
      throw new Error('keep/drop 数量必须为正整数');
    }
    rule = { mode, amount };
    body = normalized.slice(0, normalized.length - ruleMatch[0].length);
  }

  // 拆分项，保留符号
  const tokenMatches = [...body.matchAll(/([+-]?)(\d*)(d?)(\d*)/g)];
  const dice: { count: number; sides: number }[] = [];
  let modifier = 0;
  let matchedLength = 0;

  for (const match of tokenMatches) {
    const raw = match[0];
    if (raw === '') {
      continue;
    }
    matchedLength += raw.length;
    const sign = match[1] === '-' ? -1 : 1;
    const hasD = match[3] === 'd';
    const left = match[2] ?? '';
    const right = match[4] ?? '';

    if (hasD) {
      if (sign === -1) {
        throw new Error('不支持减去整个骰子项，仅支持常量修正（如 2d6-3）');
      }
      const count = left === '' ? 1 : Number(left);
      if (right === '') {
        throw new Error('骰子表达式缺少面数，例如 d6、2d20');
      }
      const sides = Number(right);
      if (!Number.isInteger(count) || count < 1) {
        throw new Error('骰子数量必须为正整数');
      }
      if (count > MAX_DICE_COUNT) {
        throw new Error(`骰子数量不能超过 ${MAX_DICE_COUNT}`);
      }
      if (!Number.isInteger(sides) || sides < MIN_DICE_SIDES) {
        throw new Error(`骰子面数必须为 ≥ ${MIN_DICE_SIDES} 的整数`);
      }
      if (sides > MAX_DICE_SIDES) {
        throw new Error(`骰子面数不能超过 ${MAX_DICE_SIDES}`);
      }
      dice.push({ count: sign * count, sides });
    } else {
      if (left === '') {
        continue;
      }
      modifier += sign * Number(left);
    }
  }

  if (matchedLength !== body.length) {
    throw new Error('表达式格式无法解析');
  }

  const totalDice = dice.reduce((sum, item) => sum + item.count, 0);
  if (totalDice < 1) {
    throw new Error('表达式至少需要一个骰子项');
  }
  if (rule && rule.amount >= totalDice) {
    if (rule.mode.startsWith('d') || rule.amount > totalDice) {
      throw new Error('keep/drop 数量必须小于骰子总数');
    }
    // keep 数量恰好等于总数时等同全保留，归一化为 null
    rule = null;
  }

  return { dice, modifier, rule, totalDice };
}

/**
 * 依据规则对全部骰子排序并标记保留 / 丢弃
 *
 * @param rolled - 已掷出的骰子（含面数与点数）
 * @param rule - keep/drop 规则
 * @returns 标记 kept 后的骰子数组
 */
function applyRule(rolled: RolledDie[], rule: KeepDropRule | null): RolledDie[] {
  if (!rule) {
    return rolled.map((die) => ({ ...die, kept: true }));
  }
  const order = rule.mode === 'kh' || rule.mode === 'dh' ? 'desc' : 'asc';
  const indexed = rolled.map((die, index) => ({ die, index, value: die.value }));
  indexed.sort((a, b) =>
    order === 'desc' ? b.value - a.value || a.index - b.index : a.value - b.value || a.index - b.index,
  );
  const picked = new Set(
    indexed.slice(0, rule.amount).map((item) => item.index),
  );
  return rolled.map((die, index) => ({
    ...die,
    kept: rule.mode.startsWith('k') ? picked.has(index) : !picked.has(index),
  }));
}

/**
 * 按表达式执行一次投掷；随机源可注入，保证测试可复现
 *
 * @param expression - 已解析 AST 或原始表达式字符串
 * @param rng - 随机源，默认使用 Web Crypto
 * @returns 逐粒明细与最终总和
 */
export function rollDice(
  expression: DiceExpression | string,
  rng: Rng = cryptoRng,
): RollResult {
  const ast = typeof expression === 'string' ? parseDiceExpression(expression) : expression;
  const rolled: RolledDie[] = [];
  for (const item of ast.dice) {
    for (let i = 0; i < item.count; i += 1) {
      const value = Math.floor(rng() * item.sides) + 1;
      rolled.push({ sides: item.sides, value, kept: true });
    }
  }
  const marked = applyRule(rolled, ast.rule);
  const diceSum = marked.filter((die) => die.kept).reduce((sum, die) => sum + die.value, 0);
  return { dice: marked, diceSum, total: diceSum + ast.modifier };
}

/**
 * 计算点数和的精确概率分布；采用概率 DP（归一化概率而非原始组合计数），
 * 规避大骰数 / 大面数下的整数溢出，支持 keep/drop 规则
 *
 * @param expression - 已解析 AST 或原始表达式字符串
 * @returns 分布表、期望与极值
 */
export function getDistribution(
  expression: DiceExpression | string,
): DistributionResult {
  const ast = typeof expression === 'string' ? parseDiceExpression(expression) : expression;

  // 生成每粒骰子的均匀概率质量函数：map<点数, 概率>
  const diePMFs: Map<number, number>[] = ast.dice.flatMap((item) =>
    Array.from({ length: item.count }, () => {
      const pmf = new Map<number, number>();
      for (let value = 1; value <= item.sides; value += 1) {
        pmf.set(value, 1 / item.sides);
      }
      return pmf;
    }),
  );

  // 枚举全部骰子点数组合的联合分布（按排序后元组聚合，天然处理 keep/drop）
  // joint: key 为排序后点数元组字符串，value 为联合概率
  let joint = new Map<string, number>();
  joint.set('', 1);
  for (const pmf of diePMFs) {
    const next = new Map<string, number>();
    for (const [prefix, prefixProb] of joint) {
      for (const [value, valueProb] of pmf) {
        const previous = prefix === '' ? [] : prefix.split(',').map(Number);
        const merged = [...previous, value].sort((a, b) => a - b);
        const key = merged.join(',');
        next.set(key, (next.get(key) ?? 0) + prefixProb * valueProb);
      }
    }
    joint = next;
  }

  // 依据规则对每个排序元组求保留骰子之和，聚合到总和分布
  const sumPMF = new Map<number, number>();
  for (const [key, probability] of joint) {
    const sortedValues = key.split(',').map(Number);
    let keptValues: number[];
    if (!ast.rule) {
      keptValues = sortedValues;
    } else if (ast.rule.mode === 'kh') {
      keptValues = sortedValues.slice(sortedValues.length - ast.rule.amount);
    } else if (ast.rule.mode === 'kl') {
      keptValues = sortedValues.slice(0, ast.rule.amount);
    } else if (ast.rule.mode === 'dh') {
      keptValues = sortedValues.slice(0, sortedValues.length - ast.rule.amount);
    } else {
      keptValues = sortedValues.slice(ast.rule.amount);
    }
    const sum = keptValues.reduce((acc, value) => acc + value, 0) + ast.modifier;
    sumPMF.set(sum, (sumPMF.get(sum) ?? 0) + probability);
  }

  const sums = [...sumPMF.keys()].sort((a, b) => a - b);
  let cumulative = 0;
  const entries: DistributionEntry[] = sums.map((sum) => {
    const probability = sumPMF.get(sum) ?? 0;
    cumulative += probability;
    return { sum, probability, cumulative };
  });

  const expected =
    entries.reduce((acc, entry) => acc + entry.sum * entry.probability, 0);
  return {
    entries,
    expected,
    min: sums[0] ?? 0,
    max: sums[sums.length - 1] ?? 0,
  };
}

/**
 * 计算 P(X ≥ target) 的区间概率
 *
 * @param distribution - 分布结果
 * @param target - 目标值
 * @returns 大于等于目标值的概率
 */
export function probabilityAtLeast(distribution: DistributionResult, target: number): number {
  const hit = distribution.entries
    .filter((entry) => entry.sum >= target)
    .reduce((sum, entry) => sum + entry.probability, 0);
  return hit;
}
