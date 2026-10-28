import { describe, it, expect } from 'vitest';
import {
  toOrdinal,
  fromOrdinal,
  weekdayOfOrdinal,
  weeksInIsoYear,
  gregorianToWeek,
  weekToGregorian,
  convertGregorian,
  convertWeekDate,
  processLines,
} from './iso-week';

describe('ordinal helpers', () => {
  it('round-trips known dates through ordinal conversion', () => {
    expect(toOrdinal({ year: 1970, month: 1, day: 1 })).toBe(0);
    expect(fromOrdinal(0)).toEqual({ year: 1970, month: 1, day: 1 });
    // 1970 非闰年：12-31 为第 365 天 → 序数 364
    expect(toOrdinal({ year: 1970, month: 12, day: 31 })).toBe(364);
    expect(fromOrdinal(364)).toEqual({ year: 1970, month: 12, day: 31 });
    // 2020-02-29 合法，2021-02-29 非法
    expect(toOrdinal({ year: 2020, month: 2, day: 29 })).not.toBeNull();
    expect(toOrdinal({ year: 2021, month: 2, day: 29 })).toBeNull();
    // 1969-12-31 为序数 -1（公元前方向）
    expect(fromOrdinal(-1)).toEqual({ year: 1969, month: 12, day: 31 });
    expect(toOrdinal({ year: 1969, month: 12, day: 31 })).toBe(-1);
  });

  it('computes ISO weekdays with Monday = 1', () => {
    // 1970-01-01 周四
    expect(weekdayOfOrdinal(0)).toBe(4);
    // 2026-10-29 周四
    const ordinal = toOrdinal({ year: 2026, month: 10, day: 29 });
    expect(weekdayOfOrdinal(ordinal ?? 0)).toBe(4);
  });
});

describe('weeksInIsoYear', () => {
  it('marks long ISO years (53 weeks) correctly', () => {
    expect(weeksInIsoYear(2020)).toBe(53);
    expect(weeksInIsoYear(2026)).toBe(53);
  });

  it('marks common ISO years (52 weeks) correctly', () => {
    expect(weeksInIsoYear(2021)).toBe(52);
    expect(weeksInIsoYear(2022)).toBe(52);
    expect(weeksInIsoYear(2023)).toBe(52);
  });
});

describe('gregorianToWeek — contract vectors', () => {
  it('converts 2026-10-29 to 2026-W44-4', () => {
    expect(gregorianToWeek({ year: 2026, month: 10, day: 29 })).toEqual({
      isoYear: 2026,
      week: 44,
      weekday: 4,
    });
  });

  it('handles new-year cross-boundary dates', () => {
    // 2021-01-01 → 2020-W53-5
    expect(gregorianToWeek({ year: 2021, month: 1, day: 1 })).toEqual({
      isoYear: 2020,
      week: 53,
      weekday: 5,
    });
    // 2023-01-01 → 2022-W52-7
    expect(gregorianToWeek({ year: 2023, month: 1, day: 1 })).toEqual({
      isoYear: 2022,
      week: 52,
      weekday: 7,
    });
    // 2020-01-01 → 2020-W01-3
    expect(gregorianToWeek({ year: 2020, month: 1, day: 1 })).toEqual({
      isoYear: 2020,
      week: 1,
      weekday: 3,
    });
  });

  it('returns null for invalid dates', () => {
    expect(gregorianToWeek({ year: 2026, month: 2, day: 30 })).toBeNull();
    expect(gregorianToWeek({ year: 2026, month: 13, day: 1 })).toBeNull();
  });
});

describe('weekToGregorian — reverse contract vectors', () => {
  it('reverses every contract vector', () => {
    expect(weekToGregorian({ isoYear: 2026, week: 44, weekday: 4 })).toEqual({
      year: 2026,
      month: 10,
      day: 29,
    });
    expect(weekToGregorian({ isoYear: 2020, week: 53, weekday: 5 })).toEqual({
      year: 2021,
      month: 1,
      day: 1,
    });
    expect(weekToGregorian({ isoYear: 2022, week: 52, weekday: 7 })).toEqual({
      year: 2023,
      month: 1,
      day: 1,
    });
    expect(weekToGregorian({ isoYear: 2020, week: 1, weekday: 3 })).toEqual({
      year: 2020,
      month: 1,
      day: 1,
    });
  });

  it('round-trips every day of several years', () => {
    for (const year of [2018, 2020, 2021, 2023, 2026]) {
      for (let month = 1; month <= 12; month += 1) {
        for (let day = 1; day <= 28; day += 1) {
          const weekDate = gregorianToWeek({ year, month, day });
          expect(weekDate).not.toBeNull();
          expect(weekToGregorian(weekDate ?? { isoYear: 0, week: 0, weekday: 0 })).toEqual({
            year,
            month,
            day,
          });
        }
      }
    }
  });

  it('rejects week 54, week 0 and weekday 8', () => {
    expect(weekToGregorian({ isoYear: 2026, week: 54, weekday: 1 })).toBeNull();
    expect(weekToGregorian({ isoYear: 2026, week: 0, weekday: 1 })).toBeNull();
    expect(weekToGregorian({ isoYear: 2026, week: 1, weekday: 8 })).toBeNull();
    expect(weekToGregorian({ isoYear: 2026, week: 1, weekday: 0 })).toBeNull();
    // 52 周的年不存在 W53
    expect(weekToGregorian({ isoYear: 2021, week: 53, weekday: 1 })).toBeNull();
  });
});

describe('convertGregorian / convertWeekDate', () => {
  it('formats the canonical ISO string and week count', () => {
    const result = convertGregorian('2026-10-29');
    expect(result.error).toBeNull();
    expect(result.isoString).toBe('2026-W44-4');
    expect(result.weeksInYear).toBe(53);
    expect(result.boundaryNote).toBeNull();
  });

  it('flags cross-year boundary dates', () => {
    const early = convertGregorian('2021-01-01');
    expect(early.isoString).toBe('2020-W53-5');
    expect(early.boundaryNote).toMatch(/上一 ISO 年/);
    // 2018-12-31 → 2019-W01-1（归属下一 ISO 年）
    const late = convertGregorian('2018-12-31');
    expect(late.isoString).toBe('2019-W01-1');
    expect(late.boundaryNote).toMatch(/下一 ISO 年/);
  });

  it('rejects malformed and impossible dates without throwing', () => {
    expect(convertGregorian('2026/10/29').error).toMatch(/YYYY-MM-DD/);
    expect(convertGregorian('2026-02-30').error).toMatch(/非法公历日期/);
    expect(convertWeekDate('2026-W44-8').error).toMatch(/YYYY-Www-D/);
    expect(convertWeekDate('2026-W54-1').error).toMatch(/只有 53 周/);
    expect(convertWeekDate('2021-W53-1').error).toMatch(/只有 52 周/);
  });

  it('converts ISO week input back to gregorian text', () => {
    const result = convertWeekDate('2020-W53-5');
    expect(result.error).toBeNull();
    expect(result.gregorian).toEqual({ year: 2021, month: 1, day: 1 });
    expect(result.boundaryNote).toMatch(/下一公历年/);
  });
});

describe('processLines', () => {
  it('processes mixed valid lines and reports invalid ones by line number', () => {
    const { output, warnings } = processLines('2026-10-29\n2020-W53-5\nbad-date');
    expect(output).toContain('2026-W44-4');
    expect(output).toContain('2021-01-01');
    expect(output).toContain('错误');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/第 3 行/);
  });
});
