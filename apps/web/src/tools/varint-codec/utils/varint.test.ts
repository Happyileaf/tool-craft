import { describe, expect, it } from 'vitest';

import {
  LIMITS,
  bytesToHex,
  bytesToSpacedHex,
  decodeVarInt,
  encodeVarInt,
  hexToBytes,
  parseIntegerInput,
  type VarIntType,
  zigzagDecode,
  zigzagEncode,
} from './varint';

function encodeHex(value: bigint, type: VarIntType): string {
  const result = encodeVarInt(value, type);
  if (result.error || !result.bytes) {
    throw new Error(result.error ?? '编码失败');
  }
  return bytesToHex(result.bytes);
}

describe('无符号 VarInt / ULEB128 编码', () => {
  it.each([
    [BigInt(0), '00'],
    [BigInt(1), '01'],
    [BigInt(127), '7F'],
    [BigInt(128), '8001'],
    [BigInt(255), 'FF01'],
    [BigInt(300), 'AC02'],
    [BigInt(16384), '808001'],
    [BigInt('18446744073709551615'), 'FFFFFFFFFFFFFFFFFF01'],
  ])('编码 %s => %s', (value, expected) => {
    expect(encodeHex(value, 'unsigned')).toBe(expected);
  });

  it('拒绝负数与超出 uint64 的值', () => {
    expect(encodeVarInt(BigInt(-1), 'unsigned').error).toContain('非负整数');
    expect(encodeVarInt(BigInt('18446744073709551616'), 'unsigned').error).toContain('uint64');
  });

  it('逐字节拆解续位与 7 位载荷', () => {
    const result = encodeVarInt(BigInt(300), 'unsigned');
    expect(result.bytesDetail).toHaveLength(2);
    expect(result.bytesDetail[0]).toMatchObject({
      index: 1,
      value: 0xac,
      hex: 'AC',
      binary: '10101100',
      continuation: true,
      payload: 0x2c,
      payloadBinary: '0101100',
    });
    expect(result.bytesDetail[1]).toMatchObject({
      index: 2,
      value: 0x02,
      continuation: false,
      payload: 0x02,
    });
  });
});

describe('ZigZag 映射', () => {
  it.each([
    [BigInt(0), BigInt(0)],
    [BigInt(-1), BigInt(1)],
    [BigInt(1), BigInt(2)],
    [BigInt(-2), BigInt(3)],
    [BigInt(2), BigInt(4)],
    [BigInt(2147483647), BigInt('4294967294')],
    [BigInt(-2147483648), BigInt('4294967295')],
  ])('zigzag32 编码 %s => %s', (value, expected) => {
    expect(zigzagEncode(value, 32)).toBe(expected);
    expect(zigzagDecode(expected)).toBe(value);
  });

  it.each([
    [BigInt('9223372036854775807'), BigInt('18446744073709551614')],
    [-BigInt('9223372036854775808'), BigInt('18446744073709551615')],
  ])('zigzag64 边界 %s => %s', (value, expected) => {
    expect(zigzagEncode(value, 64)).toBe(expected);
    expect(zigzagDecode(expected)).toBe(value);
  });

  it('sint32 编码向量（300 等整数的 ZigZag VarInt）', () => {
    expect(encodeHex(BigInt(0), 'zigzag32')).toBe('00');
    expect(encodeHex(BigInt(-1), 'zigzag32')).toBe('01');
    expect(encodeHex(BigInt(1), 'zigzag32')).toBe('02');
    expect(encodeHex(BigInt(-2), 'zigzag32')).toBe('03');
    expect(encodeHex(BigInt(2147483647), 'zigzag32')).toBe('FEFFFFFF0F');
    expect(encodeHex(BigInt(-2147483648), 'zigzag32')).toBe('FFFFFFFF0F');
  });
});

