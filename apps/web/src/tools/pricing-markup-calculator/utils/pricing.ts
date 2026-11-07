/**
 * 定价计算纯函数：围绕成本价、售价、毛利率（分母为售价）、加价率 markup（分母为成本）与毛利额做双向求解
 *
 * 口径约定：
 * - 毛利率 margin = (售价 - 成本) / 售价，取值 (-∞, 1)，成本为 0 且售价为正时为 100%
 * - 加价率 markup = (售价 - 成本) / 成本，成本必须为正才有定义
 * - 毛利额 profit = 售价 - 成本
 * 全部入参以数值（比率使用小数，如 0.2 表示 20%）参与运算，UI 层负责百分号与格式化。
 */

/** 定价求解结果 */
export interface PricingResult {
  /** 成本价 */
  cost: number;
  /** 售价 */
  price: number;
  /** 毛利额（售价 - 成本） */
  profit: number;
  /** 毛利率（小数），成本为 0 时为 1 */
  margin: number;
  /** 加价率（小数），成本为 0 时无定义 */
  markup: number | null;
}

/** 批量定价表的单行结果 */
export interface BatchRow {
  /** 原始输入的成本文本 */
  costInput: string;
  /** 解析后的成本数值 */
  cost: number;
  /** 目标毛利率（小数） */
  margin: number;
  /** 计算得到的售价；无法计算时为 null */
  price: number | null;
  /** 不可计算时的原因 */
  error?: string;
}

/**
 * 解析用户输入的有限数值，空串、空白、非有限数（含 Infinity/NaN）一律返回 null
 */
export function parseNumeric(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/**
 * 解析百分号输入：支持 "20"、"20%"、"0.2" 三种写法，统一转为小数比率
 *
 * - 带 % 的文本按百分数处理（20% → 0.2）
 * - 不带 % 的纯数字按百分数数值处理（20 → 0.2），与输入框语义保持一致
 */
export function parsePercent(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') {
    return null;
  }
  const hasPercent = trimmed.endsWith('%');
  const numeric = parseNumeric(hasPercent ? trimmed.slice(0, -1) : trimmed);
  if (numeric === null) {
    return null;
  }
  return numeric / 100;
}

/**
 * 由成本与售价推导完整定价结果
 *
 * @param cost - 成本价，必须为非负数
 * @param price - 售价，必须为非负数
 * @returns 完整定价结果；入参非法时返回错误信息
 */
export function fromCostAndPrice(cost: number, price: number): PricingResult | { error: string } {
  if (cost < 0 || price < 0) {
    return { error: '成本价与售价不能为负数' };
  }
  const profit = price - cost;
  const margin = price === 0 ? (cost === 0 ? 0 : Number.NEGATIVE_INFINITY) : profit / price;
  const markup = cost === 0 ? null : profit / cost;
  return { cost, price, profit, margin, markup };
}

/**
 * 由成本与目标毛利率求售价：price = cost / (1 - margin)
 *
 * @param cost - 成本价，必须为非负数
 * @param margin - 目标毛利率（小数），必须小于 1（100%）
 */
export function priceFromMargin(cost: number, margin: number): { price: number } | { error: string } {
  if (cost < 0) {
    return { error: '成本价不能为负数' };
  }
  if (margin >= 1) {
    return { error: '毛利率必须小于 100%，否则售价无有限解' };
  }
  return { price: cost / (1 - margin) };
}

/**
 * 由成本与目标加价率求售价：price = cost × (1 + markup)
 *
 * @param cost - 成本价，必须为正数（加价率以成本为分母）
 * @param markup - 目标加价率（小数），必须满足 1 + markup > 0 以保证售价非负
 */
export function priceFromMarkup(cost: number, markup: number): { price: number } | { error: string } {
  if (cost <= 0) {
    return { error: '按加价率定价时成本必须为正数' };
  }
  if (1 + markup < 0) {
    return { error: '加价率不能低于 -100%，否则售价为负' };
  }
  return { price: cost * (1 + markup) };
}

/**
 * 由售价与目标毛利率反推成本：cost = price × (1 - margin)
 */
export function costFromMargin(price: number, margin: number): { cost: number } | { error: string } {
  if (price < 0) {
    return { error: '售价不能为负数' };
  }
  if (margin >= 1) {
    return { error: '毛利率必须小于 100%' };
  }
  return { cost: price * (1 - margin) };
}

