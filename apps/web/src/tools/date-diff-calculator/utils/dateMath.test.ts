import { describe, expect, it } from 'vitest';
import {
  addOffset,
  countTotalDays,
  countTotalHours,
  countTotalMinutes,
  countWeekdays,
  daysInMonth,
  differenceBreakdown,
  formatDate,
  isoWeekday,
  parseDateInput,
  utcDate,
} from './dateMath';

describe('daysInMonth', () => {
  it('正确处理平年与闰年二月', () => {
    expect(daysInMonth(2023, 1)).toBe(28);
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(daysInMonth(2000, 1)).toBe(29);
    expect(daysInMonth(1900, 1)).toBe(28);
  });

  it('返回大小月天数', () => {
    expect(daysInMonth(2024, 0)).toBe(31);
    expect(daysInMonth(2024, 3)).toBe(30);
    expect(daysInMonth(2024, 11)).toBe(31);
  });
});

describe('addOffset 年月偏移与月末钳制', () => {
  it('闰年 2 月 29 日加 1 年钳制到 2025-02-28', () => {
    expect(formatDate(addOffset(utcDate(2024, 1, 29), 1, 'years'))).toBe('2025-02-28');
  });

  it('2024-01-31 加 1 月 → 2024-02-29', () => {
    expect(formatDate(addOffset(utcDate(2024, 0, 31), 1, 'months'))).toBe('2024-02-29');
  });

  it('2023-01-31 加 1 月 → 2023-02-28', () => {
    expect(formatDate(addOffset(utcDate(2023, 0, 31), 1, 'months'))).toBe('2023-02-28');
  });

  it('月末减月同样钳制', () => {
    expect(formatDate(addOffset(utcDate(2024, 2, 31), -1, 'months'))).toBe('2024-02-29');
    expect(formatDate(addOffset(utcDate(2023, 2, 31), -1, 'months'))).toBe('2023-02-28');
  });

  it('非钳制日期加年月保持当日', () => {
    expect(formatDate(addOffset(utcDate(2024, 0, 15), 1, 'years'))).toBe('2025-01-15');
    expect(formatDate(addOffset(utcDate(2024, 0, 15), 2, 'months'))).toBe('2024-03-15');
    expect(formatDate(addOffset(utcDate(2024, 11, 31), 1, 'months'))).toBe('2025-01-31');
  });

  it('周/日/时/分按毫秒加减', () => {
    expect(formatDate(addOffset(utcDate(2024, 0, 1), 1, 'weeks'))).toBe('2024-01-08');
    expect(formatDate(addOffset(utcDate(2024, 0, 1), -1, 'days'))).toBe('2023-12-31');
    expect(formatDate(addOffset(utcDate(2024, 0, 1, 23, 0), 2, 'hours'), true)).toBe(
      '2024-01-02 01:00',
    );
    expect(formatDate(addOffset(utcDate(2024, 0, 1, 0, 30), -45, 'minutes'), true)).toBe(
      '2023-12-31 23:45',
    );
  });

  it('零偏移返回等价的新 Date', () => {
    const base = utcDate(2024, 5, 15, 10, 30);
    const result = addOffset(base, 0, 'months');
    expect(result.getTime()).toBe(base.getTime());
    expect(result).not.toBe(base);
  });
});

describe('differenceBreakdown', () => {
  it('2024-01-01 → 2024-03-01 分解为 0 年 2 月 0 日', () => {
    expect(differenceBreakdown(utcDate(2024, 0, 1), utcDate(2024, 2, 1))).toEqual({
      years: 0,
      months: 2,
      days: 0,
    });
  });

  it('完整跨年分解（借位 3 月 31 天）', () => {
    expect(differenceBreakdown(utcDate(2020, 0, 10), utcDate(2024, 3, 5))).toEqual({
      years: 4,
      months: 2,
      days: 26,
    });
  });

  it('月末日期跨 2 月借位正确', () => {
    // 2024-01-31 → 2024-03-31：2 月；→ 2024-03-30 为 1 月 30 日（借 29 天）
    expect(differenceBreakdown(utcDate(2024, 0, 31), utcDate(2024, 2, 31))).toEqual({
      years: 0,
      months: 2,
      days: 0,
    });
    // 1/31 → 3/30：日位 30-31 借位，按 2 月 29 天计为 1 月 28 日
    expect(differenceBreakdown(utcDate(2024, 0, 31), utcDate(2024, 2, 30))).toEqual({
      years: 0,
      months: 1,
      days: 28,
    });
  });

  it('同日差为 0', () => {
    const d = utcDate(2024, 5, 15);
    expect(differenceBreakdown(d, new Date(d.getTime()))).toEqual({
      years: 0,
      months: 0,
      days: 0,
    });
  });

  it('反向差量各分量取负', () => {
    expect(differenceBreakdown(utcDate(2024, 2, 1), utcDate(2024, 0, 1))).toEqual({
      years: 0,
      months: -2,
      days: 0,
    });
    expect(differenceBreakdown(utcDate(2024, 3, 5), utcDate(2020, 0, 10))).toEqual({
      years: -4,
      months: -2,
      days: -26,
    });
  });
});

