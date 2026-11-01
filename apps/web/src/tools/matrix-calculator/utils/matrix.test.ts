import { describe, it, expect } from 'vitest';
import { Fraction } from './fraction';
import {
  parseMatrix,
  add,
  subtract,
  scalarMultiply,
  multiply,
  transpose,
  determinant,
  inverse,
  gaussJordan,
  solveSystem,
  identity,
} from './matrix';

const f = (text: string): Fraction => new Fraction(BigInt(text.split('/')[0]!), BigInt(text.split('/')[1] ?? 1));

/** 以二维字符串数组比对分数矩阵 */
function textMatrix(matrix: Fraction[][]): string[][] {
  return matrix.map((row) => row.map((value) => value.toString()));
}

describe('parseMatrix', () => {
  it('支持空格、逗号与换行分隔，自动识别行列', () => {
    expect(textMatrix(parseMatrix('1 2\n3 4'))).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
    expect(textMatrix(parseMatrix('1, 2; 3, 4'))).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('支持分数与小数解析为精确分数', () => {
    const m = parseMatrix('1/2 0.25\n-1.5 2');
    expect(textMatrix(m)).toEqual([['1/2', '1/4'], ['-3/2', '2']]);
  });

  it('行列数不一致时报错', () => {
    expect(() => parseMatrix('1 2 3\n4 5')).toThrowError(/不一致/);
  });

  it('非法 token 报错', () => {
    expect(() => parseMatrix('1 abc')).toThrowError(/无法识别的数字/);
  });
});

describe('基础运算', () => {
  const a = parseMatrix('1 2\n3 4');
  const b = parseMatrix('5 6\n7 8');

  it('加法 / 减法', () => {
    expect(textMatrix(add(a, b))).toEqual([
      ['6', '8'],
      ['10', '12'],
    ]);
    expect(textMatrix(subtract(b, a))).toEqual([
      ['4', '4'],
      ['4', '4'],
    ]);
  });

  it('标量乘法', () => {
    expect(textMatrix(scalarMultiply(a, f('3')))).toEqual([
      ['3', '6'],
      ['9', '12'],
    ]);
  });

  it('矩阵乘法及维度校验', () => {
    const c = parseMatrix('1 2 3\n4 5 6');
    const d = parseMatrix('7 8\n9 10\n11 12');
    expect(textMatrix(multiply(c, d))).toEqual([
      ['58', '64'],
      ['139', '154'],
    ]);
    expect(() => multiply(d, c)).not.toThrow();
    const e = parseMatrix('1 2');
    expect(() => multiply(e, d)).toThrowError(/维度不匹配/);
  });

  it('加法维度不匹配报错', () => {
    expect(() => add(a, parseMatrix('1 2 3'))).toThrowError(/维度不匹配/);
  });

  it('转置', () => {
    expect(textMatrix(transpose(parseMatrix('1 2 3\n4 5 6')))).toEqual([
      ['1', '4'],
      ['2', '5'],
      ['3', '6'],
    ]);
  });
});

describe('determinant', () => {
  it('2×2 与 3×3 经典值', () => {
    expect(determinant(parseMatrix('1 2\n3 4')).toString()).toBe('-2');
    expect(determinant(parseMatrix('6 1 1\n4 -2 5\n2 8 7')).toString()).toBe('-306');
  });

  it('奇异矩阵行列式为 0', () => {
    expect(determinant(parseMatrix('1 2\n2 4')).isZero()).toBe(true);
  });

  it('分数矩阵行列式精确', () => {
    expect(determinant(parseMatrix('1/2 1\n0 4')).toString()).toBe('2');
  });

  it('非方阵报错', () => {
    expect(() => determinant(parseMatrix('1 2 3\n4 5 6'))).toThrowError(/方阵/);
  });
});

describe('inverse', () => {
  it('逆矩阵与原矩阵互乘为单位阵', () => {
    const a = parseMatrix('4 7\n2 6');
    const inv = inverse(a);
    expect(inv).not.toBeNull();
    expect(textMatrix(multiply(a, inv!))).toEqual([
      ['1', '0'],
      ['0', '1'],
    ]);
  });

  it('3×3 逆矩阵精确分数', () => {
    const a = parseMatrix('1 2 3\n0 1 4\n5 6 0');
    const inv = inverse(a);
    expect(textMatrix(inv!)).toEqual([
      ['-24', '18', '5'],
      ['20', '-15', '-4'],
      ['-5', '4', '1'],
    ]);
  });

  it('奇异矩阵返回 null', () => {
    expect(inverse(parseMatrix('1 2\n2 4'))).toBeNull();
  });
});

describe('gaussJordan - RREF 与秩', () => {
  it('满秩矩阵化为单位阵', () => {
    const { rref, rank } = gaussJordan(parseMatrix('1 2\n3 4'));
    expect(rank).toBe(2);
    expect(textMatrix(rref)).toEqual([
      ['1', '0'],
      ['0', '1'],
    ]);
  });

  it('含相关行的矩阵给出秩与 RREF', () => {
    const { rank, rref } = gaussJordan(parseMatrix('1 2 3\n2 4 6\n1 1 1'));
    expect(rank).toBe(2);
    expect(textMatrix(rref)).toEqual([
      ['1', '0', '-1'],
      ['0', '1', '2'],
      ['0', '0', '0'],
    ]);
  });

  it('分数消元结果精确', () => {
    const { rref } = gaussJordan(parseMatrix('2 1\n1 1'));
    expect(textMatrix(rref)).toEqual([
      ['1', '0'],
      ['0', '1'],
    ]);
  });

  it('部分主元交换：首列零主元自动换行', () => {
    const { rref, rank } = gaussJordan(parseMatrix('0 1\n1 0'));
    expect(rank).toBe(2);
    expect(textMatrix(rref)).toEqual([
      ['1', '0'],
      ['0', '1'],
    ]);
  });
});

describe('solveSystem', () => {
  it('唯一解', () => {
    const a = parseMatrix('2 1\n1 -1');
    const b = [f('5'), f('1')];
    const result = solveSystem(a, b);
    expect(result.kind).toBe('unique');
    expect(result.unique!.map((x) => x.toString())).toEqual(['2', '1']);
  });

  it('无解（矛盾方程）', () => {
    const a = parseMatrix('1 1\n2 2');
    const b = [f('3'), f('8')];
    expect(solveSystem(a, b).kind).toBe('none');
  });

  it('无穷多解并报告自由变量列', () => {
    const a = parseMatrix('1 1\n2 2');
    const b = [f('3'), f('6')];
    const result = solveSystem(a, b);
    expect(result.kind).toBe('infinite');
    expect(result.freeVariables).toEqual([1]);
  });

  it('3×3 含零主元的方程组仍得唯一解', () => {
    const a = parseMatrix('0 1 2\n1 0 1\n2 1 1');
    const b = [f('1'), f('2'), f('3')];
    const result = solveSystem(a, b);
    expect(result.kind).toBe('unique');
    // 代回验证 Ax=b
    const x = result.unique!;
    const check = a.map((row) =>
      row.reduce((acc, value, j) => acc.add(value.mul(x[j]!)), Fraction.zero()),
    );
    expect(check.map((v) => v.toString())).toEqual(['1', '2', '3']);
  });

  it('单位阵构造正确', () => {
    expect(textMatrix(identity(3))).toEqual([
      ['1', '0', '0'],
      ['0', '1', '0'],
      ['0', '0', '1'],
    ]);
  });
});
