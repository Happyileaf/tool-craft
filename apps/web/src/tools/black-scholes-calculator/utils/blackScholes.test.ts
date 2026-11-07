import { describe, it, expect } from 'vitest';
import {
  normalCdf,
  normalPdf,
  erf,
  validateInput,
  priceBlackScholes,
  impliedVolatility,
  formatNum,
  type BsInput,
} from './blackScholes';

const base: BsInput = {
  spot: 100,
  strike: 100,
  rate: 0.05,
  volatility: 0.2,
  maturity: 1,
  dividend: 0,
};

describe('正态分布基础函数', () => {
  it('CDF 对称且端点正确', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975002, 5);
    expect(normalCdf(-1.96)).toBeCloseTo(0.024998, 5);
  });

  it('erf 已知值与 PDF', () => {
    expect(erf(0)).toBe(0);
    expect(erf(1)).toBeCloseTo(0.84270079, 6);
    expect(normalPdf(0)).toBeCloseTo(0.39894228, 6);
  });
});

describe('validateInput', () => {
  it('拦截非正价格与负波动/期限', () => {
    expect(validateInput({ ...base, spot: 0 })).toContain('标的现价必须为正数');
    expect(validateInput({ ...base, strike: -1 })).toContain('行权价必须为正数');
    expect(validateInput({ ...base, volatility: -0.1 })).toContain('波动率不能为负数');
    expect(validateInput({ ...base, maturity: -1 })).toContain('期限不能为负数');
    expect(validateInput(base)).toEqual([]);
  });
});

describe('priceBlackScholes', () => {
  it('平价期权经典用例：call ≈ 10.4506，put-call parity 成立', () => {
    const call = priceBlackScholes(base, 'call');
    const put = priceBlackScholes(base, 'put');
    expect('error' in call).toBe(false);
    if (!('error' in call) && !('error' in put)) {
      expect(call.price).toBeCloseTo(10.45058, 4);
      expect(put.price).toBeCloseTo(5.57353, 4);
      // put-call parity: C - P = S - K*e^(-rT)
      expect(call.price - put.price).toBeCloseTo(base.spot - base.strike * Math.exp(-base.rate * base.maturity), 6);
      expect(call.delta).toBeCloseTo(0.6368, 3);
      expect(put.delta).toBeCloseTo(-0.3632, 3);
      // call 与 put 的 gamma、vega 相同
      expect(call.gamma).toBeCloseTo(put.gamma, 10);
      expect(call.vega).toBeCloseTo(put.vega, 10);
      expect(call.rho).toBeGreaterThan(0);
      expect(put.rho).toBeLessThan(0);
    }
  });

  it('连续股息率降低 call 价格', () => {
    const noDiv = priceBlackScholes(base, 'call');
    const withDiv = priceBlackScholes({ ...base, dividend: 0.03 }, 'call');
    if (!('error' in noDiv) && !('error' in withDiv)) {
      expect(withDiv.price).toBeLessThan(noDiv.price);
    }
  });

  it('到期时回退内在价值', () => {
    const itm = priceBlackScholes({ ...base, maturity: 0 }, 'call');
    const otm = priceBlackScholes({ ...base, maturity: 0, strike: 120 }, 'call');
    if (!('error' in itm) && !('error' in otm)) {
      expect(itm.price).toBeCloseTo(0, 10);
      expect(otm.price).toBe(0);
    }
  });

  it('零波动率不除零并返回内在价值', () => {
    const r = priceBlackScholes({ ...base, volatility: 0, strike: 90 }, 'call');
    expect('error' in r).toBe(false);
    if (!('error' in r)) {
      expect(r.price).toBeGreaterThan(0);
      expect(r.gamma).toBe(0);
    }
  });

  it('非法输入返回错误', () => {
    expect(priceBlackScholes({ ...base, spot: -5 }, 'call')).toEqual({
      error: '标的现价必须为正数',
    });
  });
});

describe('impliedVolatility', () => {
  it('由模型价反解能还原输入波动率', () => {
    const priced = priceBlackScholes(base, 'call');
    if ('error' in priced) {
      throw new Error(priced.error);
    }
    const iv = impliedVolatility(
      { spot: base.spot, strike: base.strike, rate: base.rate, maturity: base.maturity, dividend: base.dividend },
      'call',
      priced.price,
    );
    expect('error' in iv).toBe(false);
    if (!('error' in iv)) {
      expect(iv.impliedVolatility).toBeCloseTo(0.2, 5);
    }
  });

  it('低于内在价值的价格报错', () => {
    const iv = impliedVolatility(
      { spot: 100, strike: 90, rate: 0.05, maturity: 1, dividend: 0 },
      'call',
      1,
    );
    expect('error' in iv).toBe(true);
  });

  it('内在价值下界对应零波动率', () => {
    // 平价 put 在零波动下的价格即贴现行权价与现价之差
    const floor = priceBlackScholes({ ...base, volatility: 0 }, 'put');
    if ('error' in floor) {
      throw new Error(floor.error);
    }
    const iv = impliedVolatility(
      { spot: base.spot, strike: base.strike, rate: base.rate, maturity: base.maturity, dividend: base.dividend },
      'put',
      floor.price,
    );
    if (!('error' in iv)) {
      expect(iv.impliedVolatility).toBe(0);
    }
  });
});

describe('formatNum', () => {
  it('控制小数位并处理非有限值', () => {
    expect(formatNum(10.45058357, 4)).toBe('10.4506');
    expect(formatNum(2)).toBe('2');
    expect(formatNum(Number.NaN)).toBe('—');
    expect(formatNum(-0)).toBe('0');
  });
});
