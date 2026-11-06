import { describe, it, expect } from 'vitest';
import {
  add,
  subtract,
  scale,
  dot,
  cross,
  magnitude,
  normalize,
  angleRadians,
  angleDegrees,
  scalarProjection,
  vectorProjection,
  roundVector,
  roundScalar,
} from './vector';

describe('向量加减法与数乘', () => {
  it('A+B 分量正确', () => {
    expect(add([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9]);
  });

  it('A-B 分量正确', () => {
    expect(subtract([4, 5, 6], [1, 2, 3])).toEqual([3, 3, 3]);
  });

  it('数乘 k·A 正确', () => {
    expect(scale([1, -2, 3], 2)).toEqual([2, -4, 6]);
  });

  it('维度不一致抛错', () => {
    expect(() => add([1, 2], [1, 2, 3])).toThrow(/维度不一致/);
  });
});

describe('点积与叉积', () => {
  it('(1,2,3)·(4,5,6) = 32', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it('2D 点积可用', () => {
    expect(dot([1, 0], [0, 1])).toBe(0);
  });

  it('3D 叉积 (1,2,3)×(4,5,6) = (-3,6,-3)', () => {
    expect(cross([1, 2, 3], [4, 5, 6])).toEqual([-3, 6, -3]);
  });

  it('2D 叉积被禁用并提示', () => {
    expect(() => cross([1, 2], [3, 4])).toThrow(/叉积仅支持 3D/);
  });
});

describe('模长与单位化', () => {
  it('(3,4) 模长为 5', () => {
    expect(magnitude([3, 4])).toBe(5);
  });

  it('3D 模长正确', () => {
    expect(magnitude([1, 2, 2])).toBe(3);
  });

  it('(3,4) 单位化为 (0.6, 0.8)', () => {
    expect(roundVector(normalize([3, 4]))).toEqual([0.6, 0.8]);
  });

  it('零向量单位化抛错而非返回 NaN', () => {
    expect(() => normalize([0, 0])).toThrow(/零向量/);
  });
});

describe('夹角', () => {
  it('垂直向量夹角为 90 度', () => {
    expect(roundScalar(angleDegrees([1, 0], [0, 1]))).toBe(90);
  });

  it('垂直向量夹角为 π/2 弧度', () => {
    expect(roundScalar(angleRadians([1, 0], [0, 1]))).toBe(roundScalar(Math.PI / 2));
  });

  it('平行同向向量夹角为 0 度', () => {
    expect(roundScalar(angleDegrees([2, 0], [5, 0]))).toBe(0);
  });

  it('反向向量夹角为 180 度', () => {
    expect(roundScalar(angleDegrees([1, 0], [-1, 0]))).toBe(180);
  });

  it('零向量求夹角抛错而非 NaN', () => {
    expect(() => angleDegrees([0, 0], [1, 1])).toThrow(/零向量/);
  });
});

describe('投影', () => {
  it('(3,4) 在 (1,0) 上标量投影为 3', () => {
    expect(scalarProjection([3, 4], [1, 0])).toBe(3);
  });

  it('(3,4) 在 (1,0) 上向量投影为 (3,0)', () => {
    expect(vectorProjection([3, 4], [1, 0])).toEqual([3, 0]);
  });

  it('投影到零向量抛错', () => {
    expect(() => vectorProjection([1, 2], [0, 0])).toThrow(/零向量/);
    expect(() => scalarProjection([1, 2], [0, 0])).toThrow(/零向量/);
  });

  it('3D 向量投影正确', () => {
    // (1,2,3) 在 (0,0,1) 上投影为 (0,0,3)
    expect(roundVector(vectorProjection([1, 2, 3], [0, 0, 1]))).toEqual([0, 0, 3]);
  });
});

describe('舍入辅助', () => {
  it('消除 -0', () => {
    expect(roundScalar(-0)).toBe(0);
    expect(roundVector([-0, 1])).toEqual([0, 1]);
  });

  it('按指定位数四舍五入', () => {
    expect(roundScalar(1.23456789, 2)).toBe(1.23);
  });
});