describe('有符号 LEB128 编码', () => {
  it.each([
    [BigInt(0), '00'],
    [BigInt(1), '01'],
    [BigInt(63), '3F'],
    [BigInt(64), 'C000'],
    [BigInt(-1), '7F'],
    [BigInt(-64), '40'],
    [BigInt(-65), 'BF7F'],
    [BigInt(127), 'FF00'],
    [BigInt(-128), '807F'],
    [BigInt(128), '8001'],
    [BigInt(-129), 'FF7E'],
  ])('编码 %s => %s', (value, expected) => {
    expect(encodeHex(value, 'signed-leb')).toBe(expected);
  });

  it('int64 上下限为 10 字节', () => {
    const min = encodeVarInt(LIMITS.I64_MIN, 'signed-leb');
    const max = encodeVarInt(LIMITS.I64_MAX, 'signed-leb');
    expect(min.bytes).toHaveLength(10);
    expect(max.bytes).toHaveLength(10);
    expect(bytesToHex(min.bytes as Uint8Array)).toBe('8080808080808080807F');
    expect(bytesToHex(max.bytes as Uint8Array)).toBe('FFFFFFFFFFFFFFFFFF00');
  });

  it('拒绝超出 int64 范围', () => {
    const tooSmall = LIMITS.I64_MIN - BigInt(1);
    const tooLarge = LIMITS.I64_MAX + BigInt(1);
    expect(encodeVarInt(tooSmall, 'signed-leb').error).toContain('int64');
    expect(encodeVarInt(tooLarge, 'signed-leb').error).toContain('int64');
  });
});

describe('hexToBytes 输入解析', () => {
  it('接受 0x 前缀、空格与逗号分隔', () => {
    expect(bytesToHex(hexToBytes('ac02').bytes as Uint8Array)).toBe('AC02');
    expect(bytesToHex(hexToBytes('0xac02').bytes as Uint8Array)).toBe('AC02');
    expect(bytesToHex(hexToBytes('AC 02').bytes as Uint8Array)).toBe('AC02');
    expect(bytesToHex(hexToBytes('0xAC, 0x02').bytes as Uint8Array)).toBe('AC02');
  });

  it('拒绝奇数长度与非法字符', () => {
    expect(hexToBytes('ac0').error).toContain('偶数');
    expect(hexToBytes('zz').error).toContain('0-9a-f');
  });
});

