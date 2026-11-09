import { describe, it, expect } from 'vitest';
import {
  encodeBasicRle,
  decodeBasicRle,
  encodePackBits,
  decodePackBits,
  parseHex,
  toHex,
  textToBytes,
  bytesToText,
} from './rle';

describe('basic RLE', () => {
  it('encodes AAAAABBB into count/byte pairs', () => {
    const input = textToBytes('AAAAABBB');
    const result = encodeBasicRle(input);
    expect(result.bytes).toEqual([5, 0x41, 3, 0x42]);
    expect(result.originalLength).toBe(8);
    expect(result.encodedLength).toBe(4);
    expect(result.compressionRatio).toBeCloseTo(50, 6);
  });

  it('splits runs longer than 255 into multiple groups', () => {
    const input = new Array(300).fill(0x58);
    const result = encodeBasicRle(input);
    expect(result.bytes.slice(0, 2)).toEqual([255, 0x58]);
    expect(result.bytes.slice(2)).toEqual([45, 0x58]);
    const decoded = decodeBasicRle(result.bytes);
    expect(decoded.error).toBeNull();
    expect(decoded.bytes).toEqual(input);
  });

  it('round-trips arbitrary data', () => {
    const input = textToBytes('AABBBCCCCCCDEEEEEE');
    const { bytes } = encodeBasicRle(input);
    const decoded = decodeBasicRle(bytes);
    expect(decoded.error).toBeNull();
    expect(decoded.bytes).toEqual(input);
  });

  it('rejects odd-length payloads and out-of-range counts', () => {
    expect(decodeBasicRle([1, 2, 3]).error).toContain('偶数');
    expect(decodeBasicRle([0, 0x41]).error).toContain('越界');
  });

  it('handles empty input', () => {
    const result = encodeBasicRle([]);
    expect(result.bytes).toEqual([]);
    expect(result.compressionRatio).toBe(0);
    expect(decodeBasicRle([]).bytes).toEqual([]);
  });
});

describe('PackBits', () => {
  it('encodes a 10-byte repeat with header -9 (0xF7)', () => {
    const input = new Array(10).fill(0xaa);
    const result = encodePackBits(input);
    expect(result.bytes).toEqual([0xf7, 0xaa]);
  });

  it('encodes literal runs with n = length - 1 header', () => {
    const input = textToBytes('ABCDEF');
    const result = encodePackBits(input);
    expect(result.bytes[0]).toBe(5);
    expect(result.bytes.slice(1)).toEqual(textToBytes('ABCDEF'));
  });

  it('keeps literal blocks at most 128 bytes', () => {
    const input = Array.from({ length: 200 }, (_, i) => i % 2);
    // 0,1,0,1... 无连续重复，应拆成 128 + 72 两个字面段
    const result = encodePackBits(input);
    expect(result.bytes[0]).toBe(127);
    const decoded = decodePackBits(result.bytes);
    expect(decoded.error).toBeNull();
    expect(decoded.bytes).toEqual(input);
  });

  it('decodes the Apple reference-style stream including NOP 0x80', () => {
    // FD AA = -3 -> AA 重复 4 次；80 为 NOP；02 41 42 43 = 3 个字面字节
    const decoded = decodePackBits([0xfd, 0xaa, 0x80, 0x02, 0x41, 0x42, 0x43]);
    expect(decoded.error).toBeNull();
    expect(decoded.bytes).toEqual([0xaa, 0xaa, 0xaa, 0xaa, 0x41, 0x42, 0x43]);
  });

  it('round-trips mixed literal and repeat data', () => {
    const input = textToBytes('Hello, World!! AAAABBBBCCD');
    const result = encodePackBits(input);
    const decoded = decodePackBits(result.bytes);
    expect(decoded.error).toBeNull();
    expect(decoded.bytes).toEqual(input);
  });

  it('reports truncated literal and repeat streams with offsets', () => {
    expect(decodePackBits([0x05, 0x41, 0x42]).error).toContain('字面段');
    expect(decodePackBits([0xfe]).error).toContain('重复段');
  });
});

describe('hex and text helpers', () => {
  it('parses spaced hex with 0x prefix and commas', () => {
    expect(parseHex('0x41 42, 43').bytes).toEqual([0x41, 0x42, 0x43]);
  });

  it('reports non-hex characters and odd length', () => {
    expect(parseHex('ZZ').error).toContain('HEX');
    expect(parseHex('ABC').error).toContain('偶数');
  });

  it('round-trips UTF-8 text', () => {
    const text = 'RLE 游程编码 ✓';
    expect(bytesToText(textToBytes(text))).toBe(text);
    expect(toHex([0x0f, 255])).toBe('0F FF');
  });
});
