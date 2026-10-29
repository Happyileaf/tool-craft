/**
 * 日期差与日期加减的纯函数模块。
 *
 * 内部一律使用 UTC 分量与 UTC 毫秒时间戳，保证纯日期/时间运算不受
 * 浏览器本地时区与夏令时影响。
 */

/** 一天的毫秒数 */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** 一小时的毫秒数 */
export const MS_PER_HOUR = 60 * 60 * 1000;
/** 一分钟的毫秒数 */
export const MS_PER_MINUTE = 60 * 1000;

/** 偏移量单位 */
export type OffsetUnit = 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes';

/** 两日期的差量分解（单位与方向均与 end - start 一致） */
export interface DateBreakdown {
  /** 完整年数（带符号） */
  years: number;
  /** 扣除完整年后剩余的完整月数（0–11，带符号时为负） */
  months: number;
  /** 扣除完整年月后剩余的天数（带符号） */
  days: number;
}

/**
 * 把 Date 取为 UTC 当天零点的毫秒时间戳
 *
 * @param date - 任意 Date
 * @returns UTC 年月日对应的零点毫秒数
 */
export function utcMidnight(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * 构造 UTC Date
 *
 * @param year - 公历年
 * @param monthIndex - 月（0–11）
 * @param day - 日
 * @param hours - 时
 * @param minutes - 分
 * @returns 对应 UTC 时刻的 Date
 */
export function utcDate(
  year: number,
  monthIndex: number,
  day: number,
  hours = 0,
  minutes = 0,
): Date {
  return new Date(Date.UTC(year, monthIndex, day, hours, minutes));
}

/**
 * 返回指定公历年月的天数
 *
 * @param year - 公历年
 * @param monthIndex - 月（0–11）
 * @returns 该月天数（28–31）
 */
export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * 两个日期之间的完整年/月/日分解（end - start）。
 *
 * 以 UTC 日历分量按「完整月 + 借位」规则计算（与 Excel DATEDIF 的
 * 年/月/日口径一致）：日位不足时借一个自然月。结果带方向：end 早于
 * start 时各分量取正向结果的负值。注意月末钳制场景下分解结果不保证
 * 能经 addOffset 严格还原 end。
 *
 * @param start - 起始日期
 * @param end - 结束日期
 * @returns 年/月/日差量分解
 */
export function differenceBreakdown(start: Date, end: Date): DateBreakdown {
  if (end.getTime() < start.getTime()) {
    const forward = differenceBreakdown(end, start);
    // 显式 `|| 0` 归一化，避免 -0
    return {
      years: -forward.years || 0,
      months: -forward.months || 0,
      days: -forward.days || 0,
    };
  }

  let years = end.getUTCFullYear() - start.getUTCFullYear();
  let months = end.getUTCMonth() - start.getUTCMonth();
  let days = end.getUTCDate() - start.getUTCDate();

  if (days < 0) {
    // 借一个完整月：上一个月相对于 end 当月的天数
    const prevMonthYear = end.getUTCMonth() === 0 ? end.getUTCFullYear() - 1 : end.getUTCFullYear();
    const prevMonthIndex = end.getUTCMonth() === 0 ? 11 : end.getUTCMonth() - 1;
    days += daysInMonth(prevMonthYear, prevMonthIndex);
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years, months, days };
}

/**
 * 两个时刻之间的总天数（end - start），按 UTC 毫秒差四舍五入。
 *
 * @param start - 起始时刻
 * @param end - 结束时刻
 * @returns 总天数（可负、可为小数；同日为 0）
 */
export function countTotalDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

/**
 * 两个时刻之间的总小时数（end - start），按 UTC 毫秒差四舍五入。
 *
 * @param start - 起始时刻
 * @param end - 结束时刻
 * @returns 总小时数（可负）
 */
export function countTotalHours(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_HOUR);
}

