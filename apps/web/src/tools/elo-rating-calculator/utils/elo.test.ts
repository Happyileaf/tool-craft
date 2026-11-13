import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SCALE,
  MAX_MATCH_ROWS,
  expectedScore,
  parseMatchText,
  ratingDelta,
  round2,
  simulateSeries,
  updateRating,
  validateInputs,
} from './elo';

describe('expectedScore', () => {
  it('同分时期望胜率为 0.5', () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5, 12);
  });

  it('高分区对低分区的期望胜率大于 0.5', () => {
    const strong = expectedScore(1600, 1400);
    expect(strong).toBeGreaterThan(0.5);
    expect(strong).toBeCloseTo(1 / (1 + Math.pow(10, -200 / 400)), 12);
  });

  it('双方期望胜率互补为 1', () => {
    const a = expectedScore(1320, 1780);
    const b = expectedScore(1780, 1320);
    expect(a + b).toBeCloseTo(1, 12);
  });

  it('支持自定义底数常数', () => {
    expect(expectedScore(1000, 1000, 500)).toBeCloseTo(0.5, 12);
  });

  it('非法参数抛错', () => {
    expect(() => expectedScore(Number.NaN, 1500)).toThrow();
    expect(() => expectedScore(1500, 1500, 0)).toThrow();
  });
});

describe('ratingDelta', () => {
  it('爆冷获胜的加分高于预期获胜', () => {
    const upset = ratingDelta(32, 1, 0.2);
    const expected = ratingDelta(32, 1, 0.8);
    expect(upset).toBeCloseTo(25.6, 10);
    expect(expected).toBeCloseTo(6.4, 10);
    expect(upset).toBeGreaterThan(expected);
  });

  it('和局按 0.5 计分且输棋为负变化', () => {
    expect(ratingDelta(32, 0.5, 0.5)).toBeCloseTo(0, 10);
    expect(ratingDelta(32, 0, 0.7)).toBeCloseTo(-22.4, 10);
  });

  it('非法 K 因子或得分抛错', () => {
    expect(() => ratingDelta(0, 1, 0.5)).toThrow();
    expect(() => ratingDelta(32, 0.3, 0.5)).toThrow();
    expect(() => ratingDelta(32, 1, 1.2)).toThrow();
  });
});

describe('updateRating', () => {
  it('FIDE 经典案例：1500 击败 1700（K=32）', () => {
    const expected = expectedScore(1500, 1700);
    const next = updateRating(1500, 1700, 1, 32);
    expect(next).toBe(round2(1500 + 32 * (1 - expected)));
    expect(next).toBeGreaterThan(1520);
  });

  it('同分和局分数不变', () => {
    expect(updateRating(1600, 1600, 0.5, 20)).toBe(1600);
  });
});

describe('round2', () => {
  it('四舍五入到两位小数并消除浮点尾差', () => {
    expect(round2(1500.126)).toBe(1500.13);
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(-1500.126)).toBe(-1500.13);
    expect(round2(2.345)).toBe(2.35);
  });
});

describe('validateInputs', () => {
  it('合法输入返回 null', () => {
    expect(validateInputs(1500, 32)).toBeNull();
  });

  it('越界等级分与 K 因子返回错误信息', () => {
    expect(validateInputs(-1, 32)).not.toBeNull();
    expect(validateInputs(10001, 32)).not.toBeNull();
    expect(validateInputs(1500, 0)).not.toBeNull();
    expect(validateInputs(1500, 201)).not.toBeNull();
  });
});

describe('parseMatchText', () => {
  it('解析 W/D/L、数字与空白分隔，忽略空行', () => {
    const text = '1400,W\n1500, d\n1600,0.5\n\n1700,L\n1800,1\n1900,0';
    const matches = parseMatchText(text);
    expect(matches).toHaveLength(6);
    expect(matches[0]).toEqual({ opponentRating: 1400, score: 1 });
    expect(matches[1]).toEqual({ opponentRating: 1500, score: 0.5 });
    expect(matches[2]).toEqual({ opponentRating: 1600, score: 0.5 });
    expect(matches[3]).toEqual({ opponentRating: 1700, score: 0 });
    expect(matches[4]).toEqual({ opponentRating: 1800, score: 1 });
    expect(matches[5]).toEqual({ opponentRating: 1900, score: 0 });
  });

  it('支持制表符分隔', () => {
    expect(parseMatchText('1500\tW')).toEqual([{ opponentRating: 1500, score: 1 }]);
  });

  it('非法行带行号报错', () => {
    expect(() => parseMatchText('1500,W\nbadline')).toThrow('第 2 行');
    expect(() => parseMatchText('abc,W')).toThrow('第 1 行');
    expect(() => parseMatchText('1500,X')).toThrow('第 1 行');
  });

  it('超出条数上限报错', () => {
    const text = Array.from({ length: MAX_MATCH_ROWS + 1 }, () => '1500,W').join('\n');
    expect(() => parseMatchText(text)).toThrow(MAX_MATCH_ROWS.toString());
  });
});

describe('simulateSeries', () => {
  it('逐场推演且每场基于上一场新分', () => {
    const result = simulateSeries(1500, 32, [
      { opponentRating: 1500, score: 1 },
      { opponentRating: 1500, score: 0.5 },
      { opponentRating: 1500, score: 0 },
    ]);
    expect(result.steps).toHaveLength(3);
    const [first, second, third] = result.steps;
    expect(first?.ratingBefore).toBe(1500);
    expect(first?.ratingAfter).toBe(1516);
    expect(second?.ratingBefore).toBe(1516);
    expect(third?.ratingBefore).toBe(second?.ratingAfter);
    expect(result.finalRating).toBe(third?.ratingAfter);
  });

  it('总变化等于末场分减初始分', () => {
    const result = simulateSeries(1200, 24, [
      { opponentRating: 1300, score: 1 },
      { opponentRating: 1250, score: 0 },
    ]);
    expect(result.totalDelta).toBe(round2(result.finalRating - 1200));
  });

  it('期望胜率使用默认 400 常数', () => {
    const result = simulateSeries(1500, 32, [{ opponentRating: 1500, score: 1 }]);
    expect(result.steps[0]?.expected).toBe(0.5);
    expect(DEFAULT_SCALE).toBe(400);
  });

  it('非法初始参数抛错', () => {
    expect(() => simulateSeries(-5, 32, [])).toThrow();
  });
});
