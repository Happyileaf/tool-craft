import { describe, expect, it } from 'vitest';
import {
  distanceBetweenPoints,
  distancePointToLine,
  footOfPerpendicular,
  formatExact,
  formatGeneralForm,
  formatPointSlope,
  formatSlopeIntercept,
  intersection,
  isVerticalLine,
  lineFromGeneral,
  lineRelation,
  lineThroughPoints,
  midpoint,
  parallelLineThrough,
  perpendicularLineThrough,
  slopeOfLine,
  toFraction,
} from './geometry';

describe('两点基本量', () => {
  it('计算距离与中点', () => {
    expect(distanceBetweenPoints({ x: 0, y: 0 }, { x: 4, y: 6 })).toBeCloseTo(Math.sqrt(52), 9);
    expect(midpoint({ x: 0, y: 0 }, { x: 4, y: 6 })).toEqual({ x: 2, y: 3 });
    expect(midpoint({ x: -1, y: 2 }, { x: 2, y: 5 })).toEqual({ x: 0.5, y: 3.5 });
  });

  it('两点重合时抛错且坐标非法时报错', () => {
    expect(() => lineThroughPoints({ x: 1, y: 2 }, { x: 1, y: 2 })).toThrow(
      '两点重合，无法确定唯一一条直线',
    );
    expect(() => distanceBetweenPoints({ x: Number.NaN, y: 0 }, { x: 0, y: 0 })).toThrow(
      '起点的坐标必须为有效数值',
    );
  });
});

describe('直线方程', () => {
  it('过 (1,2) 与 (3,6) 得到斜率为 2 的直线', () => {
    const line = lineThroughPoints({ x: 1, y: 2 }, { x: 3, y: 6 });
    expect(slopeOfLine(line)).toBeCloseTo(2, 9);
    expect(formatGeneralForm(line)).toBe('2x - y = 0');
    expect(formatSlopeIntercept(line)).toBe('y = 2x');
    expect(formatPointSlope(line, { x: 1, y: 2 })).toBe('y - 2 = 2(x - 1)');
  });

  it('竖直线斜率不存在，一般式为 x - 2 = 0', () => {
    const line = lineThroughPoints({ x: 2, y: 1 }, { x: 2, y: 5 });
    expect(slopeOfLine(line)).toBeNull();
    expect(isVerticalLine(line)).toBe(true);
    expect(formatGeneralForm(line)).toBe('x - 2 = 0');
    expect(formatSlopeIntercept(line)).toBeNull();
    expect(formatPointSlope(line, { x: 2, y: 1 })).toBe('x = 2');
  });

  it('水平线斜率为 0，斜截式为 y = 3', () => {
    const line = lineThroughPoints({ x: 1, y: 3 }, { x: 5, y: 3 });
    expect(slopeOfLine(line)).toBeCloseTo(0, 9);
    expect(formatSlopeIntercept(line)).toBe('y = 3');
    expect(formatGeneralForm(line)).toBe('y - 3 = 0');
  });

  it('一般式系数非法时抛错', () => {
    expect(() => lineFromGeneral(0, 0, 1)).toThrow('直线方程的 A、B 不能同时为 0');
  });
});

describe('两直线关系与交点', () => {
  const lineA = lineFromGeneral(2, -1, 1); // y = 2x + 1

  it('平行直线无交点', () => {
    const lineB = lineFromGeneral(2, -1, 5); // y = 2x + 5
    expect(lineRelation(lineA, lineB)).toBe('parallel');
    expect(intersection(lineA, lineB)).toBeNull();
  });

  it('系数成比例时判定为重合', () => {
    const lineB = lineFromGeneral(4, -2, 2); // 2y = 4x + 2
    expect(lineRelation(lineA, lineB)).toBe('coincident');
    expect(intersection(lineA, lineB)).toBeNull();
  });

  it('相交直线给出精确交点 (1, 0)', () => {
    const lineB = lineFromGeneral(1, 1, -1); // x + y = 1
    const lineC = lineFromGeneral(1, -1, -1); // x - y = 1
    expect(lineRelation(lineB, lineC)).toBe('intersect');
    expect(intersection(lineB, lineC)).toEqual({ x: 1, y: 0 });
  });

  it('与 y = 2x + 1 相交的 x - y + 1 = 0 交于 (0, 1)', () => {
    const lineB = lineFromGeneral(1, -1, 1);
    expect(intersection(lineA, lineB)).toEqual({ x: 0, y: 1 });
  });
});

describe('点到直线距离与垂足', () => {
  const line = lineFromGeneral(3, 4, -10);

  it('点 (3,4) 到 3x + 4y - 10 = 0 的距离为 3', () => {
    expect(distancePointToLine({ x: 3, y: 4 }, line)).toBeCloseTo(3, 9);
  });

  it('垂足为 (6/5, 8/5)', () => {
    const foot = footOfPerpendicular({ x: 3, y: 4 }, line);
    expect(foot.x).toBeCloseTo(1.2, 9);
    expect(foot.y).toBeCloseTo(1.6, 9);
  });

  it('点到直线距离对竖直线同样有效', () => {
    expect(distancePointToLine({ x: 5, y: 3 }, lineFromGeneral(1, 0, -2))).toBeCloseTo(3, 9);
  });

  it('非法直线系数报错', () => {
    expect(() => distancePointToLine({ x: 0, y: 0 }, { a: 0, b: 0, c: 0 })).toThrow(
      '直线方程的 A、B 不能同时为 0',
    );
  });
});

describe('平行线与垂线构造', () => {
  it('过 (4,0) 与 y = 2x + 1 垂直的直线为 y = -x/2 + 2', () => {
    const perpendicular = perpendicularLineThrough(lineFromGeneral(2, -1, 1), { x: 4, y: 0 });
    expect(formatGeneralForm(perpendicular)).toBe('x + 2y - 4 = 0');
    expect(formatSlopeIntercept(perpendicular)).toBe('y = -1/2x + 2');
  });

  it('过 (0,3) 与 y = 2x + 1 平行的直线截距为 3', () => {
    const parallel = parallelLineThrough(lineFromGeneral(2, -1, 1), { x: 0, y: 3 });
    expect(formatGeneralForm(parallel)).toBe('2x - y + 3 = 0');
  });

  it('竖直线 x = 2 的垂线为水平线 y = 4', () => {
    const perpendicular = perpendicularLineThrough(lineFromGeneral(1, 0, -2), { x: 3, y: 4 });
    expect(formatSlopeIntercept(perpendicular)).toBe('y = 4');
    expect(isVerticalLine(perpendicular)).toBe(false);
  });
});

describe('分数与小数格式化', () => {
  it('小数转分数自动约分', () => {
    expect(toFraction(1.5)).toEqual({ numerator: 3, denominator: 2 });
    expect(formatExact(1.5)).toBe('3/2 ≈ 1.5');
    expect(formatExact(2)).toBe('2');
    expect(formatExact(-0.5)).toBe('-1/2 ≈ -0.5');
  });

  it('循环小数近似为最简分数', () => {
    expect(formatExact(0.3333)).toBe('1/3 ≈ 0.3333');
  });
});
