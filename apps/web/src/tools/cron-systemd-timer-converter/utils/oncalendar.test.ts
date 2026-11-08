import { describe, it, expect } from 'vitest';
import {
  parseOnCalendar,
  cronToOnCalendar,
  onCalendarToCron,
  compareNextRuns,
  getOnCalendarNextRuns,
} from './oncalendar';
import { parseCron, getCronNextRuns } from './cron';

// 固定锚点，保证未来触发时刻可复现
const ANCHOR = new Date(2026, 10, 9, 12, 0, 0); // 2026-11-09 12:00 本地时间

describe('parseCron basics', () => {
  it('expands stars, ranges, lists and steps', () => {
    const p = parseCron('*/5 9-17 1,15 */2 1-5');
    expect(p.minute.values[0]).toBe(0);
    expect(p.minute.values).toHaveLength(12);
    expect(p.hour.values[0]).toBe(9);
    expect(p.hour.values.at(-1)).toBe(17);
    expect(p.dayOfMonth.values).toEqual([1, 15]);
    expect(p.month.values).toHaveLength(6);
    expect(p.dayOfWeek.values).toEqual([1, 2, 3, 4, 5]);
  });

  it('normalizes weekday 7 to 0', () => {
    const p = parseCron('0 0 * * 7');
    expect(p.dayOfWeek.values).toEqual([0]);
  });

  it('rejects wrong arity and out-of-range values', () => {
    expect(() => parseCron('* * *')).toThrow(/5 个字段/);
    expect(() => parseCron('99 * * * *')).toThrow(/超出范围/);
    expect(() => parseCron('a * * * *')).toThrow(/无法识别/);
  });
});

describe('cron → OnCalendar', () => {
  it('converts */5 * * * * to *:0/5', () => {
    const r = cronToOnCalendar('*/5 * * * *');
    expect(r.expression).toBe('*-*-* *:0/5');
    expect(r.warnings).toEqual([]);
  });

  it('converts weekday 9am workdays', () => {
    const r = cronToOnCalendar('0 9 * * 1-5');
    expect(r.expression).toBe('Mon..Fri *-*-* 09:00:00');
  });

  it('converts monthly 1st 00:30', () => {
    const r = cronToOnCalendar('30 0 1 * *');
    expect(r.expression).toBe('*-01 00:30:00');
  });

  it('converts every 15 minutes past 8-18', () => {
    const r = cronToOnCalendar('*/15 8-18 * * *');
    expect(r.expression).toContain('8..18');
    expect(r.expression).toContain('0/15');
  });

  it('warns and offers alternatives when day and weekday are both restricted', () => {
    const r = cronToOnCalendar('0 0 13 * 5');
    expect(r.warnings.some((w) => w.includes('或（并集）'))).toBe(true);
    expect(r.alternatives).toHaveLength(2);
    expect(r.alternatives[0]).toContain('Fri');
    expect(r.alternatives[1]).toContain('*-13');
  });
});

describe('OnCalendar parsing', () => {
  it('parses full date-time with weekday range', () => {
    const p = parseOnCalendar('Mon..Fri *-*-* 09:00:00');
    expect(p.weekdays).toEqual([1, 2, 3, 4, 5]);
    expect(p.months).toEqual([]);
    expect(p.days).toEqual([]);
    expect(p.hours).toEqual([9]);
    expect(p.minutes).toEqual([0]);
    expect(p.seconds).toEqual([0]);
  });

  it('expands named shortcuts', () => {
    const daily = parseOnCalendar('daily');
    expect(daily.hours).toEqual([0]);
    expect(daily.minutes).toEqual([0]);
    const hourly = parseOnCalendar('hourly');
    expect(hourly.minutes).toEqual([0]);
    expect(hourly.warnings.some((w) => w.includes('hourly'))).toBe(true);
  });

  it('flags seconds and year downgrades', () => {
    const p = parseOnCalendar('2030-*-* 10:00:30');
    expect(p.years).toEqual([2030]);
    expect(p.seconds).toEqual([30]);
    expect(p.warnings.some((w) => w.includes('秒级'))).toBe(true);
    expect(p.warnings.some((w) => w.includes('年份'))).toBe(true);
  });

  it('accepts bare year token as Year-*-*', () => {
    const p = parseOnCalendar('2031 10:00');
    expect(p.years).toEqual([2031]);
    expect(p.months).toEqual([]);
    expect(p.days).toEqual([]);
  });

  it('throws on unrecognized fragments', () => {
    expect(() => parseOnCalendar('@@@')).toThrow();
    expect(() => parseOnCalendar('*-*-* 25:00:00')).toThrow(/超出范围/);
  });
});

