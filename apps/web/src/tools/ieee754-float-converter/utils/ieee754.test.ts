import { describe, expect, it } from 'vitest';
import { PrecisionEnum } from '../constants';
import {
  decodeBits,
  encodeFloat,
  fromBits,
  parseBitString,
  parseDecimal,
  toBinary,
  toHex,
} from './ieee754';

describe('encodeFloat 双精度固定向量', () => {
  it('1.0 → 3FF0000000000000，指数去偏置为 0、尾数全 0', () => {
    const encoded = encodeFloat(1, PrecisionEnum.DOUBLE_64);
    expect(encoded.hex).toBe('3FF0000000000000');
    expect(encoded.binary).toHaveLength(64);
    expect(encoded.sign).toBe(0);
    expect(encoded.exponentBits).toBe('01111111111');
    expect(encoded.exponentBits).toHaveLength(11);
    expect(encoded.exponentValue).toBe(0);
    expect(encoded.mantissaBits).toBe('0'.repeat(52));
    expect(encoded.mantissaHex).toBe('0'.repeat(13));
    expect(encoded.isSpecial).toBe('none');
  });

  it('-1.0 → BFF0000000000000，符号位为 1', () => {
    const encoded = encodeFloat(-1, PrecisionEnum.DOUBLE_64);
    expect(encoded.hex).toBe('BFF0000000000000');
    expect(encoded.sign).toBe(1);
    expect(encoded.exponentValue).toBe(0);
  });

  it('0.1 → 3FB999999999999A，指数去偏置为 -4', () => {
    const encoded = encodeFloat(0.1, PrecisionEnum.DOUBLE_64);
    expect(encoded.hex).toBe('3FB999999999999A');
    expect(encoded.exponentValue).toBe(-4);
    expect(encoded.mantissaBits).toHaveLength(52);
    expect(encoded.mantissaHex).toBe('999999999999A');
  });

  it('+0 / -0 均标记为 zero 且符号位正确', () => {
    const plusZero = encodeFloat(0, PrecisionEnum.DOUBLE_64);
    const minusZero = encodeFloat(-0, PrecisionEnum.DOUBLE_64);
    expect(plusZero.hex).toBe('0000000000000000');
    expect(plusZero.sign).toBe(0);
    expect(plusZero.isSpecial).toBe('zero');
    expect(minusZero.hex).toBe('8000000000000000');
    expect(minusZero.sign).toBe(1);
    expect(minusZero.isSpecial).toBe('zero');
  });

  it('±Infinity → 指数全 1、尾数全 0，标记 inf', () => {
    const plusInf = encodeFloat(Number.POSITIVE_INFINITY, PrecisionEnum.DOUBLE_64);
    const minusInf = encodeFloat(Number.NEGATIVE_INFINITY, PrecisionEnum.DOUBLE_64);
    expect(plusInf.hex).toBe('7FF0000000000000');
    expect(plusInf.isSpecial).toBe('inf');
    expect(plusInf.exponentAllOnes).toBe(true);
    expect(minusInf.hex).toBe('FFF0000000000000');
    expect(minusInf.isSpecial).toBe('inf');
    expect(minusInf.sign).toBe(1);
  });

  it('NaN → 7FF8000000000000，标记 nan', () => {
    const encoded = encodeFloat(Number.NaN, PrecisionEnum.DOUBLE_64);
    expect(encoded.hex).toBe('7FF8000000000000');
    expect(encoded.isSpecial).toBe('nan');
  });
});

describe('encodeFloat 单精度固定向量', () => {
  it('1.0 → 3F800000，位域为 1|8|23', () => {
    const encoded = encodeFloat(1, PrecisionEnum.SINGLE_32);
    expect(encoded.hex).toBe('3F800000');
    expect(encoded.binary).toHaveLength(32);
    expect(encoded.exponentBits).toBe('01111111');
    expect(encoded.exponentValue).toBe(0);
    expect(encoded.mantissaBits).toBe('0'.repeat(23));
    expect(encoded.mantissaHex).toBe('000000');
  });

  it('0.1 → 3DCCCCCD，指数去偏置为 -4', () => {
    const encoded = encodeFloat(0.1, PrecisionEnum.SINGLE_32);
    expect(encoded.hex).toBe('3DCCCCCD');
    expect(encoded.exponentValue).toBe(-4);
    expect(encoded.mantissaHex).toBe('4CCCCD');
  });

  it('+Infinity → 7F800000', () => {
    const encoded = encodeFloat(Number.POSITIVE_INFINITY, PrecisionEnum.SINGLE_32);
    expect(encoded.hex).toBe('7F800000');
    expect(encoded.isSpecial).toBe('inf');
  });
});

