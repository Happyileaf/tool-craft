import { describe, expect, it } from 'vitest';
import {
  FULL_MOON_AGE,
  NEW_MOON_REF_JD,
  SYNODIC_MONTH,
  classifyPhase,
  dateToJulianDay,
  formatUTCDate,
  getMoonPhase,
  getMoonPhaseFromDate,
  getNearestPhases,
  julianDayToDate,
  moonAge,
  moonClipPath,
  toJulianDay,
} from './moonPhase';

describe('Julian Day conversion', () => {
  it('converts the known epoch 2000-01-01 (noon) to JD 2451545', () => {
    expect(toJulianDay(2000, 1, 1)).toBe(2451545);
  });

  it('converts 1969-07-20 to JD 2440423', () => {
    expect(toJulianDay(1969, 7, 20)).toBe(2440423);
  });

  it('round-trips a Date through JD', () => {
    const date = new Date(Date.UTC(2026, 10, 9));
    const jd = dateToJulianDay(date);
    expect(formatUTCDate(julianDayToDate(jd))).toBe('2026-11-09');
  });
});

describe('moonAge', () => {
  it('is zero at the integer reference new-moon JD', () => {
    // 基准取新月当日的整数 JD，月龄恰为 0。
    expect(moonAge(NEW_MOON_REF_JD)).toBe(0);
    // 次日月龄约为 1 天。
    expect(moonAge(NEW_MOON_REF_JD + 1)).toBeCloseTo(1, 6);
  });

  it('always stays within [0, SYNODIC_MONTH)', () => {
    for (let offset = -1000; offset <= 1000; offset += 7) {
      const age = moonAge(NEW_MOON_REF_JD + offset);
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThan(SYNODIC_MONTH);
    }
  });

  it('is periodic: age at jd and jd + one synodic month are equal', () => {
    const jd = toJulianDay(2026, 11, 9);
    expect(moonAge(jd + SYNODIC_MONTH)).toBeCloseTo(moonAge(jd), 9);
  });
});

describe('getMoonPhase illumination', () => {
  it('is near zero at new moon and near one at full moon', () => {
    const newMoon = getMoonPhase(NEW_MOON_REF_JD);
    expect(newMoon.illumination).toBeLessThan(0.02);
    expect(newMoon.phase).toBe('new');

    const fullMoon = getMoonPhase(NEW_MOON_REF_JD + FULL_MOON_AGE);
    expect(fullMoon.illumination).toBeGreaterThan(0.98);
    expect(fullMoon.phase).toBe('full');
  });

  it('is about 0.5 at the quarters', () => {
    const firstQuarter = getMoonPhase(NEW_MOON_REF_JD + SYNODIC_MONTH / 4);
    expect(firstQuarter.illumination).toBeCloseTo(0.5, 1);
    expect(firstQuarter.phase).toBe('first-quarter');

    const lastQuarter = getMoonPhase(NEW_MOON_REF_JD + (SYNODIC_MONTH * 3) / 4);
    expect(lastQuarter.illumination).toBeCloseTo(0.5, 1);
    expect(lastQuarter.phase).toBe('last-quarter');
  });

  it('keeps illumination within [0, 1] across a full cycle', () => {
    for (let d = 0; d < SYNODIC_MONTH; d += 0.37) {
      const { illumination } = getMoonPhase(NEW_MOON_REF_JD + d);
      expect(illumination).toBeGreaterThanOrEqual(0);
      expect(illumination).toBeLessThanOrEqual(1);
    }
  });
});

describe('classifyPhase', () => {
  it('maps representative ages to the eight phases', () => {
    expect(classifyPhase(0).phase).toBe('new');
    expect(classifyPhase(3.7).phase).toBe('waxing-crescent');
    expect(classifyPhase(7.38).phase).toBe('first-quarter');
    expect(classifyPhase(11).phase).toBe('waxing-gibbous');
    expect(classifyPhase(14.77).phase).toBe('full');
    expect(classifyPhase(18.5).phase).toBe('waning-gibbous');
    expect(classifyPhase(22.15).phase).toBe('last-quarter');
    expect(classifyPhase(26).phase).toBe('waning-crescent');
    // 接近周期末端回到新月。
    expect(classifyPhase(29.4).phase).toBe('new');
  });
});

describe('getNearestPhases', () => {
  it('places adjacent new moons one synodic month apart (29 or 30 whole days)', () => {
    const jd = toJulianDay(2026, 11, 9);
    const { lastNewMoon, nextNewMoon } = getNearestPhases(jd);
    const gap = dateToJulianDay(nextNewMoon) - dateToJulianDay(lastNewMoon);
    // 29.53 天落到整数日历日，相邻两次新月相差 29 或 30 天。
    expect([29, 30]).toContain(gap);
  });

  it('brackets the current date between last and next new moons', () => {
    const date = new Date(Date.UTC(2026, 10, 9));
    const info = getMoonPhaseFromDate(date);
    const { lastNewMoon, nextNewMoon } = getNearestPhases(dateToJulianDay(date));
    expect(info.daysSinceNewMoon).toBeGreaterThanOrEqual(0);
    expect(info.daysUntilNewMoon).toBeGreaterThan(0);
    expect(lastNewMoon.getTime()).toBeLessThanOrEqual(date.getTime());
    // 下一次新月按整日推算，可能恰好落在目标日历日，故用非严格比较。
    expect(nextNewMoon.getTime()).toBeGreaterThanOrEqual(date.getTime());
  });

  it('separates adjacent full moons by one synodic month (29 or 30 whole days)', () => {
    const jd = toJulianDay(2026, 11, 9);
    const { lastFullMoon, nextFullMoon } = getNearestPhases(jd);
    const gap = dateToJulianDay(nextFullMoon) - dateToJulianDay(lastFullMoon);
    expect([29, 30]).toContain(gap);
  });
});

describe('formatUTCDate', () => {
  it('pads month and day', () => {
    expect(formatUTCDate(new Date(Date.UTC(2026, 0, 5)))).toBe('2026-01-05');
  });
});

describe('moonClipPath', () => {
  it('hides the lit layer at new moon (rx 0) and fully reveals it at full moon (rx 50)', () => {
    expect(moonClipPath(0)).toBe('ellipse(0.00% 50% at 100% 50%)');
    expect(moonClipPath(SYNODIC_MONTH - 0.0001)).toMatch(/ellipse\(0\.00% 50% at 0%/);
    // 满月 t=0.5 归入亏月分支，锚点在左，但 rx=50% 时整盘全亮，锚点无视觉差异。
    expect(moonClipPath(FULL_MOON_AGE)).toBe('ellipse(50.00% 50% at 0% 50%)');
  });

  it('shows half the disc at the quarters and anchors on the correct side', () => {
    // 上弦（盈，t=0.25）：rx=25，亮区在右。
    expect(moonClipPath(SYNODIC_MONTH * 0.25)).toBe('ellipse(25.00% 50% at 100% 50%)');
    // 下弦（亏，t=0.75）：rx=25，亮区在左。
    expect(moonClipPath(SYNODIC_MONTH * 0.75)).toBe('ellipse(25.00% 50% at 0% 50%)');
  });
});
