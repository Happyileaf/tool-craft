/**
 * 固定资产折旧计算的纯函数实现（中国企业会计准则口径）
 * 支持四种折旧方法：
 * - 年限平均法（直线法）：年折旧额 = (原值 − 预计净残值) / 预计使用年限
 * - 工作量法：单位折旧额 = (原值 − 预计净残值) / 预计总工作量，按当年实际工作量计提
 * - 双倍余额递减法：前期按 2/年限 的年折旧率对年初账面净值计提，最后两年改按直线法摊销
 * - 年数总和法：年折旧 = 应计折旧额 × 剩余使用年数 / 年数总和
 * 所有金额先四舍五入保留 2 位小数再逐年累加，最后一年钳制累计折旧至应计折旧额，
 * 确保年末账面净值恰好等于预计净残值。本模块不依赖 React 或 DOM，全部为确定性纯函数
 */

/** 折旧方法：直线法 / 工作量法 / 双倍余额递减法 / 年数总和法 */
export type DepreciationMethod =
  | 'straight-line'
  | 'units-of-production'
  | 'double-declining'
  | 'sum-of-years-digits';

/** 使用年限允许的最小值（年） */
export const USEFUL_LIFE_MIN = 1;
/** 使用年限允许的最大值（年） */
export const USEFUL_LIFE_MAX = 50;

/** 固定资产共同入参 */
export interface AssetInput {
  /** 固定资产原值（取得成本），必须为正数 */
  cost: number;
  /** 预计净残值，必须满足 0 ≤ salvage < cost */
  salvage: number;
  /** 预计使用年限（年），1-50 的整数 */
  usefulLife: number;
}

/** 工作量法的校验选项 */
export interface ProductionOptions {
  /** 预计总工作量（工时、产量等），必须为正数 */
  totalUnits: number;
  /** 各年度实际工作量，每项非负，合计不得超过总工作量 */
  yearlyUnits: number[];
}

/** 单年折旧明细行 */
export interface YearRow {
  /** 年份序号，从 1 开始 */
  year: number;
  /** 当年折旧额（元，保留 2 位小数） */
  depreciation: number;
  /** 截至本年末的累计折旧额（元，保留 2 位小数） */
  accumulatedDepreciation: number;
  /** 本年末账面净值（元，保留 2 位小数） */
  bookValue: number;
  /** 当年折旧率（小数，如 0.25 表示 25%），工作量法不提供 */
  rate?: number;
}

/** 参数校验结果 */
export interface ValidationResult {
  /** 是否全部通过校验 */
  valid: boolean;
  /** 逐条错误信息，valid 为 true 时为空数组 */
  errors: string[];
}

/**
 * 四舍五入保留 2 位小数，先放大 1e11 抵消浮点尾数误差再四舍五入
 * @param value - 原始数值
 * @returns 保留 2 位小数后的数值
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * 将逐年折旧额组装为明细行，累计折旧采用当年累加方式，
 * 最后一年把累计折旧钳制到应计折旧额（cost − salvage），吸收历年舍入差
 * @param input - 固定资产共同入参
 * @param amounts - 各年折旧额（调用前已保留 2 位小数），长度即折旧年数
 * @param rates - 各年折旧率（小数），与 amounts 等长；不传则明细行不含 rate
 * @returns 逐年折旧明细
 */
function buildRows(input: AssetInput, amounts: number[], rates?: number[]): YearRow[] {
  const depreciableBase = round2(input.cost - input.salvage);
  const rows: YearRow[] = [];
  let accumulated = 0;
  amounts.forEach((amount, index) => {
    const isLast = index === amounts.length - 1;
    let nextAccumulated = round2(accumulated + amount);
    if (isLast) {
      nextAccumulated = depreciableBase;
    }
    const rate = rates ? rates[index] : undefined;
    const row: YearRow = {
      year: index + 1,
      depreciation: round2(nextAccumulated - accumulated),
      accumulatedDepreciation: nextAccumulated,
      bookValue: round2(input.cost - nextAccumulated),
    };
    if (rate !== undefined) {
      row.rate = rate;
    }
    rows.push(row);
    accumulated = nextAccumulated;
  });
  return rows;
}

/**
 * 年限平均法（直线法）：每年折旧额相同，年折旧率 = 1 / 使用年限
 * @param input - 固定资产共同入参
 * @returns 逐年折旧明细
 */
export function straightLine(input: AssetInput): YearRow[] {
  const annual = round2((input.cost - input.salvage) / input.usefulLife);
  const rate = 1 / input.usefulLife;
  const amounts: number[] = [];
  const rates: number[] = [];
  for (let year = 1; year <= input.usefulLife; year += 1) {
    amounts.push(annual);
    rates.push(rate);
  }
  return buildRows(input, amounts, rates);
}

/**
 * 工作量法：按各年度实际工作量计提折旧，行数等于年度工作量数组长度
 * @param input - 固定资产共同入参
 * @param totalUnits - 预计总工作量
 * @param yearlyUnits - 各年度实际工作量
 * @returns 逐年折旧明细
 * @throws 总工作量非正或年度工作量合计超过总工作量时抛出错误（正常应先经校验拦截）
 */
export function unitsOfProduction(
  input: AssetInput,
  totalUnits: number,
  yearlyUnits: number[],
): YearRow[] {
  if (!(totalUnits > 0)) {
    throw new Error('预计总工作量必须为正数');
  }
  const usedUnits = yearlyUnits.reduce((sum, units) => sum + units, 0);
  if (usedUnits > totalUnits) {
    throw new Error('年度工作量合计不能超过预计总工作量');
  }
  const unitRate = (input.cost - input.salvage) / totalUnits;
  const amounts = yearlyUnits.map((units) => round2(unitRate * units));
  return buildRows(input, amounts);
}

