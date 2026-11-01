/**
 * 复利与定投收益计算（零依赖纯函数）
 *
 * 约定：
 * - 利率一律以年化百分数界面值传入（8 表示 8%），内部换算为期利率
 *   periodRate = annualRatePercent / 100 / periodsPerYear。
 * - 复利频率 periodsPerYear：年复利 1、季复利 4、月复利 12、日复利 365。
 * - 每期定投 contribution 按复利频率的每期金额理解：月复利时即每月投入、
 *   季复利时即每季投入；timing=end（期末，默认）/ begin（期初）。
 * - 终值公式：
 *     FV = P·(1+r)^n + C·[((1+r)^n − 1)/r]·(1+r)^(begin?1:0)
 *   r=0 时退化为 FV = P + n·C。
 * - 单利对比：FV_simple = P·(1 + 年利率·总年数) + C·n·(begin?1:0)
 *   （定投本金不产生利息）。
 *
 * 本模块不触碰 DOM 与 React，所有错误以结果对象的 error 字段返回而非抛出。
 */

/** 定投投入时点 */
export type ContributionTiming = 'begin' | 'end';

/** 复利频率标识 */
export type CompoundFrequency = 'yearly' | 'quarterly' | 'monthly' | 'daily';

/** 每期增长明细行（期次从 1 开始） */
export interface GrowthRow {
  /** 第几期，从 1 开始 */
  period: number;
  /** 期初余额（期初定投已计入） */
  startBalance: number;
  /** 当定投供（期初或期末） */
  contribution: number;
  /** 当期利息 */
  interest: number;
  /** 期末余额 */
  endBalance: number;
}

/** 计算输入参数 */
export interface CompoundInput {
  /** 初始本金（不小于 0） */
  principal: number;
  /** 年化收益率百分数（8 表示 8%，允许负数） */
  annualRatePercent: number;
  /** 投资年数（正数，可小数） */
  years: number;
  /** 复利频率 */
  frequency: CompoundFrequency;
  /** 每期定投金额（不小于 0） */
  contribution: number;
  /** 定投时点：begin 期初 / end 期末 */
  timing: ContributionTiming;
}

/** 汇总结果（成功） */
export interface CompoundSummary {
  /** 期末本息总额（复利） */
  futureValue: number;
  /** 累计投入本金（初始本金 + 定投合计） */
  totalContributed: number;
  /** 累计收益（本息总额 − 累计投入） */
  totalInterest: number;
  /** 同等条件单利终值（定投本金不计息） */
  simpleFutureValue: number;
  /** 单利口径累计收益 */
  simpleInterest: number;
  /** 复利相对单利多获得的收益 */
  compoundAdvantage: number;
  /** 总期数 */
  periods: number;
  /** 逐期增长明细 */
  schedule: GrowthRow[];
}

/** 计算失败结果 */
export interface CompoundError {
  /** 中文错误信息 */
  error: string;
}

/** 计算结果 */
export type CompoundResult = (CompoundSummary & { error: null }) | CompoundError;

/** 各复利频率每年期数 */
export const PERIODS_PER_YEAR: Record<CompoundFrequency, number> = {
  yearly: 1,
  quarterly: 4,
  monthly: 12,
  daily: 365,
};

/**
 * 校验入参并归一化
 *
 * @param input - 计算参数
 * @returns 错误信息或归一化后的期利率与总期数
 */
function validate(
  input: CompoundInput,
): { error: string } | { periodRate: number; periods: number } {
  const { principal, annualRatePercent, years, contribution } = input;
  if (!Number.isFinite(principal) || principal < 0) {
    return { error: '初始本金必须为不小于 0 的数字' };
  }
  if (!Number.isFinite(annualRatePercent)) {
    return { error: '年化收益率必须为有效数字（如 8 表示 8%）' };
  }
  if (!Number.isFinite(years) || years <= 0) {
    return { error: '投资期限必须为大于 0 的年数' };
  }
  if (!Number.isFinite(contribution) || contribution < 0) {
    return { error: '每期定投金额必须为不小于 0 的数字' };
  }
  const periodsPerYear = PERIODS_PER_YEAR[input.frequency];
  const periods = Math.round(years * periodsPerYear);
  if (periods <= 0) {
    return { error: '投资期限按所选复利频率折算后不足 1 期，请延长投资期限' };
  }
  return {
    periodRate: annualRatePercent / 100 / periodsPerYear,
    periods,
  };
}

/**
 * 计算复利与定投终值
 *
 * 逐期滚动生成明细（期初先投入再计息；期末先计息再投入），
 * 终值直接取末期 endBalance，避免等比公式与滚动结果不一致；
 * 单利对比中定投本金不计息，初始本金按 年利率 × 总年数 计息
 * （总年数以 n / 每年期数 表示，保证不足整年也正确）。
 *
 * @param input - 计算参数
 * @returns 汇总与逐期明细，或 { error }
 */
export function calculateCompound(input: CompoundInput): CompoundResult {
  const checked = validate(input);
  if ('error' in checked) {
    return { error: checked.error };
  }
  const { periodRate, periods } = checked;
  const { principal, contribution, timing, annualRatePercent, frequency } = input;
  const periodsPerYear = PERIODS_PER_YEAR[frequency];

  const schedule: GrowthRow[] = [];
  let balance = principal;

  for (let k = 1; k <= periods; k += 1) {
    const startBalance = balance;
    let paid = 0;
    let interest: number;
    if (timing === 'begin') {
      balance += contribution;
      paid = contribution;
      interest = balance * periodRate;
      balance += interest;
    } else {
      interest = balance * periodRate;
      balance += interest + contribution;
      paid = contribution;
    }
    schedule.push({ period: k, startBalance, contribution: paid, interest, endBalance: balance });
  }

  const futureValue = balance;
  const totalContributed = principal + contribution * periods;
  const totalInterest = futureValue - totalContributed;

  const exactYears = periods / periodsPerYear;
  const simpleFutureValue =
    principal * (1 + (annualRatePercent / 100) * exactYears) +
    contribution * periods;
  const simpleInterest = simpleFutureValue - totalContributed;

  return {
    futureValue,
    totalContributed,
    totalInterest,
    simpleFutureValue,
    simpleInterest,
    compoundAdvantage: futureValue - simpleFutureValue,
    periods,
    schedule,
    error: null,
  };
}
