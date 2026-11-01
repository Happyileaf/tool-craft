import { describe, it, expect } from 'vitest';
import {
  npv,
  irr,
  evaluateInvestment,
  IRR_NOT_EXIST_ERROR,
  type NpvRowDetail,
  type NpvResult,
  type IrrResult,
} from './npvIrr';

/** 取 NPV 成功结果（失败时让用例直接报错） */
function expectNpvOk(result: NpvResult): { npv: number; details: NpvRowDetail[] } {
  if (result.error !== null) {
    throw new Error(`expected NPV success but got error: ${result.error}`);
  }
  return { npv: result.npv, details: result.details };
}

/** 取 IRR 成功结果（失败时让用例直接报错） */
function expectIrrOk(result: IrrResult): number {
  if (result.error !== null) {
    throw new Error(`expected IRR success but got error: ${result.error}`);
  }
  return result.irr;
}

describe('npv', () => {
  it('计算固定验收向量 [-1000, 600, 600] 在 10% 下 NPV ≈ 41.32', () => {
    const result = npv([-1000, 600, 600], 0.1);
    expect(result.error).toBeNull();
    if (result.error === null) {
      expect(result.npv).toBeCloseTo(41.32, 2);
      expect(result.npv).toBeCloseTo(41.32231404958662, 10);
    }
  });

  it('t=0 首期不折现：discountFactor=1 且 presentValue=CF0', () => {
    const result = npv([-1000, 600, 600], 0.1);
    expect(result.error).toBeNull();
    if (result.error === null) {
      const first = result.details[0];
      expect(first?.t).toBe(0);
      expect(first?.discountFactor).toBe(1);
      expect(first?.presentValue).toBe(-1000);
      expect(first?.cashFlow).toBe(-1000);
    }
  });

  it('逐期折现因子按 1/(1+r)^t 递减', () => {
    const result = npv([-1000, 600, 600], 0.1);
    if (result.error === null) {
      expect(result.details[1]?.discountFactor).toBeCloseTo(1 / 1.1, 12);
      expect(result.details[2]?.discountFactor).toBeCloseTo(1 / 1.21, 12);
      expect(result.details[1]?.presentValue).toBeCloseTo(600 / 1.1, 10);
      expect(result.details[2]?.presentValue).toBeCloseTo(600 / 1.21, 10);
      expect(result.details).toHaveLength(3);
    }
  });

  it('r=0 时 NPV 等于现金流简单求和，所有折现因子为 1', () => {
    const result = npv([-100, 50, 70], 0);
    if (result.error === null) {
      expect(result.npv).toBeCloseTo(20, 12);
      expect(result.details.every((row) => row.discountFactor === 1)).toBe(true);
    }
  });

  it('支持负贴现率（大于 -100%）', () => {
    const result = npv([-100, 110], -0.5);
    if (result.error === null) {
      // -100 + 110/0.5 = 120
      expect(result.npv).toBeCloseTo(120, 10);
    }
  });

  it('首项非负（如 [0, -100, 110]）NPV 照常数值计算', () => {
    const result = npv([0, -100, 110], 0.1);
    if (result.error === null) {
      expect(result.details[0]?.cashFlow).toBe(0);
      expect(result.details[0]?.presentValue).toBe(0);
      expect(result.npv).toBeCloseTo(-100 / 1.1 + 110 / 1.21, 10);
    }
  });

  it('单行现金流：NPV 恒等于该期金额，与贴现率无关', () => {
    const result = npv([-100], 0.15);
    if (result.error === null) {
      expect(result.npv).toBe(-100);
      expect(result.details).toHaveLength(1);
    }
  });

  it('全 0 现金流 NPV 为 0', () => {
    const result = npv([0, 0, 0], 0.08);
    if (result.error === null) {
      expect(result.npv).toBe(0);
      expect(result.details.every((row) => row.presentValue === 0)).toBe(true);
    }
  });

  it('空现金流返回「请至少输入 1 期现金流」', () => {
    const result = npv([], 0.1);
    expect(result.error).toBe('请至少输入 1 期现金流');
  });

  it('NaN / Infinity 现金流返回定位到期次的错误', () => {
    expect(npv([100, Number.NaN], 0.1).error).toBe('第 1 期（t=1）的现金流不是有效数字');
    expect(npv([100, Number.POSITIVE_INFINITY], 0.1).error).toBe(
      '第 1 期（t=1）的现金流不是有效数字',
    );
    expect(npv([Number.NEGATIVE_INFINITY], 0.1).error).toBe(
      '第 0 期（t=0）的现金流不是有效数字',
    );
  });

  it('rate = -1（-100%）返回「贴现率必须大于 -100%」', () => {
    expect(npv([-100, 110], -1).error).toBe('贴现率必须大于 -100%');
  });

  it('rate < -1 或 NaN 同样返回贴现率错误', () => {
    expect(npv([-100, 110], -1.5).error).toBe('贴现率必须大于 -100%');
    expect(npv([-100, 110], Number.NaN).error).toBe('贴现率必须大于 -100%');
  });

  it('失败结果不携带 details 数据（错误对象形状）', () => {
    const result = npv([], 0.1);
    expect(result).toEqual({ error: '请至少输入 1 期现金流' });
  });
});

