/**
 * 中国大陆劳动法加班费计算的纯函数工具集。
 * 依据《劳动法》第四十四条与劳社部发〔2008〕3 号：月计薪天数 21.75、日工作 8 小时。
 */

/** 月计薪天数（365 - 104 个休息日）÷ 12 个月 */
export const MONTHLY_PAY_DAYS = 21.75;

/** 标准日工作小时数 */
export const WORK_HOURS_PER_DAY = 8;

/** 三类加班的法定倍率（含工资本身，即总支付倍数） */
export const OVERTIME_RATES = {
  /** 工作日延时加班：不低于 150% */
  workday: 1.5,
  /** 休息日加班且不能补休：不低于 200% */
  restDay: 2,
  /** 法定节假日加班：不低于 300% */
  statutoryHoliday: 3,
} as const;

/** 加班时长入参（小时） */
export interface OvertimeHours {
  /** 工作日延时加班小时 */
  workday: number;
  /** 休息日加班小时（不能安排补休） */
  restDay: number;
  /** 法定节假日加班小时 */
  statutoryHoliday: number;
}

/** 单类加班费明细 */
export interface OvertimeBreakdown {
  /** 加班类型键 */
  type: keyof OvertimeHours;
  /** 法定倍率 */
  rate: number;
  /** 加班小时数 */
  hours: number;
  /** 该类加班费（元） */
  pay: number;
}

/** 加班费计算结果 */
export interface OvertimeResult {
  /** 月工资基数（元） */
  monthlyBase: number;
  /** 折算日工资（元） */
  dailyWage: number;
  /** 折算小时工资（元） */
  hourlyWage: number;
  /** 三类加班费明细 */
  breakdown: OvertimeBreakdown[];
  /** 加班费合计（元） */
  totalOvertimePay: number;
  /** 当月应发总额 = 月工资基数 + 加班费合计（元） */
  grossPay: number;
  /** 加班总小时数 */
  totalHours: number;
}

/**
 * 由月工资基数折算日工资与小时工资。
 *
 * @param monthlyBase - 月工资基数（元）
 * @returns 日工资、小时工资
 */
export function deriveWages(monthlyBase: number): { dailyWage: number; hourlyWage: number } {
  if (!(Number.isFinite(monthlyBase) && monthlyBase >= 0)) {
    throw new Error('月工资基数必须为非负数值');
  }
  const dailyWage = monthlyBase / MONTHLY_PAY_DAYS;
  const hourlyWage = dailyWage / WORK_HOURS_PER_DAY;
  return { dailyWage, hourlyWage };
}

/**
 * 计算三类加班费与当月应发总额。
 *
 * @param monthlyBase - 月工资基数（元）
 * @param hours - 三类加班小时数
 * @returns 折算工资、分项明细、合计与应发总额
 */
export function calculateOvertimePay(
  monthlyBase: number,
  hours: OvertimeHours,
): OvertimeResult {
  const entries = (Object.keys(OVERTIME_RATES) as (keyof OvertimeHours)[]).map((type) => {
    const value = hours[type];
    if (!(Number.isFinite(value) && value >= 0)) {
      throw new Error('加班小时数必须为非负数值');
    }
    return { type, value };
  });

  const { dailyWage, hourlyWage } = deriveWages(monthlyBase);

  const breakdown: OvertimeBreakdown[] = entries.map(({ type, value }) => ({
    type,
    rate: OVERTIME_RATES[type],
    hours: value,
    // 加班费 = 小时工资 × 加班小时 × 法定倍率
    pay: hourlyWage * value * OVERTIME_RATES[type],
  }));

  const totalOvertimePay = breakdown.reduce((sum, item) => sum + item.pay, 0);
  const totalHours = breakdown.reduce((sum, item) => sum + item.hours, 0);

  return {
    monthlyBase,
    dailyWage,
    hourlyWage,
    breakdown,
    totalOvertimePay,
    grossPay: monthlyBase + totalOvertimePay,
    totalHours,
  };
}

/**
 * 金额四舍五入到分（两位小数），用于展示层。
 *
 * @param amount - 金额
 * @returns 保留两位小数的金额
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
