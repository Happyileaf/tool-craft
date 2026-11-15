import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  interpretBytes,
  intToBytes,
  parseHexBytes,
  parseInteger,
  reverseBytes,
  splitElements,
  swapHalfwords,
} from './endian';

describe('parseHexBytes', () => {
  it('解析空格分隔的字节串', () => {
    const result = parseHexBytes('DE AD BE EF');
    expect(result.ok).toBe(true);
    expect(result.bytes).toEqual([0xde, 0xad, 0xbe, 0xef]);
  });

  it('忽略 0x 前缀、逗号与换行', () => {
    const result = parseHexBytes('0xDE,0xAD,\n0xBE 0xEF');
    expect(result.ok).toBe(true);
    expect(result.bytes).toEqual([0xde, 0xad, 0xbe, 0xef]);
  });

  it('十六进制位数为奇数时补前导 0 并告警', () => {
    const result = parseHexBytes('ABC');
    expect(result.ok).toBe(true);
    expect(result.bytes).toEqual([0x0a, 0xbc]);
    expect(result.warnings.length).toBe(1);
  });

  it('非法字符返回定位明确的错误', () => {
    const result = parseHexBytes('DE AG');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('第 5 个字符');
    expect(result.error).toContain('G');
  });

  it('空输入返回空字节数组', () => {
    const result = parseHexBytes('   ');
    expect(result.ok).toBe(true);
    expect(result.bytes).toEqual([]);
  });
});

describe('interpretBytes', () => {
  it('DE AD BE EF 的两种端序解释', () => {
    const result = interpretBytes([0xde, 0xad, 0xbe, 0xef], 32, 'unsigned');
    expect(result.bigEndian).toBe(BigInt(3735928559));
    expect(result.littleEndian).toBe(BigInt(4022250974));
  });

  it('16 位有符号补码边界', () => {
    expect(interpretBytes([0x80, 0x00], 16, 'signed').bigEndian).toBe(BigInt(-32768));
    expect(interpretBytes([0xff, 0xff], 16, 'signed').bigEndian).toBe(BigInt(-1));
  });

  it('64 位无符号不丢精度', () => {
    const bytes = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
    expect(interpretBytes(bytes, 64, 'unsigned').bigEndian).toBe(
      BigInt('18446744073709551615'),
    );
  });
});

describe('parseInteger 与 intToBytes', () => {
  it('十进制转两种端序字节', () => {
    const parsed = parseInteger('305419896', 32, 'unsigned');
    expect(parsed.ok).toBe(true);
    expect(intToBytes(parsed.value as bigint, 32, 'be')).toEqual([0x12, 0x34, 0x56, 0x78]);
    expect(intToBytes(parsed.value as bigint, 32, 'le')).toEqual([0x78, 0x56, 0x34, 0x12]);
  });

  it('负数按补码编码', () => {
    const parsed = parseInteger('-1', 32, 'signed');
    expect(parsed.ok).toBe(true);
    expect(intToBytes(parsed.value as bigint, 32, 'be')).toEqual([
      0xff, 0xff, 0xff, 0xff,
    ]);
  });

  it('越界返回错误', () => {
    expect(parseInteger('65536', 16, 'unsigned').ok).toBe(false);
    expect(parseInteger('-32769', 16, 'signed').ok).toBe(false);
    expect(parseInteger('32768', 16, 'signed').ok).toBe(false);
  });

  it('拒绝小数与非法格式', () => {
    expect(parseInteger('1.5', 32, 'unsigned').ok).toBe(false);
    expect(parseInteger('abc', 32, 'unsigned').ok).toBe(false);
  });
});

describe('字节重排与切分', () => {
  it('半字交换与整串反转', () => {
    expect(swapHalfwords([0x12, 0x34, 0x56, 0x78])).toEqual([
      0x34, 0x12, 0x78, 0x56,
    ]);
    expect(reverseBytes([0x12, 0x34, 0x56, 0x78])).toEqual([
      0x78, 0x56, 0x34, 0x12,
    ]);
  });

  it('按 16 位切分并保留末尾余量', () => {
    const { elements, remainder } = splitElements([0x12, 0x34, 0x56], 16);
    expect(elements).toEqual([[0x12, 0x34]]);
    expect(remainder).toEqual([0x56]);
  });

  it('formatBytes 输出两位大写十六进制', () => {
    expect(formatBytes([0x0a, 0xff])).toBe('0A FF');
  });
});
