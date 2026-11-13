import { describe, it, expect } from 'vitest';
import {
  METHOD_LABELS,
  doubleDeclining,
  round2,
  straightLine,
  sumOfYearsDigits,
  unitsOfActivity,
  validateBaseInputs,
  type DepreciationMethod,
} from './depreciation';

// 通用示例：原值 100000，净残值 10000，5 年
const COST = 100000;
const SALVAGE = 10000;
const YEARS = 5;
const BASE = 90000;

describe('round2', () => {
  it('四舍五入到两位小数', () => {
    expect(round2(1234.567)).toBe(1234.57);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});

describe('validateBaseInputs', () => {
  it('合法输入返回 null', () => {
    expect(validateBaseInputs(COST, SALVAGE, YEARS)).toBeNull();
  });

  it('非法原值、残值与期数返回错误', () => {
    expect(validateBaseInputs(0, 100, 5)).not.toBeNull();
    expect(validateBaseInputs(100, -1, 5)).not.toBeNull();
    expect(validateBaseInputs(100, 100, 5)).not.toBeNull();
    expect(validateBaseInputs(100, 10, 0)).not.toBeNull();
    expect(validateBaseInputs(100, 10, 5.5)).not.toBeNull();
    expect(validateBaseInputs(100, 10, 101)).not.toBeNull();
  });
});

describe('straightLine 直线法', () => {
  it('每期折旧相等且末期净值等于净残值', () => {
    const result = straightLine(COST, SALVAGE, YEARS);
    expect(result.depreciableBase).toBe(BASE);
    expect(result.rows).toHaveLength(5);
    expect(result.rows.every((row) => row.depreciation === 18000)).toBe(true);
    const last = result.rows[result.rows.length - 1];
    expect(last?.accumulated).toBe(BASE);
    expect(last?.bookValue).toBe(SALVAGE);
  });

  it('除不尽时尾差由末期承接', () => {
    const result = straightLine(1000, 10, 3);
    expect(result.rows[0]?.depreciation).toBe(330);
    expect(result.rows[1]?.depreciation).toBe(330);
    expect(result.rows[2]?.depreciation).toBe(330);
    expect(result.rows[2]?.bookValue).toBe(10);
  });

  it('非法参数抛错', () => {
    expect(() => straightLine(-1, 0, 5)).toThrow();
  });
});

describe('unitsOfActivity 工作量法', () => {
  it('按工作量比例计提且总和等于可折旧基数', () => {
    // 总工作量 90000 工时，各期 30000 / 20000 / 40000
    const result = unitsOfActivity(COST, SALVAGE, [30000, 20000, 40000], 90000);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]?.depreciation).toBe(30000);
    expect(result.rows[1]?.depreciation).toBe(20000);
    expect(result.rows[2]?.depreciation).toBe(40000);
    expect(result.rows[2]?.accumulated).toBe(BASE);
    expect(result.rows[2]?.bookValue).toBe(SALVAGE);
  });

  it('工作量之和超过总工作量时报错', () => {
    expect(() => unitsOfActivity(COST, SALVAGE, [60000, 40000], 90000)).toThrow('超过');
  });

  it('负工作量与非法总工作量报错', () => {
    expect(() => unitsOfActivity(COST, SALVAGE, [-1], 100)).toThrow('负数');
    expect(() => unitsOfActivity(COST, SALVAGE, [10], 0)).toThrow('总工作量');
  });
});

describe('doubleDeclining 双倍余额递减法', () => {
  it('前期按双倍率递减、最后两年转直线法且期末净值为净残值', () => {
    const result = doubleDeclining(COST, SALVAGE, YEARS);
    expect(result.rows).toHaveLength(5);
    // 第 1 年：100000 × 2/5 = 40000
    expect(result.rows[0]?.depreciation).toBe(40000);
    expect(result.rows[0]?.bookValue).toBe(60000);
    // 第 2 年：60000 × 0.4 = 24000
    expect(result.rows[1]?.depreciation).toBe(24000);
    expect(result.rows[1]?.bookValue).toBe(36000);
    // 第 3 年：36000 × 0.4 = 14400
    expect(result.rows[2]?.depreciation).toBe(14400);
    expect(result.rows[2]?.bookValue).toBe(21600);
    // 最后两年直线：(21600 − 10000) / 2 = 5800
    expect(result.rows[3]?.depreciation).toBe(5800);
    expect(result.rows[4]?.depreciation).toBe(5800);
    expect(result.rows[4]?.accumulated).toBe(BASE);
    expect(result.rows[4]?.bookValue).toBe(SALVAGE);
  });

  it('折旧额单调不增', () => {
    const result = doubleDeclining(200000, 5000, 6);
    for (let i = 1; i < result.rows.length; i += 1) {
      const prev = result.rows[i - 1]?.depreciation ?? 0;
      const current = result.rows[i]?.depreciation ?? 0;
      expect(current).toBeLessThanOrEqual(prev);
    }
    expect(result.rows[result.rows.length - 1]?.bookValue).toBe(5000);
  });
});

describe('sumOfYearsDigits 年数总和法', () => {
  it('按剩余年数比例加速折旧且期末净值为净残值', () => {
    const result = sumOfYearsDigits(COST, SALVAGE, YEARS);
    // 年数总和 = 15
    expect(result.rows).toHaveLength(5);
    expect(result.rows[0]?.depreciation).toBe(round2((BASE * 5) / 15)); // 30000
    expect(result.rows[1]?.depreciation).toBe(24000);
    expect(result.rows[2]?.depreciation).toBe(18000);
    expect(result.rows[3]?.depreciation).toBe(12000);
    // 末期承接尾差
    expect(result.rows[4]?.accumulated).toBe(BASE);
    expect(result.rows[4]?.bookValue).toBe(SALVAGE);
    expect(result.rows[4]?.depreciation).toBe(6000);
  });

  it('各期折旧之和等于可折旧基数', () => {
    const result = sumOfYearsDigits(5555, 77, 7);
    const total = result.rows.reduce((sum, row) => sum + row.depreciation, 0);
    expect(round2(total)).toBe(round2(5555 - 77));
  });
});

describe('METHOD_LABELS', () => {
  it('四种方法均有中文名', () => {
    const methods: DepreciationMethod[] = [
      'straight-line',
      'units-of-activity',
      'double-declining',
      'sum-of-years-digits',
    ];
    expect(methods.every((method) => METHOD_LABELS[method].length > 0)).toBe(true);
  });
});
