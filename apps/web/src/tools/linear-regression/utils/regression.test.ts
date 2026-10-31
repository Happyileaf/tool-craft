import { describe, expect, it } from 'vitest';
import { ANSCOMBE_QUARTET_I, LINEAR_EXAMPLE } from '../constants';
import {
  assertFittable,
  formatEquation,
  linearRegression,
  parsePoints,
  pointsToCsv,
  type Point,
} from './regression';

const TOLERANCE = 1e-4;

function toPoints(tuples: ReadonlyArray<readonly [number, number]>): Point[] {
  return tuples.map(([x, y]) => ({ x, y }));
}

describe('linearRegression', () => {
  it('在 Anscombe 第一组上复现公认的斜率/截距/r/R²', () => {
    const result = linearRegression(toPoints(ANSCOMBE_QUARTET_I));
    // 公认值：y = 3.0001 + 0.5001x，r ≈ 0.8164，R² ≈ 0.6665
    expect(result.n).toBe(11);
    expect(result.intercept).toBeCloseTo(3.0001, 3);
    expect(result.slope).toBeCloseTo(0.5001, 3);
    expect(result.r).toBeCloseTo(0.8164, 3);
    expect(result.rSquared).toBeCloseTo(0.6665, 3);
    expect(result.meanX).toBeCloseTo(9, TOLERANCE);
    expect(result.meanY).toBeCloseTo(7.5009, TOLERANCE);
  });

  it('强正相关示例给出接近 1 的相关系数', () => {
    const result = linearRegression(toPoints(LINEAR_EXAMPLE));
    expect(result.r).toBeGreaterThan(0.99);
    expect(result.rSquared).toBeGreaterThan(0.99);
    expect(result.slope).toBeGreaterThan(0);
  });

  it('完美正相关直线 r = 1、R² = 1、残差全为 0', () => {
    const points: Point[] = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ];
    const result = linearRegression(points);
    expect(result.intercept).toBeCloseTo(1, TOLERANCE);
    expect(result.slope).toBeCloseTo(2, TOLERANCE);
    expect(result.r).toBeCloseTo(1, TOLERANCE);
    expect(result.rSquared).toBeCloseTo(1, TOLERANCE);
    expect(result.sse).toBeCloseTo(0, TOLERANCE);
    for (const fit of result.fits) {
      expect(fit.residual).toBeCloseTo(0, TOLERANCE);
      expect(fit.yHat).toBeCloseTo(fit.y, TOLERANCE);
    }
  });

  it('完美负相关直线 r = −1', () => {
    const points: Point[] = [
      { x: 0, y: 10 },
      { x: 1, y: 8 },
      { x: 2, y: 6 },
      { x: 3, y: 4 },
    ];
    const result = linearRegression(points);
    expect(result.slope).toBeCloseTo(-2, TOLERANCE);
    expect(result.intercept).toBeCloseTo(10, TOLERANCE);
    expect(result.r).toBeCloseTo(-1, TOLERANCE);
    expect(result.rSquared).toBeCloseTo(1, TOLERANCE);
  });

  it('R² 恒等于 r²，且满足 SST = SSR + SSE', () => {
    const result = linearRegression(toPoints(ANSCOMBE_QUARTET_I));
    expect(result.rSquared).toBeCloseTo(result.r * result.r, 6);
    expect(result.ssr + result.sse).toBeCloseTo(result.sst, 6);
    expect(result.sse).toBeGreaterThanOrEqual(0);
    expect(result.ssr).toBeGreaterThanOrEqual(0);
  });

  it('y 全相等（零相关）时 r = 0、R² = 0', () => {
    const points: Point[] = [
      { x: 1, y: 5 },
      { x: 2, y: 5 },
      { x: 3, y: 5 },
      { x: 4, y: 5 },
    ];
    const result = linearRegression(points);
    expect(result.slope).toBeCloseTo(0, TOLERANCE);
    expect(result.intercept).toBeCloseTo(5, TOLERANCE);
    expect(result.r).toBe(0);
    // y 无变异时回归直线解释全部（平凡情形），R² 定义为 1
    expect(result.rSquared).toBe(1);
  });

  it('点数不足时抛出明确错误', () => {
    expect(() => linearRegression([])).toThrow(/至少需要 2 个数据点/);
    expect(() => linearRegression([{ x: 1, y: 2 }])).toThrow(/至少需要 2 个数据点/);
  });

  it('所有 x 相同时抛出明确错误', () => {
    const points: Point[] = [
      { x: 3, y: 1 },
      { x: 3, y: 4 },
      { x: 3, y: 7 },
    ];
    expect(() => linearRegression(points)).toThrow(/x 值相同/);
  });

  it('assertFittable 对合法数据不抛错', () => {
    expect(() =>
      assertFittable([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]),
    ).not.toThrow();
  });
});

describe('parsePoints', () => {
  it('解析逗号分隔的每行 x,y', () => {
    expect(parsePoints('1,2\n3,4')).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]);
  });

  it('支持 Tab、分号与空白分隔，并忽略空行、CRLF', () => {
    const text = '1\t2\r\n\r\n3;4\n  5   6  \n';
    expect(parsePoints(text)).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
    ]);
  });

  it('忽略以 # 开头的注释行', () => {
    const text = '# 这是注释\n1,2\n# 3,4\n5,6';
    expect(parsePoints(text)).toEqual([
      { x: 1, y: 2 },
      { x: 5, y: 6 },
    ]);
  });

  it('支持小数、负数与科学计数法', () => {
    expect(parsePoints('-1.5, 2.5\n1e2,3E-1')).toEqual([
      { x: -1.5, y: 2.5 },
      { x: 100, y: 0.3 },
    ]);
  });

  it('字段数不为 2 时报告行号', () => {
    expect(() => parsePoints('1,2\n3')).toThrow(/第 2 行无法解析/);
    expect(() => parsePoints('1,2,3')).toThrow(/第 1 行无法解析/);
  });

  it('包含非数值时报告行号', () => {
    expect(() => parsePoints('1,2\na,b')).toThrow(/第 2 行包含非数值/);
  });

  it('数值绝对值超限时报错', () => {
    expect(() => parsePoints('1e10,2')).toThrow(/超出允许范围/);
  });

  it('空文本解析为空数组', () => {
    expect(parsePoints('')).toEqual([]);
    expect(parsePoints('# 只有注释\n')).toEqual([]);
  });
});

describe('pointsToCsv', () => {
  it('序列化为每行 x,y 并可被 parsePoints 还原', () => {
    const points: Point[] = [
      { x: 1, y: 2.5 },
      { x: -3, y: 4 },
    ];
    const csv = pointsToCsv(points);
    expect(csv).toBe('1,2.5\n-3,4');
    expect(parsePoints(csv)).toEqual(points);
  });
});

describe('formatEquation', () => {
  it('正斜率使用加号', () => {
    expect(formatEquation({ intercept: 3.00009, slope: 0.50009 }, 4)).toBe(
      'y = 3.0001 + 0.5001x',
    );
  });

  it('负斜率使用 Unicode 减号连接绝对值', () => {
    expect(formatEquation({ intercept: 10, slope: -2 }, 2)).toBe('y = 10.00 − 2.00x');
  });

  it('零斜率按正号处理', () => {
    expect(formatEquation({ intercept: 5, slope: 0 }, 0)).toBe('y = 5 + 0x');
  });
});
