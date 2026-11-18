import { describe, expect, it } from 'vitest';
import {
  RESERVED_RANGES,
  convert7To8,
  convert8To7,
  getReservedReason,
  parseInteger,
} from './i2c';

describe('parseInteger', () => {
  it('accepts hex prefix, h suffix, binary, octal and decimal forms', () => {
    expect(parseInteger('0x50')).toBe(0x50);
    expect(parseInteger('50h')).toBe(0x50);
    expect(parseInteger('0b1010000')).toBe(0x50);
    expect(parseInteger('0o120')).toBe(0x50);
    expect(parseInteger('80')).toBe(80);
  });

  it('tolerates whitespace and underscore separators', () => {
    expect(parseInteger('  0x50 ')).toBe(0x50);
    expect(parseInteger('0b0101_0000')).toBe(0x50);
  });

  it('rejects empty or unrecognized input', () => {
    expect(() => parseInteger('   ')).toThrow('不能为空');
    expect(() => parseInteger('0xZZ')).toThrow('无法识别');
    expect(() => parseInteger('12.5')).toThrow('无法识别');
  });
});

describe('convert7To8', () => {
  it('shifts a typical EEPROM 0x50 into write 0xA0 and read 0xA1', () => {
    const result = convert7To8('0x50');
    expect(result.address7).toBe(0x50);
    expect(result.writeByte).toBe(0xa0);
    expect(result.readByte).toBe(0xa1);
    expect(result.reserved).toBe(false);
  });

  it('renders radix views with padded binary widths', () => {
    const result = convert7To8('0x68');
    expect(result.views7).toEqual({ hex: '0x68', dec: '104', bin: '0b1101000' });
    expect(result.writeViews).toEqual({ hex: '0xD0', dec: '208', bin: '0b11010000' });
    expect(result.readViews).toEqual({ hex: '0xD1', dec: '209', bin: '0b11010001' });
  });

  it('accepts decimal and binary spellings of the same address', () => {
    expect(convert7To8('80').writeByte).toBe(0xa0);
    expect(convert7To8('0b1010000').readByte).toBe(0xa1);
  });

  it('rejects values above the 7-bit range', () => {
    expect(() => convert7To8('0x80')).toThrow('0x00–0x7F');
    expect(() => convert7To8('128')).toThrow('0x00–0x7F');
  });

  it('flags the General Call and 0x01–0x03 as reserved', () => {
    const generalCall = convert7To8('0x00');
    expect(generalCall.reserved).toBe(true);
    expect(generalCall.reservedReason).toContain('General Call');
    expect(convert7To8('0x03').reserved).toBe(true);
    expect(convert7To8('0x04').reserved).toBe(false);
  });

  it('flags 0x78–0x7F as reserved while 0x77 stays usable', () => {
    expect(convert7To8('0x78').reserved).toBe(true);
    expect(convert7To8('0x7F').reserved).toBe(true);
    expect(convert7To8('0x77').reserved).toBe(false);
  });
});

describe('convert8To7', () => {
  it('recovers the 7-bit address and direction from an even write byte', () => {
    const result = convert8To7('0xA0');
    expect(result.address7).toBe(0x50);
    expect(result.direction).toBe('write');
    expect(result.views7.hex).toBe('0x50');
  });

  it('recovers the 7-bit address and direction from an odd read byte', () => {
    const result = convert8To7('0xA1');
    expect(result.address7).toBe(0x50);
    expect(result.direction).toBe('read');
  });

  it('round-trips every non-reserved 7-bit address through write and read bytes', () => {
    for (let address = 0; address <= 0x7f; address += 1) {
      if (getReservedReason(address) !== undefined) {
        continue;
      }
      const write = convert8To7(String(address << 1));
      const read = convert8To7(String((address << 1) | 1));
      expect(write.address7).toBe(address);
      expect(read.address7).toBe(address);
      expect(write.direction).toBe('write');
      expect(read.direction).toBe('read');
    }
  });

  it('rejects the 0xFF read byte of reserved address 0x7F explicitly', () => {
    expect(() => convert8To7('0xFF')).toThrow();
  });

  it('rejects 0xFF and bytes above the single-byte range', () => {
    expect(() => convert8To7('0xFF')).toThrow('不是合法的 I2C 地址字节');
    expect(() => convert8To7('256')).toThrow('单字节范围');
  });

  it('propagates reserved classification back onto the recovered address', () => {
    expect(convert8To7('0xF0').reserved).toBe(true); // 0xF0 >> 1 = 0x78
    expect(convert8To7('0x00').reserved).toBe(true); // 0x00 >> 1 = 0x00
  });
});

describe('getReservedReason', () => {
  it('covers exactly the two UM10204 reserved windows', () => {
    expect(RESERVED_RANGES).toHaveLength(2);
    expect(getReservedReason(0x00)).toBeDefined();
    expect(getReservedReason(0x03)).toBeDefined();
    expect(getReservedReason(0x04)).toBeUndefined();
    expect(getReservedReason(0x77)).toBeUndefined();
    expect(getReservedReason(0x78)).toBeDefined();
    expect(getReservedReason(0x7f)).toBeDefined();
  });
});
