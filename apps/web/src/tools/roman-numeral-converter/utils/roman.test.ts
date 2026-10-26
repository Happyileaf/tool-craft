import { describe, it, expect } from 'vitest';
import {
  ROMAN_MAX,
  convertBatch,
  convertLine,
  integerToRoman,
  romanToInteger,
} from './roman';

describe('整数 → 罗马数字', () => {
  it('标准减法记法向量', () => {
    expect(integerToRoman(1994)).toBe('MCMXCIV');
    expect(integerToRoman(3999)).toBe('MMMCMXCIX');
    expect(integerToRoman(4)).toBe('IV');
    expect(integerToRoman(9)).toBe('IX');
    expect(integerToRoman(40)).toBe('XL');
    expect(integerToRoman(90)).toBe('XC');
    expect(integerToRoman(400)).toBe('CD');
    expect(integerToRoman(900)).toBe('CM');
  });

  it('边界与常见值', () => {
    expect(integerToRoman(1)).toBe('I');
    expect(integerToRoman(3)).toBe('III');
    expect(integerToRoman(58)).toBe('LVIII');
    expect(integerToRoman(2024)).toBe('MMXXIV');
  });

  it('0、负数、4000、小数抛错', () => {
    expect(() => integerToRoman(0)).toThrow('1–3999');
    expect(() => integerToRoman(-1)).toThrow('1–3999');
    expect(() => integerToRoman(ROMAN_MAX + 1)).toThrow('1–3999');
    expect(() => integerToRoman(1.5)).toThrow('1–3999');
  });
});

describe('罗马数字 → 整数', () => {
  it('规范向量与大小写/空白容错', () => {
    expect(romanToInteger('MCMXCIV')).toBe(1994);
    expect(romanToInteger('  mcmxciv ')).toBe(1994);
    expect(romanToInteger('LVIII')).toBe(58);
    expect(romanToInteger('I')).toBe(1);
  });

  it('非法写法报错：IIII、VX、IC、MMMM', () => {
    expect(() => romanToInteger('IIII')).toThrow('标准减法记法');
    expect(() => romanToInteger('VX')).toThrow('标准减法记法');
    expect(() => romanToInteger('IC')).toThrow('标准减法记法');
    expect(() => romanToInteger('MMMM')).toThrow('标准减法记法');
  });

  it('非罗马字符与空串报错', () => {
    expect(() => romanToInteger('IVX42')).toThrow('非罗马');
    expect(() => romanToInteger('abc')).toThrow('非罗马');
    expect(() => romanToInteger('   ')).toThrow('不能为空');
  });
});

describe('双向逆运算', () => {
  it('1–3999 全部整数往返一致', () => {
    for (let value = 1; value <= ROMAN_MAX; value += 1) {
      expect(romanToInteger(integerToRoman(value))).toBe(value);
    }
  });
});

describe('自动方向与批量', () => {
  it('convertLine 按内容自动识别方向', () => {
    expect(convertLine('1994')).toBe('MCMXCIV');
    expect(convertLine('MCMXCIV')).toBe('1994');
  });

  it('逐行批量转换并忽略空行', () => {
    const results = convertBatch('1994\nmcmxciv\n\nIIII\n42');
    expect(results).toHaveLength(4);
    expect(results[0]).toMatchObject({ line: 1, input: '1994', output: 'MCMXCIV' });
    expect(results[1]).toMatchObject({ line: 2, output: '1994', error: null });
    expect(results[3]!.line).toBe(5);
    expect(results[3]!.output).toBe('XLII');
    expect(results[2]!.error).toContain('标准减法记法');
    expect(results[2]!.output).toBeNull();
  });
});
