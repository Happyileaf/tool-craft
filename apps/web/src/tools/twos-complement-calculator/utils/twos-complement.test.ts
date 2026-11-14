import { describe, expect, it } from 'vitest';
import {
  bitMask,
  computeOperation,
  parseIntegerInput,
  signedRange,
  signExtendedBinary,
  toBinaryString,
  toHexString,
  viewFromBits,
  viewFromSigned,
} from './twos-complement';

const ONE = BigInt(1);

describe('signedRange / bitMask', () => {
  it('8 位有符号范围为 -128–127，无符号最大 255', () => {
    expect(signedRange(8)).toEqual({
      min: BigInt(-128),
      max: BigInt(127),
      unsignedMax: BigInt(255),
    });
    expect(bitMask(8)).toBe(BigInt(255));
  });

  it('64 位掩码为 2^64 − 1', () => {
    expect(bitMask(64)).toBe(BigInt('18446744073709551615'));
  });
});

describe('viewFromSigned', () => {
  it('-42 的 8 位补码为 11010110 / 0xD6', () => {
    const view = viewFromSigned(BigInt(-42), 8);
    expect(view.bits).toBe(BigInt(214));
    expect(view.unsigned).toBe(BigInt(214));
    expect(view.signed).toBe(BigInt(-42));
    expect(view.binary).toBe('11010110');
    expect(view.hex).toBe('0xD6');
    expect(view.signBit).toBe(1);
  });

  it('-1 的 8 位补码全为 1', () => {
    const view = viewFromSigned(BigInt(-1), 8);
    expect(view.binary).toBe('11111111');
    expect(view.hex).toBe('0xFF');
  });

  it('127 的符号位为 0', () => {
    const view = viewFromSigned(BigInt(127), 8);
    expect(view.binary).toBe('01111111');
    expect(view.signBit).toBe(0);
  });

  it('-128 位于范围下界', () => {
    const view = viewFromSigned(BigInt(-128), 8);
    expect(view.bits).toBe(BigInt(128));
    expect(view.binary).toBe('10000000');
  });

  it('拒绝超出字长范围的值', () => {
    expect(() => viewFromSigned(BigInt(128), 8)).toThrow();
    expect(() => viewFromSigned(BigInt(-129), 8)).toThrow();
    expect(() => viewFromSigned(BigInt(32768), 16)).toThrow();
  });
});

describe('viewFromBits', () => {
  it('0xD6 在 8 位下解释为 -42', () => {
    const view = viewFromBits(BigInt(0xd6), 8);
    expect(view.signed).toBe(BigInt(-42));
    expect(view.unsigned).toBe(BigInt(214));
  });

  it('32 位全 1 解释为 -1', () => {
    const view = viewFromBits(BigInt(0xffffffff), 32);
    expect(view.signed).toBe(BigInt(-1));
    expect(view.hex).toBe('0xFFFFFFFF');
    expect(view.binary).toHaveLength(32);
  });

  it('64 位全 1 解释为 -1 且不丢精度', () => {
    const view = viewFromBits(BigInt('18446744073709551615'), 64);
    expect(view.signed).toBe(BigInt(-1));
    expect(view.hex).toBe('0xFFFFFFFFFFFFFFFF');
  });

  it('拒绝超出无符号范围的位模式', () => {
    expect(() => viewFromBits(BigInt(256), 8)).toThrow();
  });
});

describe('格式化与符号延伸', () => {
  it('定宽二进制与十六进制补齐前导零', () => {
    expect(toBinaryString(BigInt(5), 8)).toBe('00000101');
    expect(toHexString(BigInt(5), 16)).toBe('0x0005');
  });

  it('负数符号位延伸到 64 位', () => {
    const extended = signExtendedBinary(BigInt(0xd6), 8);
    expect(extended).toHaveLength(64);
    expect(extended).toBe(`${'1'.repeat(56)}11010110`);
  });

  it('正数符号位延伸到 64 位补零', () => {
    const extended = signExtendedBinary(BigInt(42), 8);
    expect(extended).toBe(`${'0'.repeat(56)}00101010`);
  });
});

describe('parseIntegerInput', () => {
  it('解析十进制、十六进制、二进制与八进制', () => {
    expect(parseIntegerInput('-42')).toBe(BigInt(-42));
    expect(parseIntegerInput('0xD6')).toBe(BigInt(214));
    expect(parseIntegerInput('0b11010110')).toBe(BigInt(214));
    expect(parseIntegerInput('0o326')).toBe(BigInt(214));
    expect(parseIntegerInput('-0x2A')).toBe(BigInt(-42));
    expect(parseIntegerInput('1_000')).toBe(BigInt(1000));
  });

  it('拒绝空输入与非法格式', () => {
    expect(() => parseIntegerInput('')).toThrow();
    expect(() => parseIntegerInput('abc')).toThrow();
    expect(() => parseIntegerInput('1.5')).toThrow();
  });
});

describe('computeOperation', () => {
  it('127 + 1 在 8 位下溢出并回绕到 -128', () => {
    const result = computeOperation(BigInt(127), ONE, 8, 'add');
    expect(result.overflow).toBe(true);
    expect(result.exact).toBe(BigInt(128));
    expect(result.signed).toBe(BigInt(-128));
    expect(result.binary).toBe('10000000');
  });

  it('100 + 27 不溢出', () => {
    const result = computeOperation(BigInt(100), BigInt(27), 8, 'add');
    expect(result.overflow).toBe(false);
    expect(result.signed).toBe(BigInt(127));
    expect(result.binary).toBe('01111111');
  });

  it('-128 + -1 溢出并回绕到 127', () => {
    const result = computeOperation(BigInt(-128), BigInt(-1), 8, 'add');
    expect(result.overflow).toBe(true);
    expect(result.signed).toBe(BigInt(127));
  });

  it('100 × 2 溢出并回绕到 -56', () => {
    const result = computeOperation(BigInt(100), BigInt(2), 8, 'mul');
    expect(result.overflow).toBe(true);
    expect(result.exact).toBe(BigInt(200));
    expect(result.signed).toBe(BigInt(-56));
  });

  it('左移 1 << 7 溢出', () => {
    const result = computeOperation(ONE, BigInt(7), 8, 'shl');
    expect(result.overflow).toBe(true);
    expect(result.signed).toBe(BigInt(-128));
  });

  it('算术右移 -128 >> 1 得到 -64', () => {
    const result = computeOperation(BigInt(-128), ONE, 8, 'sar');
    expect(result.overflow).toBe(false);
    expect(result.signed).toBe(BigInt(-64));
    expect(result.binary).toBe('11000000');
  });

  it('逻辑右移 0x80 >>> 1 得到 64', () => {
    const result = computeOperation(BigInt(-128), ONE, 8, 'shr');
    expect(result.overflow).toBe(false);
    expect(result.signed).toBe(BigInt(64));
    expect(result.binary).toBe('01000000');
  });

  it('拒绝越界操作数与非法移位位数', () => {
    expect(() => computeOperation(BigInt(200), ONE, 8, 'add')).toThrow();
    expect(() => computeOperation(ONE, ONE, 8, 'shl')).not.toThrow();
    expect(() => computeOperation(ONE, BigInt(9), 8, 'shl')).toThrow();
    expect(() => computeOperation(ONE, BigInt(-1), 8, 'sar')).toThrow();
  });
});
