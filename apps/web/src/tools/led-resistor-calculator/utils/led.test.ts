import { describe, expect, it } from 'vitest';
import {
  E24_BASE,
  calculateLedResistor,
  formatOhms,
  pickE24,
  type LedInput,
} from './led';

const baseInput: LedInput = {
  supplyVoltage: 5,
  forwardVoltage: 2,
  currentMa: 20,
  topology: 'single',
  seriesCount: 1,
  parallelCount: 1,
};

describe('pickE24', () => {
  it('E24_BASE 含 24 个标称基础值', () => {
    expect(E24_BASE).toHaveLength(24);
  });

  it('命中标称值时原样返回', () => {
    expect(pickE24(150)).toBe(150);
    expect(pickE24(160)).toBe(160);
    expect(pickE24(4700)).toBe(4700);
  });

  it('非标称值向上选取且不小于目标（防过流）', () => {
    expect(pickE24(155)).toBe(160);
    expect(pickE24(105)).toBe(110);
    expect(pickE24(330)).toBe(330);
    // 超出本量级最大标称值时进入下一量级
    expect(pickE24(950)).toBe(1000);
  });

  it('小阻值与大阻值量程均正确', () => {
    expect(pickE24(4.7)).toBe(4.7);
    expect(pickE24(5)).toBe(5.1);
    expect(pickE24(12000)).toBe(12000);
  });
});

describe('calculateLedResistor - 经典单颗用例', () => {
  it('Vs=5V、Vf=2V、If=20mA → 理论 150Ω、E24 150Ω、实际 20mA、功耗 0.06W', () => {
    const r = calculateLedResistor(baseInput);
    expect(r.ok).toBe(true);
    expect(r.error).toBeNull();
    expect(r.theoreticalOhms).toBeCloseTo(150, 6);
    expect(r.nominalOhms).toBe(150);
    expect(r.actualCurrentMa).toBeCloseTo(20, 6);
    expect(r.currentDeviationPct).toBeCloseTo(0, 6);
    // P = I²R = 0.02² × 150 = 0.06 W
    expect(r.resistorPowerW).toBeCloseTo(0.06, 6);
    // 2 倍冗余 0.12W → 向上对齐 1/8 W
    expect(r.ratedPowerW).toBe(0.125);
  });

  it('理论 155Ω 时推荐 160Ω 且实际电流偏差为负（不过流）', () => {
    // 构造理论值 155Ω：Vs=5.1V、Vf=2V、If=20mA → (5.1-2)/0.02=155
    const r = calculateLedResistor({ ...baseInput, supplyVoltage: 5.1 });
    expect(r.ok).toBe(true);
    expect(r.theoreticalOhms).toBeCloseTo(155, 6);
    expect(r.nominalOhms).toBe(160);
    expect(r.actualCurrentMa).toBeCloseTo(19.375, 6);
    expect(r.currentDeviationPct).toBeLessThan(0);
  });
});

describe('calculateLedResistor - 拓扑换算', () => {
  it('串联 3 颗按 3·Vf 折算总压降', () => {
    // 5V 电源无法驱动 3 颗 2V LED（总压降 6V），应报错不抛异常
    const under = calculateLedResistor({
      ...baseInput,
      topology: 'series',
      seriesCount: 3,
    });
    expect(under.ok).toBe(false);
    expect(under.error).not.toBeNull();

    const r12 = calculateLedResistor({
      ...baseInput,
      supplyVoltage: 12,
      topology: 'series',
      seriesCount: 3,
    });
    expect(r12.ok).toBe(true);
    // (12 - 6) / 0.02 = 300Ω
    expect(r12.theoreticalOhms).toBeCloseTo(300, 6);
    expect(r12.nominalOhms).toBe(300);
    expect(r12.actualCurrentMa).toBeCloseTo(20, 6);
  });

  it('并联 4 条支路按 4·If 折算总电流', () => {
    const r = calculateLedResistor({
      ...baseInput,
      topology: 'parallel',
      parallelCount: 4,
    });
    expect(r.ok).toBe(true);
    // 总电流 80mA：(5-2)/0.08 = 37.5Ω → E24 向上 39Ω
    expect(r.theoreticalOhms).toBeCloseTo(37.5, 6);
    expect(r.nominalOhms).toBe(39);
    // 实际总电流 = 3/39×1000 ≈ 76.92mA，偏差为负
    expect(r.actualCurrentMa).toBeCloseTo(76.9230769, 5);
    expect(r.currentDeviationPct).toBeLessThan(0);
  });

  it('单颗拓扑与串联 1 颗、并联 1 支路结果一致', () => {
    const single = calculateLedResistor(baseInput);
    const series1 = calculateLedResistor({ ...baseInput, topology: 'series', seriesCount: 1 });
    const parallel1 = calculateLedResistor({
      ...baseInput,
      topology: 'parallel',
      parallelCount: 1,
    });
    expect(series1).toEqual(single);
    expect(parallel1).toEqual(single);
  });
});

describe('calculateLedResistor - 边界报错（不抛异常）', () => {
  it('Vs ≤ Vf 总压降时报错', () => {
    const r = calculateLedResistor({ ...baseInput, supplyVoltage: 2 });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('电源电压');
    expect(r.nominalOhms).toBe(0);
  });

  it('串联总压降超过电源电压时报错', () => {
    const r = calculateLedResistor({
      ...baseInput,
      supplyVoltage: 5,
      topology: 'series',
      seriesCount: 3,
    });
    expect(r.ok).toBe(false);
    expect(r.error).not.toBeNull();
  });

  it('If ≤ 0 报错', () => {
    const r = calculateLedResistor({ ...baseInput, currentMa: 0 });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('电流');
  });

  it('电压与颗数非法值报错', () => {
    expect(calculateLedResistor({ ...baseInput, supplyVoltage: 0 }).ok).toBe(false);
    expect(calculateLedResistor({ ...baseInput, forwardVoltage: -1 }).ok).toBe(false);
    expect(
      calculateLedResistor({ ...baseInput, topology: 'series', seriesCount: 0 }).ok,
    ).toBe(false);
    expect(
      calculateLedResistor({ ...baseInput, topology: 'series', seriesCount: 1.5 }).ok,
    ).toBe(false);
    expect(
      calculateLedResistor({ ...baseInput, topology: 'parallel', parallelCount: 0 }).ok,
    ).toBe(false);
  });

  it('NaN / Infinity 输入不抛异常并报错', () => {
    expect(
      calculateLedResistor({ ...baseInput, supplyVoltage: Number.NaN }).ok,
    ).toBe(false);
    expect(
      calculateLedResistor({ ...baseInput, currentMa: Number.POSITIVE_INFINITY }).ok,
    ).toBe(false);
  });
});

describe('formatOhms', () => {
  it('Ω / kΩ / MΩ 自适应量级', () => {
    expect(formatOhms(150)).toBe('150 Ω');
    expect(formatOhms(1000)).toBe('1 kΩ');
    expect(formatOhms(4700)).toBe('4.7 kΩ');
    expect(formatOhms(1_000_000)).toBe('1 MΩ');
    expect(formatOhms(1200)).toBe('1.2 kΩ');
  });
});
