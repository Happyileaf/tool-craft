import { describe, it, expect } from 'vitest';
import {
  annualKwhToAveragePower,
  calculateBill,
  effectiveUnitPrice,
  round,
  toWatt,
  validateAppliance,
  validatePrice,
  type PriceConfig,
} from './bill';
import { createDefaultAppliance } from '../constants';

const flatConfig = (price = 0.6): PriceConfig => ({
  mode: 'flat',
  flatPrice: price,
  peakPrice: 1,
  valleyPrice: 0.3,
  peakRatio: 60,
});

const heater = createDefaultAppliance({
  name: '电暖器',
  power: 2000,
  hoursPerDay: 2,
  daysPerMonth: 30,
  quantity: 1,
});
const tv = createDefaultAppliance({
  name: '电视',
  power: 100,
  hoursPerDay: 5,
  daysPerMonth: 30,
  quantity: 1,
});

describe('验收向量：单台电器', () => {
  it('2000W 电暖器每天 2h、30 天、0.6 元/kWh：月用电 120 kWh、月电费 72 元', () => {
    const result = calculateBill([heater], flatConfig());
    expect(result.errors).toEqual([]);
    expect(round(result.rows[0]!.monthlyKwh, 3)).toBe(120);
    expect(round(result.rows[0]!.monthlyCost, 2)).toBe(72);
  });

  it('100W 电视每天 5h、30 天：月用电 15 kWh、月电费 9 元', () => {
    const result = calculateBill([tv], flatConfig());
    expect(round(result.rows[0]!.monthlyKwh, 3)).toBe(15);
    expect(round(result.rows[0]!.monthlyCost, 2)).toBe(9);
  });

  it('15W 路由器 24h/天、30 天：月用电 10.8 kWh、月电费 6.48 元', () => {
    const router = createDefaultAppliance({
      name: '路由器',
      power: 15,
      hoursPerDay: 24,
      daysPerMonth: 30,
      quantity: 1,
    });
    const result = calculateBill([router], flatConfig());
    expect(round(result.rows[0]!.monthlyKwh, 3)).toBe(10.8);
    expect(round(result.rows[0]!.monthlyCost, 2)).toBe(6.48);
  });

  it('60W 风扇 2 台、每天 8h、30 天：月用电 28.8 kWh', () => {
    const fan = createDefaultAppliance({
      name: '风扇',
      power: 60,
      hoursPerDay: 8,
      daysPerMonth: 30,
      quantity: 2,
    });
    const result = calculateBill([fan], flatConfig());
    expect(round(result.rows[0]!.monthlyKwh, 3)).toBe(28.8);
  });
});

describe('验收向量：合计与年度', () => {
  it('电暖器 + 电视：月 135 kWh / 81 元，年 1620 kWh / 972 元', () => {
    const result = calculateBill([heater, tv], flatConfig());
    expect(result.summary).not.toBeNull();
    expect(round(result.summary!.monthlyKwh, 3)).toBe(135);
    expect(round(result.summary!.monthlyCost, 2)).toBe(81);
    expect(round(result.summary!.yearlyKwh, 3)).toBe(1620);
    expect(round(result.summary!.yearlyCost, 2)).toBe(972);
  });

  it('占比之和为 1，电暖器占比 120/135', () => {
    const result = calculateBill([heater, tv], flatConfig());
    const shareSum = result.rows.reduce((sum, row) => sum + row.monthlyShare, 0);
    expect(shareSum).toBeCloseTo(1, 10);
    expect(result.rows[0]!.monthlyShare).toBeCloseTo(120 / 135, 10);
  });

  it('平均每日电费 = 月电费 ÷ 30', () => {
    const result = calculateBill([heater, tv], flatConfig());
    expect(round(result.summary!.averageDailyCost, 2)).toBe(2.7);
  });
});

