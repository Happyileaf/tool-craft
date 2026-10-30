import { describe, expect, it } from 'vitest';
import { formatNum, solveTriangle } from './triangle';

/** 容差比较（角度/边长） */
function approx(actual: number, expected: number, tolerance = 1e-4): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

describe('solveTriangle - SSS', () => {
  it('求解 3-4-5 直角三角形', () => {
    const { solutions, ambiguous } = solveTriangle({ mode: 'SSS', a: 3, b: 4, c: 5 });
    expect(ambiguous).toBe(false);
    expect(solutions).toHaveLength(1);
    const s = solutions[0]!;
    // c=5 为斜边，角 C = 90°
    expect(approx(s.C, 90)).toBe(true);
    expect(approx(s.A, 36.8699)).toBe(true);
    expect(approx(s.B, 53.1301)).toBe(true);
    expect(approx(s.area, 6)).toBe(true);
    expect(s.perimeter).toBe(12);
  });

  it('求解等边三角形', () => {
    const { solutions } = solveTriangle({ mode: 'SSS', a: 2, b: 2, c: 2 });
    const s = solutions[0]!;
    expect(approx(s.A, 60)).toBe(true);
    expect(approx(s.B, 60)).toBe(true);
    expect(approx(s.C, 60)).toBe(true);
    expect(approx(s.area, Math.sqrt(3))).toBe(true);
    expect(s.perimeter).toBe(6);
  });

  it('违反三角不等式时报错', () => {
    expect(() => solveTriangle({ mode: 'SSS', a: 1, b: 2, c: 3 })).toThrow(
      '三角不等式',
    );
    expect(() => solveTriangle({ mode: 'SSS', a: 10, b: 1, c: 1 })).toThrow();
  });

  it('缺失边长时报错', () => {
    expect(() => solveTriangle({ mode: 'SSS', a: 3, b: 4 } as never)).toThrow(
      '边 c',
    );
  });
});

describe('solveTriangle - SAS', () => {
  it('两边及夹角 3、4、90° 求出斜边 5', () => {
    const { solutions } = solveTriangle({ mode: 'SAS', a: 3, b: 4, C: 90 });
    const s = solutions[0]!;
    expect(approx(s.c, 5)).toBe(true);
    expect(approx(s.C, 90)).toBe(true);
    expect(approx(s.area, 6)).toBe(true);
  });

  it('等边情形：两边 2 夹角 60°，第三边也是 2', () => {
    const { solutions } = solveTriangle({ mode: 'SAS', a: 2, b: 2, C: 60 });
    const s = solutions[0]!;
    expect(approx(s.c, 2)).toBe(true);
    expect(approx(s.A, 60)).toBe(true);
    expect(approx(s.B, 60)).toBe(true);
    expect(approx(s.area, Math.sqrt(3))).toBe(true);
  });

  it('夹角必须小于 180°', () => {
    expect(() => solveTriangle({ mode: 'SAS', a: 3, b: 4, C: 180 })).toThrow();
  });
});

describe('solveTriangle - ASA', () => {
  it('A=60 B=60 夹边 c=2 求等边三角形', () => {
    const { solutions } = solveTriangle({ mode: 'ASA', A: 60, B: 60, c: 2 });
    const s = solutions[0]!;
    expect(approx(s.a, 2)).toBe(true);
    expect(approx(s.b, 2)).toBe(true);
    expect(approx(s.C, 60)).toBe(true);
    expect(approx(s.area, Math.sqrt(3))).toBe(true);
  });

  it('两角之和 >= 180° 时报错', () => {
    expect(() => solveTriangle({ mode: 'ASA', A: 100, B: 80, c: 5 })).toThrow(
      '180',
    );
  });
});

describe('solveTriangle - AAS', () => {
  it('A=90 B=30 对边 a=10：30-60-90 三角形', () => {
    const { solutions } = solveTriangle({ mode: 'AAS', A: 90, B: 30, a: 10 });
    const s = solutions[0]!;
    expect(approx(s.C, 60)).toBe(true);
    expect(approx(s.b, 5)).toBe(true);
    expect(approx(s.c, 8.660254)).toBe(true);
    expect(approx(s.area, 21.650635)).toBe(true);
  });
});

describe('solveTriangle - SSA 歧义', () => {
  it('锐角歧义：a=7 b=8 A=60° 存在两解', () => {
    const { solutions, ambiguous } = solveTriangle({ mode: 'SSA', a: 7, b: 8, A: 60 });
    expect(ambiguous).toBe(true);
    expect(solutions).toHaveLength(2);
    const angles = solutions.map((s) => s.B).sort((x, y) => x - y);
    // sin(B) = 8·sin60/7 ≈ 0.9897 → B ≈ 81.79° 或 98.21°
    expect(approx(angles[0]!, 81.7868, 1e-3)).toBe(true);
    expect(approx(angles[1]!, 98.2132, 1e-3)).toBe(true);
    // 两解三角各自闭合：A+B+C=180
    for (const s of solutions) {
      expect(approx(s.A + s.B + s.C, 180, 1e-6)).toBe(true);
    }
  });

  it('唯一解：a=5 b=8 A=90°（sinB>1 之外的合法唯一情形，钝角三角形）', () => {
    // A=90 为直角，a 为斜边，b=8 < 5 不成立；改用 a 为较大对边
    const { solutions, ambiguous } = solveTriangle({ mode: 'SSA', a: 9, b: 8, A: 60 });
    // sin(B) = 8·sin60/9 ≈ 0.7698，B2=180-B1 时 A+B2>180 → 唯一解
    expect(ambiguous).toBe(false);
    expect(solutions).toHaveLength(1);
    expect(approx(solutions[0]!.B, 50.336, 1e-3)).toBe(true);
  });

  it('无解：sin(B) > 1', () => {
    expect(() => solveTriangle({ mode: 'SSA', a: 5, b: 10, A: 60 })).toThrow();
  });

  it('直角唯一解：sin(B)=1', () => {
    // a=10, A=30°, b=10√3·... 构造 sinB=1：b·sinA = a → b = a/sinA = 20
    const { solutions, ambiguous } = solveTriangle({ mode: 'SSA', a: 10, b: 20, A: 30 });
    expect(ambiguous).toBe(false);
    expect(solutions).toHaveLength(1);
    expect(approx(solutions[0]!.B, 90)).toBe(true);
    expect(approx(solutions[0]!.C, 60)).toBe(true);
  });
});

describe('solveTriangle - 输入校验', () => {
  it('非正数值报错', () => {
    expect(() => solveTriangle({ mode: 'SSS', a: 0, b: 4, c: 5 })).toThrow('正数');
    expect(() => solveTriangle({ mode: 'SSS', a: -3, b: 4, c: 5 })).toThrow(
      '正数',
    );
  });

  it('非有限值报错', () => {
    expect(() =>
      solveTriangle({ mode: 'SSS', a: Number.NaN, b: 4, c: 5 }),
    ).toThrow();
  });
});

describe('formatNum', () => {
  it('去除浮点尾零', () => {
    expect(formatNum(5.0000001, 6)).toBe('5');
    expect(formatNum(8.660254)).toBe('8.660254');
    expect(formatNum(36.8698976)).toBe('36.869898');
  });

  it('非有限值返回占位符', () => {
    expect(formatNum(Number.NaN)).toBe('-');
  });
});
