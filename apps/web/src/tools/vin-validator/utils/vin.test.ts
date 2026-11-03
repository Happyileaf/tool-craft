import { describe, expect, it } from 'vitest';
import { SAMPLE_VIN } from '../constants';
import { normalizeVin, validateVin } from './vin';

describe('normalizeVin', () => {
  it('转大写并去除空白与连字符', () => {
    expect(normalizeVin(' lhg-8263 3a00 ')).toBe('LHG82633A00');
    expect(normalizeVin('1hgcm82633a004352')).toBe('1HGCM82633A004352');
  });
});

describe('validateVin 合法用例', () => {
  it('公开教学 VIN 通过校验', () => {
    const result = validateVin(SAMPLE_VIN);
    expect(result.valid).toBe(true);
    expect(result.actualCheckDigit).toBe('3');
    expect(result.expectedCheckDigit).toBe('3');
    expect(result.remainder).toBe(3);
    expect(result.weightedSum).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });

  it('校验位为 X（余数 10）的用例', () => {
    // 1M8GDM9AXKP042788：加权和对 11 取模为 10 → X
    const result = validateVin('1M8GDM9AXKP042788');
    expect(result.remainder).toBe(10);
    expect(result.expectedCheckDigit).toBe('X');
    expect(result.valid).toBe(true);
  });

  it('接受小写输入（内部规范化）', () => {
    const result = validateVin(SAMPLE_VIN.toLowerCase());
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe(SAMPLE_VIN);
  });

  it('第 9 位权重为 0 且不参与求和', () => {
    const result = validateVin(SAMPLE_VIN);
    const check = result.details.find((d) => d.isCheckDigit);
    expect(check?.position).toBe(9);
    expect(check?.weight).toBe(0);
    expect(check?.product).toBe(0);
  });

  it('逐位明细共 17 项', () => {
    const result = validateVin(SAMPLE_VIN);
    expect(result.details).toHaveLength(17);
    expect(result.details[0]).toMatchObject({ position: 1, char: '1', value: 1, weight: 8, product: 8 });
  });
});

describe('validateVin 非法用例', () => {
  it('校验位错误时 valid=false 并给出期望值', () => {
    const wrong = `${SAMPLE_VIN.slice(0, 8)}X${SAMPLE_VIN.slice(9)}`;
    const result = validateVin(wrong);
    expect(result.valid).toBe(false);
    expect(result.expectedCheckDigit).toBe('3');
    expect(result.actualCheckDigit).toBe('X');
  });

  it('长度不足或超长报错', () => {
    expect(validateVin('1HGCM82633A').errors.join(' ')).toContain('17 位');
    const long = validateVin(`${SAMPLE_VIN}X`);
    expect(long.errors.join(' ')).toContain('17 位');
    expect(long.valid).toBe(false);
  });

  it('禁用字母 I/O/Q 报错', () => {
    const result = validateVin('1HGCM826I3A0043520'.slice(0, 17));
    expect(result.errors.some((e) => e.includes('I'))).toBe(true);
  });

  it('非字母数字字符报错', () => {
    const result = validateVin('1HGCM82633A00435@');
    expect(result.errors.some((e) => e.includes('非法字符'))).toBe(true);
  });

  it('空输入提示', () => {
    expect(validateVin('   ').errors).toContain('请输入 VIN。');
    expect(validateVin('').valid).toBe(false);
  });
});
