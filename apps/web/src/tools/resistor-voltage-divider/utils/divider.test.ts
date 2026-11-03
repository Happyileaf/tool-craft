import { describe, expect, it } from 'vitest';
import { calculateDivider, parallelResistance, solveForR2 } from './divider';

describe('parallelResistance', () => {
  it('两等值电阻并联减半', () => {
    expect(parallelResistance(10e3, 10e3)).toBeCloseTo(5e3, 6);
  });

  it('2k 与 3k 并联为 1.2k', () => {
    expect(parallelResistance(2e3, 3e3)).toBeCloseTo(1.2e3, 6);
  });
});

describe('calculateDivider 空载', () => {
  it('R1=R2 时输出为输入一半', () => {
    const r = calculateDivider({ inputVoltage: 12, r1: 10e3, r2: 10e3, rl: null });
    expect(r.outputVoltage).toBeCloseTo(6, 6);
    expect(r.ratio).toBeCloseTo(0.5, 9);
    expect(r.loadCurrent).toBe(0);
    expect(r.loadRegulationPercent).toBeCloseTo(0, 9);
  });

  it('R1=1k R2=2k 时输出为 2/3', () => {
    const r = calculateDivider({ inputVoltage: 5, r1: 1e3, r2: 2e3, rl: null });
    expect(r.outputVoltage).toBeCloseTo(3.333333, 4);
    expect(r.totalCurrent).toBeCloseTo(5 / 3e3, 9);
    expect(r.totalPower).toBeCloseTo((5 * 5) / 3e3, 9);
  });
});

describe('calculateDivider 带负载', () => {
  it('RL 与 R2 并联后输出被拉低', () => {
    // R1=R2=RL=10k → Rp=5k → Vout=12×5k/15k=4V
    const r = calculateDivider({ inputVoltage: 12, r1: 10e3, r2: 10e3, rl: 10e3 });
    expect(r.parallelResistance).toBeCloseTo(5e3, 6);
    expect(r.outputVoltage).toBeCloseTo(4, 9);
    expect(r.loadCurrent).toBeCloseTo(4 / 10e3, 12);
    expect(r.loadRegulationPercent).toBeCloseTo(33.3333, 3);
  });

  it('RL ≥ 10×R2 时无负载效应告警', () => {
    // Rp = 100k∥1k ≈ 990.1Ω，Vout = 5 × 990.1/(1000+990.1) ≈ 2.487V，接近空载 2.5V
    const r = calculateDivider({ inputVoltage: 5, r1: 1e3, r2: 1e3, rl: 100e3 });
    expect(r.warnings).toHaveLength(0);
    expect(r.parallelResistance).toBeCloseTo((100e3 * 1e3) / 101e3, 4);
    expect(r.outputVoltage).toBeCloseTo(2.487, 2);
  });

  it('RL < R2 时给出显著负载效应告警', () => {
    const r = calculateDivider({ inputVoltage: 5, r1: 1e3, r2: 10e3, rl: 1e3 });
    expect(r.warnings.some((w) => w.includes('显著'))).toBe(true);
  });
});

describe('solveForR2', () => {
  it('12V → 5V 且 R1=10k 时 R2≈7.14k', () => {
    const r = solveForR2({ inputVoltage: 12, targetOutputVoltage: 5, r1: 10e3 });
    expect(r.r2).toBeCloseTo((10e3 * 5) / 7, 3);
  });

  it('5V → 3.3V 且 R1=1k 时 R2≈1.94k', () => {
    const r = solveForR2({ inputVoltage: 5, targetOutputVoltage: 3.3, r1: 1e3 });
    expect(r.r2).toBeCloseTo(1941.176, 1);
  });

  it('目标电压 ≥ 输入电压时告警且 R2 为无穷大', () => {
    const r = solveForR2({ inputVoltage: 5, targetOutputVoltage: 5, r1: 1e3 });
    expect(r.r2).toBe(Number.POSITIVE_INFINITY);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('目标电压为 0 时返回 R2=0', () => {
    const r = solveForR2({ inputVoltage: 5, targetOutputVoltage: 0, r1: 1e3 });
    expect(r.r2).toBe(0);
  });
});
