import { describe, it, expect } from 'vitest';
import {
  parseMask,
  maxMask,
  normalize,
  setBit,
  clearBit,
  toggleBit,
  testBit,
  binaryOp,
  notOp,
  nandOp,
  shift,
  msbIndex,
  lsbIndex,
  popCount,
  toSigned,
  toBinaryString,
  toOctalString,
  toHexString,
} from './bitmask';

describe('parseMask', () => {
  it('支持十进制 / 0x / 0o / 0b 与裸位串', () => {
    expect(parseMask('255', 8)).toBe(BigInt(255));
    expect(parseMask('0xFF', 8)).toBe(BigInt(255));
    expect(parseMask('0o377', 8)).toBe(BigInt(255));
    expect(parseMask('0b11111111', 8)).toBe(BigInt(255));
    expect(parseMask('11111111', 8)).toBe(BigInt(255));
  });

  it('超宽输入抛出溢出错误', () => {
    expect(() => parseMask('256', 8)).toThrowError(/超出 8 位/);
  });

  it('空输入与非法格式抛出错误', () => {
    expect(() => parseMask('  ', 8)).toThrowError(/不能为空/);
    expect(() => parseMask('12gg', 8)).toThrowError(/无法解析/);
  });

  it('64 位边界值可解析', () => {
    expect(parseMask('0xFFFFFFFFFFFFFFFF', 64)).toBe(maxMask(64));
  });
});

describe('单 bit 操作', () => {
  it('set / clear / toggle / test 正确', () => {
    let mask = BigInt(0);
    mask = setBit(mask, 3, 8);
    expect(mask).toBe(BigInt(8));
    expect(testBit(mask, 3, 8)).toBe(true);
    expect(testBit(mask, 2, 8)).toBe(false);
    mask = toggleBit(mask, 3, 8);
    expect(mask).toBe(BigInt(0));
    mask = setBit(mask, 7, 8);
    expect(clearBit(mask, 7, 8)).toBe(BigInt(0));
  });

  it('越界位编号抛出错误', () => {
    expect(() => setBit(BigInt(0), 8, 8)).toThrowError(/位编号/);
  });
});

describe('双掩码与单目运算', () => {
  const a = BigInt(0b1100);
  const b = BigInt(0b1010);

  it('AND / OR / XOR', () => {
    expect(binaryOp(a, b, 'and', 8)).toBe(BigInt(0b1000));
    expect(binaryOp(a, b, 'or', 8)).toBe(BigInt(0b1110));
    expect(binaryOp(a, b, 'xor', 8)).toBe(BigInt(0b0110));
  });

  it('NOT 在位宽内取反', () => {
    expect(notOp(BigInt(0), 8)).toBe(BigInt(255));
    expect(notOp(BigInt(0xFF), 16)).toBe(BigInt(0xFF00));
  });

  it('NAND', () => {
    expect(nandOp(a, b, 8)).toBe(BigInt(0b11110111));
  });
});

describe('移位与循环移位', () => {
  it('逻辑左移 / 右移', () => {
    expect(shift(BigInt(0b00000001), 3, 'shl', 8)).toBe(BigInt(8));
    expect(shift(BigInt(0b10000000), 3, 'shr-logical', 8)).toBe(BigInt(0b00010000));
  });

  it('算术右移保留符号位', () => {
    // 8 位 0b10000000 = -128，算术右移 1 位得 -64 = 0b11000000
    expect(shift(BigInt(0b10000000), 1, 'shr-arithmetic', 8)).toBe(
      BigInt(0b11000000),
    );
    // 正数算术右移与逻辑右移一致
    expect(shift(BigInt(0b01000000), 1, 'shr-arithmetic', 8)).toBe(BigInt(0b00100000));
  });

  it('循环左移 / 右移含回绕', () => {
    expect(shift(BigInt(0b10000000), 1, 'rotl', 8)).toBe(BigInt(0b00000001));
    expect(shift(BigInt(0b00000001), 1, 'rotr', 8)).toBe(BigInt(0b10000000));
    // 64 位回绕
    const highBit = BigInt(1) << BigInt(63);
    expect(shift(highBit, 1, 'rotl', 64)).toBe(BigInt(1));
  });

  it('非法移位位数抛出错误', () => {
    expect(() => shift(BigInt(1), -1, 'shl', 8)).toThrowError(/非负整数/);
  });
});

describe('位统计与有符号解释', () => {
  it('msb / lsb / popcount', () => {
    const mask = BigInt(0b10100);
    expect(msbIndex(mask)).toBe(4);
    expect(lsbIndex(mask)).toBe(2);
    expect(popCount(mask)).toBe(2);
    expect(msbIndex(BigInt(0))).toBe(-1);
    expect(lsbIndex(BigInt(0))).toBe(-1);
    expect(popCount(maxMask(64))).toBe(64);
  });

  it('二补码有符号转换', () => {
    expect(toSigned(BigInt(0xFF), 8)).toBe(BigInt(-1));
    expect(toSigned(BigInt(0x7F), 8)).toBe(BigInt(127));
    expect(toSigned(BigInt(0x80), 8)).toBe(BigInt(-128));
  });

  it('高位截断规范化', () => {
    expect(normalize(BigInt(0x1FF), 8)).toBe(BigInt(0xFF));
  });
});

describe('进制字符串', () => {
  it('二进制含前导零，八进制与十六进制正确', () => {
    expect(toBinaryString(BigInt(15), 8)).toBe('00001111');
    expect(toOctalString(BigInt(255))).toBe('377');
    expect(toHexString(BigInt(255))).toBe('FF');
  });
});
