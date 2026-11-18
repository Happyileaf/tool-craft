import { describe, it, expect } from 'vitest';
import { convertI2cAddress, isReservedSevenBit, parseAddress } from './i2c';

describe('parseAddress 多进制解析', () => {
  it('0x 前缀十六进制', () => {
    expect(parseAddress('0x50')).toEqual({ value: 0x50, radix: 16 });
    expect(parseAddress('0X7F')).toEqual({ value: 0x7f, radix: 16 });
  });

  it('h 后缀十六进制', () => {
    expect(parseAddress('50h')).toEqual({ value: 0x50, radix: 16 });
  });

  it('0b 前缀二进制', () => {
    expect(parseAddress('0b1010000')).toEqual({ value: 0x50, radix: 2 });
  });

  it('0o 前缀八进制', () => {
    expect(parseAddress('0o120')).toEqual({ value: 0x50, radix: 8 });
  });

  it('纯十进制', () => {
    expect(parseAddress('80')).toEqual({ value: 80, radix: 10 });
  });

  it('空白被容忍', () => {
    expect(parseAddress('  0x50 ')).toEqual({ value: 0x50, radix: 16 });
  });

  it('非法写法抛错', () => {
    expect(() => parseAddress('')).toThrow();
    expect(() => parseAddress('0xZZ')).toThrow();
    expect(() => parseAddress('0b102')).toThrow();
    expect(() => parseAddress('hello')).toThrow();
  });
});

describe('convertI2cAddress 7-bit 输入', () => {
  it('0x50 → 写 0xA0 / 读 0xA1（固定向量）', () => {
    const r = convertI2cAddress('0x50');
    expect(r.errors).toEqual([]);
    expect(r.interpretedAs).toBe('7bit');
    expect(r.sevenBit?.hex).toBe('0x50');
    expect(r.sevenBit?.dec).toBe('80');
    expect(r.sevenBit?.bin).toBe('01010000');
    expect(r.writeAddress?.hex).toBe('0xA0');
    expect(r.writeAddress?.dec).toBe('160');
    expect(r.readAddress?.hex).toBe('0xA1');
    expect(r.readAddress?.dec).toBe('161');
    expect(r.reserved).toBe(false);
  });

  it('十进制 80 与十六进制 0x50 等价', () => {
    const fromDec = convertI2cAddress('80');
    const fromHex = convertI2cAddress('0x50');
    expect(fromDec.sevenBit).toEqual(fromHex.sevenBit);
    expect(fromDec.writeAddress).toEqual(fromHex.writeAddress);
  });

  it('二进制 0b1010000 同样换算到 0xA0/0xA1', () => {
    const r = convertI2cAddress('0b1010000');
    expect(r.writeAddress?.hex).toBe('0xA0');
    expect(r.readAddress?.hex).toBe('0xA1');
  });
});

describe('convertI2cAddress 8-bit 反向模式', () => {
  it('粘贴 8-bit 写地址 0xA0 自动右移还原 7-bit 0x50', () => {
    const r = convertI2cAddress('0xA0');
    expect(r.interpretedAs).toBe('8bit');
    expect(r.sevenBit?.hex).toBe('0x50');
    expect(r.writeAddress?.hex).toBe('0xA0');
    expect(r.readAddress?.hex).toBe('0xA1');
    expect(r.errors).toEqual([]);
  });

  it('粘贴 8-bit 读地址 0xA1 还原 7-bit 并给出读地址提示', () => {
    const r = convertI2cAddress('0xA1');
    expect(r.interpretedAs).toBe('8bit');
    expect(r.sevenBit?.hex).toBe('0x50');
    expect(r.errors.some((e) => e.includes('读地址'))).toBe(true);
  });
});

describe('保留地址与边界', () => {
  it('UM10204 保留区间判断', () => {
    expect(isReservedSevenBit(0x00)).toBe(true);
    expect(isReservedSevenBit(0x03)).toBe(true);
    expect(isReservedSevenBit(0x07)).toBe(true);
    expect(isReservedSevenBit(0x08)).toBe(false);
    expect(isReservedSevenBit(0x77)).toBe(false);
    expect(isReservedSevenBit(0x78)).toBe(true);
    expect(isReservedSevenBit(0x7f)).toBe(true);
  });

  it('General Call 0x00 标注保留且为通用调用', () => {
    const r = convertI2cAddress('0x00');
    expect(r.reserved).toBe(true);
    expect(r.generalCall).toBe(true);
    expect(r.writeAddress?.hex).toBe('0x00');
    expect(r.readAddress?.hex).toBe('0x01');
  });

  it('0x7F 落在 10-bit 保留区间', () => {
    const r = convertI2cAddress('0x7F');
    expect(r.reserved).toBe(true);
    expect(r.generalCall).toBe(false);
  });

  it('超 255 报错', () => {
    const r = convertI2cAddress('0x100');
    expect(r.errors.some((e) => e.includes('超出'))).toBe(true);
    expect(r.sevenBit).toBeNull();
  });

  it('非法输入归集错误不抛异常', () => {
    const r = convertI2cAddress('not-an-address');
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.sevenBit).toBeNull();
  });
});