describe('验收向量：峰谷电价', () => {
  it('135 kWh、峰占比 60%、峰价 1.0、谷价 0.3：月电费 97.20 元', () => {
    const config: PriceConfig = {
      mode: 'tou',
      flatPrice: 0.6,
      peakPrice: 1,
      valleyPrice: 0.3,
      peakRatio: 60,
    };
    expect(effectiveUnitPrice(config)).toBeCloseTo(0.72, 10);
    const result = calculateBill([heater, tv], config);
    expect(round(result.summary!.monthlyCost, 2)).toBe(97.2);
  });
});

describe('验收向量：能效反推', () => {
  it('365 kWh/年 → 平均功率 41.67 W（365000 ÷ 8760）', () => {
    const result = annualKwhToAveragePower(365);
    expect(result.error).toBeNull();
    expect(round(result.powerW as number, 2)).toBe(41.67);
  });

  it('非法年耗电量报错', () => {
    expect(annualKwhToAveragePower(null).error).toMatch(/有效数字/);
    expect(annualKwhToAveragePower(-1).error).not.toBeNull();
  });
});

describe('单位换算与取整', () => {
  it('kW 输入正确换算为 W', () => {
    expect(toWatt(2, 'kW')).toBe(2000);
    expect(toWatt(100, 'W')).toBe(100);
  });

  it('round 四舍五入到指定小数位', () => {
    expect(round(10.8006, 3)).toBe(10.801);
    expect(round(72.004, 2)).toBe(72);
  });
});

describe('非法输入返回明确错误', () => {
  it('空电器表提示至少添加一台', () => {
    const result = calculateBill([], flatConfig());
    expect(result.errors).toContain('请至少添加一台电器');
    expect(result.summary).toBeNull();
  });

  it('每日时长 25h、每月天数 32 天、负功率报错', () => {
    const badHours = createDefaultAppliance({ name: 'A', power: 100, hoursPerDay: 25, daysPerMonth: 30, quantity: 1 });
    expect(validateAppliance(badHours, 0)).toMatch(/每日时长/);
    const badDays = createDefaultAppliance({ name: 'B', power: 100, hoursPerDay: 5, daysPerMonth: 32, quantity: 1 });
    expect(validateAppliance(badDays, 1)).toMatch(/每月天数/);
    const negativePower = createDefaultAppliance({ name: 'C', power: -10, hoursPerDay: 5, daysPerMonth: 30, quantity: 1 });
    expect(validateAppliance(negativePower, 2)).toMatch(/功率/);
  });

  it('calculateBill 遇到非法行不输出结果', () => {
    const bad = createDefaultAppliance({ name: 'A', power: 100, hoursPerDay: 25, daysPerMonth: 30, quantity: 1 });
    const result = calculateBill([bad], flatConfig());
    expect(result.rows).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('电价超范围或非数字报错', () => {
    expect(validatePrice(flatConfig(11))).toMatch(/电价/);
    expect(validatePrice(flatConfig(null as unknown as number))).toMatch(/有效数字/);
  });

  it('电价为 0 时费用为 0 并标记 zeroPrice', () => {
    const result = calculateBill([heater], flatConfig(0));
    expect(result.summary!.monthlyCost).toBe(0);
    expect(result.summary!.zeroPrice).toBe(true);
  });

  it('零时长或零功率输出 0 而非报错', () => {
    const zeroHours = createDefaultAppliance({ name: 'A', power: 100, hoursPerDay: 0, daysPerMonth: 30, quantity: 1 });
    const result = calculateBill([zeroHours], flatConfig());
    expect(result.errors).toEqual([]);
    expect(result.rows[0]!.monthlyKwh).toBe(0);
  });

  it('峰谷参数越界报错', () => {
    const bad: PriceConfig = { mode: 'tou', flatPrice: 0.6, peakPrice: 1, valleyPrice: 0.3, peakRatio: 120 };
    expect(validatePrice(bad)).toMatch(/峰段占比/);
  });
});
