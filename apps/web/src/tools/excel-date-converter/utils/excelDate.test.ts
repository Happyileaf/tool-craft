import { describe, expect, it } from 'vitest';
import {
  civilFromDays,
  dateToSerial,
  daysFromCivil,
  fractionToTime,
  isLeapYear,
  isValidCivilDate,
  serialToDate,
  timeToFraction,
} from './excelDate';

describe('daysFromCivil / civilFromDays', () => {
  it('与 Unix epoch 日序一致（1970-01-01 = 0）', () => {
    expect(daysFromCivil({ year: 1970, month: 1, day: 1 })).toBe(0);
  });

  it('正反转换互逆', () => {
    const samples = [
      { year: 2000, month: 2, day: 29 },
      { year: 2100, month: 3, day: 1 }, // 2100 不是闰年
      { year: 1900, month: 1, day: 1 },
      { year: 1904, month: 1, day: 1 },
      { year: 9999, month: 12, day: 31 },
    ];
    for (const d of samples) {
      expect(civilFromDays(daysFromCivil(d))).toEqual(d);
    }
  });
});

describe('isLeapYear / isValidCivilDate', () => {
  it('闰年规则（整百年须被 400 整除）', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2100)).toBe(false);
  });

  it('拒绝 1900-02-29（phantom 不是真实日期）', () => {
    expect(isValidCivilDate({ year: 1900, month: 2, day: 29 })).toBe(false);
    expect(isValidCivilDate({ year: 2024, month: 2, day: 29 })).toBe(true);
    expect(isValidCivilDate({ year: 2024, month: 2, day: 30 })).toBe(false);
    expect(isValidCivilDate({ year: 2024, month: 13, day: 1 })).toBe(false);
  });
});

describe('serialToDate — 1900 系统', () => {
  it('序列号 1 = 1900-01-01', () => {
    const r = serialToDate(1, '1900');
    expect(r.date).toEqual({ year: 1900, month: 1, day: 1 });
    expect(r.isPhantom).toBe(false);
  });

  it('序列号 59 = 1900-02-28', () => {
    expect(serialToDate(59, '1900').date).toEqual({
      year: 1900,
      month: 2,
      day: 28,
    });
  });

  it('序列号 60 = phantom 1900-02-29 并打标', () => {
    const r = serialToDate(60, '1900');
    expect(r.date).toEqual({ year: 1900, month: 2, day: 29 });
    expect(r.isPhantom).toBe(true);
  });

  it('序列号 61 = 1900-03-01（跨过 phantom）', () => {
    expect(serialToDate(61, '1900').date).toEqual({
      year: 1900,
      month: 3,
      day: 1,
    });
  });

  it('业界知名样例：44927 = 2023-01-01，45292 = 2024-01-01', () => {
    expect(serialToDate(44927, '1900').date).toEqual({
      year: 2023,
      month: 1,
      day: 1,
    });
    expect(serialToDate(45292, '1900').date).toEqual({
      year: 2024,
      month: 1,
      day: 1,
    });
  });

  it('小数部分换算为时刻：44927.5 = 2023-01-01 12:00:00', () => {
    const r = serialToDate(44927.5, '1900');
    expect(r.date).toEqual({ year: 2023, month: 1, day: 1 });
    expect(r.time).toMatchObject({ hour: 12, minute: 0, second: 0, millisecond: 0 });
  });

  it('时刻换算：0.25 → 06:00，0.75 → 18:00', () => {
    expect(serialToDate(44927.25, '1900').time).toMatchObject({ hour: 6 });
    expect(serialToDate(44927.75, '1900').time).toMatchObject({ hour: 18 });
  });

  it('拒绝小于 1 的序列号', () => {
    expect(() => serialToDate(0, '1900')).toThrow();
    expect(() => serialToDate(-5, '1900')).toThrow();
  });
});

describe('serialToDate — 1904 系统', () => {
  it('序列号 0 = 1904-01-01', () => {
    const r = serialToDate(0, '1904');
    expect(r.date).toEqual({ year: 1904, month: 1, day: 1 });
    expect(r.isPhantom).toBe(false);
  });

  it('43465 = 2023-01-01（比 1900 系统小 1462）', () => {
    expect(serialToDate(43465, '1904').date).toEqual({
      year: 2023,
      month: 1,
      day: 1,
    });
  });

  it('两系统对同一日期恰好相差 1462', () => {
    expect(44927 - 43465).toBe(1462);
  });

  it('允许负序列号：-1 = 1903-12-31', () => {
    expect(serialToDate(-1, '1904').date).toEqual({
      year: 1903,
      month: 12,
      day: 31,
    });
  });

  it('负序列号的小数部分仍换算为当天时刻', () => {
    const r = serialToDate(-0.5, '1904');
    expect(r.date).toEqual({ year: 1903, month: 12, day: 31 });
    expect(r.time.hour).toBe(12);
  });
});

