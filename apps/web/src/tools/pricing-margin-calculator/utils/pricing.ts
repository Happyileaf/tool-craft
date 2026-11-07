/**
 * 定价计算纯函数：毛利率 / 加价率 / 售价双向求解
 *
 * 口径约定（二者分母不同，极易混淆）：
 * - 毛利率 margin = (售价 price - 成本 cost) / 售价 price
 * - 加价率 markup = (售价 price - 成本 cost) / 成本 cost
 *
 * 所有函数均为纯函数，不触碰 DOM；无法求解时返回 { ok: false, error }，
 * 由调用方决定如何展示，函数本身不抛异常（除非法断言外）。
 */

/** 求解输入：所有字段可选，按已知量组合求解 */
export interface PricingInput {
  /** 成本价 */
  cost?: number | null;
  /** 售价 */
  price?: number | null;
  /** 毛利率，百分数口径：20 表示 20% */
  marginPercent?: number | null;
  /** 加价率，百分数口径：25 表示 25% */
  markupPercent?: number | null;
}

/** 完整求解结果（比率统一为小数，如 0.2 表示 20%） */
export interface PricingResult {
  cost: number;
  price: number;
  /** 毛利率（小数） */
  margin: number;
  /** 加价率（小数） */
  markup: number;
  /** 毛利额 */
  profit: number;
}

export type PricingSolve =
  | ({ ok: true } & PricingResult)
  | { ok: false; error: string };

export interface BatchRow {
  line: number;
  cost: number;
  /** 目标毛利率（小数） */
  margin: number;
  price: number;
}

export interface BatchOutcome {
  ok: boolean;
  rows: BatchRow[];
  /** 带行号的告警，非法行不会中断其余行 */
  warnings: string[];
  csv: string;
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** 毛利率（小数）转加价率（小数）：markup = margin / (1 - margin) */
export function marginToMarkup(margin: number): number {
  if (!Number.isFinite(margin)) {
    throw new Error('毛利率必须是有限数值');
  }
  if (margin >= 1) {
    throw new Error('毛利率必须小于 100%，否则加价率无有限解');
  }
  if (margin < 0) {
    throw new Error('毛利率不能为负数');
  }
  return margin / (1 - margin);
}

/** 加价率（小数）转毛利率（小数）：margin = markup / (1 + markup) */
export function markupToMargin(markup: number): number {
  if (!Number.isFinite(markup)) {
    throw new Error('加价率必须是有限数值');
  }
  if (markup < 0) {
    throw new Error('加价率不能为负数');
  }
  return markup / (1 + markup);
}

/**
 * 按已知量求解完整定价结果。
 * 支持组合：成本+售价、成本+毛利率、成本+加价率、售价+毛利率、售价+加价率。
 */
export function solvePricing(input: PricingInput): PricingSolve {
  const { cost, price, marginPercent, markupPercent } = input;
  const hasCost = isFiniteNumber(cost);
  const hasPrice = isFiniteNumber(price);
  const hasMargin = isFiniteNumber(marginPercent);
  const hasMarkup = isFiniteNumber(markupPercent);

  if (hasCost && cost < 0) {
    return { ok: false, error: '成本价不能为负数' };
  }
  if (hasPrice && price < 0) {
    return { ok: false, error: '售价不能为负数' };
  }
  if (hasMargin && (marginPercent < 0 || marginPercent >= 100)) {
    return { ok: false, error: '毛利率必须位于 [0%, 100%) 区间' };
  }
  if (hasMarkup && markupPercent < 0) {
    return { ok: false, error: '加价率不能为负数' };
  }

  let resolvedCost: number;
  let resolvedPrice: number;

  if (hasCost && hasPrice) {
    if (price < cost) {
      return { ok: false, error: '售价低于成本，毛利率为负，请检查输入' };
    }
    resolvedCost = cost;
    resolvedPrice = price;
  } else if (hasCost && hasMargin) {
    // price = cost / (1 - margin)
    const margin = marginPercent / 100;
    resolvedCost = cost;
    resolvedPrice = cost / (1 - margin);
  } else if (hasCost && hasMarkup) {
    // price = cost * (1 + markup)
    const markup = markupPercent / 100;
    resolvedCost = cost;
    resolvedPrice = cost * (1 + markup);
  } else if (hasPrice && hasMargin) {
    // cost = price * (1 - margin)
    const margin = marginPercent / 100;
    resolvedPrice = price;
    resolvedCost = price * (1 - margin);
  } else if (hasPrice && hasMarkup) {
    // cost = price / (1 + markup)
    const markup = markupPercent / 100;
    resolvedPrice = price;
    resolvedCost = price / (1 + markup);
  } else {
    return {
      ok: false,
      error: '至少需要两个已知量：成本/售价之一，搭配毛利率或加价率；或同时给出成本与售价',
    };
  }

  const profit = resolvedPrice - resolvedCost;
  const margin = resolvedPrice === 0 ? 0 : profit / resolvedPrice;
  const markup = resolvedCost === 0 ? 0 : profit / resolvedCost;

  return {
    ok: true,
    cost: resolvedCost,
    price: resolvedPrice,
    margin,
    markup,
    profit,
  };
}

/**
 * 批量按目标毛利率定价。
 * @param text 每行形如「成本,毛利率百分数」，如 "80,20"
 */
export function batchPriceFromMargin(text: string): BatchOutcome {
  const lines = text.split(/\r?\n/);
  const rows: BatchRow[] = [];
  const warnings: string[] = [];

  lines.forEach((rawLine, index) => {
    const line = index + 1;
    const trimmed = rawLine.trim();
    if (trimmed === '') {
      return;
    }
    const parts = trimmed.split(/[,\t]/).map((part) => part.trim());
    if (parts.length !== 2) {
      warnings.push(`第 ${line} 行：应为「成本,毛利率」两列，已跳过`);
      return;
    }
    if (parts.some((part) => part === '')) {
      warnings.push(`第 ${line} 行：存在空值列，已跳过`);
      return;
    }
    const cost = Number(parts[0]);
    const marginPercent = Number(parts[1]);
    if (!Number.isFinite(cost) || !Number.isFinite(marginPercent)) {
      warnings.push(`第 ${line} 行：包含非数字内容，已跳过`);
      return;
    }
    if (cost < 0) {
      warnings.push(`第 ${line} 行：成本不能为负数，已跳过`);
      return;
    }
    if (marginPercent < 0 || marginPercent >= 100) {
      warnings.push(`第 ${line} 行：毛利率必须位于 [0%, 100%)，已跳过`);
      return;
    }
    const margin = marginPercent / 100;
    const price = cost / (1 - margin);
    rows.push({ line, cost, margin, price });
  });

  const csv = [
    'cost,margin_percent,price',
    ...rows.map((row) => `${row.cost},${(row.margin * 100).toFixed(2)},${row.price.toFixed(2)}`),
  ].join('\n');

  return { ok: warnings.length === 0, rows, warnings, csv };
}

/**
 * 保本售价反推：打折后实际收入不低于成本。
 * @param cost 成本价
 * @param discountPercent 折扣百分数，20 表示打八折（让利 20%）
 * @returns 保本售价 = cost / (1 - discount)
 */
export function breakEvenPrice(cost: number, discountPercent: number): number {
  if (!Number.isFinite(cost) || cost < 0) {
    throw new Error('成本必须是非负有限数值');
  }
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent >= 100) {
    throw new Error('折扣率必须位于 [0%, 100%) 区间');
  }
  return cost / (1 - discountPercent / 100);
}
