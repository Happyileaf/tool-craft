import { describe, expect, it } from 'vitest';
import {
  addDays,
  calculatePregnancy,
  CHECKUP_MILESTONES,
  DEFAULT_CYCLE_DAYS,
  deriveLmp,
  diffDays,
  formatDate,
  getTrimester,
  isWeekInMilestone,
  LMP_GESTATION_DAYS,
  MAX_CYCLE_DAYS,
  MIN_CYCLE_DAYS,
  OVULATION_GESTATION_DAYS,
  parseDateInput,
  validateCycleDays,
} from './pregnancy';

const LMP_DATE = '2026-01-01';

describe('date helpers', () => {
  it('parses and formats calendar dates at UTC noon', () => {
    const date = parseDateInput('2026-01-01');
    expect(date.getUTCHours()).toBe(12);
    expect(formatDate(date)).toBe('2026-01-01');
  });

  it('rejects empty, malformed and impossible dates', () => {
    expect(() => parseDateInput('')).toThrow('请选择日期');
    expect(() => parseDateInput('2026/01/01')).toThrow('YYYY-MM-DD');
    expect(() => parseDateInput('2026-02-30')).toThrow('无效的日历日期');
  });

  it('adds and diffs whole days across month boundaries', () => {
    const start = parseDateInput('2026-01-31');
    expect(formatDate(addDays(start, 1))).toBe('2026-02-01');
    expect(diffDays(start, parseDateInput('2026-02-10'))).toBe(10);
    expect(diffDays(parseDateInput('2026-02-10'), start)).toBe(-10);
  });
});

describe('validateCycleDays', () => {
  it('accepts the inclusive 21-35 integer range', () => {
    expect(() => validateCycleDays(MIN_CYCLE_DAYS)).not.toThrow();
    expect(() => validateCycleDays(MAX_CYCLE_DAYS)).not.toThrow();
    expect(() => validateCycleDays(DEFAULT_CYCLE_DAYS)).not.toThrow();
  });

  it('rejects out-of-range and non-integer cycles', () => {
    expect(() => validateCycleDays(20)).toThrow(/21–35/);
    expect(() => validateCycleDays(36)).toThrow(/21–35/);
    expect(() => validateCycleDays(28.5)).toThrow(/21–35/);
  });
});

describe('deriveLmp', () => {
  it('keeps the LMP date in lmp mode', () => {
    const date = parseDateInput(LMP_DATE);
    expect(formatDate(deriveLmp('lmp', date))).toBe(LMP_DATE);
  });

  it('backdates ovulation by 14 days', () => {
    const ovulation = parseDateInput('2026-01-15');
    expect(formatDate(deriveLmp('ovulation', ovulation))).toBe('2026-01-01');
  });
});

describe('getTrimester', () => {
  it('switches at 13+6 and 27+6 boundaries', () => {
    expect(getTrimester(0)).toBe(1);
    expect(getTrimester(13)).toBe(1);
    expect(getTrimester(14)).toBe(2);
    expect(getTrimester(27)).toBe(2);
    expect(getTrimester(28)).toBe(3);
    expect(getTrimester(40)).toBe(3);
  });
});

describe('calculatePregnancy — Naegele baseline', () => {
  it('gives EDD 2026-10-08 for LMP 2026-01-01', () => {
    const result = calculatePregnancy({
      mode: 'lmp',
      baseDateInput: LMP_DATE,
      referenceDateInput: LMP_DATE,
    });
    expect(formatDate(result.dueDate)).toBe('2026-10-08');
    expect(formatDate(result.baselineDueDate)).toBe('2026-10-08');
    expect(result.cycleAdjustmentDays).toBe(0);
    expect(diffDays(result.lmp, result.dueDate)).toBe(LMP_GESTATION_DAYS);
  });

  it('shows 0+0 at LMP and 40+0 with zero countdown at EDD', () => {
    const atLmp = calculatePregnancy({
      mode: 'lmp',
      baseDateInput: LMP_DATE,
      referenceDateInput: LMP_DATE,
    });
    expect(atLmp.gestationalWeek).toBe(0);
    expect(atLmp.gestationalDay).toBe(0);
    expect(atLmp.dayOfPregnancy).toBe(0);
    expect(atLmp.progressPercent).toBe(0);

    const atEdd = calculatePregnancy({
      mode: 'lmp',
      baseDateInput: LMP_DATE,
      referenceDateInput: '2026-10-08',
    });
    expect(atEdd.gestationalWeek).toBe(40);
    expect(atEdd.gestationalDay).toBe(0);
    expect(atEdd.daysUntilDue).toBe(0);
    expect(atEdd.progressPercent).toBe(100);
  });

  it('splits elapsed days into weeks and remaining days', () => {
    const result = calculatePregnancy({
      mode: 'lmp',
      baseDateInput: LMP_DATE,
      referenceDateInput: '2026-01-10',
    });
    expect(result.gestationalWeek).toBe(1);
    expect(result.gestationalDay).toBe(2);
    expect(result.dayOfPregnancy).toBe(9);
  });

  it('counts down the days remaining until the due date', () => {
    const result = calculatePregnancy({
      mode: 'lmp',
      baseDateInput: LMP_DATE,
      referenceDateInput: '2026-10-01',
    });
    expect(result.daysUntilDue).toBe(7);
  });
});