describe('countTotal*', () => {
  it('2024-03-01 − 2024-01-01 = 60 天（含闰年 2 月 29 天）', () => {
    expect(countTotalDays(utcDate(2024, 0, 1), utcDate(2024, 2, 1))).toBe(60);
  });

  it('平年同期为 59 天', () => {
    expect(countTotalDays(utcDate(2023, 0, 1), utcDate(2023, 2, 1))).toBe(59);
  });

  it('总小时与总分钟（含分钟余量时四舍五入）', () => {
    const start = utcDate(2024, 0, 1, 8, 0);
    const end = utcDate(2024, 0, 2, 10, 30);
    expect(countTotalDays(start, end)).toBe(1);
    expect(countTotalHours(start, end)).toBe(27);
    expect(countTotalMinutes(start, end)).toBe(26 * 60 + 30);
  });

  it('反向为负数', () => {
    expect(countTotalDays(utcDate(2024, 2, 1), utcDate(2024, 0, 1))).toBe(-60);
    expect(countTotalHours(utcDate(2024, 0, 2), utcDate(2024, 0, 1))).toBe(-24);
  });
});

describe('countWeekdays', () => {
  it('整周 7 天有 5 个工作日', () => {
    // 2024-01-01 周一 → 2024-01-08 周一
    expect(countWeekdays(utcDate(2024, 0, 1), utcDate(2024, 0, 8))).toBe(5);
  });

  it('2024-01-01（周一）→ 2024-02-01（周四）共 23 个工作日', () => {
    expect(countWeekdays(utcDate(2024, 0, 1), utcDate(2024, 1, 1))).toBe(23);
  });

  it('只跨周末为 0', () => {
    // 2024-01-06 周六 → 2024-01-08 周一
    expect(countWeekdays(utcDate(2024, 0, 6), utcDate(2024, 0, 8))).toBe(0);
  });

  it('区间半开：周一到周六含周一至周五', () => {
    expect(countWeekdays(utcDate(2024, 0, 1), utcDate(2024, 0, 6))).toBe(5);
  });

  it('反向为负数', () => {
    expect(countWeekdays(utcDate(2024, 0, 8), utcDate(2024, 0, 1))).toBe(-5);
  });
});

describe('isoWeekday', () => {
  it('周一为 1、周日为 7', () => {
    expect(isoWeekday(utcDate(2024, 0, 1))).toBe(1);
    expect(isoWeekday(utcDate(2024, 0, 7))).toBe(7);
    expect(isoWeekday(utcDate(2024, 0, 5))).toBe(5);
  });
});

describe('parseDateInput 与 formatDate', () => {
  it('解析日期与日期时间（按 UTC）', () => {
    const d = parseDateInput('2024-02-29');
    expect(d).not.toBeNull();
    expect(formatDate(d as Date)).toBe('2024-02-29');

    const dt = parseDateInput('2024-03-01T13:45');
    expect(dt).not.toBeNull();
    expect(formatDate(dt as Date, true)).toBe('2024-03-01 13:45');
  });

  it('拒绝空串与溢出日期', () => {
    expect(parseDateInput('')).toBeNull();
    expect(parseDateInput('2024-02-30')).toBeNull();
    expect(parseDateInput('2023-02-29')).toBeNull();
    expect(parseDateInput('not-a-date')).toBeNull();
  });
});