describe('decodeBits 反向还原', () => {
  it('十六进制还原 1.0 / -1.0', () => {
    expect(decodeBits('3FF0000000000000', PrecisionEnum.DOUBLE_64).value).toBe(1);
    expect(decodeBits('BFF0000000000000', PrecisionEnum.DOUBLE_64).value).toBe(-1);
  });

  it('支持 0x 前缀、空白与下划线分隔', () => {
    expect(decodeBits('0x3FF0000000000000', PrecisionEnum.DOUBLE_64).value).toBe(1);
    expect(decodeBits('3FF0_0000_0000_0000', PrecisionEnum.DOUBLE_64).value).toBe(1);
  });

  it('64 位二进制串还原 1.0', () => {
    const bits = '0011111111110000' + '0'.repeat(48);
    const decoded = decodeBits(bits, PrecisionEnum.DOUBLE_64);
    expect(decoded.value).toBe(1);
    expect(decoded.base).toBe(2);
  });

  it('特殊值 ±Infinity / NaN / ±0 正确还原', () => {
    expect(decodeBits('7FF0000000000000', PrecisionEnum.DOUBLE_64).value).toBe(
      Number.POSITIVE_INFINITY,
    );
    expect(decodeBits('FFF0000000000000', PrecisionEnum.DOUBLE_64).value).toBe(
      Number.NEGATIVE_INFINITY,
    );
    expect(decodeBits('7FF8000000000000', PrecisionEnum.DOUBLE_64).isSpecial).toBe('nan');
    expect(
      Object.is(decodeBits('0'.repeat(64), PrecisionEnum.DOUBLE_64, 2).value, 0),
    ).toBe(true);
    expect(
      Object.is(decodeBits('1' + '0'.repeat(63), PrecisionEnum.DOUBLE_64, 2).value, -0),
    ).toBe(true);
  });

  it('单精度 3F800000 → 1.0，3DCCCCCD → 约 0.1', () => {
    expect(decodeBits('3F800000', PrecisionEnum.SINGLE_32).value).toBe(1);
    expect(decodeBits('3DCCCCCD', PrecisionEnum.SINGLE_32).value).toBeCloseTo(0.1, 7);
  });

  it.each([
    ['', PrecisionEnum.DOUBLE_64, '请输入'],
    ['3FF0', PrecisionEnum.DOUBLE_64, '16 个十六进制字符'],
    ['3F800000', PrecisionEnum.DOUBLE_64, '16 个十六进制字符'],
    ['0011', PrecisionEnum.DOUBLE_64, '16 个十六进制字符'],
    ['0b010201', PrecisionEnum.SINGLE_32, '只能包含字符 0 和 1'],
    ['GGGGGGGG', PrecisionEnum.SINGLE_32, '0-9、a-f'],
  ])('非法输入 %s 抛错（%s）', (input, precision, expected) => {
    expect(() => decodeBits(input, precision)).toThrow(expected);
  });
});

describe('parseBitString 进制识别', () => {
  it('纯 0/1 文本识别为二进制', () => {
    const result = parseBitString('0'.repeat(64), PrecisionEnum.DOUBLE_64);
    expect(result.base).toBe(2);
  });

  it('0b / 0x 前缀强制识别', () => {
    expect(parseBitString('0b' + '0'.repeat(64), PrecisionEnum.DOUBLE_64).base).toBe(2);
    expect(parseBitString('0x' + '0'.repeat(16), PrecisionEnum.DOUBLE_64).base).toBe(16);
  });

  it('forcedBase 可强制按十六进制解析纯 0/1 串', () => {
    const result = parseBitString('3F800000', PrecisionEnum.SINGLE_32, 16);
    expect(result.base).toBe(16);
    expect(result.bits).toHaveLength(32);
  });
});

describe('parseDecimal', () => {
  it.each([
    ['0.1', 0.1],
    ['-2.5', -2.5],
    ['1e3', 1000],
    ['  3.14  ', 3.14],
    ['.5', 0.5],
  ])('%s 解析为 %s', (text, expected) => {
    expect(parseDecimal(text)).toBe(expected);
  });

  it('支持 Infinity / -Infinity / NaN', () => {
    expect(parseDecimal('Infinity')).toBe(Number.POSITIVE_INFINITY);
    expect(parseDecimal('+Infinity')).toBe(Number.POSITIVE_INFINITY);
    expect(parseDecimal('-Infinity')).toBe(Number.NEGATIVE_INFINITY);
    expect(Number.isNaN(parseDecimal('NaN'))).toBe(true);
  });

  it.each([[''], ['abc'], ['1.2.3'], ['NaN-ish']])('非法十进制 %s 抛错', (text) => {
    expect(() => parseDecimal(text)).toThrow();
  });
});

describe('编解码往返', () => {
  it.each([
    123.456,
    -9876.5,
    1e-10,
    3.14159265358979,
    2 ** 30 + 1,
  ])('双精度 %s 编码后解码回到原值', (value) => {
    const encoded = encodeFloat(value, PrecisionEnum.DOUBLE_64);
    expect(decodeBits(encoded.hex, PrecisionEnum.DOUBLE_64).value).toBe(value);
  });

  it('单精度常见值往返一致', () => {
    const value = 12.375;
    const encoded = encodeFloat(value, PrecisionEnum.SINGLE_32);
    expect(decodeBits(encoded.hex, PrecisionEnum.SINGLE_32).value).toBe(value);
  });

  it('二进制与十六进制编码结果互通', () => {
    const encoded = encodeFloat(-42.25, PrecisionEnum.DOUBLE_64);
    expect(fromBits(encoded.binary).toString(16).toUpperCase()).toBe(encoded.hex);
    expect(toBinary(fromBits(encoded.binary), 64)).toBe(encoded.binary);
    expect(toHex(fromBits(encoded.binary), 64)).toBe(encoded.hex);
  });
});