describe('calculatePregnancy — cycle correction', () => {
  it('delays EDD by 7 days for a 35-day cycle and shows the comparison', () => {
    const result = calculatePregnancy({
      mode: 'lmp',
      baseDateInput: LMP_DATE,
      referenceDateInput: LMP_DATE,
      cycleDays: 35,
    });
    expect(result.cycleAdjustmentDays).toBe(7);
    expect(formatDate(result.baselineDueDate)).toBe('2026-10-08');
    expect(formatDate(result.dueDate)).toBe('2026-10-15');
  });

  it('brings EDD forward by 7 days for a 21-day cycle', () => {
    const result = calculatePregnancy({
      mode: 'lmp',
      baseDateInput: LMP_DATE,
      referenceDateInput: LMP_DATE,
      cycleDays: 21,
    });
    expect(result.cycleAdjustmentDays).toBe(-7);
    expect(formatDate(result.dueDate)).toBe('2026-10-01');
  });
});

describe('calculatePregnancy — ovulation mode', () => {
  it('produces the same LMP-based gestational age as an equivalent LMP input', () => {
    const lmpResult = calculatePregnancy({
      mode: 'lmp',
      baseDateInput: '2026-01-01',
      referenceDateInput: '2026-03-01',
    });
    const ovulationResult = calculatePregnancy({
      mode: 'ovulation',
      baseDateInput: '2026-01-15',
      referenceDateInput: '2026-03-01',
    });
    expect(formatDate(ovulationResult.lmp)).toBe('2026-01-01');
    expect(ovulationResult.gestationalWeek).toBe(lmpResult.gestationalWeek);
    expect(ovulationResult.gestationalDay).toBe(lmpResult.gestationalDay);
    expect(formatDate(ovulationResult.dueDate)).toBe(
      formatDate(lmpResult.dueDate),
    );
  });

  it('keeps EDD 266 days after the ovulation date', () => {
    const result = calculatePregnancy({
      mode: 'ovulation',
      baseDateInput: '2026-01-15',
      referenceDateInput: '2026-01-15',
    });
    expect(diffDays(parseDateInput('2026-01-15'), result.dueDate)).toBe(
      OVULATION_GESTATION_DAYS,
    );
  });
});

describe('milestones', () => {
  it('flags weeks inside a checkup window and outside it', () => {
    const nt = CHECKUP_MILESTONES.find((item) => item.name.includes('NT'));
    expect(nt).toBeDefined();
    expect(isWeekInMilestone(nt as (typeof CHECKUP_MILESTONES)[number], 12)).toBe(true);
    expect(isWeekInMilestone(nt as (typeof CHECKUP_MILESTONES)[number], 10)).toBe(false);
    expect(isWeekInMilestone(nt as (typeof CHECKUP_MILESTONES)[number], 14)).toBe(false);
  });

  it('covers the full 40-week pregnancy with ordered windows', () => {
    let previousStart = -1;
    for (const milestone of CHECKUP_MILESTONES) {
      expect(milestone.startWeek).toBeGreaterThanOrEqual(0);
      expect(milestone.endWeek).toBeLessThanOrEqual(40);
      expect(milestone.startWeek).toBeGreaterThanOrEqual(previousStart);
      previousStart = milestone.startWeek;
    }
  });
});
