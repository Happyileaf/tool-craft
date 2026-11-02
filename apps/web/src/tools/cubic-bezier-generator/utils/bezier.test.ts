import { describe, expect, it } from 'vitest';
import {
  BEZIER_PRESETS,
  cubicBezierAxis,
  cubicBezierPoint,
  formatBezier,
  sampleBezier,
  solveCubicBezierY,
  validateBezier,
  type BezierControlPoints,
} from './bezier';

const ease: BezierControlPoints = BEZIER_PRESETS.ease!;
const linear: BezierControlPoints = BEZIER_PRESETS.linear!;

describe('cubicBezierAxis / cubicBezierPoint', () => {
  it('evaluates endpoints for any points', () => {
    expect(cubicBezierAxis(0, 0.25, 0.25)).toBe(0);
    expect(cubicBezierAxis(1, 0.25, 0.25)).toBe(1);
  });

  it('produces x(t) === y(t) for the linear preset', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const point = cubicBezierPoint(t, linear);
      expect(point.x).toBeCloseTo(point.y, 10);
    }
    expect(cubicBezierPoint(0, linear)).toEqual({ x: 0, y: 0 });
    expect(cubicBezierPoint(1, linear)).toEqual({ x: 1, y: 1 });
  });

  it('allows y overshoot beyond [0,1]', () => {
    const back = BEZIER_PRESETS['ease-in-back']!;
    const values = Array.from({ length: 21 }, (_, i) =>
      cubicBezierPoint(i / 20, back),
    );
    expect(Math.min(...values.map((p) => p.y))).toBeLessThan(0);
  });
});

describe('solveCubicBezierY', () => {
  it('returns 0 and 1 at the boundaries for any curve', () => {
    expect(solveCubicBezierY(0, ease)).toBe(0);
    expect(solveCubicBezierY(1, ease)).toBe(1);
  });

  it('is identity for the linear preset', () => {
    for (let i = 1; i < 10; i += 1) {
      const x = i / 10;
      expect(solveCubicBezierY(x, linear)).toBeCloseTo(x, 6);
    }
  });

  it('is monotonic and accurate for standard presets', () => {
    const presets: BezierControlPoints[] = [
      BEZIER_PRESETS['ease-in']!,
      BEZIER_PRESETS['ease-out']!,
      BEZIER_PRESETS['ease-in-out']!,
      ease,
    ];
    for (const preset of presets) {
      let previous = 0;
      for (let i = 0; i <= 50; i += 1) {
        const x = i / 50;
        const y = solveCubicBezierY(x, preset);
        expect(y).toBeGreaterThanOrEqual(previous - 1e-6);
        previous = y;
      }
      expect(solveCubicBezierY(0.5, preset)).toBeCloseTo(
        cubicBezierAxis(solveT(0.5, preset), preset.y1, preset.y2),
        6,
      );
    }
  });

  it('matches direct curve sampling within tolerance', () => {
    // 对每个 t，先用 x(t) 反解 y，应等于 y(t)
    for (const t of [0.13, 0.37, 0.58, 0.83]) {
      const p = cubicBezierPoint(t, ease);
      expect(solveCubicBezierY(p.x, ease)).toBeCloseTo(p.y, 5);
    }
  });
});

/** 测试辅助：二分求 x(t)=x 的 t */
function solveT(x: number, points: BezierControlPoints): number {
  let low = 0;
  let high = 1;
  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    if (cubicBezierAxis(mid, points.x1, points.x2) < x) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

describe('validateBezier', () => {
  it('accepts in-range x and overshoot y', () => {
    expect(validateBezier({ x1: 0, y1: 1.56, x2: 0.64, y2: 1 })).toBeNull();
  });

  it('rejects out-of-range x', () => {
    expect(validateBezier({ x1: -0.1, y1: 0, x2: 1, y2: 1 })).toMatch(/0 到 1/);
    expect(validateBezier({ x1: 0, y1: 0, x2: 1.2, y2: 1 })).toMatch(/0 到 1/);
  });

  it('rejects non-finite values', () => {
    expect(validateBezier({ x1: NaN, y1: 0, x2: 1, y2: 1 })).toMatch(/有限数字/);
  });
});

describe('formatBezier', () => {
  it('formats the ease preset per CSS spec', () => {
    expect(formatBezier(ease)).toBe('cubic-bezier(0.25, 0.1, 0.25, 1)');
    expect(formatBezier(linear)).toBe('cubic-bezier(0, 0, 1, 1)');
  });
});

describe('sampleBezier', () => {
  it('returns the requested number of inclusive samples', () => {
    const points = sampleBezier(ease, 10);
    expect(points).toHaveLength(11);
    expect(points[0]!).toEqual({ x: 0, y: 0 });
    expect(points[10]!).toEqual({ x: 1, y: 1 });
  });
});
