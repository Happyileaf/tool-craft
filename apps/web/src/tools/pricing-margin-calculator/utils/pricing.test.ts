import { describe, expect, it } from 'vitest';
import {
  batchPriceFromMargin,
  breakEvenPrice,
  marginToMarkup,
  markupToMargin,
  solvePricing,
} from './pricing';

describe('marginToMarkup / markupToMargin', () => {
  it('毛利率 20% 对应加价率 25%，且互为逆运算', () => {
    expect(marginToMarkup(0.2)).toBeCloseTo(0.25, 10);
    expect(markupToMargin(0.25)).toBeCloseTo(0.2, 10);
    expect(markupToMargin(marginToMarkup(0.37))).toBeCloseTo(0.37, 10);
  });

  it('零值与边界', () => {
    expect(marginToMarkup(0)).toBe(0);
    expect(markupToMargin(0)).toBe(0);
  });

  it('毛利率达到或超过 100% 时抛出可读错误', () => {
    expect(() => marginToMarkup(1)).toThrow(/100%/);
    expect(() => marginToMarkup(1.2)).toThrow();
    expect(() => marginToMarkup(-0.1)).toThrow(/负/);
    expect(() => markupToMargin(-0.1)).toThrow(/负/);
  });
});

describe('solvePricing', () => {
  it('成本 80 + 售价 100 → 毛利率 20%、加价率 25%、毛利额 20', () => {
    const result = solvePricing({ cost: 80, price: 100 });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected ok result');
    }
    expect(result.margin).toBeCloseTo(0.2, 10);
    expect(result.markup).toBeCloseTo(0.25, 10);
    expect(result.profit).toBeCloseTo(20, 10);
  });

  it('成本 + 目标毛利率反推售价', () => {
    const result = solvePricing({ cost: 80, marginPercent: 20 });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected ok result');
    }
    expect(result.price).toBeCloseTo(100, 10);
    expect(result.markup).toBeCloseTo(0.25, 10);
  });

  it('成本 + 加价率反推售价', () => {
    const result = solvePricing({ cost: 80, markupPercent: 25 });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected ok result');
    }
    expect(result.price).toBeCloseTo(100, 10);
    expect(result.margin).toBeCloseTo(0.2, 10);
  });

  it('售价 + 毛利率反推成本', () => {
    const result = solvePricing({ price: 100, marginPercent: 20 });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected ok result');
    }
    expect(result.cost).toBeCloseTo(80, 10);
  });

  it('售价 + 加价率反推成本', () => {
    const result = solvePricing({ price: 100, markupPercent: 25 });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected ok result');
    }
    expect(result.cost).toBeCloseTo(80, 10);
  });

  it('已知量不足时返回可读错误而非抛异常', () => {
    const result = solvePricing({ cost: 80 });
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('expected error result');
    }
    expect(result.error).toContain('已知量');
  });

  it('非法输入分支：负数、毛利率越界、售价低于成本', () => {
    expect(solvePricing({ cost: -1, price: 10 }).ok).toBe(false);
    expect(solvePricing({ cost: 10, price: -1 }).ok).toBe(false);
    expect(solvePricing({ cost: 80, marginPercent: 100 }).ok).toBe(false);
    expect(solvePricing({ cost: 80, marginPercent: -5 }).ok).toBe(false);
    const belowCost = solvePricing({ cost: 100, price: 80 });
    expect(belowCost.ok).toBe(false);
  });
});

describe('batchPriceFromMargin', () => {
  it('合法行批量生成含表头的三列 CSV', () => {
    const outcome = batchPriceFromMargin('80,20\n100,50');
    expect(outcome.warnings).toHaveLength(0);
    expect(outcome.rows).toHaveLength(2);
    expect(outcome.rows[0]!.price).toBeCloseTo(100, 10);
    expect(outcome.rows[1]!.price).toBeCloseTo(200, 10);
    expect(outcome.csv.split('\n')[0]).toBe('cost,margin_percent,price');
    expect(outcome.csv).toContain('80,20.00,100.00');
  });

  it('非法行带行号告警且不中断其余行', () => {
    const outcome = batchPriceFromMargin('80,20\nabc,20\n50,100\n-3,10\n,');
    expect(outcome.rows).toHaveLength(1);
    expect(outcome.warnings.length).toBeGreaterThanOrEqual(3);
    expect(outcome.warnings.some((w) => w.includes('第 2 行'))).toBe(true);
    expect(outcome.warnings.some((w) => w.includes('第 3 行'))).toBe(true);
    expect(outcome.warnings.some((w) => w.includes('第 4 行'))).toBe(true);
  });

  it('空行与制表符分隔兼容', () => {
    const outcome = batchPriceFromMargin('80\t20\n\n  ');
    expect(outcome.rows).toHaveLength(1);
    expect(outcome.rows[0]!.price).toBeCloseTo(100, 10);
    expect(outcome.warnings).toHaveLength(0);
  });
});

describe('breakEvenPrice', () => {
  it('成本 80、折扣 20% → 保本售价 100', () => {
    expect(breakEvenPrice(80, 20)).toBeCloseTo(100, 10);
  });

  it('无折扣时保本价等于成本', () => {
    expect(breakEvenPrice(80, 0)).toBeCloseTo(80, 10);
  });

  it('非法参数抛出可读错误', () => {
    expect(() => breakEvenPrice(-1, 10)).toThrow();
    expect(() => breakEvenPrice(80, 100)).toThrow();
    expect(() => breakEvenPrice(80, -5)).toThrow();
  });
});
