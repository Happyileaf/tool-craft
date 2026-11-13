/**
 * 固定资产折旧纯函数集合，不依赖 DOM 与 React；
 * 覆盖直线法、工作量法、双倍余额递减法与年数总和法四种常用折旧方法
 */

/** 折旧方法标识 */
export type DepreciationMethod =
  | 'straight-line'
  | 'units-of-activity'
  | 'double-declining'
  | 'sum-of-years-digits';

/** 单年（或单期）折旧明细行 */
export interface DepreciationRow {
  /** 期次，从 1 开始 */
  period: number;
  /** 当期折旧额 */
  depreciation: number;
  /** 累计折旧 */
  accumulated: number;
  /** 期末账面净值（原值 − 累计折旧） */
  bookValue: number;
}

/** 完整折旧计算结果 */
export interface DepreciationResult {
  /** 可折旧总额（原值 − 预计净残值） */
  depreciableBase: number;
  /** 逐期明细 */
  rows: DepreciationRow[]
}

/** 展示与内部计算统一保留的小数位数 */
export const DECIMALS = 2;

/**
 * 四舍五入到分（两位小数），消除浮点尾差
 *
 * @param value - 原始数值
 * @returns 保留两位小数的数值
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * 校验通用输入：原值、净残值、期数
 *
 * @param cost - 固定资产原值
 * @param salvage - 预计净残值
 * @param periods - 折旧期数（年或工作量期数）
 * @returns 校验通过返回 null，否则返回中文错误信息
 */
export function validateBaseInputs(
  cost: number,
  salvage: number,
  periods: number,
): string | null {
  if (!Number.isFinite(cost) || cost <= 0) {
    return '资产原值必须为大于 0 的数值';
  }
  if (!Number.isFinite(salvage) || salvage < 0) {
    return '预计净残值不能为负数';
  }
  if (salvage >= cost) {
    return '预计净残值必须小于资产原值';
  }
  if (!Number.isInteger(periods) || periods <= 0 || periods > 100) {
    return '折旧期数需为 1–100 之间的整数';
  }
  return null;
}

/**
 * 直线法：每期折旧额 =（原值 − 净残值）/ 期数
 *
 * @param cost - 原值
 * @param salvage - 净残值
 * @param periods - 期数
 * @returns 逐期折旧明细
 */
export function straightLine(
  cost: number,
  salvage: number,
  periods: number,
): DepreciationResult {
  const error = validateBaseInputs(cost, salvage, periods);
  if (error) {
    throw new Error(error);
  }
  const base = cost - salvage;
  const perPeriod = round2(base / periods);
  const rows: DepreciationRow[] = [];
  let accumulated = 0;
  for (let period = 1; period <= periods; period += 1) {
    // 最后一期承接尾差，确保累计折旧恰好等于可折旧基数
    const depreciation =
      period === periods ? round2(base - accumulated) : perPeriod;
    accumulated = round2(accumulated + depreciation);
    rows.push({
      period,
      depreciation,
      accumulated,
      bookValue: round2(cost - accumulated),
    });
  }
  return { depreciableBase: round2(base), rows };
}

/**
 * 工作量法：单位工作量折旧额 × 当期实际工作量；
 * 各期工作量之和应等于总预计工作量，末期同样承接尾差。
 *
 * @param cost - 原值
 * @param salvage - 净残值
 * @param unitsPerPeriod - 每期实际工作量数组
 * @param totalUnits - 预计总工作量
 * @returns 逐期折旧明细
 */