describe('OnCalendar → cron', () => {
  it('maps daily shortcut to 0 0 * * *', () => {
    const r = onCalendarToCron('daily');
    expect(r.expression).toBe('0 0 * * *');
  });

  it('maps hourly shortcut to 0 * * * *', () => {
    const r = onCalendarToCron('hourly');
    expect(r.expression).toBe('0 * * * *');
  });

  it('maps weekday range and English month names', () => {
    const r = onCalendarToCron('Mon..Fri *-*-* 09:00:00');
    expect(r.expression).toBe('0 9 * * 1-5');
  });

  it('round-trips monthly timer', () => {
    const r = onCalendarToCron('*-*-01 00:30:00');
    expect(r.expression).toBe('30 0 1 * *');
  });

  it('downgrades seconds silently in output but keeps warning', () => {
    const r = onCalendarToCron('*-*-* 10:00:30');
    expect(r.expression).toBe('0 10 * * *');
    expect(r.warnings.some((w) => w.includes('降级'))).toBe(true);
  });
});

describe('next-run comparison', () => {
  it('cron and converted OnCalendar produce identical runs for */5', () => {
    const cron = '*/5 * * * *';
    const onCal = cronToOnCalendar(cron).expression;
    const cmp = compareNextRuns(cron, onCal, 10, ANCHOR);
    expect(cmp.equivalent).toBe(true);
    expect(cmp.cronRuns).toHaveLength(10);
    expect(cmp.cronRuns[0]?.getMinutes()).toBe(5);
  });

  it('weekday 9am conversions match over next 10 runs', () => {
    const cron = '0 9 * * 1-5';
    const onCal = cronToOnCalendar(cron).expression;
    const cmp = compareNextRuns(cron, onCal, 10, ANCHOR);
    expect(cmp.equivalent).toBe(true);
    for (const d of cmp.cronRuns) {
      expect([1, 2, 3, 4, 5]).toContain(d.getDay());
      expect(d.getHours()).toBe(9);
    }
  });

  it('monthly 1st 00:30 matches on both sides', () => {
    const cron = '30 0 1 * *';
    const onCal = cronToOnCalendar(cron).expression;
    const cmp = compareNextRuns(cron, onCal, 5, ANCHOR);
    expect(cmp.equivalent).toBe(true);
    expect(cmp.cronRuns[0]?.getDate()).toBe(1);
  });

  it('cron next runs strictly follow anchor and advance per minute', () => {
    const runs = getCronNextRuns(parseCron('* * * * *'), 3, ANCHOR);
    expect(runs[0]?.getTime()).toBe(ANCHOR.getTime() + 60_000);
    expect(runs).toHaveLength(3);
  });

  it('OnCalendar minutely shortcut yields minute-spaced runs', () => {
    const runs = getOnCalendarNextRuns('minutely', 3, ANCHOR);
    const first = runs[0]?.getTime() ?? 0;
    const second = runs[1]?.getTime() ?? 0;
    expect(second - first).toBe(60_000);
  });

  it('detects non-equivalent schedules', () => {
    const cmp = compareNextRuns('0 9 * * 1-5', '*-*-* 09:00:00', 10, ANCHOR);
    expect(cmp.equivalent).toBe(false);
  });
});
