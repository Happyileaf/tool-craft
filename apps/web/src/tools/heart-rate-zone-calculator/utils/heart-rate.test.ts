import { describe, expect, it } from 'vitest';
import { calculateHeartRateZones, estimateMaxHr } from './heart-rate';

describe('estimateMaxHr', () => {
  it('按 Fox、Tanaka 与 Gulati 估算最大心率', () => {
    expect(estimateMaxHr(30, 'male', 'fox').value).toBe(190);
    expect(estimateMaxHr(30, 'male', 'tanaka').value).toBe(187);
    expect(estimateMaxHr(30, 'female', 'gulati').value).toBeCloseTo(179.6, 5);
  });

  it('男性选择 Gulati 时回退到 Tanaka', () => {
    expect(estimateMaxHr(30, 'male', 'gulati')).toEqual({ value: 187, used: 'tanaka' });
  });
});

describe('calculateHeartRateZones', () => {
  it('Tanaka 公式下计算储备心率与五级区间', () => {
    const result = calculateHeartRateZones({
      age: 30,
      restingHr: 60,
      sex: 'male',
      formula: 'tanaka',
    });
    expect(result.maxHr).toBe(187);
    expect(result.formulaUsed).toBe('tanaka');
    expect(result.heartRateReserve).toBe(127);
    expect(result.zones[0]).toMatchObject({ lowerBpm: 124, upperBpm: 136 });
    expect(result.zones[4]).toMatchObject({ lowerBpm: 174, upperBpm: 187 });
    expect(result.zones[4]?.lowerBpmMaxPercent).toBe(168);
    expect(result.zones[4]?.upperBpmMaxPercent).toBe(187);
  });

  it('Fox 公式下 Z5 上限为估算最大心率', () => {
    const result = calculateHeartRateZones({
      age: 30,
      restingHr: 60,
      sex: 'male',
      formula: 'fox',
    });
    expect(result.maxHr).toBe(190);
    expect(result.zones[4]).toMatchObject({ lowerBpm: 177, upperBpm: 190 });
  });

  it('实测最大心率优先于公式估算', () => {
    const result = calculateHeartRateZones({
      age: 30,
      restingHr: 60,
      sex: 'female',
      formula: 'gulati',
      measuredMaxHr: 185,
    });
    expect(result.maxHr).toBe(185);
    expect(result.formulaUsed).toBe('measured');
    expect(result.heartRateReserve).toBe(125);
  });

  it('拒绝静息心率不小于最大心率等非法输入', () => {
    expect(() =>
      calculateHeartRateZones({ age: 30, restingHr: 190, sex: 'male', formula: 'fox' }),
    ).toThrow();
    expect(() =>
      calculateHeartRateZones({
        age: 30,
        restingHr: 60,
        sex: 'male',
        formula: 'fox',
        measuredMaxHr: 50,
      }),
    ).toThrow();
    expect(() =>
      calculateHeartRateZones({ age: 5, restingHr: 60, sex: 'male', formula: 'fox' }),
    ).toThrow();
    expect(() =>
      calculateHeartRateZones({ age: 30, restingHr: 20, sex: 'male', formula: 'fox' }),
    ).toThrow();
  });
});
