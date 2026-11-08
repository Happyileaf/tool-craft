import { describe, it, expect } from 'vitest';
import {
  snapshotFromCostPrice,
  priceFromMargin,
  priceFromMarkup,
  costFromPriceAndMargin,
  marginToMarkup,
  markupToMargin,
  batchPriceByMargin,
  batchRowsToCsv,
  breakEvenDiscounts,
} from './pricing';

describe('snapshotFromCostPrice', () => {
  it('matches the acceptance vector: cost 80, price 100 -> margin 20%, markup 25%', () => {
    const snapshot = snapshotFromCostPrice(80, 100);
    expect(snapshot.grossProfit).toBeCloseTo(20, 6);
    expect(snapshot.margin).toBeCloseTo(0.2, 6);
    expect(snapshot.markup).toBeCloseTo(0.25, 6);
  });

  it('handles zero cost: margin is finite while markup is NaN', () => {
    const snapshot = snapshotFromCostPrice(0, 50);
    expect(snapshot.grossProfit).toBe(50);
    expect(snapshot.margin).toBe(1);
    expect(Number.isNaN(snapshot.markup)).toBe(true);
  });

  it('handles below-cost pricing with negative margin and markup', () => {
    const snapshot = snapshotFromCostPrice(100, 80);
    expect(snapshot.margin).toBeCloseTo(-0.25, 6);
    expect(snapshot.markup).toBeCloseTo(-0.2, 6);
  });

  it('rejects invalid cost or price', () => {
    expect(() => snapshotFromCostPrice(-1, 100)).toThrow('非负');
    expect(() => snapshotFromCostPrice(80, 0)).toThrow('正数值');
    expect(() => snapshotFromCostPrice(80, Number.NaN)).toThrow('正数值');
  });
});

describe('priceFromMargin', () => {
  it('derives price from cost and target margin: P = C / (1 - margin)', () => {
    const snapshot = priceFromMargin(80, 0.2);
    expect(snapshot.price).toBeCloseTo(100, 6);
    expect(snapshot.margin).toBeCloseTo(0.2, 6);
    expect(snapshot.markup).toBeCloseTo(0.25, 6);
  });

  it('supports negative margin (loss-leader pricing)', () => {
    const snapshot = priceFromMargin(100, -0.25);
    expect(snapshot.price).toBeCloseTo(80, 6);
  });

  it('rejects margin >= 100% and invalid cost', () => {
    expect(() => priceFromMargin(80, 1)).toThrow('100%');
    expect(() => priceFromMargin(80, 1.5)).toThrow('100%');
    expect(() => priceFromMargin(-1, 0.2)).toThrow('非负');
  });
});

describe('priceFromMarkup', () => {
  it('derives price from cost and markup: P = C * (1 + markup)', () => {
    const snapshot = priceFromMarkup(80, 0.25);
    expect(snapshot.price).toBeCloseTo(100, 6);
    expect(snapshot.markup).toBeCloseTo(0.25, 6);
    expect(snapshot.margin).toBeCloseTo(0.2, 6);
  });

  it('accepts zero markup (selling at cost)', () => {
    const snapshot = priceFromMarkup(50, 0);
    expect(snapshot.price).toBe(50);
    expect(snapshot.margin).toBe(0);
  });

  it('rejects negative markup or invalid cost', () => {
    expect(() => priceFromMarkup(80, -0.1)).toThrow('非负');
    expect(() => priceFromMarkup(Number.NaN, 0.2)).toThrow('非负');
  });
});

describe('costFromPriceAndMargin', () => {
  it('derives the maximum acceptable cost from price and margin: C = P * (1 - margin)', () => {
    const snapshot = costFromPriceAndMargin(100, 0.2);
    expect(snapshot.cost).toBeCloseTo(80, 6);
    expect(snapshot.margin).toBeCloseTo(0.2, 6);
  });

  it('rejects invalid price or margin', () => {
    expect(() => costFromPriceAndMargin(0, 0.2)).toThrow('正数值');
    expect(() => costFromPriceAndMargin(100, 1)).toThrow('100%');
  });
});

describe('margin <-> markup conversion', () => {
  it('converts margin to markup', () => {
    expect(marginToMarkup(0.2)).toBeCloseTo(0.25, 6);
    expect(marginToMarkup(0.5)).toBeCloseTo(1, 6);
    expect(marginToMarkup(0)).toBe(0);
  });

  it('converts markup to margin', () => {
    expect(markupToMargin(0.25)).toBeCloseTo(0.2, 6);
    expect(markupToMargin(1)).toBeCloseTo(0.5, 6);
    expect(markupToMargin(0)).toBe(0);
  });

  it('round-trips both directions', () => {
    const margin = 0.35;
    expect(markupToMargin(marginToMarkup(margin))).toBeCloseTo(margin, 10);
    const markup = 0.6;
    expect(marginToMarkup(markupToMargin(markup))).toBeCloseTo(markup, 10);
  });

  it('rejects out-of-range inputs', () => {
    expect(() => marginToMarkup(1)).toThrow('100%');
    expect(() => markupToMargin(-0.5)).toThrow('非负');
  });
});

describe('batchPriceByMargin', () => {
  it('computes a pricing table for multiple cost/margin pairs', () => {
    const rows = batchPriceByMargin([
      { cost: 80, margin: 0.2 },
      { cost: 50, margin: 0.5 },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ index: 1, cost: 80, margin: 0.2 });
    expect(rows[0].price).toBeCloseTo(100, 6);
    expect(rows[0].grossProfit).toBeCloseTo(20, 6);
    expect(rows[1].index).toBe(2);
    expect(rows[1].price).toBeCloseTo(100, 6);
    expect(rows[1].grossProfit).toBeCloseTo(50, 6);
  });

  it('propagates validation errors', () => {
    expect(() => batchPriceByMargin([{ cost: -1, margin: 0.2 }])).toThrow('非负');
  });
});

describe('batchRowsToCsv', () => {
  it('serializes rows with a header and CRLF line endings', () => {
    const rows = batchPriceByMargin([{ cost: 80, margin: 0.2 }]);
    const csv = batchRowsToCsv(rows);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('index,cost,target_margin,price,gross_profit');
    expect(lines[1]).toBe('1,80,20.00%,100,20');
  });
});

describe('breakEvenDiscounts', () => {
  it('flags which discounts keep the discounted price at or above cost', () => {
    const results = breakEvenDiscounts(100, 60, [0, 0.2, 0.4, 0.5]);
    expect(results).toHaveLength(4);
    expect(results[0]).toMatchObject({
      discount: 0,
      discountedPrice: 100,
      profit: 40,
      breaksEven: true,
    });
    expect(results[1].discountedPrice).toBeCloseTo(80, 6);
    expect(results[1].breaksEven).toBe(true);
    expect(results[2]).toMatchObject({ discountedPrice: 60, profit: 0, breaksEven: true });
    expect(results[3].breaksEven).toBe(false);
    expect(results[3].profit).toBeCloseTo(-10, 6);
  });

  it('rejects invalid list price, cost and discount rates', () => {
    expect(() => breakEvenDiscounts(0, 10, [0.1])).toThrow('正数值');
    expect(() => breakEvenDiscounts(100, 120, [0.1])).toThrow('不高于标价');
    expect(() => breakEvenDiscounts(100, 60, [1])).toThrow('折扣率');
    expect(() => breakEvenDiscounts(100, 60, [-0.1])).toThrow('折扣率');
  });
});
