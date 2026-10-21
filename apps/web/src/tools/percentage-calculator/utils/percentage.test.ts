import { describe, it, expect } from 'vitest';
import {
  formatResult,
  parseNumeric,
  percentOf,
  percentageChange,
  percentageRatio,
} from './percentage';

describe('parseNumeric', () => {
  it('解析十进制数字并容忍首尾空白', () => {
    expect(parseNumeric('200')).toBe(200);
    expect(parseNumeric('  -3.5 ')).toBe(-3.5);
    expect(parseNumeric('0')).toBe(0);
  });

  it('空串、空白与非有限数值返回 null', () => {
    expect(parseNumeric('')).toBeNull();
    expect(parseNumeric('   ')).toBeNull();
    expect(parseNumeric('abc')).toBeNull();
    expect(parseNumeric('12px')).toBeNull();
    expect(parseNumeric('Infinity')).toBeNull();
  });
});

describe('percentOf', () => {
  it('计算 X 的 Y%', () => {
    expect(percentOf(200, 25)).toBe(50);
    expect(percentOf(80, 0)).toBe(0);
    expect(percentOf(0.1, 200)).toBeCloseTo(0.2, 12);
  });
});

describe('percentageRatio', () => {
  it('计算 X 是 Y 的百分之几', () => {
    expect(percentageRatio(50, 200)).toBe(25);
    expect(percentageRatio(3, 4)).toBe(75);
  });

  it('支持负值结果', () => {
    expect(percentageRatio(-50, 100)).toBe(-50);
  });

  it('除数为 0 时返回 null', () => {
    expect(percentageRatio(50, 0)).toBeNull();
  });
});

describe('percentageChange', () => {
  it('计算增长与下降百分比', () => {
    expect(percentageChange(120, 150)).toBe(25);
    expect(percentageChange(120, 90)).toBe(-25);
    expect(percentageChange(100, -50)).toBe(-150);
  });

  it('基数为 0 时返回 null', () => {
    expect(percentageChange(0, 10)).toBeNull();
  });
});

describe('formatResult', () => {
  it('去除尾随零并控制小数位', () => {
    expect(formatResult(50)).toBe('50');
    expect(formatResult(25)).toBe('25');
    expect(formatResult(33.3333333333)).toBe('33.333333');
    expect(formatResult(0.1 + 0.2)).toBe('0.3');
    expect(formatResult(-25)).toBe('-25');
  });
});
