import { describe, it, expect } from 'vitest';
import {
  calendarToJulian,
  julianToCalendar,
  convertCalendar,
  convertJulian,
  validateParts,
  formatParts,
  type CalendarParts,
} from './julian';

const parts = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): CalendarParts => ({ year, month, day, hour, minute, second });

describe('calendarToJulian known vectors', () => {
  it('maps J2000.0 to JD 2451545.0 / MJD 51544.5', () => {
    // J2000.0 定义为 2000-01-01T12:00Z；MJD 日界在 UTC 0 时，故 MJD=51544.5
    expect(calendarToJulian(parts(2000, 1, 1, 12, 0, 0))).toBe(2451545.0);
    const result = convertCalendar(parts(2000, 1, 1, 12, 0, 0));
    expect(result.jd).toBe(2451545.0);
    expect(result.mjd).toBe(51544.5);
    expect(result.unix).toBe(946728000);
  });

  it('maps the Unix epoch to JD 2440587.5 / MJD 40587.0', () => {
    expect(calendarToJulian(parts(1970, 1, 1, 0, 0, 0))).toBe(2440587.5);
    const result = convertCalendar(parts(1970, 1, 1, 0, 0, 0));
    expect(result.mjd).toBe(40587.0);
    expect(result.unix).toBe(0);
  });

  it('maps the Gregorian reform date 1582-10-15 to JD 2299160.5', () => {
    expect(calendarToJulian(parts(1582, 10, 15, 0, 0, 0))).toBe(2299160.5);
  });

  it('handles the non-leap century year 2100 correctly', () => {
    // 2100-03-01 00:00 UTC
    expect(calendarToJulian(parts(2100, 3, 1, 0, 0, 0))).toBe(
      2440587.5 + Date.UTC(2100, 2, 1) / 1000 / 86400,
    );
    // 2100-02-28 的次日是 3-1（2100 非闰年）
    expect(calendarToJulian(parts(2100, 3, 1, 0, 0, 0))).toBe(
      calendarToJulian(parts(2100, 2, 28, 0, 0, 0)) + 1,
    );
  });

  it('matches Date.UTC for random modern dates with fractional seconds', () => {
    const cases: CalendarParts[] = [
      parts(2026, 10, 31, 6, 6, 1),
      parts(1999, 12, 31, 23, 59, 59),
      parts(2024, 2, 29, 12, 0, 0),
    ];
    for (const p of cases) {
      const expected =
        2440587.5 +
        Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) / 1000 / 86400;
      expect(calendarToJulian(p)).toBeCloseTo(expected, 8);
    }
  });
});

describe('julianToCalendar inverse', () => {
  it('inverts J2000.0 and Unix epoch', () => {
    expect(julianToCalendar(2451545.0)).toEqual(parts(2000, 1, 1, 12, 0, 0));
    expect(julianToCalendar(2440587.5)).toEqual(parts(1970, 1, 1, 0, 0, 0));
    expect(julianToCalendar(2299160.5)).toEqual(parts(1582, 10, 15, 0, 0, 0));
  });

  it('round-trips dates across the full supported range', () => {
    const samples = [
      parts(1582, 10, 15, 0, 0, 0),
      parts(1700, 6, 15, 3, 45, 30),
      parts(1900, 2, 28, 23, 59, 59),
      parts(2026, 10, 31, 6, 6, 1),
      parts(2099, 12, 31, 23, 59, 59),
      parts(2100, 11, 26, 4, 0, 42),
    ];
    for (const p of samples) {
      expect(julianToCalendar(calendarToJulian(p))).toEqual(p);
    }
  });

  it('does not produce 59.999... float artifacts at exact minutes', () => {
    const r = julianToCalendar(calendarToJulian(parts(2022, 8, 30, 7, 33, 0)));
    expect(r.second).toBe(0);
    expect(r.minute).toBe(33);
  });
});

describe('convertJulian input handling', () => {
  it('returns parts plus MJD/Unix for valid input', () => {
    const r = convertJulian('2451545.0');
    expect(r.error).toBeNull();
    expect(r.parts).toEqual(parts(2000, 1, 1, 12, 0, 0));
    expect(r.mjd).toBe(51544.5);
    expect(r.unix).toBe(946728000);
  });

  it('rejects empty, non-numeric, and out-of-range input', () => {
    expect(convertJulian('   ').error).toMatch(/请输入/);
    expect(convertJulian('abc').error).toMatch(/有效数字/);
    expect(convertJulian('2299160').error).toMatch(/格里高利历/);
    expect(convertJulian('9999999').error).toMatch(/格里高利历/);
  });
});

describe('validateParts', () => {
  it('rejects impossible calendar values and supports leap day', () => {
    expect(validateParts(parts(2026, 2, 29))).toMatch(/日期/);
    expect(validateParts(parts(2024, 2, 29))).toBeNull();
    expect(validateParts(parts(2100, 2, 29))).toMatch(/日期/);
    expect(validateParts(parts(2026, 13, 1))).toMatch(/月份/);
    expect(validateParts(parts(2026, 1, 1, 24, 0, 0))).toMatch(/小时/);
    expect(validateParts(parts(1500, 1, 1))).toMatch(/年份/);
  });
});

describe('formatParts', () => {
  it('zero-pads fields and renders UTC suffix', () => {
    expect(formatParts(parts(2000, 1, 1, 12, 0, 0))).toBe('2000-01-01 12:00:00 UTC');
    expect(formatParts(parts(1970, 1, 1, 0, 0, 30.5))).toBe('1970-01-01 00:00:30.500 UTC');
  });
});
