import { describe, it, expect } from 'vitest';
import { calculateVat, roundTo2, validateVatInput, VatDirectionEnum } from './vat';

describe('calculateVat 不含税 → 含税', () => {
  it('1000 元、13% → 税额 130、含税 1130', () => {
    const result = calculateVat(VatDirectionEnum.EXCLUSIVE_TO_INCLUSIVE, 1000, 13);
    expect(result).toMatchObject({
      amountExcludingVat: 1000,
      taxAmount: 130,
      amountIncludingVat: 1130,
      error: null,
    });
  });

  it('各常用税率档位计算正确', () => {
    expect(calculateVat(VatDirectionEnum.EXCLUSIVE_TO_INCLUSIVE, 1000, 9).taxAmount).toBe(90);
    expect(calculateVat(VatDirectionEnum.EXCLUSIVE_TO_INCLUSIVE, 1000, 6).amountIncludingVat).toBe(1060);
    expect(calculateVat(VatDirectionEnum.EXCLUSIVE_TO_INCLUSIVE, 1000, 3).taxAmount).toBe(30);
    expect(calculateVat(VatDirectionEnum.EXCLUSIVE_TO_INCLUSIVE, 1000, 1).amountIncludingVat).toBe(1010);
  });

  it('自定义税率与两位小数四舍五入', () => {
    const result = calculateVat(VatDirectionEnum.EXCLUSIVE_TO_INCLUSIVE, 123.45, 13);
    expect(result.taxAmount).toBe(16.05);
    expect(result.amountIncludingVat).toBe(139.5);
  });

  it('零金额三项均为 0', () => {
    const result = calculateVat(VatDirectionEnum.EXCLUSIVE_TO_INCLUSIVE, 0, 13);
    expect([result.amountExcludingVat, result.taxAmount, result.amountIncludingVat]).toEqual([0, 0, 0]);
  });
});

describe('calculateVat 含税 → 不含税', () => {
  it('1130 元含税、13% 反算不含税 1000、税额 130', () => {
    const result = calculateVat(VatDirectionEnum.INCLUSIVE_TO_EXCLUSIVE, 1130, 13);
    expect(result.amountExcludingVat).toBe(1000);
    expect(result.taxAmount).toBe(130);
    expect(result.amountIncludingVat).toBe(1130);
  });

  it('100 元含税、13% 满足不含税 + 税额 = 含税合计', () => {
    const result = calculateVat(VatDirectionEnum.INCLUSIVE_TO_EXCLUSIVE, 100, 13);
    expect(result.amountExcludingVat).toBe(88.5);
    expect(result.taxAmount).toBe(11.5);
    expect(result.amountExcludingVat + result.taxAmount).toBeCloseTo(100, 10);
  });

  it('各税率档位反算后三项自洽', () => {
    for (const rate of [13, 9, 6, 3, 1, 2.5]) {
      const result = calculateVat(VatDirectionEnum.INCLUSIVE_TO_EXCLUSIVE, 500, rate);
      expect(Math.round((result.amountExcludingVat + result.taxAmount) * 100) / 100).toBe(500);
    }
  });
});

describe('validateVatInput 错误处理', () => {
  it('负数金额报错', () => {
    expect(validateVatInput(-1, 13)).toContain('负数');
  });

  it('税率小于 0 或大于等于 100% 报错', () => {
    expect(validateVatInput(100, -1)).toContain('0%');
    expect(validateVatInput(100, 100)).toContain('100%');
    expect(validateVatInput(100, 120)).toContain('100%');
  });

  it('非数字输入报错', () => {
    expect(validateVatInput(Number.NaN, 13)).toContain('数字');
    expect(validateVatInput(100, Number.NaN)).toContain('数字');
  });

  it('非法输入时 calculateVat 返回错误且金额为 0', () => {
    const result = calculateVat(VatDirectionEnum.EXCLUSIVE_TO_INCLUSIVE, -10, 13);
    expect(result.error).not.toBeNull();
    expect(result.taxAmount).toBe(0);
  });

  it('合法输入返回 null', () => {
    expect(validateVatInput(100, 0)).toBeNull();
    expect(validateVatInput(100, 99.99)).toBeNull();
  });
});

describe('roundTo2', () => {
  it('四舍五入到两位小数', () => {
    expect(roundTo2(1.005)).toBe(1.01);
    expect(roundTo2(2.675)).toBe(2.68);
    expect(roundTo2(88.4956)).toBe(88.5);
  });
});
