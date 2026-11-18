import { describe, it, expect } from 'vitest';
import {
  convertFrom7Bit,
  convertFrom8Bit,
  findReservedRange,
  parseAddress,
  toHex,
} from './i2c';

describe('parseAddress 输入解析', () => {
  it('支持 0x 十六进制前缀', () => {
    expect(parseAddress('0x50')).toBe(0x50);
    expect(parseAddress('0X50')).toBe(0x50);
  });

  it('支持 $ 十六进制前缀与裸十进制', () => {
    expect(parseAddress('$50')).toBe(0x50);
    expect(parseAddress('80')).toBe(80);
  });

  it('自动裁剪空白并忽略大小写', () => {
    expect(parseAddress('  0x3a ')).toBe(0x3a);
    expect(parseAddress('0x3A')).toBe(0x3a);
  });

  it('非法字符与空输入返回 null', () => {
    expect(parseAddress('')).toBeNull();
    expect(parseAddress('0xGG')).toBeNull();
    expect(parseAddress('12g')).toBeNull();
  });
});

describe('toHex 格式化', () => {
  it('默认两位补零大写', () => {
    expect(toHex(5)).toBe('05');
    expect(toHex(0xff)).toBe('FF');
  });

  it('支持指定位数', () => {
    expect(toHex(10, 4)).toBe('000A');
  });
});

describe('findReservedRange 保留地址识别', () => {
  it('识别低地址保留段 0x00–0x07', () => {
    expect(findReservedRange(0x00)?.start).toBe(0x00);
    expect(findReservedRange(0x07)?.end).toBe(0x07);
  });

  it('识别高地址保留段 0x78–0x7F', () => {
    expect(findReservedRange(0x78)).not.toBeNull();
    expect(findReservedRange(0x7f)).not.toBeNull();
  });

  it('常规地址返回 null', () => {
    expect(findReservedRange(0x50)).toBeNull();
    expect(findReservedRange(0x10)).toBeNull();
  });
});

describe('convertFrom7Bit 七转八', () => {
  it('0x50 写地址 0xA0、读地址 0xA1', () => {
    const result = convertFrom7Bit(0x50);
    expect(result.errors).toEqual([]);
    expect(result.write8).toBe(0xa0);
    expect(result.read8).toBe(0xa1);
    expect(result.isReserved).toBe(false);
  });

  it('0x68（RTC 常见地址）输出 D0/D1', () => {
    const result = convertFrom7Bit(0x68);
    expect(result.write8).toBe(0xd0);
    expect(result.read8).toBe(0xd1);
  });

  it('保留地址给出警告而非报错', () => {
    const result = convertFrom7Bit(0x00);
    expect(result.isReserved).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.write8).toBe(0x00);
    expect(result.read8).toBe(0x01);
  });

  it('越界 7-bit 地址返回错误', () => {
    const result = convertFrom7Bit(0x78);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('非整数与负数返回错误', () => {
    expect(convertFrom7Bit(1.5).errors.length).toBeGreaterThan(0);
    expect(convertFrom7Bit(-1).errors.length).toBeGreaterThan(0);
  });
});

describe('convertFrom8Bit 八转七', () => {
  it('写地址 0xA0 反推 7-bit 0x50 且 rwBit=0', () => {
    const result = convertFrom8Bit(0xa0);
    expect(result.errors).toEqual([]);
    expect(result.address7).toBe(0x50);
    expect(result.rwBit).toBe(0);
  });

  it('读地址 0xA1 反推同一 7-bit 地址且 rwBit=1', () => {
    const result = convertFrom8Bit(0xa1);
    expect(result.address7).toBe(0x50);
    expect(result.rwBit).toBe(1);
  });

  it('反推结果与正算互逆', () => {
    const forward = convertFrom7Bit(0x3c);
    const back = convertFrom8Bit(forward.write8);
    expect(back.address7).toBe(0x3c);
    expect(back.read8).toBe(forward.read8);
  });

  it('0xFF 落在保留区并提示', () => {
    const result = convertFrom8Bit(0xff);
    expect(result.address7).toBe(0x7f);
    expect(result.isReserved).toBe(true);
  });

  it('越界 8-bit 地址返回错误', () => {
    expect(convertFrom8Bit(256).errors.length).toBeGreaterThan(0);
  });
});