/**
 * 双倍余额递减法（中国准则口径）：
 * 前期年折旧率 = 2 / 使用年限，按年初账面净值（不扣减净残值）计提；
 * 最后两年改按直线法，将倒数第二年初账面净值减去净残值后在剩余两年平均摊销；
 * 任一年折旧后账面净值不得低于预计净残值
 * @param input - 固定资产共同入参
 * @returns 逐年折旧明细
 */
export function doubleDeclining(input: AssetInput): YearRow[] {
  const { cost, salvage, usefulLife } = input;
  const amounts: number[] = [];
  const rates: number[] = [];
  let bookValue = cost;

  if (usefulLife === 1) {
    amounts.push(round2(cost - salvage));
    rates.push(1);
    return buildRows(input, amounts, rates);
  }

  const decliningRate = 2 / usefulLife;
  // 双倍余额递减阶段覆盖第 1 年至倒数第 3 年（含），最后两年改直线法
  const lastDecliningYear = usefulLife - 2;
  for (let year = 1; year <= lastDecliningYear; year += 1) {
    const amount = round2(Math.min(bookValue * decliningRate, bookValue - salvage));
    amounts.push(amount);
    rates.push(amount === 0 ? 0 : amount / bookValue);
    bookValue = round2(bookValue - amount);
  }

  // 最后两年：（倒数第二年初账面净值 − 净残值）/ 2
  const straightAmount = round2((bookValue - salvage) / 2);
  for (let year = lastDecliningYear + 1; year <= usefulLife; year += 1) {
    amounts.push(straightAmount);
    rates.push(straightAmount / bookValue);
  }
  return buildRows(input, amounts, rates);
}

/**
 * 年数总和法：第 i 年折旧 = 应计折旧额 × (使用年限 − i + 1) / 年数总和，
 * 年折旧率随剩余年数逐年递减
 * @param input - 固定资产共同入参
 * @returns 逐年折旧明细
 */
export function sumOfYearsDigits(input: AssetInput): YearRow[] {
  const { cost, salvage, usefulLife } = input;
  const depreciableBase = cost - salvage;
  const sumOfYears = (usefulLife * (usefulLife + 1)) / 2;
  const amounts: number[] = [];
  const rates: number[] = [];
  for (let year = 1; year <= usefulLife; year += 1) {
    const remainingLife = usefulLife - year + 1;
    const rate = remainingLife / sumOfYears;
    amounts.push(round2(depreciableBase * rate));
    rates.push(rate);
  }
  return buildRows(input, amounts, rates);
}

/**
 * 校验固定资产共同入参，工作量法参数通过 opts 传入时一并校验
 * @param input - 固定资产共同入参
 * @param opts - 工作量法选项，仅工作量法需要传入
 * @returns 校验结论与逐条错误信息
 */
export function validateAssetInput(
  input: AssetInput,
  opts?: ProductionOptions,
): ValidationResult {
  const errors: string[] = [];
  if (!Number.isFinite(input.cost) || input.cost <= 0) {
    errors.push('固定资产原值必须为正数');
  }
  if (!Number.isFinite(input.salvage) || input.salvage < 0 || input.salvage >= input.cost) {
    errors.push('预计净残值必须满足 0 ≤ 净残值 < 原值');
  }
  if (
    !Number.isInteger(input.usefulLife) ||
    input.usefulLife < USEFUL_LIFE_MIN ||
    input.usefulLife > USEFUL_LIFE_MAX
  ) {
    errors.push(`预计使用年限必须为 ${USEFUL_LIFE_MIN}-${USEFUL_LIFE_MAX} 之间的整数`);
  }
  if (opts !== undefined) {
    if (!Number.isFinite(opts.totalUnits) || opts.totalUnits <= 0) {
      errors.push('预计总工作量必须为正数');
    }
    if (opts.yearlyUnits.length === 0) {
      errors.push('年度工作量不能为空，请至少填写一个年度的工作量');
    } else if (opts.yearlyUnits.some((units) => !Number.isFinite(units) || units < 0)) {
      errors.push('每个年度工作量必须为不小于 0 的数字');
    } else if (
      Number.isFinite(opts.totalUnits) &&
      opts.totalUnits > 0 &&
      opts.yearlyUnits.reduce((sum, units) => sum + units, 0) > opts.totalUnits
    ) {
      errors.push('年度工作量合计不能超过预计总工作量');
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * 将单个 CSV 字段按 RFC 4180 规则转义：含逗号、双引号或换行时用双引号包裹，
 * 字段内部的双引号翻倍
 * @param field - 原始字段文本
 * @returns 转义后的字段文本
 */
function escapeCsvField(field: string): string {
  if (/[",\r\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * 将折旧明细行导出为带表头的 CSV 字符串（CRLF 换行）
 * 表头：年份,年折旧额,累计折旧额,年末账面价值,年折旧率；
 * 金额保留 2 位小数，年折旧率转换为百分比字符串，无折旧率的行末字段留空
 * @param rows - 逐年折旧明细
 * @returns CSV 文本
 */
export function toCsv(rows: YearRow[]): string {
  const header = '年份,年折旧额,累计折旧额,年末账面价值,年折旧率';
  const lines = rows.map((row) => {
    const rateText = row.rate === undefined ? '' : `${(row.rate * 100).toFixed(2)}%`;
    return [
      String(row.year),
      row.depreciation.toFixed(2),
      row.accumulatedDepreciation.toFixed(2),
      row.bookValue.toFixed(2),
      rateText,
    ]
      .map(escapeCsvField)
      .join(',');
  });
  return [header, ...lines].join('\r\n');
}
