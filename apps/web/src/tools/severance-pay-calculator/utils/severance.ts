/**
 * 经济补偿金 / 代通知金 / 违法解除赔偿金估算（零依赖纯函数）
 *
 * 依据《中华人民共和国劳动合同法》第 47 条、第 40 条、第 87 条：
 * - 每满一年支付一个月工资；六个月以上不满一年按一年；不满六个月按半个月
 * - 月工资高于当地上年度职工月平均工资三倍的，基数按三倍封顶，年限最高不超过 12 年
 * - N：经济补偿金；N+1：未提前 30 日通知的代通知金（+1 个月）；2N：违法解除赔偿金
 *
 * 结果为估算值，不构成法律意见。2008 年前工龄分段规则不在本工具范围内。
 */

export type SeveranceScenario = 'N' | 'N_PLUS_1' | '2N';

export interface SeveranceInput {
  /** 已工作整年数（≥0 整数） */
  years: number;
  /** 已满整年之外的剩余月数（0–11 整数） */
  months: number;
  /** 离职前 12 个月平均月工资（元） */
  monthlyWage: number;
  /** 当地上年度职工月平均工资（元）；留空 / undefined 表示不触发三倍封顶 */
  localAvgWage?: number;
  /** 解除情形 */
  scenario: SeveranceScenario;
}

export interface SeveranceResult {
  /** 折算后的补偿月数 N（未封顶） */
  rawMonths: number;
  /** 实际参与计算的月数（封顶情形下 ≤ 12） */
  effectiveMonths: number;
  /** 月计算基数（元，可能被三倍封顶） */
  baseWage: number;
  /** 是否触发工资基数三倍封顶 */
  wageCapped: boolean;
  /** 是否触发 12 年年限封顶 */
  monthsCapped: boolean;
  /** 封顶基数值（仅 wageCapped 时有意义） */
  capWage: number | null;
  /** 经济补偿金 N × 基数（元） */
  severancePay: number;
  /** 代通知金（1 个月基数，仅 N+1 情形非零） */
  noticePay: number;
  /** 应付总额（元） */
  totalPay: number;
  /** 分项计算明细 */
  breakdown: string[];
}

const MAX_CAP_MONTHS = 12;

function requireNonNegativeInteger(value: number, name: string): number {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${name}必须是不小于 0 的整数`);
  }
  return value;
}

/**
 * 年限折算：满一年计 1 个月；剩余 ≥6 个月按 1 个月计；>0 且 <6 个月按 0.5 个月计；
 * 工龄恰好为 0 时 N=0。
 */
export function calcCompensationMonths(years: number, months: number): number {
  const y = requireNonNegativeInteger(years, '工作年数');
  const m = requireNonNegativeInteger(months, '剩余月数');
  if (m > 11) {
    throw new Error('剩余月数必须在 0–11 之间，完整年度请计入工作年数');
  }
  const totalMonths = y * 12 + m;
  if (totalMonths === 0) return 0;
  const fullYears = Math.floor(totalMonths / 12);
  const remainder = totalMonths % 12;
  if (remainder === 0) return fullYears;
  return fullYears + (remainder >= 6 ? 1 : 0.5);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calcSeverance(input: SeveranceInput): SeveranceResult {
  const rawMonths = calcCompensationMonths(input.years, input.months);

  if (!Number.isFinite(input.monthlyWage) || input.monthlyWage <= 0) {
    throw new Error('月工资必须为大于 0 的有效数字');
  }
  if (input.localAvgWage !== undefined) {
    if (!Number.isFinite(input.localAvgWage) || input.localAvgWage <= 0) {
      throw new Error('当地社平工资必须为大于 0 的有效数字；如不适用请留空');
    }
  }

  const capWage =
    input.localAvgWage === undefined ? null : round2(input.localAvgWage * 3);
  const wageCapped = capWage !== null && input.monthlyWage > capWage;
  const baseWage = round2(wageCapped ? (capWage as number) : input.monthlyWage);

  // 仅在工资基数被三倍封顶时，补偿年限才受 12 年上限约束（劳动合同法第 47 条）
  const monthsCapped = wageCapped && rawMonths > MAX_CAP_MONTHS;
  const effectiveMonths = monthsCapped ? MAX_CAP_MONTHS : rawMonths;

  const severancePay = round2(effectiveMonths * baseWage);
  const noticePay = input.scenario === 'N_PLUS_1' ? baseWage : 0;
  const multiplier = input.scenario === '2N' ? 2 : 1;
  const totalPay = round2(severancePay * multiplier + noticePay);

  const breakdown: string[] = [
    `工龄 ${input.years} 年 ${input.months} 个月 → 补偿月数 N = ${rawMonths}`,
  ];
  if (wageCapped) {
    breakdown.push(
      `月工资 ${input.monthlyWage} 元高于社平工资三倍 ${capWage} 元，基数按三倍封顶为 ${baseWage} 元`,
    );
  } else {
    breakdown.push(`月工资未超过社平三倍（或未提供社平工资），计算基数 = ${baseWage} 元`);
  }
  if (monthsCapped) {
    breakdown.push(`封顶情形补偿年限最高 12 年，月数由 ${rawMonths} 调整为 ${effectiveMonths}`);
  }
  breakdown.push(`经济补偿金 N×基数 = ${effectiveMonths} × ${baseWage} = ${severancePay} 元`);
  if (input.scenario === 'N_PLUS_1') {
    breakdown.push(`代通知金（未提前 30 日通知）= 1 × ${baseWage} = ${noticePay} 元`);
  }
  if (input.scenario === '2N') {
    breakdown.push(`违法解除赔偿金 2N = 2 × ${severancePay} = ${totalPay} 元`);
  }

  return {
    rawMonths,
    effectiveMonths,
    baseWage,
    wageCapped,
    monthsCapped,
    capWage,
    severancePay,
    noticePay,
    totalPay,
    breakdown,
  };
}

export const SCENARIO_LABELS: Record<SeveranceScenario, string> = {
  N: 'N：经济补偿金（协商一致 / 无过失辞退 / 经济性裁员等）',
  N_PLUS_1: 'N+1：经济补偿 + 代通知金（第 40 条情形且未提前 30 日通知）',
  '2N': '2N：违法解除赔偿金（第 87 条，按经济补偿标准二倍）',
};