describe('解码与错误处理', () => {
  it('无符号往返：0 / 1 / 300 及边界', () => {
    const samples = [BigInt(0), BigInt(1), BigInt(300), LIMITS.U64_MAX, BigInt('12345678901234567890')];
    for (const value of samples) {
      const encoded = encodeVarInt(value, 'unsigned');
      const decoded = decodeVarInt(encoded.bytes as Uint8Array, 'unsigned');
      expect(decoded.error).toBeNull();
      expect(decoded.value).toBe(value);
      expect(decoded.length).toBe((encoded.bytes as Uint8Array).length);
    }
  });

  it('zigzag32 / zigzag64 / signed-leb 全边界往返', () => {
    const cases: Array<[bigint, VarIntType]> = [
      [BigInt(0), 'zigzag32'],
      [BigInt(-1), 'zigzag32'],
      [LIMITS.I32_MIN, 'zigzag32'],
      [LIMITS.I32_MAX, 'zigzag32'],
      [BigInt(0), 'zigzag64'],
      [LIMITS.I64_MIN, 'zigzag64'],
      [LIMITS.I64_MAX, 'zigzag64'],
      [BigInt(-129), 'signed-leb'],
      [BigInt(127), 'signed-leb'],
      [LIMITS.I64_MIN, 'signed-leb'],
      [LIMITS.I64_MAX, 'signed-leb'],
    ];
    for (const [value, type] of cases) {
      const encoded = encodeVarInt(value, type);
      const decoded = decodeVarInt(encoded.bytes as Uint8Array, type);
      expect(decoded.error, `${type} ${value.toString()}: ${decoded.error ?? ''}`).toBeNull();
      expect(decoded.value).toBe(value);
    }
  });

  it('截断的 VarInt 报错', () => {
    const truncated = hexToBytes('AC').bytes as Uint8Array;
    const decoded = decodeVarInt(truncated, 'unsigned');
    expect(decoded.value).toBeNull();
    expect(decoded.error).toContain('截断');
  });

  it('非规范（冗余）编码报错：80 00 应表示 0 但多一字节', () => {
    const decoded = decodeVarInt(hexToBytes('8000').bytes as Uint8Array, 'unsigned');
    expect(decoded.error).toContain('非规范');
  });

  it('超过 10 字节报错', () => {
    const decoded = decodeVarInt(hexToBytes('8080808080808080808001').bytes as Uint8Array, 'unsigned');
    expect(decoded.error).toMatch(/10 字节|uint64/);
  });

  it('第 10 字节超范围报非规范', () => {
    // 10 字节续位
    expect(decodeVarInt(hexToBytes('80808080808080808080').bytes as Uint8Array, 'unsigned').error).toMatch(/10 字节|uint64/);
    // 无符号第 10 字节载荷 > 1
    expect(decodeVarInt(hexToBytes('80808080808080808002').bytes as Uint8Array, 'unsigned').error).toContain('非规范');
  });

  it('有符号 LEB128 第 10 字节只接受 0x00 / 0x7F 且必须是边界值', () => {
    // 末字节为 0x01：超出 int64
    expect(decodeVarInt(hexToBytes('80808080808080808001').bytes as Uint8Array, 'signed-leb').error).toContain('非规范');
    // 全 0x80 + 0x00：冗余编码的 0（9 字节即可）
    expect(decodeVarInt(hexToBytes('80808080808080808000').bytes as Uint8Array, 'signed-leb').error).toContain('非规范');
    // 全 0x80 + 0x7F：I64_MIN 合法
    const min = decodeVarInt(hexToBytes('8080808080808080807F').bytes as Uint8Array, 'signed-leb');
    expect(min.error).toBeNull();
    expect(min.value).toBe(LIMITS.I64_MIN);
    // 全 0xFF + 0x00：I64_MAX 合法
    const max = decodeVarInt(hexToBytes('FFFFFFFFFFFFFFFFFF00').bytes as Uint8Array, 'signed-leb');
    expect(max.error).toBeNull();
    expect(max.value).toBe(LIMITS.I64_MAX);
  });

  it('短序列的冗余符号扩展也判为非规范', () => {
    // 0x80 0x00：冗余编码的 0（应为 00）
    expect(decodeVarInt(hexToBytes('8000').bytes as Uint8Array, 'signed-leb').error).toContain('非规范');
    // 0xFF 0x7F：冗余编码的 -1（应为 7F）
    expect(decodeVarInt(hexToBytes('FF7F').bytes as Uint8Array, 'signed-leb').error).toContain('非规范');
  });

  it('sint32 超范围输入报错', () => {
    expect(encodeVarInt(LIMITS.I32_MAX + BigInt(1), 'zigzag32').error).toContain('sint32');
    expect(encodeVarInt(LIMITS.I32_MIN - BigInt(1), 'zigzag32').error).toContain('sint32');
  });
});

describe('parseIntegerInput 整数输入解析', () => {
  it.each([
    ['300', BigInt(300)],
    ['  300  ', BigInt(300)],
    ['-1', BigInt(-1)],
    ['+42', BigInt(42)],
    ['0x12c', BigInt(300)],
    ['0XAC', BigInt(172)],
    ['18,446,744,073,709,551,615', BigInt('18446744073709551615')],
    ['4_294_967_295', BigInt('4294967295')],
  ])('解析 %s => %s', (input, expected) => {
    expect(parseIntegerInput(input).value).toBe(expected);
  });

  it('拒绝空输入、小数与非法字符', () => {
    expect(parseIntegerInput('').error).toBeTruthy();
    expect(parseIntegerInput('-').error).toBeTruthy();
    expect(parseIntegerInput('1.5').error).toContain('整数');
    expect(parseIntegerInput('abc').error).toContain('无法识别');
    expect(parseIntegerInput('0xZZ').error).toContain('无法识别');
  });
});

describe('格式化输出', () => {
  it('bytesToSpacedHex 输出 AC 02 形式', () => {
    expect(bytesToSpacedHex(hexToBytes('ac02').bytes as Uint8Array)).toBe('AC 02');
  });
});
