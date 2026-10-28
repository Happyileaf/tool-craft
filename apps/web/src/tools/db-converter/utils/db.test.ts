import { describe, expect, it } from 'vitest';
import {
  cascadeDb,
  dbToRatio,
  DbModeEnum,
  parseGainList,
  ratioToDb,
  validateRatio,
} from './db';

describe('dbToRatio（dB → 倍数）', () => {
  it('功率模式：+3 dB ≈ 1.995、10 dB = 10、-10 dB = 0.1、0 dB = 1', () => {
    expect(dbToRatio(3, DbModeEnum.POWER)).toBeCloseTo(1.9952623149688795, 9);
    expect(dbToRatio(10, DbModeEnum.POWER)).toBeCloseTo(10, 10);
    expect(dbToRatio(-10, DbModeEnum.POWER)).toBeCloseTo(0.1, 10);
    expect(dbToRatio(0, DbModeEnum.POWER)).toBe(1);
  });

  it('场量模式：+6 dB ≈ 1.995、+20 dB = 10、-6 dB ≈ 0.501', () => {
    expect(dbToRatio(6, DbModeEnum.AMPLITUDE)).toBeCloseTo(1.9952623149688795, 9);
    expect(dbToRatio(20, DbModeEnum.AMPLITUDE)).toBeCloseTo(10, 10);
    expect(dbToRatio(-6, DbModeEnum.AMPLITUDE)).toBeCloseTo(0.5011872336272724, 9);
  });

  it('-Infinity dB 对应 0 倍', () => {
    expect(dbToRatio(Number.NEGATIVE_INFINITY, DbModeEnum.POWER)).toBe(0);
    expect(dbToRatio(Number.NEGATIVE_INFINITY, DbModeEnum.AMPLITUDE)).toBe(0);
  });
});

describe('ratioToDb（倍数 → dB）', () => {
  it('功率模式：10 倍 = 10 dB、0.1 倍 = -10 dB、1 倍 = 0 dB', () => {
    expect(ratioToDb(10, DbModeEnum.POWER)).toBeCloseTo(10, 10);
    expect(ratioToDb(0.1, DbModeEnum.POWER)).toBeCloseTo(-10, 10);
    expect(ratioToDb(1, DbModeEnum.POWER)).toBeCloseTo(0, 10);
  });

  it('场量模式：10 倍 = 20 dB、约 1.995 倍 ≈ 6 dB', () => {
    expect(ratioToDb(10, DbModeEnum.AMPLITUDE)).toBeCloseTo(20, 10);
    expect(ratioToDb(1.9952623149688795, DbModeEnum.AMPLITUDE)).toBeCloseTo(6, 9);
  });

  it('0 倍对应 -Infinity dB，负倍数返回 NaN', () => {
    expect(ratioToDb(0, DbModeEnum.POWER)).toBe(Number.NEGATIVE_INFINITY);
    expect(Number.isNaN(ratioToDb(-1, DbModeEnum.POWER))).toBe(true);
  });

  it('双向换算一致', () => {
    for (const mode of [DbModeEnum.POWER, DbModeEnum.AMPLITUDE]) {
      for (const db of [-20, -6, -3, 0, 3, 6, 10, 20]) {
        expect(ratioToDb(dbToRatio(db, mode), mode)).toBeCloseTo(db, 10);
      }
    }
  });
});

describe('validateRatio', () => {
  it('零合法，负数与非数字报错', () => {
    expect(validateRatio(0)).toBeNull();
    expect(validateRatio(2)).toBeNull();
    expect(validateRatio(-0.5)).toBe('倍数不能为负数');
    expect(validateRatio(Number.NaN)).not.toBeNull();
    expect(validateRatio(Number.POSITIVE_INFINITY)).not.toBeNull();
  });
});

describe('级联', () => {
  it('多级 dB 直接相加，等价于倍数相乘', () => {
    const { gains, error } = parseGainList('3, 3; 3\n 3');
    expect(error).toBeNull();
    expect(gains).toEqual([3, 3, 3, 3]);
    const total = cascadeDb(gains);
    expect(total).toBeCloseTo(12, 10);
    const product = gains.reduce((acc, value) => acc * dbToRatio(value, DbModeEnum.POWER), 1);
    expect(ratioToDb(product, DbModeEnum.POWER)).toBeCloseTo(12, 10);
  });

  it('非法条目报错，空列表总数为 null', () => {
    expect(parseGainList('3, abc').error).toBe('「abc」不是有效的 dB 数值');
    expect(cascadeDb([])).toBeNull();
  });
});
