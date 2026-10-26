import { describe, it, expect } from 'vitest';
import {
  analyzeNumber,
  formatFactorExpression,
  gcdMany,
  gcdPair,
  isPrime,
  lcmMany,
  lcmPair,
  listDivisors,
  parseInteger,
  parseIntegerList,
  primeFactorize,
} from './number-theory';

describe('输入解析', () => {
  it('解析带符号整数', () => {
    expect(parseInteger('  -42 ')).toBe(-42);
    expect(parseInteger('+7')).toBe(7);
  });

  it('支持逗号、空格、中文顿号等分隔', () => {
    expect(parseIntegerList('12, 18  24；30、36')).toEqual([12, 18, 24, 30, 36]);
    expect(parseIntegerList('\n 7 \n')).toEqual([7]);
  });

  it('非整数与超安全整数报错', () => {
    expect(() => parseInteger('1.5')).toThrow('合法整数');
    expect(() => parseInteger('abc')).toThrow('合法整数');
    expect(() => parseInteger('9007199254740993')).toThrow('安全整数');
  });
});

describe('GCD / LCM', () => {
  it('两数 GCD：gcd(48,18)=6，支持负数与零', () => {
    expect(gcdPair(48, 18)).toBe(6);
    expect(gcdPair(-48, 18)).toBe(6);
    expect(gcdPair(7, 0)).toBe(7);
  });

  it('多值 GCD：gcd(12,18,24)=6', () => {
    expect(gcdMany([12, 18, 24])).toBe(6);
    expect(gcdMany([12, 18, 24, 0])).toBe(6);
  });

  it('两数 LCM：lcm(4,6)=12，先除后乘', () => {
    expect(lcmPair(4, 6)).toBe(12);
    expect(lcmPair(7, 5)).toBe(35);
    expect(lcmPair(0, 9)).toBe(0);
  });

  it('多值 LCM：lcm(6,10,15)=30', () => {
    expect(lcmMany([6, 10, 15])).toBe(30);
  });

  it('数量必须在 2–10 个', () => {
    expect(() => gcdMany([1])).toThrow('2–10');
    expect(() => lcmMany(new Array(11).fill(2))).toThrow('2–10');
  });
});

describe('质数判定', () => {
  it('97 为质数，360 为合数', () => {
    expect(isPrime(97)).toBe(true);
    expect(isPrime(360)).toBe(false);
  });

  it('0、1 既非质数也非合数；2 是质数；负数取绝对值', () => {
    expect(isPrime(0)).toBeNull();
    expect(isPrime(1)).toBeNull();
    expect(isPrime(2)).toBe(true);
    expect(isPrime(-13)).toBe(true);
  });
});

describe('质因数分解', () => {
  it('360 = 2^3 × 3^2 × 5', () => {
    expect(primeFactorize(360)).toEqual([
      { prime: 2, exponent: 3 },
      { prime: 3, exponent: 2 },
      { prime: 5, exponent: 1 },
    ]);
  });

  it('质数仅含自身一次；1 与 0 为空', () => {
    expect(primeFactorize(97)).toEqual([{ prime: 97, exponent: 1 }]);
    expect(primeFactorize(1)).toEqual([]);
    expect(primeFactorize(0)).toEqual([]);
  });

  it('表达式格式', () => {
    expect(formatFactorExpression(360, primeFactorize(360))).toBe('360 = 2^3 × 3^2 × 5');
    expect(formatFactorExpression(97, primeFactorize(97))).toBe('97 = 97');
  });
});

describe('因数枚举与综合分析', () => {
  it('12 的全部因数为 1,2,3,4,6,12', () => {
    expect(listDivisors(12)).toEqual([1, 2, 3, 4, 6, 12]);
  });

  it('平方数的平方根不重复', () => {
    expect(listDivisors(36)).toEqual([1, 2, 3, 4, 6, 9, 12, 18, 36]);
    expect(listDivisors(1)).toEqual([1]);
    expect(listDivisors(0)).toEqual([]);
  });

  it('analyzeNumber 聚合分类结果', () => {
    const result = analyzeNumber('360');
    expect(result.classification).toBe('composite');
    expect(result.divisorCount).toBe(24);
    expect(result.factorExpression).toBe('360 = 2^3 × 3^2 × 5');
    expect(analyzeNumber(97).classification).toBe('prime');
    expect(analyzeNumber(1).classification).toBe('neutral');
    expect(analyzeNumber(0).classification).toBe('zero');
    expect(analyzeNumber(-12).divisors).toEqual([1, 2, 3, 4, 6, 12]);
  });
});
