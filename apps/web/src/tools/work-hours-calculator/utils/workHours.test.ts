import { describe, expect, it } from 'vitest';
import {
  calculateAll,
  calculateSegment,
  estimatePay,
  formatDuration,
  parseTimeToMinutes,
  summarize,
  toHours,
  validateSegment,
  type WorkSegment,
} from './workHours';

const segment = (overrides: Partial<WorkSegment> = {}): WorkSegment => ({
  start: '09:00',
  end: '18:00',
  breakMinutes: 60,
  ...overrides,
});

describe('parseTimeToMinutes', () => {
  it('parses valid HH:mm', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0);
    expect(parseTimeToMinutes('09:30')).toBe(570);
    expect(parseTimeToMinutes('23:59')).toBe(1439);
    expect(parseTimeToMinutes('9:05')).toBe(545);
  });

  it('returns null for invalid input', () => {
    expect(parseTimeToMinutes('24:00')).toBeNull();
    expect(parseTimeToMinutes('12:60')).toBeNull();
    expect(parseTimeToMinutes('abc')).toBeNull();
    expect(parseTimeToMinutes('')).toBeNull();
  });
});

describe('validateSegment', () => {
  it('accepts a complete segment', () => {
    expect(validateSegment(segment())).toBeNull();
  });

  it('rejects missing or malformed times', () => {
    expect(validateSegment(segment({ start: '' }))).toMatch(/填写/);
    expect(validateSegment(segment({ end: '25:00' }))).toMatch(/下班/);
    expect(validateSegment(segment({ start: 'xx' }))).toMatch(/上班/);
  });

  it('rejects negative break', () => {
    expect(validateSegment(segment({ breakMinutes: -5 }))).toMatch(/休息/);
  });
});

describe('calculateSegment', () => {
  it('computes net minutes after break for a normal day', () => {
    // 09:00 -> 18:00 = 540 分钟在岗，扣 60 休息 = 480
    const result = calculateSegment(segment(), 0);
    expect(result.grossMinutes).toBe(540);
    expect(result.netMinutes).toBe(480);
    expect(result.crossedMidnight).toBe(false);
    expect(result.error).toBeNull();
  });

  it('handles cross-midnight shifts by adding one day', () => {
    // 22:00 -> 06:00 次日 = 8 小时 = 480 分钟，扣 30 = 450
    const result = calculateSegment(segment({ start: '22:00', end: '06:00', breakMinutes: 30 }), 1);
    expect(result.crossedMidnight).toBe(true);
    expect(result.grossMinutes).toBe(480);
    expect(result.netMinutes).toBe(450);
  });

  it('treats equal start and end as a full 24h shift (crossed midnight)', () => {
    const result = calculateSegment(segment({ start: '08:00', end: '08:00', breakMinutes: 0 }), 0);
    expect(result.crossedMidnight).toBe(true);
    expect(result.grossMinutes).toBe(1440);
  });

  it('clamps net minutes to zero when break exceeds gross', () => {
    const result = calculateSegment(segment({ start: '09:00', end: '10:00', breakMinutes: 120 }), 0);
    expect(result.grossMinutes).toBe(60);
    expect(result.netMinutes).toBe(0);
  });

  it('returns zeroed result with error for invalid segment', () => {
    const result = calculateSegment(segment({ start: '' }), 2);
    expect(result.error).not.toBeNull();
    expect(result.netMinutes).toBe(0);
  });
});

describe('summarize', () => {
  it('totals net minutes, breaks, count and daily average', () => {
    const results = calculateAll([
      segment({ start: '09:00', end: '18:00', breakMinutes: 60 }), // 480
      segment({ start: '10:00', end: '12:00', breakMinutes: 0 }), // 120
    ]);
    const summary = summarize(results);
    expect(summary.totalNetMinutes).toBe(600);
    expect(summary.totalBreakMinutes).toBe(60);
    expect(summary.validCount).toBe(2);
    expect(summary.averageMinutes).toBe(300);
  });

  it('ignores invalid segments in totals but still counts their break safely', () => {
    const results = calculateAll([
      segment({ start: '09:00', end: '18:00', breakMinutes: 60 }), // 480
      segment({ start: '', breakMinutes: 30 }),
    ]);
    const summary = summarize(results);
    expect(summary.validCount).toBe(1);
    expect(summary.totalNetMinutes).toBe(480);
    expect(summary.averageMinutes).toBe(480);
  });

  it('returns zeros for empty input', () => {
    const summary = summarize([]);
    expect(summary).toEqual({
      totalNetMinutes: 0,
      totalBreakMinutes: 0,
      validCount: 0,
      averageMinutes: 0,
    });
  });
});

describe('estimatePay', () => {
  it('converts net minutes to pay using hourly rate', () => {
    // 480 分钟 = 8 小时，费率 50 => 400
    expect(estimatePay(480, 50)).toBe(400);
    // 90 分钟 = 1.5 小时，费率 33.5 => 50.25
    expect(estimatePay(90, 33.5)).toBe(50.25);
  });

  it('returns zero for invalid rate', () => {
    expect(estimatePay(480, 0)).toBe(0);
    expect(estimatePay(480, Number.NaN)).toBe(0);
  });
});

describe('formatDuration / toHours', () => {
  it('formats minutes as H小时MM分', () => {
    expect(formatDuration(0)).toBe('0小时00分');
    expect(formatDuration(480)).toBe('8小时00分');
    expect(formatDuration(570)).toBe('9小时30分');
  });

  it('converts to decimal hours rounded to 2 places', () => {
    expect(toHours(90)).toBe(1.5);
    expect(toHours(480)).toBe(8);
    expect(toHours(65)).toBe(1.08);
  });
});
