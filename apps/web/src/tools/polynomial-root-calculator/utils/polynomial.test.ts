import { describe, expect, it } from 'vitest';
import {
  formatComplex,
  formatNum,
  solvePolynomial,
  type PolynomialRoot,
} from './polynomial';

function approx(actual: number, expected: number, tolerance = 1e-6): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

function expectRootSet(
  roots: PolynomialRoot[],
  expected: Array<[number, number]>,
  tolerance = 1e-6,
): void {
  // 期望形如 [re, im]，按根的 multiplicity 展开后逐一匹配
  const actual = roots.flatMap((r) =>
    Array.from({ length: r.multiplicity }, () => [r.re, r.im] as [number, number]),
  );
  expect(actual.length).toBe(expected.length);
  const used = new Array(expected.length).fill(false);
  for (const [re, im] of actual) {
    const index = expected.findIndex(
      ([ere, eim], i) =>
        !used[i] && approx(re, ere, tolerance) && approx(im, eim, tolerance),
    );
    expect(index).toBeGreaterThanOrEqual(0);
    used[index] = true;
  }
}

describe('solvePolynomial 二次方程', () => {
  it('x² − 5x + 6 = 0：两个实根 2、3', () => {
    const result = solvePolynomial({ mode: 'quadratic', a: 1, b: -5, c: 6 });
    expect(result.degree).toBe(2);
    expect(result.discriminant).toBe(1);
    expectRootSet(result.roots, [
      [2, 0],
      [3, 0],
    ]);
  });

  it('x² + 1 = 0：一对共轭复根 ±i', () => {
    const result = solvePolynomial({ mode: 'quadratic', a: 1, b: 0, c: 1 });
    expect(result.discriminant).toBe(-4);
    expectRootSet(result.roots, [
      [0, -1],
      [0, 1],
    ]);
  });

  it('x² − 2x + 1 = 0：二重实根 1', () => {
    const result = solvePolynomial({ mode: 'quadratic', a: 1, b: -2, c: 1 });
    expect(result.discriminant).toBeCloseTo(0, 10);
    expect(result.roots).toHaveLength(1);
    expect(result.roots[0]!.re).toBe(1);
    expect(result.roots[0]!.multiplicity).toBe(2);
  });

  it('2x² + 4x + 2 = 0：a≠1 时同样得二重根 −1', () => {
    const result = solvePolynomial({ mode: 'quadratic', a: 2, b: 4, c: 2 });
    expect(result.roots[0]!.re).toBe(-1);
    expect(result.roots[0]!.multiplicity).toBe(2);
  });

  it('x² + x + 1 = 0：复根 −0.5 ± √3/2 i', () => {
    const result = solvePolynomial({ mode: 'quadratic', a: 1, b: 1, c: 1 });
    expectRootSet(result.roots, [
      [-0.5, -Math.sqrt(3) / 2],
      [-0.5, Math.sqrt(3) / 2],
    ]);
  });

  it('3x² − 2x − 1 = 0：实根 −1/3 与 1', () => {
    const result = solvePolynomial({ mode: 'quadratic', a: 3, b: -2, c: -1 });
    expect(result.discriminant).toBe(16);
    expectRootSet(result.roots, [
      [-1 / 3, 0],
      [1, 0],
    ]);
  });

  it('负首项系数 −x² + 4 = 0：根 ±2', () => {
    const result = solvePolynomial({ mode: 'quadratic', a: -1, b: 0, c: 4 });
    expectRootSet(result.roots, [
      [-2, 0],
      [2, 0],
    ]);
  });

  it('a=0 降次为一次方程 2x + 4 = 0', () => {
    const result = solvePolynomial({ mode: 'quadratic', a: 0, b: 2, c: 4 });
    expect(result.degree).toBe(1);
    expect(result.discriminant).toBeNull();
    expect(result.roots[0]!.re).toBe(-2);
  });

  it('a=b=0、c≠0：矛盾常数方程抛错', () => {
    expect(() => solvePolynomial({ mode: 'quadratic', a: 0, b: 0, c: 5 })).toThrow(
      '无解',
    );
  });
});

