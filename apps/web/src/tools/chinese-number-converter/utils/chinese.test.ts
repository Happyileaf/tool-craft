import { describe, expect, it } from 'vitest';
import { numberToChinese } from './chinese';

describe('numberToChinese - 小写', () => {
  it('基础整数与零', () => {
    expect(numberToChinese('0')).toBe('零');
    expect(numberToChinese('5')).toBe('五');
    expect(numberToChinese('10')).toBe('一十');
    expect(numberToChinese('11')).toBe('一十一');
    expect(numberToChinese('20')).toBe('二十');
  });

  it('节内零占位', () => {
    expect(numberToChinese('100')).toBe('一百');
    expect(numberToChinese('101')).toBe('一百零一');
    expect(numberToChinese('1001')).toBe('一千零一');
    expect(numberToChinese('1010')).toBe('一千零一十');
    expect(numberToChinese('1101')).toBe('一千一百零一');
  });

  it('万 / 亿 / 万亿节与跨节补零', () => {
    expect(numberToChinese('10000')).toBe('一万');
    expect(numberToChinese('10001')).toBe('一万零一');
    expect(numberToChinese('12345')).toBe('一万二千三百四十五');
    expect(numberToChinese('12000')).toBe('一万二千');
    expect(numberToChinese('100000000')).toBe('一亿');
    expect(numberToChinese('100000001')).toBe('一亿零一');
    expect(numberToChinese('100010000')).toBe('一亿零一万');
    expect(numberToChinese('1000000000000')).toBe('一万亿');
  });

  it('负数与正负号', () => {
    expect(numberToChinese('-5')).toBe('负五');
    expect(numberToChinese('-10001')).toBe('负一万零一');
    expect(numberToChinese('+5')).toBe('五');
  });

  it('小数（点）', () => {
    expect(numberToChinese('0.5')).toBe('零点五');
    expect(numberToChinese('3.14')).toBe('三点一四');
    expect(numberToChinese('-0.05')).toBe('负零点零五');
  });

  it('千分位与空白', () => {
    expect(numberToChinese(' 12,345 ')).toBe('一万二千三百四十五');
  });
});

describe('numberToChinese - 财务大写', () => {
  it('整数金额加「元整」', () => {
    expect(numberToChinese('0', { variant: 'financial' })).toBe('零元整');
    expect(numberToChinese('12000', { variant: 'financial' })).toBe('壹萬贰仟元整');
    expect(numberToChinese('12345', { variant: 'financial' })).toBe(
      '壹萬贰仟叁佰肆拾伍元整',
    );
  });

  it('角分', () => {
    expect(numberToChinese('123.45', { variant: 'financial' })).toBe(
      '壹佰贰拾叁元肆角伍分',
    );
    expect(numberToChinese('123.40', { variant: 'financial' })).toBe('壹佰贰拾叁元肆角');
    expect(numberToChinese('123.05', { variant: 'financial' })).toBe('壹佰贰拾叁元零伍分');
    expect(numberToChinese('123.00', { variant: 'financial' })).toBe('壹佰贰拾叁元整');
    expect(numberToChinese('123.', { variant: 'financial' })).toBe('壹佰贰拾叁元整');
    expect(numberToChinese('0.45', { variant: 'financial' })).toBe('肆角伍分');
    expect(numberToChinese('0.05', { variant: 'financial' })).toBe('伍分');
    expect(numberToChinese('0.4', { variant: 'financial' })).toBe('肆角');
    expect(numberToChinese('-123.45', { variant: 'financial' })).toBe(
      '负壹佰贰拾叁元肆角伍分',
    );
  });
});

describe('numberToChinese - 异常', () => {
  it('空与非法字符', () => {
    expect(() => numberToChinese('')).toThrow('不能为空');
    expect(() => numberToChinese('abc')).toThrow('不是合法的数字');
    expect(() => numberToChinese('1.2.3')).toThrow('不是合法的数字');
  });

  it('超范围与精度', () => {
    expect(() => numberToChinese('12345678901234567')).toThrow('超出支持范围');
    expect(() => numberToChinese('1.234')).toThrow('小数部分最多支持 2 位');
  });
});
