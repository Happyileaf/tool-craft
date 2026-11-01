/**
 * NPV（净现值）与 IRR（内部收益率）投资现金流计算（零依赖纯函数）
 *
 * 约定：
 * - cashFlows 为 number[]，索引即期次 t（t 从 0 开始，首期 t=0 不折现）；
 *   通常第 0 期为初始投资（负数），后续各期为现金流入（正数）。
 * - rate 为小数：0.1 表示 10%。
 * - NPV = Σ CF_t / (1 + r)^t。
 * - IRR 通过有界二分法求解，区间固定为 [-0.9999, 10]，只有两端 NPV 严格异号
 *   才认为区间内有根，容差 1e-10、最多 200 次迭代，收敛稳健。
 *
 * 本模块不触碰 DOM 与 React，所有错误以结果对象的 error 字段返回而非抛出。
 */

/** 单期折现明细 */
export interface NpvRowDetail {
  /** 期次，从 0 开始 */
  t: number;
  /** 该期现金流 */
  cashFlow: number;
  /** 折现因子 1 / (1 + r)^t；t=0 时恒为 1 */
  discountFactor: number;
  /** 折现值 cashFlow × discountFactor */
  presentValue: number;
}

/** NPV 成功结果 */
export interface NpvSuccess {
  /** 净现值 */
  npv: number;
  /** 各期折现明细 */
  details: NpvRowDetail[];
  /** 无错误 */
  error: null;
}

/** 计算失败结果 */
export interface CalcError {
  /** 中文错误信息 */
  error: string;
}

/** 通用计算结果联合类型 */
export type CalcResult<T> = (T & { error: null }) | CalcError;

/** NPV 计算结果 */
export type NpvResult = CalcResult<{ npv: number; details: NpvRowDetail[] }>;

/** IRR 计算结果 */
export type IrrResult = CalcResult<{ irr: number }>;

/** 投资判定结论 */
export type InvestmentDecision = 'invest' | 'reject';

/** 投资判定结果 */
export interface EvaluationResult {
  /** invest 值得投资 / reject 不建议投资 */
  decision: InvestmentDecision;
  /** 判定理由（中文） */
  reasons: string[];
}

/** IRR 二分搜索区间下界（-99.99%） */
const IRR_LOWER = -0.9999;
/** IRR 二分搜索区间上界（1000%） */
const IRR_UPPER = 10;
/** 二分收敛容差（区间宽度） */
const IRR_TOLERANCE = 1e-10;
/** 二分最大迭代次数 */
const IRR_MAX_ITERATIONS = 200;

/** 全同号 / 区间端点不异号时的固定错误文案 */
export const IRR_NOT_EXIST_ERROR =
  '现金流在整个利率区间内不改变符号，IRR 不存在（全同号现金流没有内部收益率）';

/**
 * 校验现金流数组的基础合法性
 *
 * @param cashFlows - 现金流数组
 * @returns 错误信息；全部合法返回 null
 */
function validateCashFlows(cashFlows: number[]): string | null {
  if (cashFlows.length === 0) {
    return '请至少输入 1 期现金流';
  }
  for (let t = 0; t < cashFlows.length; t += 1) {
    if (!Number.isFinite(cashFlows[t])) {
      return `第 ${t} 期（t=${t}）的现金流不是有效数字`;
    }
  }
  return null;
}

/**
 * 计算给定利率下的 NPV 原始数值（无校验、不返回明细，供 IRR 二分内部复用）
 *
 * @param cashFlows - 现金流数组
 * @param rate - 小数利率
 * @returns NPV 数值
 */
function npvValue(cashFlows: number[], rate: number): number {
  let total = 0;
  let discountFactor = 1;
  for (let t = 0; t < cashFlows.length; t += 1) {
    total += (cashFlows[t] as number) * discountFactor;
    discountFactor /= 1 + rate;
  }
  return total;
}

/**
 * 计算 NPV 与各期折现明细
 *
 * t 从 0 开始，第 0 期折现因子恒为 1（首期不折现）；
 * 现金流为空或含非有限数、贴现率 ≤ -100% 时返回中文错误。
 *
 * @param cashFlows - 现金流数组，索引即期次
 * @param rate - 小数贴现率（0.1 = 10%）
 * @returns 含 npv / details 的结果对象或 { error }
 */
