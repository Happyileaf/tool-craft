import { describe, expect, it } from 'vitest';
import { computeCheckDigit, luhnCheck, luhnSteps, luhnSum } from './luhn';
import {
  detectCardBrand,
  formatCardNumber,
  hasIllegalChars,
  sanitizeCardNumber,
  validateCardNumber,
} from './card';

describe('luhn', () => {
  it('通过常见测试卡号的 Luhn 校验', () => {
    expect(luhnCheck('4111111111111111')).toBe(true);
    expect(luhnCheck('5500005555555559')).toBe(true);
    expect(luhnCheck('340000000000009')).toBe(true);
    expect(luhnCheck('6011111111111117')).toBe(true);
    expect(luhnCheck('3530111333300000')).toBe(true);
    expect(luhnCheck('30569309025904')).toBe(true);
    expect(luhnCheck('6200000000000005')).toBe(true);
  });

  it('篡改一位后 Luhn 失败', () => {
    expect(luhnCheck('4111111111111112')).toBe(false);
    expect(luhnCheck('5500005555555558')).toBe(false);
  });

  it('空串、过短与非数字输入判为不合法', () => {
    expect(luhnCheck('')).toBe(false);
    expect(luhnCheck('7')).toBe(false);
    expect(luhnCheck('abcdefghijklmnop')).toBe(false);
  });

  it('逐位计算过程正确标记加倍位与贡献值', () => {
    const steps = luhnSteps('79');
    expect(steps[0]).toEqual({ digit: 7, doubled: true, contribution: 5 });
    expect(steps[1]).toEqual({ digit: 9, doubled: false, contribution: 9 });
    expect(luhnSum('79')).toBe(14);
  });

  it('computeCheckDigit 为合法卡号前缀推导出正确校验位', () => {
    expect(computeCheckDigit('411111111111111')).toBe(1);
    expect(computeCheckDigit('34000000000000')).toBe(9);
    expect(computeCheckDigit('620000000000000')).toBe(5);
  });

  it('computeCheckDigit 对非法前缀返回 null', () => {
    expect(computeCheckDigit('')).toBeNull();
    expect(computeCheckDigit('12a')).toBeNull();
  });
});

describe('card brand detection', () => {
  it('依据 IIN 与长度识别各卡组织', () => {
    expect(detectCardBrand('4111111111111111').key).toBe('visa');
    expect(detectCardBrand('4111111111111').key).toBe('visa');
    expect(detectCardBrand('5500005555555559').key).toBe('mastercard');
    expect(detectCardBrand('2221000000000009').key).toBe('mastercard');
    expect(detectCardBrand('340000000000009').key).toBe('amex');
    expect(detectCardBrand('378282246310005').key).toBe('amex');
    expect(detectCardBrand('6200000000000005').key).toBe('unionpay');
    expect(detectCardBrand('6011111111111117').key).toBe('discover');
    expect(detectCardBrand('6500000000000004').key).toBe('discover');
    expect(detectCardBrand('3530111333300000').key).toBe('jcb');
    expect(detectCardBrand('30569309025904').key).toBe('diners');
  });

  it('前缀匹配但长度不符时判为未知卡种', () => {
    // 34 开头但长度不是 15
    expect(detectCardBrand('3400000000000091').key).toBe('unknown');
  });

  it('无法匹配的卡号返回未知卡种', () => {
    expect(detectCardBrand('9999999999999999').key).toBe('unknown');
  });
});

describe('formatting and validation', () => {
  it('忽略空格与连字符并按 4 位分组', () => {
    expect(sanitizeCardNumber('4111 1111-1111 1111')).toBe('4111111111111111');
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
    expect(formatCardNumber('340000000000009')).toBe('3400 0000 0000 009');
  });

  it('识别非法字符', () => {
    expect(hasIllegalChars('4111 1111')).toBe(false);
    expect(hasIllegalChars('4111-1111')).toBe(false);
    expect(hasIllegalChars('4111a1111')).toBe(true);
  });

  it('完整校验返回结构化结论', () => {
    const visa = validateCardNumber('4111 1111 1111 1111');
    expect(visa.valid).toBe(true);
    expect(visa.luhnValid).toBe(true);
    expect(visa.brand.key).toBe('visa');
    expect(visa.length).toBe(16);

    const amex = validateCardNumber('3400-0000-0000-009');
    expect(amex.valid).toBe(true);
    expect(amex.brand.key).toBe('amex');

    const tampered = validateCardNumber('4111 1111 1111 1112');
    expect(tampered.valid).toBe(false);
    expect(tampered.luhnValid).toBe(false);
    expect(tampered.lengthValid).toBe(true);
  });

  it('长度超出 12-19 区间判为格式不合法', () => {
    const tooShort = validateCardNumber('411111');
    expect(tooShort.valid).toBe(false);
    expect(tooShort.lengthValid).toBe(false);

    const tooLong = validateCardNumber('41111111111111111111');
    expect(tooLong.valid).toBe(false);
    expect(tooLong.lengthValid).toBe(false);
  });

  it('未知卡种但 Luhn 通过时仍如实给出结论', () => {
    // 6362 开头不在任何卡组织规则中，长度 16，校验位 9
    const result = validateCardNumber('6362000000000009');
    expect(result.luhnValid).toBe(true);
    expect(result.brand.key).toBe('unknown');
  });

  it('空输入与含非法字符输入不执行 Luhn 判定', () => {
    const empty = validateCardNumber('   ');
    expect(empty.empty).toBe(true);
    expect(empty.valid).toBe(false);
    expect(empty.luhnTotal).toBeNull();

    const illegal = validateCardNumber('4111 abcd 1111 1111');
    expect(illegal.illegalChars).toBe(true);
    expect(illegal.valid).toBe(false);
  });
});
