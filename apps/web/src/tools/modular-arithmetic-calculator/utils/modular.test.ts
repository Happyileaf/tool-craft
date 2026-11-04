import { describe, it, expect } from 'vitest';
import {
  parseBigInt,
  extendedGcd,
  modularInverse,
  modularPow,
  solveLinearCongruence,
  chineseRemainder,
} from './modular';

describe('parseBigInt', () => {
  it('解析十进制与 0x 十六进制', () => {
    expect(parseBigInt('123')).toBe(BigInt(123));
    expect(parseBigInt('0xFF')).toBe(BigInt(255));
    expect(parseBigInt('  -7 ')).toBe(-BigInt(7));
    expect(parseBigInt('+42')).toBe(BigInt(42));
  });

  it('空输入与非法格式抛出错误', () => {
    expect(() => parseBigInt('   ')).toThrowError(/不能为空/);
    expect(() => parseBigInt('12ab')).toThrowError(/无法解析/);
  });

  it('支持超出安全整数范围的大整数', () => {
    expect(parseBigInt('9007199254740993')).toBe(BigInt('9007199254740993'));
  });
});

describe('extendedGcd', () => {
  it('返回正确的 gcd 与贝祖系数', () => {
    const result = extendedGcd(BigInt(35), BigInt(15));
    expect(result.gcd).toBe(BigInt(5));
    expect(BigInt(35) * result.x + BigInt(15) * result.y).toBe(BigInt(5));
  });

  it('互素时 gcd 为 1', () => {
    expect(extendedGcd(BigInt(3), BigInt(7)).gcd).toBe(BigInt(1));
  });
});

describe('modularInverse', () => {
  it('3 在模 7 下的逆元为 5', () => {
    expect(modularInverse(BigInt(3), BigInt(7))).toBe(BigInt(5));
  });

  it('逆元回乘模 m 等于 1', () => {
    const inv = modularInverse(BigInt(17), BigInt(3120));
    expect((BigInt(17) * inv) % BigInt(3120)).toBe(BigInt(1));
  });

  it('非互素时抛出含 gcd 的错误', () => {
    expect(() => modularInverse(BigInt(2), BigInt(4))).toThrowError(/gcd\(2, 4\) = 2/);
  });

  it('负数底数按规范化处理', () => {
    expect(modularInverse(-BigInt(3), BigInt(7))).toBe(BigInt(2));
  });
});

describe('modularPow', () => {
  it('2^10 mod 1000 = 24', () => {
    expect(modularPow(BigInt(2), BigInt(10), BigInt(1000))).toBe(BigInt(24));
  });

  it('模 1 恒为 0', () => {
    expect(modularPow(BigInt(123), BigInt(456), BigInt(1))).toBe(BigInt(0));
  });

  it('大整数指数结果正确', () => {
    // 费马小定理：2^(p-1) ≡ 1 (mod p)
    expect(modularPow(BigInt(2), BigInt(1000003) - BigInt(1), BigInt(1000003))).toBe(BigInt(1));
  });

  it('负指数走逆元路径', () => {
    expect(modularPow(BigInt(3), -BigInt(1), BigInt(7))).toBe(BigInt(5));
    expect(modularPow(BigInt(3), -BigInt(2), BigInt(7))).toBe(BigInt(4));
  });

  it('非正模数抛出错误', () => {
    expect(() => modularPow(BigInt(1), BigInt(1), BigInt(0))).toThrowError(/正整数/);
  });
});

describe('solveLinearCongruence', () => {
  it('2x ≡ 4 (mod 6) 有两个解 2 与 5', () => {
    const result = solveLinearCongruence(BigInt(2), BigInt(4), BigInt(6));
    expect(result.count).toBe(BigInt(2));
    expect(result.step).toBe(BigInt(3));
    expect(result.solutions).toEqual([BigInt(2), BigInt(5)]);
  });

  it('互素系数只有唯一解', () => {
    const result = solveLinearCongruence(BigInt(3), BigInt(2), BigInt(7));
    expect(result.count).toBe(BigInt(1));
    expect(result.solutions).toEqual([BigInt(3)]);
  });

  it('gcd 不整除右端项时无解', () => {
    expect(() => solveLinearCongruence(BigInt(2), BigInt(1), BigInt(4))).toThrowError(/无解/);
  });

  it('全部解代回原方程均成立', () => {
    const { solutions, modulus } = solveLinearCongruence(BigInt(6), BigInt(10), BigInt(14));
    solutions.forEach((x) => {
      expect((BigInt(6) * x) % modulus).toBe(BigInt(10) % modulus);
    });
  });
});

describe('chineseRemainder', () => {
  it('经典教材向量：x≡2 mod3, x≡3 mod5, x≡2 mod7 → 23 mod105', () => {
    const result = chineseRemainder([
      { remainder: BigInt(2), modulus: BigInt(3) },
      { remainder: BigInt(3), modulus: BigInt(5) },
      { remainder: BigInt(2), modulus: BigInt(7) },
    ]);
    expect(result.remainder).toBe(BigInt(23));
    expect(result.modulus).toBe(BigInt(105));
  });

  it('单个方程返回规范化余数与模数', () => {
    expect(chineseRemainder([{ remainder: BigInt(9), modulus: BigInt(11) }])).toEqual({
      remainder: BigInt(9),
      modulus: BigInt(11),
    });
  });

  it('非互素模数可解情形：x≡2 mod4 与 x≡4 mod6 → 10 mod12', () => {
    const result = chineseRemainder([
      { remainder: BigInt(2), modulus: BigInt(4) },
      { remainder: BigInt(4), modulus: BigInt(6) },
    ]);
    expect(result.remainder).toBe(BigInt(10));
    expect(result.modulus).toBe(BigInt(12));
  });

  it('同余冲突时抛出错误', () => {
    expect(() =>
      chineseRemainder([
        { remainder: BigInt(1), modulus: BigInt(4) },
        { remainder: BigInt(0), modulus: BigInt(2) },
      ]),
    ).toThrowError(/同余冲突/);
  });

  it('空方程组抛出错误', () => {
    expect(() => chineseRemainder([])).toThrowError(/不能为空/);
  });
});