/**
 * 两个时刻之间的总分钟数（end - start）。
 *
 * @param start - 起始时刻
 * @param end - 结束时刻
 * @returns 总分钟数（整数，可负）
 */
export function countTotalMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_MINUTE);
}

/**
 * 统计区间 [start, end) 内周一至周五的工作日数量（不含节假日表）。
 *
 * 以 UTC 零点对齐逐日计数；end 早于 start 时返回负数。
 *
 * @param start - 起始日期
 * @param end - 结束日期（不含）
 * @returns 工作日天数（带方向）
 */
export function countWeekdays(start: Date, end: Date): number {
  const sign = end.getTime() < start.getTime() ? -1 : 1;
  const from = sign === 1 ? utcMidnight(start) : utcMidnight(end);
  const to = sign === 1 ? utcMidnight(end) : utcMidnight(start);

  let count = 0;
  for (let cursor = from; cursor < to; cursor += MS_PER_DAY) {
    const weekday = new Date(cursor).getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      count += 1;
    }
  }
  return sign * count;
}

/**
 * 对基准时刻施加一个带单位的偏移量（支持负值）。
 *
 * 年、月按日历月推进，目标日超出当月天数时钳制到月末
 * （如 1 月 31 日 +1 月 → 2 月 28/29 日；2024-02-29 +1 年 → 2025-02-28）。
 * 周/日/时/分直接按毫秒加减（UTC 运算，不受夏令时影响）。
 *
 * @param base - 基准时刻
 * @param amount - 偏移量（正/负/零）
 * @param unit - 偏移单位
 * @returns 偏移后的新 Date（不修改入参）
 */
export function addOffset(base: Date, amount: number, unit: OffsetUnit): Date {
  if (unit === 'weeks' || unit === 'days' || unit === 'hours' || unit === 'minutes') {
    const factor =
      unit === 'weeks'
        ? 7 * MS_PER_DAY
        : unit === 'days'
          ? MS_PER_DAY
          : unit === 'hours'
            ? MS_PER_HOUR
            : MS_PER_MINUTE;
    return new Date(base.getTime() + amount * factor);
  }

  const year = base.getUTCFullYear();
  const monthIndex = base.getUTCMonth();
  const day = base.getUTCDate();
  const hours = base.getUTCHours();
  const minutes = base.getUTCMinutes();

  const totalMonths = year * 12 + monthIndex + (unit === 'years' ? amount * 12 : amount);
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));

  return new Date(Date.UTC(targetYear, targetMonth, targetDay, hours, minutes));
}

/**
 * 返回 UTC 星期几（1=周一 … 7=周日）。
 *
 * @param date - 任意 Date
 * @returns ISO 星期序号
 */
export function isoWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

/**
 * 把 Date 格式化为 `YYYY-MM-DD` 或 `YYYY-MM-DD HH:mm`（UTC）。
 *
 * @param date - 任意 Date
 * @param withTime - 是否附带时分
 * @returns 格式化后的字符串
 */
export function formatDate(date: Date, withTime = false): string {
  const yyyy = String(date.getUTCFullYear()).padStart(4, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  if (!withTime) {
    return `${yyyy}-${mm}-${dd}`;
  }
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

/**
 * 解析 `YYYY-MM-DD` 或 `YYYY-MM-DDTHH:mm`（datetime-local）输入为 UTC Date。
 *
 * @param value - input[type=date|datetime-local] 的值
 * @returns 对应 UTC Date；空串/非法返回 null
 */
export function parseDateInput(value: string): Date | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hours = match[4] === undefined ? 0 : Number(match[4]);
  const minutes = match[5] === undefined ? 0 : Number(match[5]);
  // 拒绝 2024-02-30 等溢出日期
  const date = new Date(Date.UTC(year, monthIndex, day, hours, minutes));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hours ||
    date.getUTCMinutes() !== minutes
  ) {
    return null;
  }
  return date;
}
