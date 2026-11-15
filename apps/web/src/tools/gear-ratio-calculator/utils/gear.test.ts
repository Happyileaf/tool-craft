import { describe, expect, it } from 'vitest';
import {
  calculateDrivenTeeth,
  calculateMultiStage,
  calculateSingleStage,
  gcd,
  simplifyRatio,
} from './gear';

describe('gcd 与化简', () => {
  it('求出最大公约数并约分齿数比', () => {
    expect(gcd(12, 36)).toBe(12);
    expect(gcd(10, 40)).toBe(10);
    expect(simplifyRatio(12, 36)).toEqual({ numerator: 3, denominator: 1 });
    expect(simplifyRatio(28, 35)).toEqual({ numerator: 5, denominator: 4 });
  });
});

describe('calculateSingleStage', () => {
  it('计算传动比、输出转速、扭矩与方向', () => {
    const result = calculateSingleStage(12, 36, 1200, 10, 100);
    expect(result.ratio).toBe(3);
    expect(result.ratioNumerator).toBe(3);
    expect(result.ratioDenominator).toBe(1);
    expect(result.outputRpm).toBeCloseTo(400, 6);
    expect(result.outputTorque).toBeCloseTo(30, 6);
    expect(result.direction).toBe('反转');
  });

  it('按效率修正输出扭矩', () => {
    const result = calculateSingleStage(12, 36, 1200, 10, 90);
    expect(result.outputTorque).toBeCloseTo(27, 6);
  });

  it('拒绝非法齿数、转速、扭矩与效率', () => {
    expect(() => calculateSingleStage(0, 36, 1200, 10, 100)).toThrow();
    expect(() => calculateSingleStage(12, 501, 1200, 10, 100)).toThrow();
    expect(() => calculateSingleStage(12, 36, 0, 10, 100)).toThrow();
    expect(() => calculateSingleStage(12, 36, 1200, -1, 100)).toThrow();
    expect(() => calculateSingleStage(12, 36, 1200, 10, 120)).toThrow();
  });
});

describe('calculateMultiStage', () => {
  it('两级串联的总传动比与方向', () => {
    const result = calculateMultiStage(
      [
        { driverTeeth: 12, drivenTeeth: 36 },
        { driverTeeth: 10, drivenTeeth: 40 },
      ],
      1200,
      10,
      100,
    );
    expect(result.totalRatio).toBe(12);
    expect(result.ratioNumerator).toBe(12);
    expect(result.ratioDenominator).toBe(1);
    expect(result.outputRpm).toBeCloseTo(100, 6);
    expect(result.outputTorque).toBeCloseTo(120, 6);
    expect(result.direction).toBe('正转');
    expect(result.stages).toHaveLength(2);
    expect(result.stages[0]?.outputRpm).toBeCloseTo(400, 6);
  });

  it('空列表报错', () => {
    expect(() => calculateMultiStage([], 1200, 10, 100)).toThrow();
  });
});

describe('calculateDrivenTeeth', () => {
  it('由目标转速反推从动轮齿数', () => {
    expect(calculateDrivenTeeth(12, 1200, 400)).toBe(36);
  });

  it('拒绝目标转速高于输入转速', () => {
    expect(() => calculateDrivenTeeth(12, 1200, 1500)).toThrow();
    expect(() => calculateDrivenTeeth(12, 0, 400)).toThrow();
  });
});
