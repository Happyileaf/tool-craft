import { describe, expect, it } from 'vitest';
import {
  actualAvailability,
  downtimeBudget,
  formatDuration,
  highestSlaLevel,
  ninesToPercent,
  percentToNines,
  SLA_LEVELS,
  SECONDS_PER_DAY,
  SECONDS_PER_MONTH,
  SECONDS_PER_WEEK,
  SECONDS_PER_YEAR,
} from './sla';

describe('downtimeBudget 停机预算固定向量', () => {
  it('99.9% 时年预算 = 31536000 × 0.001 = 31536 秒', () => {
    const budget = downtimeBudget(99.9);
    expect(budget.year).toBe(31536);
  });

  it('99.9% 时日预算 = 86.4 秒', () => {
    const budget = downtimeBudget(99.9);
    expect(budget.day).toBeCloseTo(86.4, 10);
  });

  it('99.9% 时周预算 = 604.8 秒、月预算 = 2592 秒', () => {
    const budget = downtimeBudget(99.9);
    expect(budget.week).toBeCloseTo(604.8, 10);
    expect(budget.month).toBe(2592);
  });

  it('99.999% 时年预算 = 315.36 秒', () => {
    const budget = downtimeBudget(99.999);
    expect(budget.year).toBeCloseTo(315.36, 10);
  });

  it('99.999% 时日预算 = 0.864 秒（864 毫秒）', () => {
    const budget = downtimeBudget(99.999);
    expect(budget.day).toBe(0.864);
    expect(formatDuration(budget.day)).toBe('864ms');
  });

  it('99% 时年预算 = 315360 秒（约 3.65 天）', () => {
    const budget = downtimeBudget(99);
    expect(budget.year).toBe(315360);
    expect(budget.day).toBeCloseTo(864, 10);
  });

  it('周期基数常量分别为 86400 / 604800 / 2592000 / 31536000', () => {
    expect(SECONDS_PER_DAY).toBe(86400);
    expect(SECONDS_PER_WEEK).toBe(604800);
    expect(SECONDS_PER_MONTH).toBe(2_592_000);
    expect(SECONDS_PER_YEAR).toBe(31_536_000);
  });
});

describe('formatDuration 自适应时长格式化', () => {
  it('0 秒显示为 "0s"', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('亚秒显示毫秒：0.5 秒 → "500ms"', () => {
    expect(formatDuration(0.5)).toBe('500ms');
    expect(formatDuration(0.001)).toBe('1ms');
  });

  it('跨日组合：90061 秒 → "1d 1h 1m 1s"', () => {
    expect(formatDuration(90061)).toBe('1d 1h 1m 1s');
  });

  it('31536 秒 → "8h 45m 36s"', () => {
    expect(formatDuration(31536)).toBe('8h 45m 36s');
  });

  it('315.36 秒 → "5m 15s"', () => {
    expect(formatDuration(315.36)).toBe('5m 15s');
  });

  it('纯秒与分秒组合', () => {
    expect(formatDuration(36)).toBe('36s');
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(86400)).toBe('1d');
  });

  it('负秒数抛出含字段名的错误', () => {
    expect(() => formatDuration(-1)).toThrow(/故障时长（秒）/);
  });
});