describe('irr', () => {
  it('固定验收向量 [-1000, 600, 600] 的 IRR ≈ 0.1307（误差 < 1e-4）', () => {
    const value = expectIrrOk(irr([-1000, 600, 600]));
    expect(value).toBeCloseTo(0.1307, 4);
    expect(Math.abs(value - 0.1306623863)).toBeLessThan(1e-9);
  });

  it('在求得的 IRR 处 NPV 接近 0（|NPV| < 1e-6）', () => {
    const value = expectIrrOk(irr([-1000, 600, 600]));
    const result = npv([-1000, 600, 600], value);
    if (result.error === null) {
      expect(Math.abs(result.npv)).toBeLessThan(1e-6);
    }
  });

  it('首项非负 [0, -100, 110] 照常数值求解，IRR = 0.1', () => {
    const value = expectIrrOk(irr([0, -100, 110]));
    expect(value).toBeCloseTo(0.1, 6);
    const result = npv([0, -100, 110], value);
    if (result.error === null) {
      expect(Math.abs(result.npv)).toBeLessThan(1e-6);
    }
  });

  it('两期 [-100, 110] 的 IRR 恰为 0.1', () => {
    const value = expectIrrOk(irr([-100, 110]));
    expect(value).toBeCloseTo(0.1, 8);
  });

  it('更长的年金型现金流也能收敛并使 NPV≈0', () => {
    const cashFlows = [-5000, 1200, 1500, 1800, 2000, 1600];
    const value = expectIrrOk(irr(cashFlows));
    const result = npv(cashFlows, value);
    if (result.error === null) {
      expect(Math.abs(result.npv)).toBeLessThan(1e-6);
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('全负现金流 [-100, -20] 返回固定中文错误', () => {
    expect(irr([-100, -20])).toEqual({ error: IRR_NOT_EXIST_ERROR });
  });

  it('全正现金流 [100, 200] 返回固定中文错误', () => {
    expect(irr([100, 200])).toEqual({ error: IRR_NOT_EXIST_ERROR });
  });

  it('全 0 现金流 IRR 不存在', () => {
    expect(irr([0, 0, 0]).error).toBe(IRR_NOT_EXIST_ERROR);
  });

  it('单行 [-100] 为全同号，IRR 不存在', () => {
    expect(irr([-100]).error).toBe(IRR_NOT_EXIST_ERROR);
  });

  it('单行 [100] 同样没有 IRR', () => {
    expect(irr([100]).error).toBe(IRR_NOT_EXIST_ERROR);
  });

  it('空现金流返回「请至少输入 1 期现金流」', () => {
    expect(irr([]).error).toBe('请至少输入 1 期现金流');
  });

  it('非有限数现金流返回定位期次错误', () => {
    expect(irr([-100, Number.NaN]).error).toBe('第 1 期（t=1）的现金流不是有效数字');
  });

  it('IRR 结果恒在搜索区间 [-0.9999, 10] 内', () => {
    // [-100, 1000] 的理论 IRR = 9（-100 + 1000/(1+r)=0 → r=9），贴近上界
    const value = expectIrrOk(irr([-100, 1000]));
    expect(value).toBeGreaterThanOrEqual(-0.9999);
    expect(value).toBeLessThanOrEqual(10);
    expect(value).toBeCloseTo(9, 4);
  });

  it('数学上有根但根落在区间外（如 IRR=99）时按区间不异号判无解', () => {
    // [-1, 100]：r=99 才使 NPV=0，超出上界 10，两端 NPV 同为正
    expect(irr([-1, 100]).error).toBe(IRR_NOT_EXIST_ERROR);
  });

  it('负 IRR：先流入后流出且总现值为亏的情形', () => {
    // -100/(1+r) + 50/(1+r)^2 = 0 -> 1+r = 0.5 -> r = -0.5
    const value = expectIrrOk(irr([0, -100, 50]));
    expect(value).toBeCloseTo(-0.5, 6);
  });
});

describe('evaluateInvestment', () => {
  it('NPV>0 且 IRR(0.1307) > 门槛 0.1 → invest', () => {
    const result = evaluateInvestment(41.32, 0.1306623863, 0.1);
    expect(result.decision).toBe('invest');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('NPV>0 但 IRR 0.1307 ≤ 门槛 0.2 → reject', () => {
    const result = evaluateInvestment(41.32, 0.1306623863, 0.2);
    expect(result.decision).toBe('reject');
    expect(result.reasons.some((reason) => reason.includes('门槛'))).toBe(true);
  });

  it('NPV<0 即使 IRR 高于门槛也 reject', () => {
    const result = evaluateInvestment(-50, 0.3, 0.08);
    expect(result.decision).toBe('reject');
    expect(result.reasons.some((reason) => reason.includes('NPV 为负'))).toBe(true);
  });

  it('NPV=0 视为不值得投资', () => {
    expect(evaluateInvestment(0, 0.12, 0.08).decision).toBe('reject');
  });

  it('门槛率为 null 时不考核 IRR：NPV>0 即 invest', () => {
    const result = evaluateInvestment(10, 0.01, null);
    expect(result.decision).toBe('invest');
  });

  it('门槛率为 null 且 NPV<0 → reject', () => {
    expect(evaluateInvestment(-1, 0.5, null).decision).toBe('reject');
  });

  it('设置了门槛率但 IRR 不存在（null）时 reject 并说明原因', () => {
    const result = evaluateInvestment(20, null, 0.08);
    expect(result.decision).toBe('reject');
    expect(result.reasons.some((reason) => reason.includes('IRR 不存在'))).toBe(true);
  });

  it('IRR 恰好等于门槛率（严格大于才通过）→ reject', () => {
    expect(evaluateInvestment(10, 0.08, 0.08).decision).toBe('reject');
  });

  it('未设门槛率且 IRR 不存在：NPV>0 仍可 invest', () => {
    const result = evaluateInvestment(5, null, null);
    expect(result.decision).toBe('invest');
  });
});

describe('npv 成功结果辅助断言', () => {
  it('expectNpvOk 在成功时返回明细', () => {
    const result = expectNpvOk(npv([-100, 110], 0.1));
    expect(result.npv).toBeCloseTo(0, 8);
    expect(result.details).toHaveLength(2);
  });
});