/**
 * 由售价与目标加价率反推成本：cost = price / (1 + markup)
 */
export function costFromMarkup(price: number, markup: number): { cost: number } | { error: string } {
  if (price < 0) {
    return { error: '售价不能为负数' };
  }
  if (1 + markup <= 0) {
    return { error: '加价率必须大于 -100%，否则成本无正解' };
  }
  return { cost: price / (1 + markup) };
}

/**
 * 毛利率与加价率互转：markup = margin / (1 - margin)
 *
 * @param margin - 毛利率（小数），必须小于 1
 */
export function markupFromMargin(margin: number): number | { error: string } {
  if (margin >= 1) {
    return { error: '毛利率必须小于 100%' };
  }
  return margin / (1 - margin);
}

/**
 * 加价率转毛利率：margin = markup / (1 + markup)
 *
 * @param markup - 加价率（小数），必须满足 1 + markup > 0
 */
export function marginFromMarkup(markup: number): number | { error: string } {
  if (1 + markup <= 0) {
    return { error: '加价率必须大于 -100%' };
  }
  return markup / (1 + markup);
}

/**
 * 含多档折扣的保本价反推：求使折后实际收入不低于成本的挂牌价
 *
 * @param cost - 成本价
 * @param discountRates - 各档折扣率（小数，如 0.8 表示打 8 折），取最深一档（最小值）计算
 * @returns 挂牌价 floor = cost / 最深折扣
 */
export function breakEvenListPrice(
  cost: number,
  discountRates: number[],
): { listPrice: number; minDiscount: number } | { error: string } {
  if (cost < 0) {
    return { error: '成本价不能为负数' };
  }
  if (discountRates.length === 0) {
    return { error: '请至少填写一档折扣' };
  }
  const minDiscount = Math.min(...discountRates);
  if (minDiscount <= 0) {
    return { error: '折扣率必须为正数（如 0.8 表示 8 折）' };
  }
  return { listPrice: cost / minDiscount, minDiscount };
}

/**
 * 批量定价：逐行解析「成本,毛利率」并输出售价表，非法行保留错误信息且不中断整体计算
 *
 * @param rawText - 多行文本，每行形如 "80, 20%" 或 "80,20"
 */
export function batchPricing(rawText: string, defaultMargin: number): BatchRow[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      const segments = line.split(/[,，\t]/);
      const costInput = (segments[0] ?? '').trim();
      const marginInput = (segments[1] ?? '').trim();
      const cost = parseNumeric(costInput);
      const margin = marginInput === '' ? defaultMargin : parsePercent(marginInput);
      if (cost === null) {
        return { costInput, cost: Number.NaN, margin: margin ?? defaultMargin, price: null, error: '成本无法解析为数字' };
      }
      if (margin === null) {
        return { costInput, cost, margin: defaultMargin, price: null, error: '毛利率无法解析' };
      }
      const result = priceFromMargin(cost, margin);
      if ('error' in result) {
        return { costInput, cost, margin, price: null, error: result.error };
      }
      return { costInput, cost, margin, price: result.price };
    });
}

/**
 * 把批量结果序列化为可复制的 CSV（含表头），数字保留至多 4 位小数并去除尾随 0
 */
export function batchToCsv(rows: BatchRow[]): string {
  const header = 'cost,margin,price,error';
  const body = rows.map((row) => {
    const marginText = `${roundTrim(row.margin * 100)}%`;
    const priceText = row.price === null ? '' : roundTrim(row.price);
    const errorText = row.error ?? '';
    return `${roundTrim(row.cost)},${marginText},${priceText},${errorText}`;
  });
  return [header, ...body].join('\n');
}

/**
 * 四舍六入保留至多 4 位小数并去除尾随 0，整数不补小数点
 */
export function roundTrim(value: number, digits = 4): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor) / factor;
  return String(rounded);
}

/**
 * 把小数比率格式化为百分号文本（至多 4 位小数），null 输出占位符
 */
export function formatPercent(value: number | null): string {
  if (value === null) {
    return '—';
  }
  if (!Number.isFinite(value)) {
    return value > 0 ? '+∞' : '-∞';
  }
  return `${roundTrim(value * 100)}%`;
}