export function unitsOfActivity(
  cost: number,
  salvage: number,
  unitsPerPeriod: number[],
  totalUnits: number,
): DepreciationResult {
  const periods = unitsPerPeriod.length;
  const error = validateBaseInputs(cost, salvage, periods);
  if (error) {
    throw new Error(error);
  }
  if (!Number.isFinite(totalUnits) || totalUnits <= 0) {
    throw new Error('预计总工作量必须为大于 0 的数值');
  }
  if (unitsPerPeriod.some((units) => !Number.isFinite(units) || units < 0)) {
    throw new Error('各期工作量不能为负数或非数值');
  }
  const actualTotal = unitsPerPeriod.reduce((sum, units) => sum + units, 0);
  if (actualTotal > totalUnits) {
    throw new Error(
      `各期工作量之和 ${round2(actualTotal)} 超过预计总工作量 ${round2(totalUnits)}`,
    );
  }
  const base = cost - salvage;
  const ratePerUnit = base / totalUnits;
  const rows: DepreciationRow[] = [];
  let accumulated = 0;
  unitsPerPeriod.forEach((units, index) => {
    const period = index + 1;
    const depreciation =
      period === periods
        ? round2(base - accumulated)
        : round2(ratePerUnit * units);
    accumulated = round2(accumulated + depreciation);
    rows.push({
      period,
      depreciation,
      accumulated,
      bookValue: round2(cost - accumulated),
    });
  });
  return { depreciableBase: round2(base), rows };
}

/**
 * 双倍余额递减法：年折旧率 = 2 / 年限，按期初账面净值计提；
 * 最后两年改为直线法，将剩余可折旧额平均摊完，确保期末净值等于净残值。
 *
 * @param cost - 原值
 * @param salvage - 净残值
 * @param periods - 折旧年限
 * @returns 逐年折旧明细
 */
export function doubleDeclining(
  cost: number,
  salvage: number,
  periods: number,
): DepreciationResult {
  const error = validateBaseInputs(cost, salvage, periods);
  if (error) {
    throw new Error(error);
  }
  const base = cost - salvage;
  const rate = 2 / periods;
  const rows: DepreciationRow[] = [];
  let accumulated = 0;
  let bookValue = cost;

  for (let period = 1; period <= periods; period += 1) {
    let depreciation: number;
    const remainingPeriods = periods - period + 1;
    if (remainingPeriods <= 2) {
      // 最后两年：按直线法摊余剩余可折旧额
      depreciation = round2((bookValue - salvage) / remainingPeriods);
    } else {
      depreciation = round2(bookValue * rate);
    }
    // 不得把账面净值折到净残值以下
    if (accumulated + depreciation > base) {
      depreciation = round2(base - accumulated);
    }
    accumulated = round2(accumulated + depreciation);
    bookValue = round2(cost - accumulated);
    rows.push({ period, depreciation, accumulated, bookValue });
  }
  return { depreciableBase: round2(base), rows };
}

/**
 * 年数总和法：年折旧率 = 剩余使用年数 / 年数总和；
 * 年数总和 = n(n+1)/2，每期折旧 = 可折旧基数 × 当年折旧率。
 *
 * @param cost - 原值
 * @param salvage - 净残值
 * @param periods - 折旧年限
 * @returns 逐年折旧明细
 */
export function sumOfYearsDigits(
  cost: number,
  salvage: number,
  periods: number,
): DepreciationResult {
  const error = validateBaseInputs(cost, salvage, periods);
  if (error) {
    throw new Error(error);
  }
  const base = cost - salvage;
  const sumOfYears = (periods * (periods + 1)) / 2;
  const rows: DepreciationRow[] = [];
  let accumulated = 0;
  for (let period = 1; period <= periods; period += 1) {
    const remainingYears = periods - period + 1;
    const depreciation =
      period === periods
        ? round2(base - accumulated)
        : round2((base * remainingYears) / sumOfYears);
    accumulated = round2(accumulated + depreciation);
    rows.push({
      period,
      depreciation,
      accumulated,
      bookValue: round2(cost - accumulated),
    });
  }
  return { depreciableBase: round2(base), rows };
}

/** 四种方法的中文展示名 */
export const METHOD_LABELS: Record<DepreciationMethod, string> = {
  'straight-line': '直线法（平均年限法）',
  'units-of-activity': '工作量法',
  'double-declining': '双倍余额递减法',
  'sum-of-years-digits': '年数总和法',
};