describe('actualAvailability 反向计算', () => {
  it('年故障 31536 秒 → 可用性恰为 99.9%', () => {
    const result = actualAvailability(31536, SECONDS_PER_YEAR);
    expect(result.availability).toBe(99.9);
  });

  it('年故障 31536 秒 → nines 恰为 3', () => {
    const result = actualAvailability(31536, SECONDS_PER_YEAR);
    expect(result.nines).toBeCloseTo(3, 10);
  });

  it('故障 0 秒 → 可用性 100% 且 nines 为 Infinity', () => {
    const result = actualAvailability(0, SECONDS_PER_YEAR);
    expect(result.availability).toBe(100);
    expect(result.nines).toBe(Number.POSITIVE_INFINITY);
  });

  it('可用性结果保留 4 位小数', () => {
    const result = actualAvailability(1, 30000);
    // (1 − 1/30000) × 100 = 99.996666… → 99.9967
    expect(result.availability).toBe(99.9967);
  });

  it('故障时长等于周期 → 可用性 0%、nines 为 0', () => {
    const result = actualAvailability(SECONDS_PER_DAY, SECONDS_PER_DAY);
    expect(result.availability).toBe(0);
    expect(result.nines).toBeCloseTo(0, 10);
  });

  it('统计周期为 0 或负数抛出含字段名的错误', () => {
    expect(() => actualAvailability(10, 0)).toThrow(/统计周期（秒）/);
    expect(() => actualAvailability(10, -1)).toThrow(/统计周期（秒）/);
  });

  it('故障时长为负抛出含字段名的错误', () => {
    expect(() => actualAvailability(-1, SECONDS_PER_DAY)).toThrow(/故障时长（秒）/);
  });

  it('故障时长超过周期抛出含字段名的错误', () => {
    expect(() => actualAvailability(86401, SECONDS_PER_DAY)).toThrow(/不能超过统计周期/);
  });

  it('非有限数值抛出错误且不产出 NaN', () => {
    expect(() => actualAvailability(Number.NaN, SECONDS_PER_DAY)).toThrow();
    expect(() => actualAvailability(1, Number.NaN)).toThrow();
  });
});

describe('ninesToPercent / percentToNines 互转', () => {
  it('「3 个 9」与 99.9% 互转一致', () => {
    expect(ninesToPercent(3)).toBe(99.9);
    expect(percentToNines(99.9)).toBeCloseTo(3, 10);
  });

  it('常见档位互转', () => {
    expect(ninesToPercent(2)).toBe(99);
    expect(ninesToPercent(4)).toBe(99.99);
    expect(ninesToPercent(5)).toBe(99.999);
    expect(percentToNines(99)).toBeCloseTo(2, 10);
    expect(percentToNines(99.99)).toBeCloseTo(4, 10);
    expect(percentToNines(99.999)).toBeCloseTo(5, 10);
  });

  it('percentToNines(100) 返回 Infinity', () => {
    expect(percentToNines(100)).toBe(Number.POSITIVE_INFINITY);
  });

  it('99.95% 的 nines ≈ 3.301', () => {
    expect(percentToNines(99.95)).toBeCloseTo(3.30103, 5);
  });

  it('往返转换保持一致', () => {
    for (const nines of [1, 2, 2.5, 3, 4, 5, 6]) {
      const percent = ninesToPercent(nines);
      expect(percentToNines(percent)).toBeCloseTo(nines, 8);
    }
  });

  it('非法 nines 与可用性百分数抛出含字段名的错误', () => {
    expect(() => ninesToPercent(-1)).toThrow(/9 的个数/);
    expect(() => ninesToPercent(Number.NaN)).toThrow(/9 的个数/);
    expect(() => percentToNines(0)).toThrow(/可用性百分比/);
    expect(() => percentToNines(100.1)).toThrow(/可用性百分比/);
    expect(() => percentToNines(-5)).toThrow(/可用性百分比/);
  });
});

describe('downtimeBudget 输入校验', () => {
  it('100% 抛出含字段名的错误', () => {
    expect(() => downtimeBudget(100)).toThrow(/可用性百分比/);
  });

  it('0% 与负数抛出含字段名的错误', () => {
    expect(() => downtimeBudget(0)).toThrow(/可用性百分比/);
    expect(() => downtimeBudget(-99)).toThrow(/可用性百分比/);
  });

  it('NaN / Infinity 抛出错误', () => {
    expect(() => downtimeBudget(Number.NaN)).toThrow();
    expect(() => downtimeBudget(Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe('SLA_LEVELS 与 highestSlaLevel', () => {
  it('等级表覆盖 99 / 99.5 / 99.9 / 99.95 / 99.99 / 99.999 六档', () => {
    expect(SLA_LEVELS.map((level) => level.availability)).toEqual([
      99, 99.5, 99.9, 99.95, 99.99, 99.999,
    ]);
    expect(SLA_LEVELS).toHaveLength(6);
  });

  it('99.9% 达到的最高等级为 99.9% 档', () => {
    expect(highestSlaLevel(99.9)?.availability).toBe(99.9);
  });

  it('100% 达到最高档 99.999%', () => {
    expect(highestSlaLevel(100)?.availability).toBe(99.999);
  });

  it('低于 99% 时无匹配等级', () => {
    expect(highestSlaLevel(98.5)).toBeUndefined();
  });
});