describe('solvePolynomial 三次方程', () => {
  it('x³ − 1 = 0：1 与共轭复根 −0.5 ± √3/2 i', () => {
    const result = solvePolynomial({ mode: 'cubic', a: 1, b: 0, c: 0, d: -1 });
    expect(result.degree).toBe(3);
    expect(result.discriminant).toBeGreaterThan(0);
    expectRootSet(result.roots, [
      [1, 0],
      [-0.5, -Math.sqrt(3) / 2],
      [-0.5, Math.sqrt(3) / 2],
    ]);
  });

  it('x³ − 6x² + 11x − 6 = 0：三个实根 1、2、3', () => {
    const result = solvePolynomial({ mode: 'cubic', a: 1, b: -6, c: 11, d: -6 });
    expect(result.discriminant).toBeLessThan(0);
    expectRootSet(result.roots, [
      [1, 0],
      [2, 0],
      [3, 0],
    ]);
  });

  it('x³ − x = 0：根 −1、0、1', () => {
    const result = solvePolynomial({ mode: 'cubic', a: 1, b: 0, c: -1, d: 0 });
    expectRootSet(result.roots, [
      [-1, 0],
      [0, 0],
      [1, 0],
    ]);
  });

  it('(x−2)³ = x³ − 6x² + 12x − 8：三重根 2', () => {
    const result = solvePolynomial({ mode: 'cubic', a: 1, b: -6, c: 12, d: -8 });
    expect(result.roots).toHaveLength(1);
    expect(result.roots[0]!.re).toBeCloseTo(2, 6);
    expect(result.roots[0]!.multiplicity).toBe(3);
  });

  it('x³ − 3x + 2 = (x−1)²(x+2)：二重根 1 与单根 −2', () => {
    const result = solvePolynomial({ mode: 'cubic', a: 1, b: 0, c: -3, d: 2 });
    const byValue = result.roots.find((r) => approx(r.re, 1));
    const byMinusTwo = result.roots.find((r) => approx(r.re, -2));
    expect(byValue?.multiplicity).toBe(2);
    expect(byMinusTwo?.multiplicity).toBe(1);
    expectRootSet(result.roots, [
      [-2, 0],
      [1, 0],
      [1, 0],
    ]);
  });

  it('x³ + x = 0：实根 0 与复根 ±i', () => {
    const result = solvePolynomial({ mode: 'cubic', a: 1, b: 0, c: 1, d: 0 });
    expect(result.discriminant).toBeGreaterThan(0);
    expectRootSet(result.roots, [
      [0, 0],
      [0, -1],
      [0, 1],
    ]);
  });

  it('2x³ − 4x² − 22x + 24 = 0：首项非 1 的三实根 −3、1、4', () => {
    const result = solvePolynomial({ mode: 'cubic', a: 2, b: -4, c: -22, d: 24 });
    expectRootSet(result.roots, [
      [-3, 0],
      [1, 0],
      [4, 0],
    ]);
  });

  it('a=0 时自动降次按二次方程求解', () => {
    const result = solvePolynomial({ mode: 'cubic', a: 0, b: 1, c: -5, d: 6 });
    expect(result.degree).toBe(2);
    expectRootSet(result.roots, [
      [2, 0],
      [3, 0],
    ]);
  });

  it('a=b=0 时降次为一次方程', () => {
    const result = solvePolynomial({ mode: 'cubic', a: 0, b: 0, c: 3, d: -9 });
    expect(result.degree).toBe(1);
    expect(result.roots[0]!.re).toBe(3);
  });
});

describe('solvePolynomial 输入校验', () => {
  it('系数缺失抛错', () => {
    expect(() =>
      solvePolynomial({ mode: 'quadratic', a: 1, b: 2, c: undefined }),
    ).toThrow('请填写全部系数');
  });

  it('系数为 Infinity / NaN 抛错', () => {
    expect(() =>
      solvePolynomial({ mode: 'quadratic', a: 1, b: Number.POSITIVE_INFINITY, c: 1 }),
    ).toThrow('请填写全部系数');
    expect(() =>
      solvePolynomial({ mode: 'cubic', a: 1, b: Number.NaN, c: 1, d: 1 }),
    ).toThrow('请填写全部系数');
  });

  it('全零多项式抛错', () => {
    expect(() => solvePolynomial({ mode: 'cubic', a: 0, b: 0, c: 0, d: 0 })).toThrow(
      '任意 x',
    );
  });
});

describe('formatNum 与 formatComplex', () => {
  it('formatNum 去尾零并处理异常值', () => {
    expect(formatNum(2)).toBe('2');
    expect(formatNum(0.5)).toBe('0.5');
    expect(formatNum(Math.sqrt(2))).toBe('1.414214');
    expect(formatNum(Number.NaN)).toBe('-');
  });

  it('formatComplex 正确表达实根 / 纯虚根 / 混合复根 / 重根', () => {
    expect(formatComplex({ re: 3, im: 0, multiplicity: 1 })).toBe('3');
    expect(formatComplex({ re: 0, im: 1, multiplicity: 1 })).toBe('1i');
    expect(formatComplex({ re: 0, im: -1, multiplicity: 1 })).toBe('-1i');
    expect(formatComplex({ re: -0.5, im: 0.866, multiplicity: 1 })).toBe(
      '-0.5 + 0.866i',
    );
    expect(formatComplex({ re: 1, im: 0, multiplicity: 2 })).toBe('1（重数 2）');
  });

  it('steps 包含判别式与求解说明', () => {
    const result = solvePolynomial({ mode: 'quadratic', a: 1, b: -5, c: 6 });
    expect(result.steps.length).toBeGreaterThanOrEqual(2);
    expect(result.steps[0]!.detail).toContain('Δ');
  });
});
