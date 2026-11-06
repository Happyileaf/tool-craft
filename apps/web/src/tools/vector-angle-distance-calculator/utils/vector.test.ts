import { describe, expect, it } from 'vitest';
import {
  EPSILON,
  VectorError,
  add,
  angleBetween,
  cross,
  dot,
  magnitude,
  relation,
  scale,
  scalarProjection,
  subtract,
  toDegrees,
  vectorProjection,
} from './vector';

describe('magnitude 模长', () => {
  it('二维与三维模长', () => {
    expect(magnitude([3, 4])).toBeCloseTo(5, 10);
    expect(magnitude([1, 2, 2])).toBeCloseTo(3, 10);
    expect(magnitude([0, 0])).toBe(0);
  });
});

describe('dot 点积', () => {
  it('正交向量点积为 0', () => {
    expect(dot([1, 0], [0, 1])).toBe(0);
    expect(dot([1, 0, 0], [0, 1, 0])).toBe(0);
  });

  it('一般点积', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it('维度不一致抛错', () => {
    expect(() => dot([1, 2], [1, 2, 3])).toThrow(VectorError);
  });
});

describe('cross 叉积', () => {
  it('二维标量叉积', () => {
    expect(cross([1, 0], [0, 1])).toBe(1);
    expect(cross([0, 1], [1, 0])).toBe(-1);
    expect(cross([2, 3], [4, 5])).toBe(10 - 12);
  });

  it('三维标准基 e1×e2 = e3', () => {
    expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
    expect(cross([0, 1, 0], [1, 0, 0])).toEqual([0, 0, -1]);
  });

  it('三维一般叉积', () => {
    expect(cross([1, 2, 3], [4, 5, 6])).toEqual([-3, 6, -3]);
  });

  it('平行向量叉积为零向量', () => {
    const result = cross([1, 2, 3], [2, 4, 6]) as number[];
    expect(result[0]).toBeCloseTo(0, 10);
    expect(result[1]).toBeCloseTo(0, 10);
    expect(result[2]).toBeCloseTo(0, 10);
  });
});

describe('angleBetween 夹角', () => {
  it('同向 0°、反向 180°、垂直 90°', () => {
    expect(toDegrees(angleBetween([1, 0], [2, 0]))).toBeCloseTo(0, 10);
    expect(toDegrees(angleBetween([1, 0], [-1, 0]))).toBeCloseTo(180, 10);
    expect(toDegrees(angleBetween([1, 0], [0, 1]))).toBeCloseTo(90, 10);
    expect(toDegrees(angleBetween([1, 0, 0], [0, 0, 1]))).toBeCloseTo(90, 10);
  });

  it('3-4-5 三角形夹角约 53.13°', () => {
    expect(toDegrees(angleBetween([3, 0], [3, 4]))).toBeCloseTo(53.130102, 5);
  });

  it('零向量抛错', () => {
    expect(() => angleBetween([0, 0], [1, 1])).toThrow(VectorError);
    expect(() => angleBetween([1, 1], [0, 0, 0])).toThrow(VectorError);
  });
});

describe('projection 投影', () => {
  it('标量投影', () => {
    expect(scalarProjection([3, 4], [1, 0])).toBeCloseTo(3, 10);
    // 投影到反向向量带负号
    expect(scalarProjection([3, 4], [-1, 0])).toBeCloseTo(-3, 10);
  });

  it('向量投影与方向向量共线', () => {
    const proj = vectorProjection([3, 4], [1, 0]) as number[];
    expect(proj[0]).toBeCloseTo(3, 10);
    expect(proj[1]).toBeCloseTo(0, 10);
  });

  it('零方向向量抛错', () => {
    expect(() => scalarProjection([1, 1], [0, 0])).toThrow(VectorError);
    expect(() => vectorProjection([1, 1], [0, 0])).toThrow(VectorError);
  });
});

describe('add / subtract / scale', () => {
  it('加减与数乘', () => {
    expect(add([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9]);
    expect(subtract([4, 5, 6], [1, 2, 3])).toEqual([3, 3, 3]);
    expect(scale([1, -2, 3], 2)).toEqual([2, -4, 6]);
  });

  it('非法数乘系数抛错', () => {
    expect(() => scale([1, 2], Number.NaN)).toThrow(VectorError);
  });
});

describe('relation 方向关系', () => {
  it('正交', () => {
    expect(relation([1, 0], [0, 1])).toBe('orthogonal');
    expect(relation([1, 0, 0], [0, 0, 2])).toBe('orthogonal');
  });

  it('平行同向与反向', () => {
    expect(relation([1, 2], [2, 4])).toBe('parallel-same');
    expect(relation([1, 2, 3], [-2, -4, -6])).toBe('parallel-opposite');
  });

  it('既不正交也不平行', () => {
    expect(relation([1, 0], [1, 1])).toBe('neither');
  });

  it('容差边界：微小点积视为正交', () => {
    expect(relation([1, 0], [EPSILON / 2, 1])).toBe('orthogonal');
  });

  it('零向量抛错', () => {
    expect(() => relation([0, 0], [1, 0])).toThrow(VectorError);
  });
});
