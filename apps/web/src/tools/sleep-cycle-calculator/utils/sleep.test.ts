import { describe, expect, it } from 'vitest';
import {
  calculateSleepPlans,
  formatClock,
  formatDayOffset,
  formatSleepDuration,
  parseClock,
} from './sleep';

describe('parseClock', () => {
  it('解析常见时刻', () => {
    expect(parseClock('07:00')).toBe(420);
    expect(parseClock('23:15')).toBe(1395);
    expect(parseClock('0:05')).toBe(5);
  });

  it('拒绝非法时刻', () => {
    expect(() => parseClock('25:00')).toThrow();
    expect(() => parseClock('07:60')).toThrow();
    expect(() => parseClock('7')).toThrow();
    expect(() => parseClock('')).toThrow();
  });
});

describe('formatClock', () => {
  it('按 24 小时制格式化并跨午夜回绕', () => {
    expect(formatClock(-45, false)).toBe('23:15');
    expect(formatClock(45, false)).toBe('00:45');
    expect(formatClock(1845, false)).toBe('06:45');
  });

  it('按 12 小时制格式化边界时刻', () => {
    expect(formatClock(45, true)).toBe('12:45 AM');
    expect(formatClock(1395, true)).toBe('11:15 PM');
    expect(formatClock(720, true)).toBe('12:00 PM');
  });
});

describe('formatDayOffset', () => {
  it('输出中文日期前缀', () => {
    expect(formatDayOffset(-1)).toBe('前一日');
    expect(formatDayOffset(0)).toBe('当日');
    expect(formatDayOffset(1)).toBe('次日');
  });
});

describe('calculateSleepPlans', () => {
  it('按起床 07:00 与 15 分钟缓冲倒推 4 / 5 / 6 周期', () => {
    const plans = calculateSleepPlans('wake', 420, 15, [4, 5, 6], false);
    expect(plans).toHaveLength(3);
    expect(plans[0]).toMatchObject({ cycles: 4, clock: '00:45', dayOffset: 0 });
    expect(plans[1]).toMatchObject({ cycles: 5, clock: '23:15', dayOffset: -1 });
    expect(plans[2]).toMatchObject({ cycles: 6, clock: '21:45', dayOffset: -1 });
  });

  it('按就寝 23:00 与 15 分钟缓冲正推 5 / 6 周期', () => {
    const plans = calculateSleepPlans('bed', 1380, 15, [5, 6], false);
    expect(plans[0]).toMatchObject({ cycles: 5, clock: '06:45', dayOffset: 1 });
    expect(plans[1]).toMatchObject({ cycles: 6, clock: '08:15', dayOffset: 1 });
  });

  it('总睡眠时长等于周期数乘以 90 分钟', () => {
    const plans = calculateSleepPlans('wake', 420, 15, [4], false);
    expect(plans[0]?.totalSleepMinutes).toBe(360);
    expect(formatSleepDuration(360)).toBe('6 小时');
    expect(formatSleepDuration(450)).toBe('7 小时 30 分钟');
  });

  it('拒绝非法缓冲、空周期与越界时间', () => {
    expect(() => calculateSleepPlans('wake', 420, -1, [4], false)).toThrow();
    expect(() => calculateSleepPlans('wake', 420, 61, [4], false)).toThrow();
    expect(() => calculateSleepPlans('wake', 420, 15, [], false)).toThrow();
    expect(() => calculateSleepPlans('wake', 1500, 15, [4], false)).toThrow();
    expect(() => calculateSleepPlans('wake', 420, 15, [13], false)).toThrow();
  });
});
