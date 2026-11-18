import { describe, it, expect } from 'vitest';
import {
  blockingProbability,
  requiredLines,
  offeredLoad,
  sensitivityTable,
  recurseErlangB,
} from './erlangB';

describe('recurseErlangB 递推核心', () => {
  it('A=0 时阻塞概率为 0', () => {
    expect(recurseErlangB(5, 0)).toBe(0);
  });

  it('单中继线 B(1,A)=A/(1+A)', () => {
    expect(recurseErlangB(1, 2)).toBeCloseTo(2 / 3, 10);
  });

  it('与经典查表值一致：c=5, A=10 → 0.56395', () => {
    // Erlang B 递推：5 lines / 10 Erlang
    expect(recurseErlangB(5, 10)).toBeCloseTo(0.563952, 4);
  });

  it('与经典查表值一致：c=10, A=10 → 0.21458', () => {
    expect(recurseErlangB(10, 10)).toBeCloseTo(0.214582, 4);
  });

  it('线数越多阻塞越低（单调）', () => {
    const b5 = recurseErlangB(5, 8);
    const b10 = recurseErlangB(10, 8);
    expect(b10).toBeLessThan(b5);
  });
});

describe('blockingProbability 正向计算', () => {
  it('合法输入返回概率', () => {
    const result = blockingProbability(5, 10);
    expect(result.errors).toEqual([]);
    expect(result.blocking).toBeCloseTo(0.563952, 4);
  });

  it('阻塞超 50% 给出警告', () => {
    const result = blockingProbability(1, 5);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('非法线数报错', () => {
    expect(blockingProbability(0, 10).errors.length).toBeGreaterThan(0);
    expect(blockingProbability(1.5, 10).errors.length).toBeGreaterThan(0);
  });

  it('非法话务量报错', () => {
    expect(blockingProbability(5, -1).errors.length).toBeGreaterThan(0);
  });
});

describe('requiredLines 反求线数', () => {
  it('10 Erlang、GoS 1% 至少需要 18 条线（标准表值）', () => {
    const result = requiredLines(10, 0.01);
    expect(result.errors).toEqual([]);
    expect(result.lines).toBe(18);
    expect(result.blocking).not.toBeNull();
    expect(result.blocking as number).toBeLessThanOrEqual(0.01);
  });

  it('GoS 5% 时所需线数更少', () => {
    const tight = requiredLines(10, 0.01);
    const loose = requiredLines(10, 0.05);
    expect(loose.lines as number).toBeLessThanOrEqual(tight.lines as number);
  });

  it('零话务量 1 条线即可', () => {
    expect(requiredLines(0, 0.01).lines).toBe(1);
  });

  it('非法 GoS 报错', () => {
    expect(requiredLines(10, 0).errors.length).toBeGreaterThan(0);
    expect(requiredLines(10, 1).errors.length).toBeGreaterThan(0);
  });
});

describe('offeredLoad 反求话务量', () => {
  it('c=5、GoS 1% 可承载话务量与正算互逆', () => {
    const result = offeredLoad(5, 0.01);
    expect(result.errors).toEqual([]);
    expect(result.offered).not.toBeNull();
    const check = recurseErlangB(5, result.offered as number);
    expect(check).toBeCloseTo(0.01, 5);
  });

  it('线数增加可承载更多话务量', () => {
    const a = offeredLoad(5, 0.05).offered as number;
    const b = offeredLoad(10, 0.05).offered as number;
    expect(b).toBeGreaterThan(a);
  });

  it('非法输入报错', () => {
    expect(offeredLoad(0, 0.01).errors.length).toBeGreaterThan(0);
    expect(offeredLoad(5, 1.2).errors.length).toBeGreaterThan(0);
  });
});

describe('sensitivityTable 灵敏度对照', () => {
  it('按线数 1..N 生成且阻塞单调下降', () => {
    const { errors, rows } = sensitivityTable(10, 8);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(8);
    for (let i = 1; i < rows.length; i += 1) {
      // 循环边界保证索引均在范围内
      expect(rows[i]!.blocking).toBeLessThan(rows[i - 1]!.blocking);
    }
  });

  it('越界最大线数报错', () => {
    expect(sensitivityTable(10, 0).errors.length).toBeGreaterThan(0);
    expect(sensitivityTable(10, 201).errors.length).toBeGreaterThan(0);
  });
});
