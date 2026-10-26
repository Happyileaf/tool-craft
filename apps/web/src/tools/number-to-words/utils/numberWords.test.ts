import { describe, it, expect } from 'vitest';
import { integerToWords, numberToWords } from './numberWords';

describe('integerToWords', () => {
  it('转换 0 与基础数字', () => {
    expect(integerToWords(BigInt(0))).toBe('zero');
    expect(integerToWords(BigInt(7))).toBe('seven');
    expect(integerToWords(BigInt(13))).toBe('thirteen');
  });

  it('转换整十与几十几（默认连字符）', () => {
    expect(integerToWords(BigInt(40))).toBe('forty');
    expect(integerToWords(BigInt(42))).toBe('forty-two');
    expect(integerToWords(BigInt(99))).toBe('ninety-nine');
  });

  it('可关闭连字符', () => {
    expect(integerToWords(BigInt(42), false)).toBe('forty two');
    expect(integerToWords(BigInt(123), false)).toBe('one hundred twenty three');
  });

  it('转换百位与千位', () => {
    expect(integerToWords(BigInt(100))).toBe('one hundred');
    expect(integerToWords(BigInt(101))).toBe('one hundred one');
    expect(integerToWords(BigInt(115))).toBe('one hundred fifteen');
    expect(integerToWords(BigInt(1000))).toBe('one thousand');
    expect(integerToWords(BigInt(1001))).toBe('one thousand one');
    expect(integerToWords(BigInt(12345))).toBe('twelve thousand three hundred forty-five');
  });

  it('转换短级差大数', () => {
    expect(integerToWords(BigInt(1234567))).toBe(
      'one million two hundred thirty-four thousand five hundred sixty-seven',
    );
    expect(integerToWords(BigInt(1000000000))).toBe('one billion');
    expect(integerToWords(BigInt(5000000000000))).toBe('five trillion');
    expect(integerToWords(BigInt(999999999999999))).toBe(
      'nine hundred ninety-nine trillion nine hundred ninety-nine billion nine hundred ninety-nine million nine hundred ninety-nine thousand nine hundred ninety-nine',
    );
  });

  it('转换负数', () => {
    expect(integerToWords(BigInt(-42))).toBe('negative forty-two');
    expect(integerToWords(BigInt(-1000000))).toBe('negative one million');
  });

  it('超出范围抛出中文错误', () => {
    expect(() => integerToWords(BigInt('1000000000000000'))).toThrow('10¹⁵');
    expect(() => integerToWords(BigInt('-1000000000000000'))).toThrow('10¹⁵');
  });
});

describe('numberToWords - cardinal 模式', () => {
  it('整数基数词', () => {
    expect(numberToWords('12345').words).toBe(
      'twelve thousand three hundred forty-five',
    );
  });

  it('支持千分位逗号与正负号', () => {
    expect(numberToWords('1,234,567').words).toBe(
      'one million two hundred thirty-four thousand five hundred sixty-seven',
    );
    expect(numberToWords('+21').words).toBe('twenty-one');
    expect(numberToWords('-42').words).toBe('negative forty-two');
  });

  it('小数部分逐位读出 point', () => {
    expect(numberToWords('3.14').words).toBe('three point one four');
    expect(numberToWords('0.5').words).toBe('zero point five');
    expect(numberToWords('-2.05').words).toBe('negative two point zero five');
  });

  it('空白与非法输入报错', () => {
    expect(() => numberToWords('  ')).toThrow('请输入数字');
    expect(() => numberToWords('abc')).toThrow('无法识别的数字');
    expect(() => numberToWords('1.2.3')).toThrow('无法识别的数字');
  });
});

describe('numberToWords - ordinal 模式', () => {
  it('不规则序数词', () => {
    expect(numberToWords('1', 'ordinal').words).toBe('first');
    expect(numberToWords('2', 'ordinal').words).toBe('second');
    expect(numberToWords('3', 'ordinal').words).toBe('third');
    expect(numberToWords('5', 'ordinal').words).toBe('fifth');
    expect(numberToWords('12', 'ordinal').words).toBe('twelfth');
  });

  it('几十几序数词只转换末位', () => {
    expect(numberToWords('21', 'ordinal').words).toBe('twenty-first');
    expect(numberToWords('42', 'ordinal').words).toBe('forty-second');
    expect(numberToWords('100', 'ordinal').words).toBe('one hundredth');
    expect(numberToWords('1000', 'ordinal').words).toBe('one thousandth');
    expect(numberToWords('1000000', 'ordinal').words).toBe('one millionth');
  });

  it('关闭连字符时序数词末词仍正确', () => {
    expect(numberToWords('21', 'ordinal', { hyphenate: false }).words).toBe('twenty first');
  });

  it('小数序数词报错', () => {
    expect(() => numberToWords('3.5', 'ordinal')).toThrow('序数词模式仅支持整数');
  });
});

describe('numberToWords - money 模式', () => {
  it('标准美元美分读法', () => {
    expect(numberToWords('123.45', 'money').words).toBe(
      'one hundred twenty-three dollars and forty-five cents',
    );
  });

  it('无小数时美分读作 zero', () => {
    expect(numberToWords('100', 'money').words).toBe('one hundred dollars and zero cents');
  });

  it('单位 1 时使用单数 dollar / cent', () => {
    expect(numberToWords('1', 'money').words).toBe('one dollar and zero cents');
    expect(numberToWords('1.01', 'money').words).toBe('one dollar and one cent');
  });

  it('一位小数按十分位补零为美分', () => {
    expect(numberToWords('2.5', 'money').words).toBe(
      'two dollars and fifty cents',
    );
  });

  it('负数与千分位金额', () => {
    expect(numberToWords('-1,000.00', 'money').words).toBe(
      'negative one thousand dollars and zero cents',
    );
  });

  it('小数超过 2 位报错', () => {
    expect(() => numberToWords('1.234', 'money')).toThrow('小数部分至多 2 位');
  });
});
