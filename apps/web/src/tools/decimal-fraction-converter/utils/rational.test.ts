import { describe, it, expect } from 'vitest';
import {
  decimalToFraction,
  fractionToDecimal,
  fractionToPercent,
  parseFraction,
  percentToFraction,
  reduceFraction,
  toMixedFraction,
} from './rational';

const b = (value: number): bigint => BigInt(value);

describe('reduceFraction 与 toMixedFraction', () => {
  it('约分并归一化负号到分子', () => {
    expect(reduceFraction(b(4), b(-6))).toEqual({ numerator: b(-2), denominator: b(3) });
    expect(reduceFraction(b(6), b(4))).toEqual({ numerator: b(3), denominator: b(2) });
    expect(reduceFraction(b(-8), b(-12))).toEqual({ numerator: b(2), denominator: b(3) });
  });

  it('分母为 0 时抛出错误', () => {
    expect(() => reduceFraction(b(1), b(0))).toThrow('分母不能为 0');
  });

  it('带分数格式化', () => {
    expect(toMixedFraction({ numerator: b(5), denominator: b(2) })).toBe('2 又 1/2');
    expect(toMixedFraction({ numerator: b(-7), denominator: b(3) })).toBe('-2 又 1/3');
    expect(toMixedFraction({ numerator: b(4), denominator: b(2) })).toBe('2');
    expect(toMixedFraction({ numerator: b(1), denominator: b(2) })).toBeNull();
  });
});

describe('decimalToFraction', () => {
  it('有限小数转最简分数', () => {
    expect(decimalToFraction('0.5').fraction).toEqual({ numerator: b(1), denominator: b(2) });
    expect(decimalToFraction('0.25').fraction).toEqual({ numerator: b(1), denominator: b(4) });
    expect(decimalToFraction('-1.25').fraction).toEqual({ numerator: b(-5), denominator: b(4) });
    expect(decimalToFraction('0.1').fraction).toEqual({ numerator: b(1), denominator: b(10) });
  });

  it('整数与 .5 简写形式', () => {
    expect(decimalToFraction('7').fraction).toEqual({ numerator: b(7), denominator: b(1) });
    expect(decimalToFraction('.5').fraction).toEqual({ numerator: b(1), denominator: b(2) });
    expect(decimalToFraction('+0.75').fraction).toEqual({ numerator: b(3), denominator: b(4) });
  });

  it('纯循环小数转最简分数', () => {
    expect(decimalToFraction('0.(3)').fraction).toEqual({ numerator: b(1), denominator: b(3) });
    expect(decimalToFraction('0.(6)').fraction).toEqual({ numerator: b(2), denominator: b(3) });
    expect(decimalToFraction('0.(142857)').fraction).toEqual({
      numerator: b(1),
      denominator: b(7),
    });
  });

  it('混合循环小数转最简分数', () => {
    expect(decimalToFraction('0.1(6)').fraction).toEqual({ numerator: b(1), denominator: b(6) });
    expect(decimalToFraction('1.2(14)').fraction).toEqual({ numerator: b(601), denominator: b(495) });
  });

  it('返回带分数与约分步骤', () => {
    const result = decimalToFraction('2.5');
    expect(result.mixed).toBe('2 又 1/2');
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('非法格式抛出中文错误', () => {
    expect(() => decimalToFraction('abc')).toThrow('无法识别的小数格式');
    expect(() => decimalToFraction('1.2.3')).toThrow('无法识别的小数格式');
  });
});

describe('parseFraction', () => {
  it('解析普通分数与负分数', () => {
    expect(parseFraction('3/4')).toEqual({ numerator: b(3), denominator: b(4) });
    expect(parseFraction('-4/6')).toEqual({ numerator: b(-2), denominator: b(3) });
    expect(parseFraction('6/2')).toEqual({ numerator: b(3), denominator: b(1) });
  });

  it('解析带分数', () => {
    expect(parseFraction('1 1/2')).toEqual({ numerator: b(3), denominator: b(2) });
    expect(parseFraction('-2 1/3')).toEqual({ numerator: b(-7), denominator: b(3) });
  });

  it('带分数真分数部分非法时抛错', () => {
    expect(() => parseFraction('1 3/2')).toThrow('真分数部分');
  });

  it('分母为 0 或非法格式抛错', () => {
    expect(() => parseFraction('1/0')).toThrow('分母不能为 0');
    expect(() => parseFraction('abc')).toThrow('无法识别的分数格式');
  });
});

describe('fractionToDecimal', () => {
  it('整除时输出整数', () => {
    expect(fractionToDecimal({ numerator: b(6), denominator: b(3) }).text).toBe('2');
  });

  it('有限小数', () => {
    expect(fractionToDecimal({ numerator: b(1), denominator: b(8) }).text).toBe('0.125');
    expect(fractionToDecimal({ numerator: b(-1), denominator: b(4) }).text).toBe('-0.25');
  });

  it('循环小数用圆括号标出循环节', () => {
    expect(fractionToDecimal({ numerator: b(1), denominator: b(3) }).text).toBe('0.(3)');
    expect(fractionToDecimal({ numerator: b(2), denominator: b(3) }).text).toBe('0.(6)');
    expect(fractionToDecimal({ numerator: b(1), denominator: b(6) }).text).toBe('0.1(6)');
    expect(fractionToDecimal({ numerator: b(1), denominator: b(7) }).text).toBe('0.(142857)');
    expect(fractionToDecimal({ numerator: b(-5), denominator: b(6) }).text).toBe('-0.8(3)');
  });

  it('往返一致：分数→小数→分数', () => {
    const expansion = fractionToDecimal({ numerator: b(17), denominator: b(23) });
    const back = decimalToFraction(expansion.text).fraction;
    expect(back).toEqual({ numerator: b(17), denominator: b(23) });
  });
});

describe('百分数互转', () => {
  it('百分数转分数', () => {
    expect(percentToFraction('25%').fraction).toEqual({ numerator: b(1), denominator: b(4) });
    expect(percentToFraction('12.5%').fraction).toEqual({ numerator: b(1), denominator: b(8) });
    expect(percentToFraction('200%').fraction).toEqual({ numerator: b(2), denominator: b(1) });
  });

  it('循环百分数转分数', () => {
    expect(percentToFraction('33.(3)%').fraction).toEqual({ numerator: b(1), denominator: b(3) });
  });

  it('空百分数抛错', () => {
    expect(() => percentToFraction('%')).toThrow('请输入百分数');
  });

  it('分数转百分数', () => {
    expect(fractionToPercent('1/4')).toBe('25%');
    expect(fractionToPercent('1/8')).toBe('12.5%');
    expect(fractionToPercent('1/3')).toBe('33.(3)%');
    expect(fractionToPercent('5/2')).toBe('250%');
  });
});