export function npv(cashFlows: number[], rate: number): NpvResult {
  const cashError = validateCashFlows(cashFlows);
  if (cashError) {
    return { error: cashError };
  }
  if (!Number.isFinite(rate) || rate <= -1) {
    return { error: '贴现率必须大于 -100%' };
  }

  const details: NpvRowDetail[] = [];
  let total = 0;
  let discountFactor = 1;
  for (let t = 0; t < cashFlows.length; t += 1) {
    const cashFlow = cashFlows[t] as number;
    const presentValue = cashFlow * discountFactor;
    details.push({ t, cashFlow, discountFactor, presentValue });
    total += presentValue;
    discountFactor /= 1 + rate;
  }

  return { npv: total, details, error: null };
}

/**
 * 判断两个数值是否严格异号（0 既非正也非负）
 *
 * @param a - 数值 a
 * @param b - 数值 b
 * @returns 是否异号
 */
function oppositeSigns(a: number, b: number): boolean {
  return (a > 0 && b < 0) || (a < 0 && b > 0);
}

/**
 * 计算 IRR（使 NPV 恰好为 0 的小数利率）
 *
 * 采用有界二分法：固定在 [-0.9999, 10] 区间搜索，端点 NPV 严格异号才认为有根；
 * 容差 1e-10、最多 200 次迭代。现金流全同号（含全 0、单行）或端点不异号时
 * 返回固定中文错误。若端点恰好为根则直接返回端点。
 *
 * @param cashFlows - 现金流数组，索引即期次
 * @returns 含 irr 的结果对象或 { error }
 */
export function irr(cashFlows: number[]): IrrResult {
  const cashError = validateCashFlows(cashFlows);
  if (cashError) {
    return { error: cashError };
  }

  let lower = IRR_LOWER;
  let upper = IRR_UPPER;
  let fLower = npvValue(cashFlows, lower);
  const fUpper = npvValue(cashFlows, upper);

  if (!Number.isFinite(fLower) || !Number.isFinite(fUpper) || !oppositeSigns(fLower, fUpper)) {
    return { error: IRR_NOT_EXIST_ERROR };
  }

  for (let i = 0; i < IRR_MAX_ITERATIONS; i += 1) {
    if (upper - lower <= IRR_TOLERANCE) {
      return { irr: (lower + upper) / 2, error: null };
    }
    const mid = (lower + upper) / 2;
    const fMid = npvValue(cashFlows, mid);
    if (fMid === 0) {
      return { irr: mid, error: null };
    }
    if (oppositeSigns(fLower, fMid)) {
      upper = mid;
    } else {
      lower = mid;
      fLower = fMid;
    }
  }

  return { irr: (lower + upper) / 2, error: null };
}

/**
 * 投资判定
 *
 * worth it（invest）当且仅当：
 * - NPV > 0（NPV ≤ 0 直接 reject）；且
 * - hurdleRate 为 null 时不考核 IRR 门槛；提供门槛率时要求 irrValue 存在且严格大于门槛率。
 *
 * @param npvValue - 已算出的净现值
 * @param irrValue - 已算出的内部收益率（小数）；IRR 无解时传 null
 * @param hurdleRate - 门槛收益率（小数）；不考核时传 null
 * @returns 判定结论与中文理由
 */
export function evaluateInvestment(
  npvValue: number,
  irrValue: number | null,
  hurdleRate: number | null,
): EvaluationResult {
  const reasons: string[] = [];

  if (npvValue > 0) {
    reasons.push('净现值 NPV 为正，项目预期创造价值');
  } else if (npvValue === 0) {
    reasons.push('净现值 NPV 为 0，仅达到盈亏平衡');
  } else {
    reasons.push('净现值 NPV 为负，项目预期折损价值');
  }

  if (hurdleRate !== null) {
    if (irrValue === null) {
      reasons.push('IRR 不存在，无法证明收益率高于门槛率');
    } else if (irrValue > hurdleRate) {
      reasons.push('内部收益率 IRR 高于门槛收益率');
    } else {
      reasons.push('内部收益率 IRR 未超过门槛收益率');
    }
  } else if (irrValue === null) {
    reasons.push('现金流全同号，IRR 不存在，本次仅依据 NPV 判定');
  } else {
    reasons.push('未设置门槛率，本次仅依据 NPV 判定');
  }

  const worthIt =
    npvValue > 0 && (hurdleRate === null || (irrValue !== null && irrValue > hurdleRate));

  return { decision: worthIt ? 'invest' : 'reject', reasons };
}
