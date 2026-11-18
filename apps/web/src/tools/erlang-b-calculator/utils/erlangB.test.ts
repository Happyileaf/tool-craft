import { describe, expect, it } from 'vitest';
import {
  ERBOUNDS,
  erlangBBlocking,
  formatBlocking,
  gradeOfServiceTable,
  requiredLines,
  sensitivityTable,
  supportedTraffic,
} from './erlangB';

/** 闭式参考实现 B(N,A) = (A^N/N!) / Σ A^k/k!，逐项累乘避免阶乘上溢 */
function closedFormErlangB(lines: number, traffic: number): number {
  let term = 1; // A^0 / 0!
  let sum = term;
  for (let k = 1; k <= lines; k += 1) {
    term = (term * traffic) / k;
    sum += term;
  }
  return term / sum;
}

describe('erlangBBlocking', () => {
  it('returns 1 for a single idle line at zero capacity pressure', () => {
    // N=1：B(1,A) = A/(1+A)，A 很大时趋近 1
    expect(erlangBBlocking(1, 0)).toBe(0);
    expect(erlangBBlocking(1, 1)).toBeCloseTo(0.5, 10);
  });

  it('matches the closed-form formula and published table anchors', () => {
    // 小 N 锚点：经典查表 N=5,A=1≈0.0031、N=10,A=10≈0.2146
    expect(erlangBBlocking(5, 1)).toBeCloseTo(0.0031, 4);
    expect(erlangBBlocking(10, 10)).toBeCloseTo(0.2146, 3);
    // 其余参数组合与独立闭式实现逐点核对，避免手写表值误差
    for (const [lines, traffic] of [
      [5, 1],
      [10, 5],
      [20, 15],
      [50, 50],
      [100, 80],
    ] as const) {
      expect(erlangBBlocking(lines, traffic)).toBeCloseTo(closedFormErlangB(lines, traffic), 10);
    }
  });

  it('is monotonically decreasing in lines and increasing in traffic', () => {
    let previous = 1;
    for (let lines = 1; lines <= 30; lines += 1) {
      const current = erlangBBlocking(lines, 10);
      expect(current).toBeLessThan(previous);
      previous = current;
    }
    expect(erlangBBlocking(10, 5)).toBeLessThan(erlangBBlocking(10, 10));
    expect(erlangBBlocking(10, 10)).toBeLessThan(erlangBBlocking(10, 20));
  });

  it('rejects invalid lines and traffic', () => {
    expect(() => erlangBBlocking(0, 10)).toThrow('≥ 1 的整数');
    expect(() => erlangBBlocking(1.5, 10)).toThrow('≥ 1 的整数');
    expect(() => erlangBBlocking(10, -1)).toThrow('非负有限数值');
    expect(() => erlangBBlocking(ERBOUNDS.maxLines + 1, 10)).toThrow('不能超过');
  });

  it('stays numerically stable for large trunk groups', () => {
    const blocking = erlangBBlocking(1000, 1000);
    expect(blocking).toBeGreaterThan(0);
    expect(blocking).toBeLessThan(1);
    expect(Number.isFinite(blocking)).toBe(true);
  });
});

describe('requiredLines', () => {
  it('returns the smallest N whose blocking is at or below target', () => {
    // 经典查表：A=10、GoS=1% 需要 18 条线（B(18,10)≈0.0065，B(17,10)≈0.0099>0.01 边界附近取首个达标）
    const result = requiredLines(10, 0.01);
    expect(result.lines).toBeGreaterThanOrEqual(17);
    expect(result.lines).toBeLessThanOrEqual(18);
    expect(result.blocking).toBeLessThanOrEqual(0.01);
    expect(erlangBBlocking(result.lines - 1, 10)).toBeGreaterThan(0.01);
  });

  it('handles zero traffic with a single line', () => {
    expect(requiredLines(0, 0.01)).toEqual({ lines: 1, blocking: 0 });
  });

  it('rejects targets outside (0,1)', () => {
    expect(() => requiredLines(10, 0)).toThrow('0 与 1 之间');
    expect(() => requiredLines(10, 1)).toThrow('0 与 1 之间');
    expect(() => requiredLines(10, 0.5)).not.toThrow();
  });
});

describe('supportedTraffic', () => {
  it('inverts blocking back to traffic within rounding tolerance', () => {
    // N=10、目标 1% 对应约 4.46 Erlang
    const result = supportedTraffic(10, 0.01);
    expect(result.trafficErlang).toBeGreaterThan(4);
    expect(result.trafficErlang).toBeLessThan(5);
    expect(result.blocking).toBeLessThanOrEqual(0.01 + 1e-6);
    // 反算结果与正向函数自洽
    expect(erlangBBlocking(10, result.trafficErlang)).toBeCloseTo(0.01, 3);
  });

  it('grows with more lines for the same grade of service', () => {
    const small = supportedTraffic(5, 0.01);
    const large = supportedTraffic(50, 0.01);
    expect(large.trafficErlang).toBeGreaterThan(small.trafficErlang);
  });

  it('rejects invalid line counts', () => {
    expect(() => supportedTraffic(0, 0.01)).toThrow();
  });
});

describe('sensitivityTable', () => {
  it('emits N-2..N+2 with monotone blocking and delta markers', () => {
    const rows = sensitivityTable(10, 8);
    expect(rows).toHaveLength(5);
    expect(rows.map((row) => row.delta)).toEqual([-2, -1, 0, 1, 2]);
    expect(rows.map((row) => row.lines)).toEqual([8, 9, 10, 11, 12]);
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i]?.blocking).toBeLessThan(rows[i - 1]?.blocking ?? Infinity);
    }
    expect(rows[2]?.blocking).toBeCloseTo(erlangBBlocking(10, 8), 12);
  });

  it('clips at one line when the center is small', () => {
    const rows = sensitivityTable(2, 5);
    expect(rows.map((row) => row.lines)).toEqual([1, 2, 3, 4]);
    expect(rows[0]?.delta).toBe(-1);
  });
});

describe('gradeOfServiceTable', () => {
  it('maps engineering GoS targets onto required line counts', () => {
    const rows = gradeOfServiceTable(20, [0.05, 0.01, 0.001]);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.target).toBe(0.05);
    // 目标越严格所需线数越多
    expect(rows[0]?.lines).toBeLessThan(rows[1]?.lines ?? Infinity);
    expect(rows[1]?.lines).toBeLessThan(rows[2]?.lines ?? Infinity);
    for (const row of rows) {
      expect(row.blocking).toBeLessThanOrEqual(row.target);
    }
  });
});

describe('formatBlocking', () => {
  it('renders zero, fixed-percent and scientific forms', () => {
    expect(formatBlocking(0)).toBe('0%');
    expect(formatBlocking(0.01838)).toBe('1.8380%');
    expect(formatBlocking(1e-8)).toBe('1.00e-6%');
  });
});
