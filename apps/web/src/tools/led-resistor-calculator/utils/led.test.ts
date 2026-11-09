import { describe, it, expect } from 'vitest';
import {
  calculateLedResistor,
  e24Series,
  formatCurrentMa,
  formatPower,
  formatResistance,
  listE24Candidates,
  round,
  selectE24Ceiling,
  type LedInputs,
} from './led';
import { E24_BASE } from '../constants';

/** 构造输入，缺省值为经典 5V / 红 LED / 20mA 单路 */
function makeInputs(overrides: Partial<LedInputs> = {}): LedInputs {
  return {
    supplyVoltage: 5,
    forwardVoltage: 2,
    targetCurrentMa: 20,
    topology: 'single',
    count: 1,
    ...overrides,
  };
}

describe('经典向量 calculateLedResistor', () => {
  it('5V / 红 LED Vf=2V / 20mA → 理想 R=150Ω、P=0.06W，E24 命中 150Ω', () => {
    const result = calculateLedResistor(makeInputs());
    expect(result.error).toBeNull();
    expect(result.idealResistance).toBeCloseTo(150, 6);
    expect(result.idealPower).toBeCloseTo(0.06, 6);
    expect(result.recommended).toBe(150);
    expect(result.actualCurrentMa).toBeCloseTo(20, 4);
    expect(result.currentDeviationPercent).toBeCloseTo(0, 2);
    expect(result.totalCurrentMa).toBeCloseTo(20, 4);
    expect(result.totalPower).toBeCloseTo(0.06, 6);
    expect(result.vfTotal).toBe(2);
  });

  it('3 颗蓝光串联（Vf=3.2V）、12V、20mA → Vf总=9.6V、R=120Ω', () => {
    const result = calculateLedResistor(
      makeInputs({
        supplyVoltage: 12,
        forwardVoltage: 3.2,
        topology: 'series',
        count: 3,
      }),
    );
    expect(result.error).toBeNull();
    expect(result.vfTotal).toBeCloseTo(9.6, 6);
    expect(result.idealResistance).toBeCloseTo(120, 6);
    expect(result.recommended).toBe(120);
    expect(result.actualCurrentMa).toBeCloseTo(20, 4);
  });

  it('2 颗红 LED 并联（每路独立电阻）→ 每路 150Ω、总电流 40mA、总功耗 0.12W', () => {
    const result = calculateLedResistor(
      makeInputs({ topology: 'parallel', count: 2 }),
    );
    expect(result.error).toBeNull();
    expect(result.vfTotal).toBe(2);
    expect(result.idealResistance).toBeCloseTo(150, 6);
    expect(result.recommended).toBe(150);
    expect(result.totalCurrentMa).toBeCloseTo(40, 4);
    expect(result.totalPower).toBeCloseTo(0.12, 6);
    expect(result.warnings.join(' ')).toMatch(/每路独立限流电阻/);
  });

  it('单路拓扑忽略 N 并按 1 颗处理', () => {
    const result = calculateLedResistor(makeInputs({ topology: 'single', count: 4 }));
    expect(result.error).toBeNull();
    expect(result.vfTotal).toBe(2);
    expect(result.idealResistance).toBeCloseTo(150, 6);
  });
});

describe('E24 向上选型（不小于理想值的最接近值，避免过流）', () => {
  it('理想 150Ω 精确命中标准值', () => {
    expect(selectE24Ceiling(150)).toBe(150);
  });

  it('理想 155Ω 向上取 160Ω 而非 150Ω', () => {
    expect(selectE24Ceiling(155)).toBe(160);
  });

  it('理想 101Ω 向上取 110Ω（跨十倍频衔接正确）', () => {
    expect(selectE24Ceiling(101)).toBe(110);
  });

  it('理想 303Ω 向上取 330Ω（不取更接近但偏小的 300Ω）', () => {
    expect(selectE24Ceiling(303)).toBe(330);
  });

  it('全系列下限与上限边界', () => {
    expect(selectE24Ceiling(0.5)).toBe(1);
    expect(selectE24Ceiling(9_100_000)).toBe(9_100_000);
    expect(selectE24Ceiling(9_200_000)).toBeNull();
    expect(selectE24Ceiling(0)).toBeNull();
    expect(selectE24Ceiling(Number.NaN)).toBeNull();
  });

  it('e24Series 展开 7 个十倍频共 168 个升序阻值，范围 1Ω～9.1MΩ', () => {
    const series = e24Series(0, 6);
    expect(series).toHaveLength(24 * 7);
    expect(series[0]).toBe(1);
    expect(series[series.length - 1]).toBe(9_100_000);
    expect([...series]).toEqual([...series].sort((a, b) => a - b));
    expect(E24_BASE).toHaveLength(24);
  });

  it('listE24Candidates 标记推荐值并给出偏差', () => {
    const candidates = listE24Candidates(303, 6);
    const ceiling = candidates.find((item) => item.isCeiling);
    expect(ceiling?.value).toBe(330);
    expect(ceiling?.deltaPercent).toBeCloseTo(((330 - 303) / 303) * 100, 2);
    expect(candidates.filter((item) => item.isCeiling)).toHaveLength(1);
    expect(listE24Candidates(0)).toEqual([]);
  });

  it('选用偏大标称值后实际欠流，偏差为负且不超过 0（不超流）', () => {
    // 5V、Vf=2V、If=20mA 理想 150Ω；改为 If=19mA → 理想 157.9Ω → 选 160Ω
    const result = calculateLedResistor(makeInputs({ targetCurrentMa: 19 }));
    expect(result.error).toBeNull();
    expect(result.recommended).toBe(160);
    expect(result.actualCurrentMa).toBeLessThan(19);
    expect(result.currentDeviationPercent).toBeLessThan(0);
  });
});

