import { describe, expect, it } from 'vitest';
import { CRC_PRESETS } from '../constants';
import {
  computeCrc,
  encodeUtf8,
  formatCrcHex,
  parseHexBytes,
  reverseBits,
  verifyModel,
} from './crc';

describe('CRC 预设模型 check 自检（"123456789"）', () => {
  for (const model of CRC_PRESETS) {
    it(`${model.name} check 与 catalogue 常量一致`, () => {
      const result = verifyModel(model);
      expect(result.ok).toBe(true);
      expect(formatCrcHex(result.computed, model.width)).toBe(
        formatCrcHex(model.check, model.width),
      );
    });
  }
});

describe('computeCrc 已知向量', () => {
  const crc32 = CRC_PRESETS.find((item) => item.name.startsWith('CRC-32/ISO-HDLC'))!;
  const modbus = CRC_PRESETS.find((item) => item.name === 'CRC-16/MODBUS')!;

  it('CRC-32 空输入 = 00000000（reflected init 经 xorOut 抵消）', () => {
    expect(computeCrc(new Uint8Array(), crc32)).toBe(BigInt(0));
  });

  it('CRC-32 对 "Hello" 给出已知值', () => {
    const value = computeCrc(encodeUtf8('Hello'), crc32);
    expect(formatCrcHex(value, 32)).toBe('F7D18982');
  });

  it('CRC-16/MODBUS 对十六进制 01 03 给出寄存器值 2140（线上按小端发 40 21）', () => {
    const value = computeCrc(parseHexBytes('01 03'), modbus);
    expect(formatCrcHex(value, 16)).toBe('2140');
  });

  it('同一逻辑数据的文本与十六进制输入结果一致', () => {
    const fromText = computeCrc(encodeUtf8('AB'), crc32);
    const fromHex = computeCrc(parseHexBytes('4142'), crc32);
    expect(fromText).toBe(fromHex);
  });
});

describe('reverseBits', () => {
  it('反转 8 位 0b10000001 → 0b10000001（回文）', () => {
    expect(reverseBits(BigInt('0b10000001'), 8)).toBe(BigInt('0b10000001'));
  });

  it('反转 8 位 0b00000001 → 0b10000000', () => {
    expect(reverseBits(BigInt(1), 8)).toBe(BigInt('0b10000000'));
  });

  it('16 位反转后再次反转恢复原值', () => {
    const original = BigInt('0x1234');
    expect(reverseBits(reverseBits(original, 16), 16)).toBe(original);
  });
});

describe('formatCrcHex', () => {
  it('按位宽左侧补零', () => {
    expect(formatCrcHex(BigInt('0x0BB3'), 16)).toBe('0BB3');
    expect(formatCrcHex(BigInt('0x15'), 8)).toBe('15');
    expect(formatCrcHex(BigInt('0xFA'), 64)).toBe('00000000000000FA');
  });
});

describe('parseHexBytes', () => {
  it('兼容空格、逗号、0x 前缀与连续字符串', () => {
    expect(Array.from(parseHexBytes('48 65 6C'))).toEqual([0x48, 0x65, 0x6c]);
    expect(Array.from(parseHexBytes('0x48,0x65,0x6C'))).toEqual([0x48, 0x65, 0x6c]);
    expect(Array.from(parseHexBytes('48656C'))).toEqual([0x48, 0x65, 0x6c]);
  });

  it('空字符串返回空数组', () => {
    expect(parseHexBytes('').length).toBe(0);
  });

  it('奇数长度或非法字符报错', () => {
    expect(() => parseHexBytes('ABC')).toThrow();
    expect(() => parseHexBytes('ZZ')).toThrow();
  });
});
