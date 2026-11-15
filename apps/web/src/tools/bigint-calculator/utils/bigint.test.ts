import { describe, expect, it } from 'vitest';
import {
  computeBigInt,
  decimalDigits,
  factorialBigInt,
  formatDecimal,
  gcdBigInt,
  modInverse,
  modPow,
  parseBigInt,
} from './bigint';

describe('parseBigInt 与格式化', () => {
  it('解析正负号与千位逗号', () => {
    expect(parseBigInt('1,234,567')).toBe(BigInt(1234567));
    expect(parseBigInt(' -42 ')).toBe(BigInt(-42));
    expect(() => parseBigInt('12.5')).toThrow();
    expect(() => parseBigInt('abc')).toThrow();
    expect(() => parseBigInt('')).toThrow();
  });

  it('分组十进制并保留符号', () => {
    expect(formatDecimal(BigInt('12345678901234567890'))).toBe('12,345,678,901,234,567,890');
    expect(formatDecimal(BigInt(-1234567))).toBe('-1,234,567');
    expect(formatDecimal(BigInt(0))).toBe('0');
  });
});

describe('computeBigInt 四则运算', () => {
  it('加减乘保持任意精度', () => {
    expect(computeBigInt('add', '99999999999999999999', '1', '').value).toBe(
      BigInt('100000000000000000000'),
    );
    expect(computeBigInt('sub', '100000000000000000000', '1', '').value).toBe(
      BigInt('99999999999999999999'),
    );
    expect(computeBigInt('mul', '12345678901234567890', '98765432109876543210', '').value).toBe(
      BigInt('1219326311370217952237463801111263526900'),
    );
  });

  it('整除返回商与余数', () => {
    const result = computeBigInt('div', '100', '7', '');
    expect(result.quotient).toBe(BigInt(14));
    expect(result.remainder).toBe(BigInt(2));
    expect(result.value).toBe(BigInt(14));
    expect(computeBigInt('mod', '100', '7', '').value).toBe(BigInt(2));
  });

  it('除数为 0 报错', () => {
    expect(() => computeBigInt('div', '100', '0', '')).toThrow();
    expect(() => computeBigInt('mod', '100', '0', '')).toThrow();
  });
});

describe('computeBigInt 幂与阶乘', () => {
  it('2^100 精确结果', () => {
    const result = computeBigInt('pow', '2', '100', '');
    expect(result.value.toString()).toBe('1267650600228229401496703205376');
    expect(result.decimalDigits).toBe(31);
  });

  it('50! 精确结果与尾随零', () => {
    const value = factorialBigInt(BigInt(50));
    expect(value.toString()).toBe(
      '30414093201713378043612608166064768844377641568960512000000000000',
    );
    expect(value.toString().match(/0+$/)?.[0].length).toBe(12);
    expect(decimalDigits(value)).toBe(65);
  });

  it('拒绝负数阶乘与超大指数', () => {
    expect(() => computeBigInt('factorial', '-1', '', '')).toThrow();
    expect(() => computeBigInt('pow', '2', '-1', '')).toThrow();
    expect(() => computeBigInt('pow', '2', '10001', '')).toThrow();
  });
});

describe('数论运算', () => {
  it('gcd 与 lcm', () => {
    expect(gcdBigInt(BigInt(1071), BigInt(462))).toBe(BigInt(21));
    expect(computeBigInt('lcm', '21', '6', '').value).toBe(BigInt(42));
    expect(computeBigInt('lcm', '0', '6', '').value).toBe(BigInt(0));
  });

  it('模幂结果正确', () => {
    expect(modPow(BigInt(3), BigInt(200), BigInt(1000000007))).toBe(BigInt(136318165));
    expect(computeBigInt('modPow', '3', '200', '1000000007').value).toBe(BigInt(136318165));
  });

  it('模逆元满足乘积同余 1', () => {
    const inverse = modInverse(BigInt(3), BigInt(11));
    expect(inverse).toBe(BigInt(4));
    expect((BigInt(3) * inverse) % BigInt(11)).toBe(BigInt(1));
    expect(() => computeBigInt('modInverse', '6', '', '9')).toThrow();
    expect(() => computeBigInt('modPow', '3', '5', '0')).toThrow();
  });
});

describe('computeBigInt 结果展示', () => {
  it('同时给出十六进制、二进制与位数', () => {
    const result = computeBigInt('pow', '2', '100', '');
    expect(result.hexadecimal.startsWith('0x1')).toBe(true);
    expect(result.binaryBits).toBe(101);
    expect(result.decimal).toBe('1,267,650,600,228,229,401,496,703,205,376');
  });

  it('大数相乘结果与已知向量一致', () => {
    const result = computeBigInt(
      'mul',
      '170141183460469231731687303715884105727',
      '2305843009213693951',
      '',
    );
    expect(result.value.toString()).toBe('392318858461667547569595655490009919272404068553904357377');
  });
});