describe('边界错误（结果对象返回，不抛异常）', () => {
  it('Vs ≤ Vf_total 时提示无法限流（含串联场景）', () => {
    const single = calculateLedResistor(makeInputs({ supplyVoltage: 2, forwardVoltage: 2 }));
    expect(single.error).toMatch(/无法限流/);
    expect(single.idealResistance).toBeNull();

    const series = calculateLedResistor(
      makeInputs({ supplyVoltage: 9, forwardVoltage: 3.2, topology: 'series', count: 3 }),
    );
    expect(series.error).toMatch(/无法限流/);
  });

  it('If ≤ 0 报错', () => {
    expect(calculateLedResistor(makeInputs({ targetCurrentMa: 0 })).error).toMatch(/目标电流/);
    expect(calculateLedResistor(makeInputs({ targetCurrentMa: -5 })).error).toMatch(/目标电流/);
  });

  it('数值缺失或非数值报错（null / NaN）', () => {
    expect(calculateLedResistor(makeInputs({ supplyVoltage: null })).error).toMatch(/电源电压/);
    expect(calculateLedResistor(makeInputs({ forwardVoltage: null })).error).toMatch(/正向压降/);
    expect(calculateLedResistor(makeInputs({ targetCurrentMa: Number.NaN })).error).toMatch(
      /目标电流/,
    );
    expect(calculateLedResistor(makeInputs({ count: null })).error).toMatch(/LED 数量/);
  });

  it('N 不是正整数报错（0、负数、小数）', () => {
    expect(calculateLedResistor(makeInputs({ topology: 'series', count: 0 })).error).toMatch(
      /正整数/,
    );
    expect(calculateLedResistor(makeInputs({ topology: 'series', count: -2 })).error).toMatch(
      /正整数/,
    );
    expect(calculateLedResistor(makeInputs({ topology: 'parallel', count: 2.5 })).error).toMatch(
      /正整数/,
    );
  });

  it('Vs、Vf 非正数报错', () => {
    expect(calculateLedResistor(makeInputs({ supplyVoltage: 0 })).error).toMatch(/电源电压/);
    expect(calculateLedResistor(makeInputs({ forwardVoltage: -1 })).error).toMatch(/正向压降/);
  });

  it('理想电阻超出 E24 全系列时返回错误并保留理想值', () => {
    // Vf=2V、Vs=12V、If=1μA（0.001mA）→ R=10MΩ，超出 9.1MΩ 上限
    const result = calculateLedResistor(makeInputs({ targetCurrentMa: 0.001, supplyVoltage: 12 }));
    expect(result.error).toMatch(/超出 E24 全系列范围/);
    expect(result.recommended).toBeNull();
    expect(result.idealResistance).toBeCloseTo(10_000_000, 6);
  });
});

describe('格式化与舍入', () => {
  it('formatResistance 自适应 Ω/kΩ/MΩ', () => {
    expect(formatResistance(150)).toBe('150 Ω');
    expect(formatResistance(1500)).toBe('1.5 kΩ');
    expect(formatResistance(2_200_000)).toBe('2.2 MΩ');
  });

  it('formatCurrentMa 与 formatPower 单位切换', () => {
    expect(formatCurrentMa(20)).toBe('20 mA');
    expect(formatPower(0.06)).toBe('60 mW');
    expect(formatPower(1.5)).toBe('1.5 W');
  });

  it('round 消除浮点尾差与 -0', () => {
    expect(round(0.1 + 0.2, 6)).toBe(0.3);
    expect(round(-0, 2)).toBe(0);
  });
});
