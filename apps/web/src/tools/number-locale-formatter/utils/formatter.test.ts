import { describe, it, expect } from 'vitest';
import { NotationEnum, NumberFormatModeEnum } from '../constants';
import {
  formatNumber,
  formatNumberAcrossLocales,
  parseNumberInput,
} from './formatter';

const baseOptions = {
  mode: NumberFormatModeEnum.DECIMAL,
  notation: NotationEnum.STANDARD,
  useGrouping: true,
  negativeParentheses: false,
};

describe('parseNumberInput', () => {
  it('解析合法数值', () => {
    expect(parseNumberInput('1234.5')).toBe(1234.5);
    expect(parseNumberInput(' -0.5 ')).toBe(-0.5);
    expect(parseNumberInput('1e3')).toBe(1000);
  });

  it('空串与空白为 empty', () => {
    expect(parseNumberInput('')).toBe('empty');
    expect(parseNumberInput('   ')).toBe('empty');
  });

  it('无法解析与 Infinity 为 invalid', () => {
    expect(parseNumberInput('abc')).toBe('invalid');
    expect(parseNumberInput('1,234')).toBe('invalid');
    expect(parseNumberInput('Infinity')).toBe('invalid');
  });
});

describe('formatNumber 数字模式', () => {
  it('千分位分组随区域变化', () => {
    expect(
      formatNumber(1234567.89, { ...baseOptions, locale: 'en-US' }),
    ).toBe('1,234,567.89');
    expect(
      formatNumber(1234567.89, { ...baseOptions, locale: 'de-DE' }),
    ).toBe('1.234.567,89');
  });

  it('zh-CN 分组与小数点', () => {
    expect(
      formatNumber(1234567.89, { ...baseOptions, locale: 'zh-CN' }),
    ).toBe('1,234,567.89');
  });

  it('关闭分组不输出分隔符', () => {
    expect(
      formatNumber(1234567.89, {
        ...baseOptions,
        locale: 'en-US',
        useGrouping: false,
      }),
    ).toBe('1234567.89');
  });

  it('显式小数位四舍五入', () => {
    expect(
      formatNumber(1.5, {
        ...baseOptions,
        locale: 'en-US',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    ).toBe('1.50');
    expect(
      formatNumber(1.236, {
        ...baseOptions,
        locale: 'en-US',
        maximumFractionDigits: 2,
      }),
    ).toBe('1.24');
  });

  it('紧凑记法随区域输出 K / 万', () => {
    expect(
      formatNumber(1234567, {
        ...baseOptions,
        locale: 'en-US',
        notation: NotationEnum.COMPACT,
      }),
    ).toBe('1.2M');
    expect(
      formatNumber(1234567, {
        ...baseOptions,
        locale: 'zh-CN',
        notation: NotationEnum.COMPACT,
      }),
    ).toBe('123万');
  });
});

describe('formatNumber 货币模式', () => {
  it('美元与欧元的符号位置和小数位', () => {
    expect(
      formatNumber(1234.5, {
        ...baseOptions,
        locale: 'en-US',
        mode: NumberFormatModeEnum.CURRENCY,
        currency: 'USD',
      }),
    ).toBe('$1,234.50');
    expect(
      formatNumber(1234.5, {
        ...baseOptions,
        locale: 'de-DE',
        mode: NumberFormatModeEnum.CURRENCY,
        currency: 'EUR',
      }),
    ).toBe('1.234,50 €');
  });

  it('日元默认无小数位', () => {
    expect(
      formatNumber(1234.5, {
        ...baseOptions,
        locale: 'ja-JP',
        mode: NumberFormatModeEnum.CURRENCY,
        currency: 'JPY',
      }),
    ).toBe('￥1,235');
  });

  it('人民币中文区域排版', () => {
    expect(
      formatNumber(1234.5, {
        ...baseOptions,
        locale: 'zh-CN',
        mode: NumberFormatModeEnum.CURRENCY,
        currency: 'CNY',
      }),
    ).toBe('¥1,234.50');
  });
});

describe('formatNumber 百分比与负数括号', () => {
  it('百分比模式自动乘 100', () => {
    expect(
      formatNumber(0.1234, {
        ...baseOptions,
        locale: 'en-US',
        mode: NumberFormatModeEnum.PERCENT,
        maximumFractionDigits: 2,
      }),
    ).toBe('12.34%');
  });

  it('负数括号化（数字与货币）', () => {
    expect(
      formatNumber(-1234.5, {
        ...baseOptions,
        locale: 'en-US',
        negativeParentheses: true,
      }),
    ).toBe('(1,234.5)');
    expect(
      formatNumber(-1234.5, {
        ...baseOptions,
        locale: 'en-US',
        mode: NumberFormatModeEnum.CURRENCY,
        currency: 'USD',
        negativeParentheses: true,
      }),
    ).toBe('($1,234.50)');
  });

  it('非负数括号选项不影响输出', () => {
    expect(
      formatNumber(1234.5, {
        ...baseOptions,
        locale: 'en-US',
        negativeParentheses: true,
      }),
    ).toBe('1,234.5');
  });
});

describe('formatNumberAcrossLocales', () => {
  it('按区域顺序批量输出', () => {
    const results = formatNumberAcrossLocales(1234.5, ['en-US', 'de-DE'], baseOptions);
    expect(results).toEqual([
      { locale: 'en-US', text: '1,234.5' },
      { locale: 'de-DE', text: '1.234,5' },
    ]);
  });
});
