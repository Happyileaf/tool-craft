/**
 * APR（名义年利率）↔ EAR（实际年利率/APY）换算与含手续费贷款真实成本计算。
 * 仅使用 Math.pow / Math.log / Math.exp，零依赖纯函数，不触碰 DOM。
 * 利率入参统一为百分数（如 12 表示 12%），输出同样为百分数。
 */

/** 复利频次枚举：离散期数或连续复利 */
export type CompoundingPeriod =
  | 'monthly'
  | 'quarterly'
  | 'semi-annual'
  | 'daily'
  | 'continuous';

/** 频次到每年期数 n 的映射，连续复利为 Infinity */
export const PERIODS_PER_YEAR: Record<Exclude<CompoundingPeriod, 'continuous'>, number> = {
  monthly: 12,
  quarterly: 4,
  'semi-annual': 2,
  daily: 365,
};

/** 频次的中文展示名 */
export const PERIOD_LABELS: Record<CompoundingPeriod, string> = {
  monthly: '按月复利（n=12）',
  quarterly: '按季复利（n=4）',
  'semi-annual': '按半年复利（n=2）',
  daily: '按日复利（n=365）',
  continuous: '连续复利',
};

/**
 * 校验百分数利率合法：有限且非负
 *
 * @param ratePercent - 百分数利率
 * @param name - 字段名，用于错误提示
 */
function assertRate(ratePercent: number, name: string): void {
  if (!Number.isFinite(ratePercent) || ratePercent < 0) {
    throw new Error(`${name}必须是不小于 0 的有限数值，实际为 ${ratePercent}`);
  }
}

/**
 * 名义年利率 APR 转实际年利率 EAR。
 * 离散复利：EAR = (1 + r/n)^n − 1；连续复利：EAR = e^r − 1。
 *
 * @param aprPercent - 名义年利率百分数
 * @param period - 复利频次
 * @returns 实际年利率百分数
 */
export function aprToEar(aprPercent: number, period: CompoundingPeriod): number {
  assertRate(aprPercent, '名义年利率');
  const r = aprPercent / 100;
  if (period === 'continuous') {
    return (Math.exp(r) - 1) * 100;
  }
  const n = PERIODS_PER_YEAR[period];
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error('复利频次必须取自支持的枚举值');
  }
  return (Math.pow(1 + r / n, n) - 1) * 100;
}

/**
 * 实际年利率 EAR 反求名义年利率 APR。
 * 离散复利：APR = n × ((1 + EAR)^(1/n) − 1)；连续复利：APR = ln(1 + EAR)。
 *
 * @param earPercent - 实际年利率百分数
 * @param period - 复利频次
 * @returns 名义年利率百分数
 */
export function earToApr(earPercent: number, period: CompoundingPeriod): number {
  assertRate(earPercent, '实际年利率');
  const ear = earPercent / 100;
  if (period === 'continuous') {
    return Math.log(1 + ear) * 100;
  }
  const n = PERIODS_PER_YEAR[period];
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error('复利频次必须取自支持的枚举值');
  }
  return n * (Math.pow(1 + ear, 1 / n) - 1) * 100;
}

/**
 * 含一次性手续费贷款的有效年化成本（百分数）。
 *
 * 模型：借款人净到手 principal − fee，但按合同本金与 APR 偿还一年本息
 * （离散复利本息 = principal × (1 + r/n)^n，连续复利 = principal × e^r）。
 * 有效年化成本 = 一年后总偿付 / 净到手本金 − 1，费用越高、净到手越少，成本越高。
 *
 * @param principal - 贷款本金（正数）
 * @param fee - 一次性开户/手续费用（非负且小于本金）
 * @param aprPercent - 合同名义年利率百分数
 * @param period - 复利频次
 * @returns 有效年化成本百分数
 */
export function effectiveCostRate(
  principal: number,
  fee: number,
  aprPercent: number,
  period: CompoundingPeriod,
): number {
  if (!Number.isFinite(principal) || principal <= 0) {
    throw new Error(`贷款本金必须是正数，实际为 ${principal}`);
  }
  if (!Number.isFinite(fee) || fee < 0) {
    throw new Error(`手续费必须是不小于 0 的有限数值，实际为 ${fee}`);
  }
  if (fee >= principal) {
    throw new Error('手续费必须小于贷款本金，否则净到手资金非正，无法计算年化成本');
  }
  assertRate(aprPercent, '名义年利率');

  const r = aprPercent / 100;
  const growth =
    period === 'continuous'
      ? Math.exp(r)
      : Math.pow(1 + r / PERIODS_PER_YEAR[period], PERIODS_PER_YEAR[period]);
  const totalRepayment = principal * growth;
  const netProceeds = principal - fee;
  return (totalRepayment / netProceeds - 1) * 100;
}

/**
 * 名义利率与实际利率的利差（百分点）
 *
 * @param aprPercent - 名义年利率百分数
 * @param earPercent - 实际年利率百分数
 * @returns 利差百分点
 */
export function rateSpread(aprPercent: number, earPercent: number): number {
  return earPercent - aprPercent;
}

/**
 * 把百分数利率格式化为固定 4 位小数并带百分号
 *
 * @param percent - 百分数数值
 * @returns 如 "12.6825%"
 */
export function formatPercent(percent: number): string {
  if (!Number.isFinite(percent)) {
    return '—';
  }
  return `${percent.toFixed(4)}%`;
}