describe('dateToSerial', () => {
  it('2023-01-01 在两系统分别为 44927 / 43465', () => {
    expect(dateToSerial({ year: 2023, month: 1, day: 1 }, undefined, '1900')).toBe(
      44927,
    );
    expect(dateToSerial({ year: 2023, month: 1, day: 1 }, undefined, '1904')).toBe(
      43465,
    );
  });

  it('1900 年初连续段：1900-01-01 = 1，1900-02-28 = 59，1900-03-01 = 61', () => {
    expect(dateToSerial({ year: 1900, month: 1, day: 1 }, undefined, '1900')).toBe(1);
    expect(dateToSerial({ year: 1900, month: 2, day: 28 }, undefined, '1900')).toBe(
      59,
    );
    expect(dateToSerial({ year: 1900, month: 3, day: 1 }, undefined, '1900')).toBe(
      61,
    );
  });

  it('带时刻：2023-01-01 12:00 = 44927.5；06:00 = 44927.25', () => {
    expect(
      dateToSerial(
        { year: 2023, month: 1, day: 1 },
        { hour: 12, minute: 0, second: 0 },
        '1900',
      ),
    ).toBeCloseTo(44927.5, 8);
    expect(
      dateToSerial(
        { year: 2023, month: 1, day: 1 },
        { hour: 6, minute: 0, second: 0 },
        '1900',
      ),
    ).toBeCloseTo(44927.25, 8);
  });

  it('毫秒时刻：00:00:00.500 → 0.5/86400 的小数', () => {
    const s = dateToSerial(
      { year: 2023, month: 1, day: 1 },
      { hour: 0, minute: 0, second: 0, millisecond: 500 },
      '1900',
    );
    expect(s).toBeCloseTo(44927 + 500 / 86_400_000, 8);
  });

  it('拒绝 1900-02-29 与 1900-01-01 之前的日期（1900 系统）', () => {
    expect(() =>
      dateToSerial({ year: 1900, month: 2, day: 29 }, undefined, '1900'),
    ).toThrow();
    expect(() =>
      dateToSerial({ year: 1899, month: 12, day: 31 }, undefined, '1900'),
    ).toThrow();
  });

  it('1904 系统支持 1904 年之前的日期', () => {
    expect(dateToSerial({ year: 1903, month: 12, day: 31 }, undefined, '1904')).toBe(
      -1,
    );
  });

  it('拒绝非法时间分量', () => {
    expect(() =>
      dateToSerial(
        { year: 2023, month: 1, day: 1 },
        { hour: 24, minute: 0, second: 0 },
        '1900',
      ),
    ).toThrow();
    expect(() =>
      dateToSerial(
        { year: 2023, month: 1, day: 1 },
        { hour: 0, minute: 60, second: 0 },
        '1900',
      ),
    ).toThrow();
  });
});

describe('双向往返', () => {
  it('典型日期与时刻往返一致（1900 系统）', () => {
    const cases: Array<[number, number, number, number, number, number]> = [
      [2024, 6, 15, 12, 30, 45],
      [2000, 2, 29, 23, 59, 59],
      [1900, 3, 1, 0, 0, 1],
      [2026, 11, 2, 8, 5, 19],
    ];
    for (const [y, mo, d, h, mi, s] of cases) {
      const serial = dateToSerial(
        { year: y, month: mo, day: d },
        { hour: h, minute: mi, second: s, millisecond: 0 },
        '1900',
      );
      const back = serialToDate(serial, '1900');
      expect(back.date).toEqual({ year: y, month: mo, day: d });
      expect(back.time).toMatchObject({ hour: h, minute: mi, second: s });
    }
  });

  it('1904 系统含负值的往返一致', () => {
    const serial = dateToSerial(
      { year: 1903, month: 6, day: 15 },
      { hour: 18, minute: 0, second: 0 },
      '1904',
    );
    const back = serialToDate(serial, '1904');
    expect(back.date).toEqual({ year: 1903, month: 6, day: 15 });
    expect(back.time.hour).toBe(18);
  });
});

describe('timeToFraction / fractionToTime', () => {
  it('午夜为 0、正午为 0.5、23:59:59.999 接近 1', () => {
    expect(timeToFraction({ hour: 0, minute: 0, second: 0, millisecond: 0 })).toBe(0);
    expect(timeToFraction({ hour: 12, minute: 0, second: 0, millisecond: 0 })).toBe(
      0.5,
    );
    const last = timeToFraction({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });
    expect(last).toBeCloseTo(1 - 1 / 86_400_000, 10);
  });

  it('fractionToTime 逆转换', () => {
    expect(fractionToTime(0)).toMatchObject({ hour: 0, minute: 0, second: 0 });
    expect(fractionToTime(0.5)).toMatchObject({ hour: 12, minute: 0, second: 0 });
  });
});
