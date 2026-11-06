import { describe, it, expect } from 'vitest';
import {
  parseDiceExpression,
  rollDice,
  getDistribution,
  probabilityAtLeast,
} from './dice';

/** 构造依次返回给定值的确定性随机源 */
function seededRng(values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length]!;
}

describe('parseDiceExpression', () => {
  it('解析基础表达式与省略数量的写法', () => {
    expect(parseDiceExpression('d6')).toEqual({
      dice: [{ count: 1, sides: 6 }],
      modifier: 0,
      rule: null,
      totalDice: 1,
    });
    expect(parseDiceExpression('3d6+2')).toEqual({
      dice: [{ count: 3, sides: 6 }],
      modifier: 2,
      rule: null,
      totalDice: 3,
    });
  });

  it('解析多骰子项、负修正与 keep/drop 规则', () => {
    const combined = parseDiceExpression('2d6+1d4-1');
    expect(combined.dice).toEqual([
      { count: 2, sides: 6 },
      { count: 1, sides: 4 },
    ]);
    expect(combined.modifier).toBe(-1);

    const advantage = parseDiceExpression('2d20kh1');
    expect(advantage.rule).toEqual({ mode: 'kh', amount: 1 });

    const drop = parseDiceExpression('4d6dl1');
    expect(drop.rule).toEqual({ mode: 'dl', amount: 1 });

    // 省略数量默认 1
    expect(parseDiceExpression('2d6dh').rule).toEqual({ mode: 'dh', amount: 1 });
  });

  it('非法表达式抛出明确错误', () => {
    expect(() => parseDiceExpression('')).toThrow('为空');
    expect(() => parseDiceExpression('xyz')).toThrow('非法字符');
    expect(() => parseDiceExpression('2d')).toThrow('面数');
    expect(() => parseDiceExpression('d0')).toThrow('面数');
    expect(() => parseDiceExpression('3d6kh9')).toThrow('keep/drop');
    expect(() => parseDiceExpression('2d6-1d4')).toThrow('不支持减去整个骰子项');
    expect(() => parseDiceExpression('99d6')).toThrow('骰子数量不能超过');
  });
});

describe('rollDice', () => {
  it('注入固定 rng 时结果可复现且逐粒明细正确', () => {
    // rng 值 0 -> 点数 1，0.999 -> 点数 6（d6）
    const result = rollDice('3d6+2', seededRng([0, 0.5, 0.999]));
    expect(result.dice.map((die) => die.value)).toEqual([1, 4, 6]);
    expect(result.diceSum).toBe(11);
    expect(result.total).toBe(13);
    expect(result.dice.every((die) => die.kept)).toBe(true);
  });

  it('kh 规则保留最高点并正确标记', () => {
    const result = rollDice('2d20kh1', seededRng([0.0, 0.5]));
    // 点数分别为 1 与 11，保留 11
    expect(result.dice.map((die) => die.value)).toEqual([1, 11]);
    expect(result.dice.map((die) => die.kept)).toEqual([false, true]);
    expect(result.total).toBe(11);
  });

  it('dl 规则丢弃最低点', () => {
    const result = rollDice('4d6dl1', seededRng([0.0, 0.0, 0.999, 0.999]));
    // 点数 1,1,6,6，丢弃一个 1
    expect(result.diceSum).toBe(13);
    expect(result.dice.filter((die) => die.kept)).toHaveLength(3);
  });
});

describe('getDistribution', () => {
  it('2d6 组合数序列与期望正确', () => {
    const { entries, expected, min, max } = getDistribution('2d6');
    expect(entries.map((entry) => entry.sum)).toEqual(
      Array.from({ length: 11 }, (_, index) => index + 2),
    );
    const counts = entries.map((entry) => Math.round(entry.probability * 36));
    expect(counts).toEqual([1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1]);
    expect(expected).toBeCloseTo(7);
    expect(min).toBe(2);
    expect(max).toBe(12);
  });

  it('1d6 每个面等概率', () => {
    const { entries } = getDistribution('1d6');
    expect(entries).toHaveLength(6);
    for (const entry of entries) {
      expect(entry.probability).toBeCloseTo(1 / 6);
    }
  });

  it('常量修正整体平移且期望同步', () => {
    const base = getDistribution('2d6');
    const shifted = getDistribution('2d6+3');
    expect(shifted.entries.map((entry) => entry.sum)).toEqual(
      base.entries.map((entry) => entry.sum + 3),
    );
    expect(shifted.expected).toBeCloseTo(10);
  });

  it('累积概率单调不减且末项为 1', () => {
    const { entries } = getDistribution('3d6');
    for (let i = 1; i < entries.length; i += 1) {
      expect(entries[i]!.cumulative).toBeGreaterThanOrEqual(entries[i - 1]!.cumulative);
    }
    expect(entries[entries.length - 1]!.cumulative).toBeCloseTo(1);
  });

  it('2d20kh1 优势骰取高分布可精确核对', () => {
    const { entries } = getDistribution('2d20kh1');
    // P(取高 = 1) = 1/400；P(取高 = k) = (k²-(k-1)²)/400
    expect(entries[0]!).toMatchObject({ sum: 1 });
    expect(entries[0]!.probability).toBeCloseTo(1 / 400);
    expect(entries[1]!.probability).toBeCloseTo(3 / 400);
    const total = entries.reduce((sum, entry) => sum + entry.probability, 0);
    expect(total).toBeCloseTo(1);
  });

  it('probabilityAtLeast 计算上尾概率', () => {
    const distribution = getDistribution('1d6');
    expect(probabilityAtLeast(distribution, 5)).toBeCloseTo(2 / 6);
    expect(probabilityAtLeast(distribution, 1)).toBeCloseTo(1);
  });
});
