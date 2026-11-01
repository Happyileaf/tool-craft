/**
 * 贷款还款计算（等额本息 / 等额本金，零依赖纯函数）
 *
 * 约定：
 * - principal 为贷款本金（正数）；annualRate 为年利率小数（0.049 表示 4.9%）；
 *   months 为还款月数（正整数）。
 * - 月利率 r = annualRate / 12；年利率 0 时 r=0（免息贷款）。
 * - 等额本息：M = P·r·(1+r)^n / ((1+r)^n − 1)，每月还款额固定。
 * - 等额本金：第 k 月还款 = P/n +（剩余本金）·r，每月本金固定为 P/n、利息逐月递减。
 *
 * 本模块不触碰 DOM 与 React，所有错误以结果对象的 error 字段返回而非抛出。
 */

/** 还款方式 */
export type RepaymentMethod = 'equal-payment' | 'equal-principal';

/** 单期还款明细（k 从 1 开始） */
export interface PaymentRow {
  /** 第几期，从 1 开始 */
  month: number;
  /** 当期还款总额 */
  payment: number;
  /** 当期偿还本金 */
  principal: number;
  /** 当期偿还利息 */
  interest: number;
  /** 期末剩余本金 */
  remaining: number;
}

/** 汇总结果（成功） */
export interface LoanSummary {
  /** 还款总额 */
  totalPayment: number;
  /** 利息总额 */
  totalInterest: number;
  /** 每月还款额（等额本息固定；等额本金为首月金额） */
  monthlyPayment: number;
  /** 逐月还款计划 */
  schedule: PaymentRow[];
}

/** 计算失败结果 */
export interface LoanError {
  /** 中文错误信息 */
  error: string;
}

/** 贷款计算结果 */
export type LoanResult = (LoanSummary & { error: null }) | LoanError;

/**
 * 校验入参基础合法性
 *
 * @param principal - 贷款本金
 * @param annualRate - 年利率小数
 * @param months - 还款月数
 * @returns 错误信息；全部合法返回 null
 */
function validate(principal: number, annualRate: number, months: number): string | null {
  if (!Number.isFinite(principal) || principal <= 0) {
    return '贷款本金必须为大于 0 的数字';
  }
  if (!Number.isFinite(annualRate) || annualRate < 0) {
    return '年利率必须为不小于 0 的数字（如 4.9% 填 4.9）';
  }
  if (!Number.isInteger(months) || months <= 0) {
    return '期限必须为大于 0 的整数月';
  }
  return null;
}

/**
 * 等额本息还款计划
 *
 * 每月还款额 M = P·r·(1+r)^n / ((1+r)^n − 1)；
 * r=0（免息）时 M = P/n。每期利息 = 剩余本金 × r，本金 = M − 利息，
 * 末期用剩余本金兜底以消除浮点累计误差。
 *
 * @param principal - 贷款本金
 * @param monthlyRate - 月利率小数
 * @param months - 还款月数
 * @returns 汇总与逐月计划
 */
function equalPaymentSchedule(
  principal: number,
  monthlyRate: number,
  months: number,
): LoanSummary {
  const factor = (1 + monthlyRate) ** months;
  const monthly =
    monthlyRate === 0 ? principal / months : (principal * monthlyRate * factor) / (factor - 1);

  const schedule: PaymentRow[] = [];
  let remaining = principal;
  let totalInterest = 0;

  for (let k = 1; k <= months; k += 1) {
    const interest = remaining * monthlyRate;
    let principalPaid = monthly - interest;
    let payment = monthly;
    if (k === months) {
      // 末期按剩余本金结清，吸收累计舍入误差
      principalPaid = remaining;
      payment = principalPaid + interest;
    }
    remaining -= principalPaid;
    if (Math.abs(remaining) < 1e-9) {
      remaining = 0;
    }
    totalInterest += interest;
    schedule.push({ month: k, payment, principal: principalPaid, interest, remaining });
  }

  return {
    monthlyPayment: monthly,
    totalPayment: principal + totalInterest,
    totalInterest,
    schedule,
  };
}

/**
 * 等额本金还款计划
 *
 * 每月偿还固定本金 P/n；第 k 月利息 =（P − P·(k−1)/n）·r，
 * 第 k 月还款 = P/n + 利息；末期剩余本金兜底清零。
 *
 * @param principal - 贷款本金
 * @param monthlyRate - 月利率小数
 * @param months - 还款月数
 * @returns 汇总与逐月计划
 */
function equalPrincipalSchedule(
  principal: number,
  monthlyRate: number,
  months: number,
): LoanSummary {
  const principalPerMonth = principal / months;
  const schedule: PaymentRow[] = [];
  let totalPayment = 0;
  let totalInterest = 0;
  let remaining = principal;

  for (let k = 1; k <= months; k += 1) {
    const interest = remaining * monthlyRate;
    let principalPaid = principalPerMonth;
    if (k === months) {
      principalPaid = remaining;
    }
    const payment = principalPaid + interest;
    remaining -= principalPaid;
    if (Math.abs(remaining) < 1e-9) {
      remaining = 0;
    }
    totalPayment += payment;
    totalInterest += interest;
    schedule.push({ month: k, payment, principal: principalPaid, interest, remaining });
  }

  return {
    monthlyPayment: schedule[0]?.payment ?? 0,
    totalPayment,
    totalInterest,
    schedule,
  };
}

/**
 * 计算贷款还款方案
 *
 * @param principal - 贷款本金（正数）
 * @param annualRatePercent - 年利率百分数界面值（4.9 表示 4.9%）
 * @param months - 还款月数（正整数）
 * @param method - 还款方式：equal-payment 等额本息 / equal-principal 等额本金
 * @returns 汇总与逐月计划，或 { error }
 */
export function calculateLoan(
  principal: number,
  annualRatePercent: number,
  months: number,
  method: RepaymentMethod,
): LoanResult {
  const error = validate(principal, annualRatePercent, months);
  if (error) {
    return { error };
  }
  const monthlyRate = annualRatePercent / 100 / 12;
  const summary =
    method === 'equal-payment'
      ? equalPaymentSchedule(principal, monthlyRate, months)
      : equalPrincipalSchedule(principal, monthlyRate, months);
  return { ...summary, error: null };
}
