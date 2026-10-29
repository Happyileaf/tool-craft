import { describe, expect, it } from 'vitest';
import {
  CRC16_PRESETS,
  adler32,
  computeAll,
  crc16,
  parseHexBytes,
  textToBytes,
  toHex,
} from './crc';

const CHECK_BYTES = textToBytes('123456789');

function presetByName(name: string) {
  const preset = CRC16_PRESETS.find((item) => item.name === name);
  if (!preset) {
    throw new Error(`missing preset ${name}`);
  }
  return preset;
}

describe('crc16 标准 check 向量（"123456789"）', () => {
  it('CRC-16/CCITT-FALSE = 0x29B1', () => {
    expect(crc16(CHECK_BYTES, presetByName('CRC-16/CCITT-FALSE'))).toBe(0x29b1);
  });

  it('CRC-16/ARC = 0xBB3D', () => {
    expect(crc16(CHECK_BYTES, presetByName('CRC-16/ARC'))).toBe(0xbb3d);
  });

  it('CRC-16/XMODEM = 0x31C3', () => {
    expect(crc16(CHECK_BYTES, presetByName('CRC-16/XMODEM'))).toBe(0x31c3);
  });

  it('CRC-16/MODBUS = 0x4B37', () => {
    expect(crc16(CHECK_BYTES, presetByName('CRC-16/MODBUS'))).toBe(0x4b37);
  });

  it('CRC-16/GENIBUS = 0xD64E', () => {
    expect(crc16(CHECK_BYTES, presetByName('CRC-16/GENIBUS'))).toBe(0xd64e);
  });

  it('CRC-16/KERMIT = 0x2189', () => {
    expect(crc16(CHECK_BYTES, presetByName('CRC-16/KERMIT'))).toBe(0x2189);
  });
});

describe('crc16 空输入', () => {
  it('CCITT-FALSE 空串为 init 0xFFFF，ARC 为 0x0000', () => {
    expect(crc16([], presetByName('CRC-16/CCITT-FALSE'))).toBe(0xffff);
    expect(crc16([], presetByName('CRC-16/ARC'))).toBe(0x0000);
    expect(crc16([], presetByName('CRC-16/XMODEM'))).toBe(0x0000);
  });
});

describe('adler32', () => {
  it('标准向量 Adler-32("123456789") = 0x091E01DE', () => {
    expect(adler32(CHECK_BYTES)).toBe(0x091e01de);
  });

  it('空输入为 1', () => {
    expect(adler32([])).toBe(1);
  });

  it('按 UTF-8 字节处理中文', () => {
    const bytes = textToBytes('你好');
    expect(bytes).toEqual([0xe4, 0xbd, 0xa0, 0xe5, 0xa5, 0xbd]);
    expect(adler32(bytes)).toBe(0x10450489);
  });
});

describe('parseHexBytes', () => {
  it('支持空格、0x 前缀与逗号分隔', () => {
    expect(parseHexBytes('0x31 32 33')).toEqual([0x31, 0x32, 0x33]);
    expect(parseHexBytes('31,32,33')).toEqual([0x31, 0x32, 0x33]);
    expect(parseHexBytes('3132')).toEqual([0x31, 0x32]);
    expect(parseHexBytes('')).toEqual([]);
  });

  it('奇数长度报错', () => {
    expect(() => parseHexBytes('abc')).toThrow('偶数');
  });

  it('非法字符报错', () => {
    expect(() => parseHexBytes('zz')).toThrow('十六进制');
  });
});

describe('toHex 与 computeAll', () => {
  it('定长大写补零', () => {
    expect(toHex(0x29b1, 4)).toBe('29B1');
    expect(toHex(1, 8)).toBe('00000001');
  });

  it('一次返回 6 个 CRC-16 与 Adler-32 结果', () => {
    const results = computeAll(CHECK_BYTES);
    expect(results).toHaveLength(7);
    const ccitt = results.find((item) => item.key === 'CRC-16/CCITT-FALSE');
    expect(ccitt?.hex).toBe('29B1');
    expect(ccitt?.decimal).toBe(0x29b1);
    const adler = results.find((item) => item.key === 'Adler-32');
    expect(adler?.hex).toBe('091E01DE');
  });
});
