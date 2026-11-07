import { describe, it, expect } from 'vitest';
import {
  parseNumeric,
  parsePercent,
  fromCostAndPrice,
  priceFromMargin,
  priceFromMarkup,
  costFromMargin,
  costFromMarkup,
  markupFromMargin,
  marginFromMarkup,
  breakEvenListPrice,
  batchPricing,
  batchToCsv,
  roundTrim,
  formatPercent,
} from './pricing';

describe('parseNumeric', () => {
  it('解析数字并容忍空白，拒绝空串与非有限值', () => {
    expect(parseNumeric('80')).toBe(80);
    expect(parseNumeric(' 12.5 ')).toBe(12.5);
    expect(parseNumeric('')).toBeNull();
    expect(parseNumeric('abc')).toBeNull();
    expect(parseNumeric('Infinity')).toBeNull();
  });
});

describe('parsePercent', () => {
  it('兼容百分号与纯数字两种写法', () => {
    expect(parsePercent('20%')).toBeCloseTo(0.2, 12);
    expect(parsePercent('20')).toBeCloseTo(0.2, 12);
    expect(parsePercent('12.5%')).toBeCloseTo(0.125, 12);
    expect(parsePercent('')).toBeNull();
    expect(parsePercent('x%')).toBeNull();
  });
});

describe('fromCostAndPrice', () => {
  it('成本 80 售价 100 得到毛利率 20% 与加价率 25%', () => {
    const r = fromCostAndPrice(80, 100);
    expect('error' in r).toBe(false);
    if (!('error' in r)) {
      expect(r.profit).toBe(20);
      expect(r.margin).toBeCloseTo(0.2, 12);
      expect(r.markup).toBeCloseTo(0.25, 12);
    }
  });

  it('亏本销售得到负毛利率与负加价率', () => {
    const r = fromCostAndPrice(100, 80);
    if (!('error' in r)) {
      expect(r.profit).toBe(-20);
      expect(r.margin).toBeCloseTo(-0.25, 12);
      expect(r.markup).toBeCloseTo(-0.2, 12);
    }
  });

  it('成本为 0 时加价率无定义，毛利率为 100%', () => {
    const r = fromCostAndPrice(0, 50);
    if (!('error' in r)) {
      expect(r.margin).toBe(1);
      expect(r.markup).toBeNull();
    }
  });

  it('售价与成本都为 0 时毛利率记 0，避免除零', () => {
    const r = fromCostAndPrice(0, 0);
    if (!('error' in r)) {
      expect(r.margin).toBe(0);
      expect(r.markup).toBeNull();
    }
  });

  it('负数入参报错', () => {
    expect(fromCostAndPrice(-1, 10)).toEqual({ error: '成本价与售价不能为负数' });
  });
});

describe('priceFromMargin / priceFromMarkup', () => {
  it('按毛利率定价：80 / (1 - 0.2) = 100', () => {
    expect(priceFromMargin(80, 0.2)).toEqual({ price: 100 });
  });

  it('毛利率 ≥ 100% 无有限售价', () => {
    expect(priceFromMargin(80, 1)).toEqual({ error: '毛利率必须小于 100%，否则售价无有限解' });
  });

  it('按加价率定价：80 × 1.25 = 100', () => {
    const r = priceFromMarkup(80, 0.25);
    expect('price' in r && r.price).toBe(100);
  });

  it('成本非正时不能按加价率定价', () => {
    expect(priceFromMarkup(0, 0.25)).toEqual({ error: '按加价率定价时成本必须为正数' });
  });
});

describe('costFromMargin / costFromMarkup', () => {
  it('售价 100 毛利率 20% 反推成本 80', () => {
    expect(costFromMargin(100, 0.2)).toEqual({ cost: 80 });
  });

  it('售价 100 加价率 25% 反推成本 80', () => {
    expect(costFromMarkup(100, 0.25)).toEqual({ cost: 80 });
  });

  it('加价率 ≤ -100% 无正解', () => {
    expect(costFromMarkup(100, -1)).toEqual({ error: '加价率必须大于 -100%，否则成本无正解' });
  });
});

describe('margin 与 markup 互转', () => {
  it('毛利率 20% 对应加价率 25%，反向一致', () => {
    expect(markupFromMargin(0.2)).toBeCloseTo(0.25, 12);
    expect(marginFromMarkup(0.25)).toBeCloseTo(0.2, 12);
  });

  it('边界参数报错', () => {
    expect(markupFromMargin(1)).toEqual({ error: '毛利率必须小于 100%' });
    expect(marginFromMarkup(-1)).toEqual({ error: '加价率必须大于 -100%' });
  });
});

describe('breakEvenListPrice', () => {
  it('按最深折扣反推保本挂牌价', () => {
    const r = breakEvenListPrice(80, [0.9, 0.8, 0.7]);
    expect(r).toEqual({ listPrice: 80 / 0.7, minDiscount: 0.7 });
  });

  it('空折扣与非正折扣报错', () => {
    expect(breakEvenListPrice(80, [])).toEqual({ error: '请至少填写一档折扣' });
    const r = breakEvenListPrice(80, [0]);
    expect('error' in r).toBe(true);
  });
});

describe('batchPricing', () => {
  it('逐行计算售价并对非法行保留错误', () => {
    const rows = batchPricing('80,20%\n100, 25\nbad,10%', 0.15);
    expect(rows).toHaveLength(3);
    expect(rows[0]!.price).toBeCloseTo(100, 10);
    expect(rows[1]!.price).toBeCloseTo(100 / 0.75, 10);
    expect(rows[2]!.price).toBeNull();
    expect(rows[2]!.error).toBeTruthy();
  });

  it('缺省毛利率时使用默认值', () => {
    const rows = batchPricing('80', 0.2);
    expect(rows[0]!.price).toBeCloseTo(100, 10);
  });

  it('空文本返回空数组', () => {
    expect(batchPricing('\n  \n', 0.2)).toEqual([]);
  });

  it('可序列化为带表头的 CSV', () => {
    const csv = batchToCsv(batchPricing('80,20%', 0.2));
    expect(csv.split('\n')[0]).toBe('cost,margin,price,error');
    expect(csv).toContain('80,20%,100,');
  });
});

describe('roundTrim / formatPercent', () => {
  it('去除尾随零并控制小数位', () => {
    expect(roundTrim(100)).toBe('100');
    expect(roundTrim(33.3333333)).toBe('33.3333');
    expect(roundTrim(0.1 + 0.2)).toBe('0.3');
  });

  it('比率格式化与空值占位', () => {
    expect(formatPercent(0.2)).toBe('20%');
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(Number.NEGATIVE_INFINITY)).toBe('-∞');
  });
});
