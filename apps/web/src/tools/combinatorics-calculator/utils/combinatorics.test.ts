import { describe, expect, it } from 'vitest';
import {
  calculateCombinatorics,
  circularPermutation,
  combination,
  factorial,
  groupThousands,
  parseNonNegativeInteger,
  permutation,
  repetitionCombination,
  repetitionPermutation,
  toScientific,
} from './combinatorics';

describe('factorial', () => {
  it('处理边界 0! 与 1!', () => {
    expect(factorial(0)).toBe(BigInt(1));
    expect(factorial(1)).toBe(BigInt(1));
  });

  it('计算常见阶乘', () => {
    expect(factorial(5)).toBe(BigInt(120));
    expect(factorial(10)).toBe(BigInt(3628800));
    expect(factorial(20).toString()).toBe('2432902008176640000');
  });
});

describe('permutation', () => {
  it('计算排列数 P(n,r)', () => {
    expect(permutation(5, 2)).toBe(BigInt(20));
    expect(permutation(5, 5)).toBe(BigInt(120));
    expect(permutation(10, 3)).toBe(BigInt(720));
  });

  it('P(n,0) = 1', () => {
    expect(permutation(5, 0)).toBe(BigInt(1));
  });
});

describe('combination', () => {
  it('计算组合数 C(n,r)', () => {
    expect(combination(5, 2)).toBe(BigInt(10));
    expect(combination(10, 3)).toBe(BigInt(120));
    expect(combination(52, 5).toString()).toBe('2598960');
  });

  it('满足对称性 C(n,r) = C(n,n-r) 与边界', () => {
    expect(combination(10, 7)).toBe(combination(10, 3));
    expect(combination(5, 0)).toBe(BigInt(1));
    expect(combination(5, 5)).toBe(BigInt(1));
  });

  it('大参数保持精确（C(200,100) 已知值）', () => {
    expect(combination(200, 100).toString()).toBe(
      '90548514656103281165404177077484163874504589675413336841320',
    );
  });
});

describe('repetitionPermutation', () => {
  it('计算可放回排列 n^r', () => {
    expect(repetitionPermutation(2, 3)).toBe(BigInt(8));
    expect(repetitionPermutation(3, 4)).toBe(BigInt(81));
  });

  it('处理 n^0 = 1 与 0^r', () => {
    expect(repetitionPermutation(10, 0)).toBe(BigInt(1));
    expect(repetitionPermutation(0, 0)).toBe(BigInt(1));
    expect(repetitionPermutation(0, 3)).toBe(BigInt(0));
  });

  it('支持大指数快速幂', () => {
    expect(repetitionPermutation(2, 64).toString()).toBe('18446744073709551616');
  });
});

describe('repetitionCombination', () => {
  it('计算可放回组合 C(n+r-1,r)', () => {
    expect(repetitionCombination(5, 3)).toBe(BigInt(35));
    expect(repetitionCombination(4, 3)).toBe(BigInt(20));
  });

  it('n=1 时只有一种取法', () => {
    expect(repetitionCombination(1, 100)).toBe(BigInt(1));
  });
});

describe('circularPermutation', () => {
  it('计算圆排列 (n-1)!', () => {
    expect(circularPermutation(5)).toBe(BigInt(24));
    expect(circularPermutation(6)).toBe(BigInt(120));
  });

  it('n=1 时 (0)! = 1', () => {
    expect(circularPermutation(1)).toBe(BigInt(1));
  });
});

describe('toScientific', () => {
  it('小整数不返回科学计数法', () => {
    expect(toScientific(BigInt(1))).toBeNull();
    expect(toScientific(BigInt('999999999999999'))).toBeNull();
  });

  it('100! 近似为 9.332621544e+157', () => {
    expect(toScientific(factorial(100))).toBe('9.332621544e+157');
  });

  it('处理四舍五入进位（16 位的 10^15）', () => {
    expect(toScientific(BigInt('1000000000000000'))).toBe('1e+15');
  });

  it('末位达到进位阈值时正确进位', () => {
    expect(toScientific(BigInt('9999999999900000'))).toBe('1e+16');
  });
});

describe('groupThousands', () => {
  it('添加千位分隔符', () => {
    expect(groupThousands('1234567')).toBe('1,234,567');
    expect(groupThousands('1000')).toBe('1,000');
    expect(groupThousands('99')).toBe('99');
    expect(groupThousands('1000000')).toBe('1,000,000');
  });
});

describe('parseNonNegativeInteger', () => {
  it('合法输入通过', () => {
    expect(parseNonNegativeInteger('12', 'n')).toBeNull();
    expect(parseNonNegativeInteger(' 0 ', 'r')).toBeNull();
    expect(parseNonNegativeInteger('1000', 'n')).toBeNull();
  });

  it('拒绝空值、负数、小数与非数字', () => {
    expect(parseNonNegativeInteger('', 'n')?.field).toBe('n');
    expect(parseNonNegativeInteger('-1', 'n')?.message).toContain('非负整数');
    expect(parseNonNegativeInteger('1.5', 'r')?.message).toContain('非负整数');
    expect(parseNonNegativeInteger('abc', 'r')?.field).toBe('r');
  });

  it('拒绝超过上限', () => {
    const error = parseNonNegativeInteger('1001', 'n');
    expect(error).not.toBeNull();
    expect(error?.message).toContain('1000');
  });
});

describe('calculateCombinatorics', () => {
  it('n=5,r=2 返回全部六项且值正确', () => {
    const result = calculateCombinatorics(5, 2);
    const map = new Map(result.items.map((item) => [item.key, item]));
    expect(result.n).toBe(5);
    expect(result.r).toBe(2);
    expect(map.get('factorial')?.exact).toBe('120');
    expect(map.get('permutation')?.exact).toBe('20');
    expect(map.get('combination')?.exact).toBe('10');
    expect(map.get('repetitionPermutation')?.exact).toBe('25');
    expect(map.get('repetitionCombination')?.exact).toBe('15');
    expect(map.get('circularPermutation')?.exact).toBe('24');
    expect(result.items.every((item) => item.available)).toBe(true);
  });

  it('r > n 时排列与组合标记不可用并给出原因', () => {
    const result = calculateCombinatorics(3, 5);
    const map = new Map(result.items.map((item) => [item.key, item]));
    expect(map.get('permutation')?.available).toBe(false);
    expect(map.get('permutation')?.exact).toBeNull();
    expect(map.get('permutation')?.reason).toContain('r ≤ n');
    expect(map.get('combination')?.available).toBe(false);
    expect(map.get('repetitionPermutation')?.available).toBe(true);
    expect(map.get('repetitionPermutation')?.exact).toBe('243');
  });

  it('n=0 时重复组合与圆排列不可用', () => {
    const result = calculateCombinatorics(0, 0);
    const map = new Map(result.items.map((item) => [item.key, item]));
    expect(map.get('factorial')?.exact).toBe('1');
    expect(map.get('repetitionPermutation')?.exact).toBe('1');
    expect(map.get('repetitionCombination')?.available).toBe(false);
    expect(map.get('circularPermutation')?.available).toBe(false);
  });

  it('n=1000,r=1000 大值场景为重复组合标记科学计数法', () => {
    const result = calculateCombinatorics(1000, 1000);
    const repCombination = result.items.find((item) => item.key === 'repetitionCombination');
    expect(repCombination?.available).toBe(true);
    expect(repCombination?.exact).not.toBeNull();
    expect(repCombination?.scientific).toMatch(/^1\.\d+e\+\d+$/);
  });
});
