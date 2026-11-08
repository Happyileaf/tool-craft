/**
 * 定价领域的纯函数工具集：成本、售价、毛利率、加价率与毛利额的双向换算。
 * 口径约定：
 * - 毛利率 margin = (售价 - 成本) / 售价，分母为售价，取值 < 1
 * - 加价率 markup = (售价 - 成本) / 成本，分母为成本，取值 >= 0
 */

/** 定价核算结果 */
export interface PricingSnapshot {
  /** 成本价 */
  cost: number;
  /** 售价 */
  price: number;
  /** 毛利额 = 售价 - 成本 */
  grossProfit: number;
  /** 毛利率（小数，0.2 表示 20%） */
  margin: number;
  /** 加价率（小数） */
  markup: number;
}

/**
 * 由成本与售价推导完整定价快照。
 *
 * @param cost - 成本价（>= 0）
 * @param price - 售价（> 0）
 */
export function snapshotFromCostPrice(cost: number, price: number): PricingSnapshot {
  if (!(Number.isFinite(cost) && cost >= 0)) {
    throw new Error('成本价必须为非负数值');
  }
  if (!(Number.isFinite(price) && price > 0)) {
    throw new Error('售价必须为正数值');
  }
  const grossProfit = price - cost;
  return {
    cost,
    price,
    grossProfit,
    margin: grossProfit / price,
    // 成本为 0 时加价率无数学定义
    markup: cost > 0 ? grossProfit / cost : Number.NaN,
  };
}

/**
 * 由成本与目标毛利率反推售价：P = C / (1 - margin)。
 *
 * @param cost - 成本价（>= 0）
 * @param margin - 目标毛利率（小数，必须 < 1）
 */
export function priceFromMargin(cost: number, margin: number): PricingSnapshot {
  if (!(Number.isFinite(cost) && cost >= 0)) {
    throw new Error('成本价必须为非负数值');
  }
  if (!(Number.isFinite(margin) && margin < 1)) {
    throw new Error('毛利率必须小于 100%');
  }
  const price = cost / (1 - margin);
  return snapshotFromCostPrice(cost, price);
}

/**
 * 由成本与加价率反推售价：P = C × (1 + markup)。
 *
 * @param cost - 成本价（>= 0）
 * @param markup - 加价率（小数，>= 0）
 */
export function priceFromMarkup(cost: number, markup: number): PricingSnapshot {
  if (!(Number.isFinite(cost) && cost >= 0)) {
    throw new Error('成本价必须为非负数值');
  }
  if (!(Number.isFinite(markup) && markup >= 0)) {
    throw new Error('加价率必须为非负数值');
  }
  return snapshotFromCostPrice(cost, cost * (1 + markup));
}

/**
 * 由售价与目标毛利率反推可接受的最高成本：C = P × (1 - margin)。
 *
 * @param price - 售价（> 0）
 * @param margin - 目标毛利率（小数，< 1）
 */
export function costFromPriceAndMargin(price: number, margin: number): PricingSnapshot {
  if (!(Number.isFinite(price) && price > 0)) {
    throw new Error('售价必须为正数值');
  }
  if (!(Number.isFinite(margin) && margin < 1)) {
    throw new Error('毛利率必须小于 100%');
  }
  return snapshotFromCostPrice(price * (1 - margin), price);
}

/**
 * 毛利率与加价率互转：markup = margin / (1 - margin)。
 *
 * @param margin - 毛利率（小数，< 1）
 */
export function marginToMarkup(margin: number): number {
  if (!(Number.isFinite(margin) && margin < 1)) {
    throw new Error('毛利率必须小于 100%');
  }
  return margin / (1 - margin);
}

/**
 * 加价率转毛利率：margin = markup / (1 + markup)。
 *
 * @param markup - 加价率（小数，>= 0）
 */
export function markupToMargin(markup: number): number {
  if (!(Number.isFinite(markup) && markup >= 0)) {
    throw new Error('加价率必须为非负数值');
  }
  return markup / (1 + markup);
}

/** 批量定价的单行结果 */
export interface BatchPricingRow {
  /** 序号（从 1 开始） */
  index: number;
  /** 输入成本 */
  cost: number;
  /** 目标毛利率（小数） */
  margin: number;
  /** 计算售价 */
  price: number;
  /** 毛利额 */
  grossProfit: number;
}

/**
 * 批量模式：对多组「成本 + 目标毛利率」计算售价表。
 *
 * @param rows - 每项包含成本与毛利率（小数）
 * @returns 可直接导出 CSV 的定价行
 */
export function batchPriceByMargin(
  rows: { cost: number; margin: number }[],
): BatchPricingRow[] {
  return rows.map((row, i) => {
    const snapshot = priceFromMargin(row.cost, row.margin);
    return {
      index: i + 1,
      cost: row.cost,
      margin: row.margin,
      price: snapshot.price,
      grossProfit: snapshot.grossProfit,
    };
  });
}

/**
 * 把批量定价结果序列化为 CSV 文本（含表头，CRLF 行尾）。
 *
 * @param rows - 批量定价行
 */
export function batchRowsToCsv(rows: BatchPricingRow[]): string {
  const header = 'index,cost,target_margin,price,gross_profit';
  const body = rows.map(
    (row) =>
      `${row.index},${row.cost},${(row.margin * 100).toFixed(2)}%,${round2(row.price)},${round2(row.grossProfit)}`,
  );
  return [header, ...body].join('\r\n');
}

/**
 * 多档折扣下的保本价反推：在标价基础上允许的最大折扣率，
 * 使折后价不低于成本。返回保本折扣率（小数）与折后价。
 *
 * @param listPrice - 标价（> 0）
 * @param cost - 成本价（>= 0 且不高于标价）
 * @param discountRates - 待评估的折扣率列表（小数，如 0.2 表示打 8 折）
 */
export function breakEvenDiscounts(
  listPrice: number,
  cost: number,
  discountRates: number[],
): { discount: number; discountedPrice: number; profit: number; breaksEven: boolean }[] {
  if (!(Number.isFinite(listPrice) && listPrice > 0)) {
    throw new Error('标价必须为正数值');
  }
  if (!(Number.isFinite(cost) && cost >= 0 && cost <= listPrice)) {
    throw new Error('成本价必须为非负且不高于标价');
  }
  return discountRates.map((discount) => {
    if (!(Number.isFinite(discount) && discount >= 0 && discount < 1)) {
      throw new Error('折扣率必须位于 [0, 1) 区间');
    }
    const discountedPrice = listPrice * (1 - discount);
    return {
      discount,
      discountedPrice,
      profit: discountedPrice - cost,
      breaksEven: discountedPrice >= cost,
    };
  });
}

/** 两位小数四舍五入 */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
