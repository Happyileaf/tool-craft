import { describe, expect, it } from 'vitest';
import {
  aprToEar,
  earToApr,
  effectiveCostRate,
  formatPercent,
  rateSpread,
} from './rate';

describe('aprToEar 离散复利官方向量（APR 12%）', () => {
  const APR = 12;

  it('按月 n=12 → 12.6825%', () => {
    expect(aprToEar(APR, 'monthly')).toBeCloseTo(12.682503, 4);
  });

  it('按季 n=4 → 12.5509%', () => {
    expect(aprToEar(APR, 'quarterly')).toBeCloseTo(12.550881, 4);
  });

  it('按半年 n=2 → 12.3600%', () => {
    expect(aprToEar(APR, 'semi-annual')).toBeCloseTo(12.36, 4);
  });

  it('按日 n=365 → 12.7475%', () => {
    expect(aprToEar(APR, 'daily')).toBeCloseTo(12.74746, 4);
  });

  it('复利频次越高 EAR 越大：月 > 季 > 半年', () => {
    const monthly = aprToEar(APR, 'monthly');
    const quarterly = aprToEar(APR, 'quarterly');
    const semi = aprToEar(APR, 'semi-annual');
    expect(monthly).toBeGreaterThan(quarterly);
    expect(quarterly).toBeGreaterThan(semi);
    expect(aprToEar(APR, 'daily')).toBeGreaterThan(monthly);
  });
});

describe('连续复利', () => {
  it('APR 10% → EAR = e^0.1 − 1 ≈ 10.5171%', () => {
    expect(aprToEar(10, 'continuous')).toBeCloseTo(10.517092, 4);
  });

  it('APR 0% 时任意频次 EAR 均为 0', () => {
    for (const p of ['monthly', 'quarterly', 'daily', 'continuous'] as const) {
      expect(aprToEar(0, p)).toBe(0);
    }
  });
});

describe('earToApr 反求与往返一致性', () => {
  const cases = [
    { apr: 12, period: 'monthly' as const },
    { apr: 12, period: 'quarterly' as const },
    { apr: 12, period: 'semi-annual' as const },
    { apr: 12, period: 'daily' as const },
    { apr: 10, period: 'continuous' as const },
    { apr: 0, period: 'monthly' as const },
    { apr: 24.5, period: 'daily' as const },
  ];

  for (const { apr, period } of cases) {
    it(`${period} 往返 APR ${apr}% 误差 < 1e-6`, () => {
      const ear = aprToEar(apr, period);
      const back = earToApr(ear, period);
      expect(Math.abs(back - apr)).toBeLessThan(1e-6);
    });
  }

  it('连续复利 r = ln(1+EAR) 直接验证', () => {
    const ear = 10.517092;
    // ear/100 = 0.10517092，故 1+EAR = 1.10517092，ln 后约为名义利率 10%
    expect(earToApr(ear, 'continuous')).toBeCloseTo(
      Math.log(1 + ear / 100) * 100,
      5,
    );
    expect(earToApr(ear, 'continuous')).toBeCloseTo(10, 4);
  });
});

describe('含手续费有效年化成本', () => {
  it('本金 10000、费 200、APR 12% 按月，有效成本严格大于无费 EAR 12.6825%', () => {
    const cost = effectiveCostRate(10000, 200, 12, 'monthly');
    const plainEar = aprToEar(12, 'monthly');
    expect(cost).toBeGreaterThan(plainEar);
    expect(cost).toBeGreaterThan(12.6825);
  });

  it('费用越高有效年化越高', () => {
    const low = effectiveCostRate(10000, 100, 12, 'monthly');
    const mid = effectiveCostRate(10000, 500, 12, 'monthly');
    const high = effectiveCostRate(10000, 2000, 12, 'monthly');
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
  });

  it('零手续费时有效成本等于普通 EAR', () => {
    expect(effectiveCostRate(10000, 0, 12, 'monthly')).toBeCloseTo(
      aprToEar(12, 'monthly'),
      10,
    );
    expect(effectiveCostRate(10000, 0, 10, 'continuous')).toBeCloseTo(
      aprToEar(10, 'continuous'),
      10,
    );
  });

  it('连续复利用 e^r 增长，费用同样抬升成本', () => {
    const cost = effectiveCostRate(5000, 100, 10, 'continuous');
    expect(cost).toBeGreaterThan(aprToEar(10, 'continuous'));
  });
});

describe('非法输入防护', () => {
  it('负利率报错且不产出 NaN', () => {
    expect(() => aprToEar(-1, 'monthly')).toThrow(/名义年利率/);
    expect(() => earToApr(-1, 'daily')).toThrow(/实际年利率/);
  });

  it('NaN / Infinity 利率报错', () => {
    expect(() => aprToEar(Number.NaN, 'monthly')).toThrow();
    expect(() => aprToEar(Number.POSITIVE_INFINITY, 'monthly')).toThrow();
  });

  it('负本金或非正本金报错', () => {
    expect(() => effectiveCostRate(-100, 10, 12, 'monthly')).toThrow(/本金/);
    expect(() => effectiveCostRate(0, 10, 12, 'monthly')).toThrow(/本金/);
  });

  it('负手续费报错', () => {
    expect(() => effectiveCostRate(10000, -1, 12, 'monthly')).toThrow(/手续费/);
  });

  it('手续费 ≥ 本金报错', () => {
    expect(() => effectiveCostRate(10000, 10000, 12, 'monthly')).toThrow(/手续费必须小于/);
    expect(() => effectiveCostRate(10000, 12000, 12, 'monthly')).toThrow(/手续费必须小于/);
  });
});

describe('辅助函数', () => {
  it('rateSpread 返回 EAR − APR 利差', () => {
    expect(rateSpread(12, 12.6825)).toBeCloseTo(0.6825, 6);
  });

  it('formatPercent 固定四位小数', () => {
    expect(formatPercent(12.682503)).toBe('12.6825%');
    expect(formatPercent(0)).toBe('0.0000%');
    expect(formatPercent(Number.NaN)).toBe('—');
  });
});
