import { describe, expect, it } from 'vitest';
import { convertToRmb } from './rmb';

describe('convertToRmb', () => {
  it.each<[string, string]>([
    ['0', '零元整'],
    ['0.00', '零元整'],
    ['1', '壹元整'],
    ['10', '壹拾元整'],
    ['11', '壹拾壹元整'],
    ['20', '贰拾元整'],
    ['100', '壹佰元整'],
    ['101', '壹佰零壹元整'],
    ['1001', '壹仟零壹元整'],
    ['1010', '壹仟零壹拾元整'],
    ['1101', '壹仟壹佰零壹元整'],
    ['1234', '壹仟贰佰叁拾肆元整'],
    ['10001', '壹万零壹元整'],
    ['10010', '壹万零壹拾元整'],
    ['10100', '壹万零壹佰元整'],
    ['11000', '壹万壹仟元整'],
    ['100000000', '壹亿元整'],
    ['100001000', '壹亿零壹仟元整'],
    ['200001000', '贰亿零壹仟元整'],
    ['100000001', '壹亿零壹元整'],
    ['100010000', '壹亿零壹万元整'],
    ['123456789', '壹亿贰仟叁佰肆拾伍万陆仟柒佰捌拾玖元整'],
    ['1000000000000000', '壹仟万亿元整'],
    ['1,234.56', '壹仟贰佰叁拾肆元伍角陆分'],
    ['8652.57', '捌仟陆佰伍拾贰元伍角柒分'],
  ])('整数转换 %s -> %s', (input, expected) => {
    expect(convertToRmb(input).text).toBe(expected);
  });

  it.each<[string, string]>([
    ['0.1', '壹角'],
    ['0.01', '壹分'],
    ['0.10', '壹角'],
    ['0.05', '伍分'],
    ['0.56', '伍角陆分'],
    ['1.1', '壹元壹角'],
    ['1.01', '壹元零壹分'],
    ['1.10', '壹元壹角'],
    ['100.00', '壹佰元整'],
  ])('角分转换 %s -> %s', (input, expected) => {
    expect(convertToRmb(input).text).toBe(expected);
  });

  it('超过两位小数时四舍五入到分', () => {
    expect(convertToRmb('1.234').text).toBe('壹元贰角叁分');
    expect(convertToRmb('1.235').text).toBe('壹元贰角肆分');
  });

  it('四舍五入进位到整数时正确进位', () => {
    expect(convertToRmb('1.999').text).toBe('贰元整');
    expect(convertToRmb('99.999').text).toBe('壹佰元整');
  });

  it('允许首尾空白与千分位逗号', () => {
    expect(convertToRmb('  12,345.67 ').text).toBe(
      '壹万贰仟叁佰肆拾伍元陆角柒分',
    );
  });

  it('空输入返回空结果而非错误', () => {
    expect(convertToRmb('')).toEqual({ text: null, error: null });
    expect(convertToRmb('   ')).toEqual({ text: null, error: null });
  });

  it.each(['-1', 'abc', '1.2.3', '00', '元', '1,23'])('拒绝非法输入 %s', (input) => {
    const result = convertToRmb(input);
    expect(result.text).toBeNull();
    expect(result.error).not.toBeNull();
  });

  it('整数超过 16 位时给出错误', () => {
    const result = convertToRmb('10000000000000000');
    expect(result.text).toBeNull();
    expect(result.error).toContain('16');
  });
});
