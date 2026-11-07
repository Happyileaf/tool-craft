import { describe, it, expect } from 'vitest';
import {
  parseNumber,
  analyzeTwoPoints,
  lineFromSlopeIntercept,
  slopeOf,
  relateLines,
  pointToLineDistance,
  distanceBetween,
  areParallel,
  formatLineEquation,
  formatNumber,
  type LineGeneral,
  type LineRelation,
  type Point,
} from './geometry';

function assertRelation(value: LineRelation | { error: string }): LineRelation {
  if ('error' in value) {
    throw new Error(value.error);
  }
  return value;
}

describe('parseNumber', () => {
  it('解析有限数值并拒绝空串与非法文本', () => {
    expect(parseNumber('3.5')).toBe(3.5);
    expect(parseNumber('  ')).toBeNull();
    expect(parseNumber('NaN')).toBeNull();
  });
});

describe('analyzeTwoPoints', () => {
  it('计算 (0,0) 与 (3,4) 的距离、中点、斜率与方程', () => {
    const r = analyzeTwoPoints({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect('error' in r).toBe(false);
    if (!('error' in r)) {
      expect(r.length).toBe(5);
      expect(r.slope).toBeCloseTo(4 / 3, 10);
      expect(r.midpoint).toEqual({ x: 1.5, y: 2 });
      expect(r.angleDeg).toBeCloseTo(53.130102, 5);
      // -4x + 3y = 0
      expect(r.line.a).toBe(-4);
      expect(r.line.b).toBe(3);
      expect(r.line.c).toBe(0);
    }
  });

  it('竖直线斜率为 null、倾斜角 90°', () => {
    const r = analyzeTwoPoints({ x: 2, y: 1 }, { x: 2, y: 5 });
    if (!('error' in r)) {
      expect(r.slope).toBeNull();
      expect(r.angleDeg).toBe(90);
      expect(r.length).toBe(4);
    }
  });

  it('水平线倾斜角为 0°', () => {
    const r = analyzeTwoPoints({ x: 0, y: 3 }, { x: 5, y: 3 });
    if (!('error' in r)) {
      expect(r.slope).toBe(0);
      expect(r.angleDeg).toBe(0);
    }
  });

  it('相同两点报错', () => {
    expect(analyzeTwoPoints({ x: 1, y: 1 }, { x: 1, y: 1 })).toEqual({
      error: '两个点坐标完全相同，无法确定一条直线',
    });
  });
});

describe('直线关系', () => {
  it('相交直线返回交点：y=2x 与 y=x+1 交于 (1,2)', () => {
    const l1 = lineFromSlopeIntercept(2, 0);
    const l2 = lineFromSlopeIntercept(1, 1);
    const relation = assertRelation(relateLines(l1, l2));
    expect(relation.kind).toBe('intersect');
    if (relation.kind === 'intersect') {
      expect(relation.point.x).toBeCloseTo(1, 10);
      expect(relation.point.y).toBeCloseTo(2, 10);
    }
  });

  it('垂直直线识别为 perpendicular 且给出垂足', () => {
    const l1 = lineFromSlopeIntercept(1, 0); // y = x
    const l2 = lineFromSlopeIntercept(-1, 0); // y = -x
    const relation = assertRelation(relateLines(l1, l2));
    expect(relation.kind).toBe('perpendicular');
  });

  it('平行直线识别 parallel，同一直线识别 coincident', () => {
    const l1: LineGeneral = { a: 1, b: -1, c: 0 };
    const l2: LineGeneral = { a: 2, b: -2, c: 4 }; // 2x-2y+4=0 → y=x+2
    expect(assertRelation(relateLines(l1, l2)).kind).toBe('parallel');
    const same: LineGeneral = { a: 2, b: -2, c: 0 };
    expect(assertRelation(relateLines(l1, same)).kind).toBe('coincident');
  });

  it('竖直线参与相交不除零：x=1 与 y=2 交于 (1,2)', () => {
    const vertical: LineGeneral = { a: 1, b: 0, c: -1 };
    const horizontal: LineGeneral = { a: 0, b: 1, c: -2 };
    const relation = assertRelation(relateLines(vertical, horizontal));
    expect(relation.kind).toBe('perpendicular');
    if ('point' in relation) {
      expect(relation.point).toEqual({ x: 1, y: 2 });
    }
  });

  it('slopeOf 对竖直线返回 null', () => {
    expect(slopeOf({ a: 1, b: 0, c: -1 })).toBeNull();
    expect(slopeOf(lineFromSlopeIntercept(2, 3))).toBe(2);
  });
});

describe('距离与平行判定', () => {
  it('点到直线距离：原点到 3x+4y+5=0 为 1', () => {
    const d = pointToLineDistance({ x: 0, y: 0 } as Point, { a: 3, b: 4, c: 5 });
    expect(d).toBe(1);
  });

  it('两点距离', () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 6, y: 8 })).toBe(10);
  });

  it('两组点确定的直线平行判定', () => {
    expect(
      areParallel({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 3 }, { x: 4, y: 5 }),
    ).toBe(true);
    expect(
      areParallel({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }),
    ).toBe(false);
  });
});

describe('格式化', () => {
  it('一般式方程可读输出', () => {
    expect(formatLineEquation({ a: 2, b: 3, c: -5 })).toBe('2x + 3y - 5 = 0');
    expect(formatLineEquation({ a: -1, b: 1, c: 0 })).toBe('-x + y = 0');
  });

  it('数字格式化与竖直占位', () => {
    expect(formatNumber(2)).toBe('2');
    expect(formatNumber(1 / 3)).toBe('0.333333');
    expect(formatNumber(null)).toBe('不存在（竖直）');
    expect(formatNumber(-0)).toBe('0');
  });
});
