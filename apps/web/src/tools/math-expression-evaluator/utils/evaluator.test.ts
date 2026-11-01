import { describe, it, expect } from 'vitest';
import { evaluateProgram, formatNumber, type EvaluateOptions } from './evaluator';

/**
 * 取整段程序最后一个表达式的值
 *
 * @param input - 程序文本
 * @param options - 求值选项
 * @returns 最后一条语句的值
 */
function valueOf(input: string, options?: EvaluateOptions): number {
  return evaluateProgram(input, options).value;
}

describe('evaluateProgram 基础运算与优先级', () => {
  it('四则运算遵循先乘除后加减', () => {
    expect(valueOf('1 + 2 * 3')).toBe(7);
    expect(valueOf('10 / 4 + 1')).toBe(3.5);
  });

  it('括号改变运算顺序', () => {
    expect(valueOf('(1 + 2) * 3')).toBe(9);
    expect(valueOf('((2 + 3) * (4 - 1))')).toBe(15);
  });

  it('幂运算右结合', () => {
    expect(valueOf('2^3^2')).toBe(512);
    expect(valueOf('2^(3^2)')).toBe(512);
    expect(valueOf('(2^3)^2')).toBe(64);
  });

  it('一元负号优先级低于幂', () => {
    expect(valueOf('-2^2')).toBe(-4);
    expect(valueOf('(-2)^2')).toBe(4);
    expect(valueOf('2^-1')).toBe(0.5);
    expect(valueOf('2 * -3')).toBe(-6);
  });

  it('取模与连续运算', () => {
    expect(valueOf('10 % 3')).toBe(1);
    expect(valueOf('1 + 2 + 3 - 4')).toBe(2);
  });

  it('支持小数与科学计数法', () => {
    expect(valueOf('0.5 + .25')).toBe(0.75);
    expect(valueOf('1e3 + 2')).toBe(1002);
    expect(valueOf('1.5e-1')).toBeCloseTo(0.15);
  });
});

describe('evaluateProgram 阶乘', () => {
  it('非负整数阶乘', () => {
    expect(valueOf('0!')).toBe(1);
    expect(valueOf('5!')).toBe(120);
    expect(valueOf('(2 + 3)!')).toBe(120);
    expect(valueOf('3!!')).toBe(720);
  });

  it('非法阶乘报错', () => {
    expect(() => valueOf('2.5!')).toThrow(/非负整数/);
    expect(() => valueOf('(-1)!')).toThrow(/非负整数/);
    expect(() => valueOf('171!')).toThrow(/过大/);
  });
});

describe('evaluateProgram 函数与常量', () => {
  it('常用代数函数', () => {
    expect(valueOf('sqrt(16)')).toBe(4);
    expect(valueOf('cbrt(-27)')).toBe(-3);
    expect(valueOf('abs(-5)')).toBe(5);
    expect(valueOf('floor(2.9) + ceil(2.1) + round(2.4)')).toBe(7);
    expect(valueOf('pow(2, 10)')).toBe(1024);
    expect(valueOf('max(1, 2, 3) + min(1, 2, 3)')).toBe(4);
  });

  it('对数函数', () => {
    expect(valueOf('log(e)')).toBeCloseTo(1);
    expect(valueOf('ln(1)')).toBe(0);
    expect(valueOf('log10(1000)')).toBeCloseTo(3);
    expect(valueOf('log2(8)')).toBe(3);
    expect(() => valueOf('log(-1)')).toThrow(/大于 0/);
  });

  it('三角函数默认使用弧度', () => {
    expect(valueOf('sin(pi / 2)')).toBeCloseTo(1);
    expect(valueOf('cos(pi)')).toBeCloseTo(-1);
    expect(valueOf('tan(pi / 4)')).toBeCloseTo(1);
    expect(valueOf('tau / pi')).toBeCloseTo(2);
  });

  it('角度模式下三角函数按度换算', () => {
    expect(valueOf('sin(30)', { degrees: true })).toBeCloseTo(0.5);
    expect(valueOf('cos(60)', { degrees: true })).toBeCloseTo(0.5);
    expect(valueOf('asin(1)', { degrees: true })).toBeCloseTo(90);
    expect(valueOf('atan2(1, 1)', { degrees: true })).toBeCloseTo(45);
  });

  it('函数名大小写不敏感、参数个数校验', () => {
    expect(valueOf('SIN(0)')).toBe(0);
    expect(() => valueOf('sqrt()')).toThrow(/参数/);
    expect(() => valueOf('pow(1)')).toThrow(/参数/);
    expect(() => valueOf('foo(1)')).toThrow(/未知函数/);
  });

  it('反三角函数域校验', () => {
    expect(() => valueOf('asin(2)')).toThrow(/区间/);
    expect(() => valueOf('sqrt(-4)')).toThrow(/负数/);
  });
});

describe('evaluateProgram 多行与变量', () => {
  it('变量赋值并复用', () => {
    expect(valueOf('x = 3\ny = 4\nsqrt(x^2 + y^2)')).toBe(5);
  });

  it('变量可在后续赋值中引用自身', () => {
    expect(valueOf('x = 2\nx = x + 1\nx * 10')).toBe(30);
  });

  it('空行与注释被忽略，返回最后一条语句的值', () => {
    expect(valueOf('# comment\n\n// another\n1 + 1\n')).toBe(2);
  });

  it('预置变量上下文', () => {
    expect(valueOf('a + b', { context: { a: 2, b: 3 } })).toBe(5);
  });

  it('不能给内置函数或常量赋值', () => {
    expect(() => valueOf('pi = 3')).toThrow(/常量/);
    expect(() => valueOf('sin = 1')).toThrow(/函数/);
  });

  it('结果包含逐步计算记录与最终变量表', () => {
    const result = evaluateProgram('x = 2\nx + 3 * 4');
    expect(result.variables.x).toBe(2);
    expect(result.steps.filter((step) => step.heading)).toHaveLength(2);
    expect(result.steps.some((step) => step.text.includes('3 * 4 = 12'))).toBe(true);
  });
});

describe('evaluateProgram 错误定位', () => {
  it('空输入报错', () => {
    expect(() => evaluateProgram('')).toThrow(/至少一条/);
    expect(() => evaluateProgram('# only comment\n\n')).toThrow(/至少一条/);
  });

  it('错误带行号与列号', () => {
    expect(() => valueOf('1 + 1\n2 / 0')).toThrow(/第 2 行/);
    expect(() => valueOf('1 +\n2')).toThrow(/第 1 行第/);
    expect(() => valueOf('(1 + 2')).toThrow(/右括号/);
    expect(() => valueOf('1 2')).toThrow(/意外的符号/);
    expect(() => valueOf('1 + a')).toThrow(/未定义的变量/);
    expect(() => valueOf('@')).toThrow(/无法识别的字符/);
  });
});

describe('formatNumber', () => {
  it('整数原样输出', () => {
    expect(formatNumber(12)).toBe('12');
    expect(formatNumber(-0)).toBe('0');
  });

  it('浮点消除二进制尾差', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
    expect(formatNumber(1 / 3)).toBe('0.333333333333');
  });

  it('特殊值文本', () => {
    expect(formatNumber(Number.NaN)).toBe('NaN');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('Infinity');
  });
});
