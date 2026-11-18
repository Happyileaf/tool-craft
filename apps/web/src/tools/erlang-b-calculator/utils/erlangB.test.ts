import { describe, it, expect } from 'vitest';
import {
  blockCurve,
  buildSensitivityTable,
  erlangB,
  maximumTrafficForGoS,
  minimumChannelsForGoS,
} from './erlangB';

describe('erlangB 阻塞概率（公开 Erlang B 表固定向量）', () => {
  it('A=10, N=10 → B≈0.2146（标准爱尔兰 B 表）', () => {
    expect(erlangB(10, 10)).toBeCloseTo(0.21455, 4);
  });

  it('A=5, N=10 → B≈0.0184', () => {
    expect(erlangB(5, 10)).toBeCloseTo(0.018385, 4);
  });

  it('A=14, N=20 → B≈0.0300', () => {
    expect(erlangB(14, 20)).toBeCloseTo(0.03004, 3);
  });

  it('N=1 时 B=A/(1+A)', () => {
    expect(erlangB(5, 1)).toBeCloseTo(5 / 6, 10);
  });

  it('B 随 N 单调递减', () => {
    const seq = [1, 2, 5, 10, 20, 50].map((n) => erlangB(10, n));
    for (let i = 1; i < seq.length; i += 1) {
      expect(seq[i]!).toBeLessThan(seq[i - 1]!);
    }
  });

  it('B 随 A 单调递增', () => {
    const seq = [1, 5, 10, 20, 50].map((a) => erlangB(a, 10));
    for (let i = 1; i < seq.length; i += 1) {
      expect(seq[i]!).toBeGreaterThan(seq[i - 1]!);
    }
  });

  it('非法输入抛错', () => {
    expect(() => erlangB(0, 10)).toThrow();
    expect(() => erlangB(10, 1.5)).toThrow();
    expect(() => erlangB(10, -1)).toThrow();
  });
});

describe('minimumChannelsForGoS 反向问题①', () => {
  it('A=10、GoS=1% → N=18（爱尔兰 B 表：N=17 时 B≈1.33%，N=18 时 B≈0.84%）', () => {
    const n = minimumChannelsForGoS(10, 0.01);
    expect(n).toBe(18);
    expect(erlangB(10, n)).toBeLessThanOrEqual(0.01);
    expect(erlangB(10, n - 1)).toBeGreaterThan(0.01);
  });

  it('A=5、GoS=5% → N=10（B(5,9)≈3.75% 已满足，最小满足项按递归逐项判定）', () => {
    const n = minimumChannelsForGoS(5, 0.05);
    expect(erlangB(5, n)).toBeLessThanOrEqual(0.05);
    expect(erlangB(5, n - 1)).toBeGreaterThan(0.05);
  });

  it('A=10、GoS=0.1% → N=23（高可靠档位）', () => {
    const n = minimumChannelsForGoS(10, 0.001);
    expect(erlangB(10, n)).toBeLessThanOrEqual(0.001);
    expect(erlangB(10, n - 1)).toBeGreaterThan(0.001);
  });

  it('非法 GoS 抛错', () => {
    expect(() => minimumChannelsForGoS(10, 0)).toThrow();
    expect(() => minimumChannelsForGoS(10, 1)).toThrow();
  });
});

describe('maximumTrafficForGoS 反向问题②', () => {
  it('N=10、GoS=1% → A≈4.46 Erlang（标准表值）', () => {
    const a = maximumTrafficForGoS(10, 0.01);
    expect(a).toBeCloseTo(4.461, 2);
    expect(erlangB(a, 10)).toBeCloseTo(0.01, 3);
  });

  it('N=20、GoS=1% → A≈12.03 Erlang', () => {
    const a = maximumTrafficForGoS(20, 0.01);
    expect(a).toBeCloseTo(12.03, 1);
  });

  it('N=5、GoS=5% → A≈2.22 Erlang', () => {
    const a = maximumTrafficForGoS(5, 0.05);
    expect(a).toBeCloseTo(2.218, 2);
  });

  it('反算结果与正算自洽', () => {
    const a = maximumTrafficForGoS(15, 0.02);
    expect(erlangB(a, 15)).toBeCloseTo(0.02, 4);
  });
});

describe('buildSensitivityTable 灵敏度对照', () => {
  it('给出 N-1/N/N+1 三行且阻塞率递减', () => {
    const table = buildSensitivityTable(10, 10);
    expect(table.map((row) => row.channels)).toEqual([9, 10, 11]);
    expect(table[0]!.blockAtCurrentTraffic).toBeGreaterThan(table[1]!.blockAtCurrentTraffic);
    expect(table[1]!.blockAtCurrentTraffic).toBeGreaterThan(table[2]!.blockAtCurrentTraffic);
  });

  it('每行含三档 GoS 承载话务量且 0.1% 档最保守', () => {
    const row = buildSensitivityTable(10, 10)[0]!;
    expect(row.maxTrafficByGoS[0.001]!).toBeLessThan(row.maxTrafficByGoS[0.01]!);
    expect(row.maxTrafficByGoS[0.01]!).toBeLessThan(row.maxTrafficByGoS[0.05]!);
  });

  it('N=1 边界不产生 N=0 行', () => {
    const table = buildSensitivityTable(2, 1);
    expect(table.length).toBe(2);
    expect(table[0]!.channels).toBe(1);
  });
});

describe('blockCurve 曲线采样', () => {
  it('采样点数与单调下降', () => {
    const curve = blockCurve(10, 20);
    expect(curve).toHaveLength(20);
    expect(curve[0]!.n).toBe(1);
    expect(curve[19]!.n).toBe(20);
    for (let i = 1; i < curve.length; i += 1) {
      expect(curve[i]!.b).toBeLessThan(curve[i - 1]!.b);
    }
  });

  it('越界上限抛错', () => {
    expect(() => blockCurve(10, 0)).toThrow();
    expect(() => blockCurve(10, 1001)).toThrow();
  });
});
