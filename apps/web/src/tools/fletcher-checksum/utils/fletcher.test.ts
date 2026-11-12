import { describe, expect, it } from 'vitest';
import {
  computeAll,
  computeFletcher,
  fletcher16,
  fletcher32,
  fletcher64,
  parseHexBytes,
  textToBytes,
  verifyAppended,
} from './fletcher';

describe('fletcher16', () => {
  it('returns zero sums for empty input', () => {
    expect(fletcher16([])).toEqual({ sum1: 0, sum2: 0 });
    expect(computeFletcher([], 'fletcher16').hex).toBe('0000');
  });

  it('computes the canonical single-byte vector 0x01 -> 0x0101', () => {
    const result = computeFletcher([0x01], 'fletcher16');
    expect(result.sum1).toBe(1);
    expect(result.sum2).toBe(1);
    expect(result.hex).toBe('0101');
    expect(result.value).toBe(BigInt(257));
  });

  it('computes S1=3, S2=4 for bytes [0x01, 0x02] -> 0x0403', () => {
    const result = computeFletcher([0x01, 0x02], 'fletcher16');
    expect(result.sum1).toBe(3);
    expect(result.sum2).toBe(4);
    expect(result.hex).toBe('0403');
  });
});

describe('fletcher32', () => {
  it('combines S1=513, S2=513 for little-endian word 01 02 -> 0x02010201', () => {
    const result = computeFletcher([0x01, 0x02], 'fletcher32');
    expect(result.sum1).toBe(0x0201);
    expect(result.sum2).toBe(0x0201);
    expect(result.hex).toBe('02010201');
  });

  it('computes 0x00ff00ff for the single byte 0xff', () => {
    const result = computeFletcher([0xff], 'fletcher32');
    expect(result.hex).toBe('00ff00ff');
  });

  it('pads an odd-length input with a zero high byte', () => {
    const even = computeFletcher([0x01, 0x00], 'fletcher32');
    const odd = computeFletcher([0x01], 'fletcher32');
    expect(odd.hex).toBe(even.hex);
  });
});

describe('fletcher64', () => {
  it('combines S1=513 and S2=513 for little-endian word 01 02 00 00', () => {
    const result = computeFletcher([0x01, 0x02, 0x00, 0x00], 'fletcher64');
    expect(result.sum1).toBe(0x0201);
    expect(result.sum2).toBe(0x0201);
    expect(result.hex).toBe('0000020100000201');
  });

  it('pads inputs whose byte length is not a multiple of 4', () => {
    const padded = computeFletcher([0x01, 0x02], 'fletcher64');
    const full = computeFletcher([0x01, 0x02, 0x00, 0x00], 'fletcher64');
    expect(padded.hex).toBe(full.hex);
  });

  it('emits a 16-character lowercase hex string', () => {
    expect(computeFletcher([0xab, 0xcd, 0xef, 0x01], 'fletcher64').hex).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('text and hex inputs', () => {
  it('produces identical results for UTF-8 text and its hex bytes', () => {
    const fromText = computeAll(textToBytes('abc'));
    const fromHex = computeAll(parseHexBytes('61 62 63'));
    expect(fromHex.map((item) => item.hex)).toEqual(fromText.map((item) => item.hex));
  });

  it('accepts 0x prefixes, commas and newlines in hex input', () => {
    expect(parseHexBytes('0x31,0x32\n0x33')).toEqual([0x31, 0x32, 0x33]);
  });

  it('rejects odd-length hex input', () => {
    expect(() => parseHexBytes('abc')).toThrow('偶数');
  });

  it('rejects non-hex characters', () => {
    expect(() => parseHexBytes('zz')).toThrow('十六进制');
  });
});

/**
 * 构造使整体 S1、S2 同时归零的校验字节（模 modulus）：
 * 令追加首字后中间状态 a = (M - s2) mod M，反推首字 c0，再令 c1 = (M - a) mod M
 */
function checkBytes16(data: number[]): [number, number] {
  const modulus = 255;
  const { sum1, sum2 } = fletcher16(data);
  const a = (modulus - (sum2 % modulus)) % modulus;
  const c0 = (((a - sum1) % modulus) + modulus) % modulus;
  const c1 = (modulus - a) % modulus;
  return [c0, c1];
}

function checkWords32(data: number[]): number[] {
  const modulus = 65535;
  const { sum1, sum2 } = fletcher32(data);
  const a = (modulus - (sum2 % modulus)) % modulus;
  const word0 = (((a - sum1) % modulus) + modulus) % modulus;
  const word1 = (modulus - a) % modulus;
  return [word0 & 0xff, (word0 >> 8) & 0xff, word1 & 0xff, (word1 >> 8) & 0xff];
}

describe('verifyAppended', () => {
  it('passes when the appended check bytes zero both sums (Fletcher-16)', () => {
    const data = [0x01, 0x02];
    const [c0, c1] = checkBytes16(data);
    expect(verifyAppended([...data, c0, c1], 'fletcher16').valid).toBe(true);
  });

  it('fails after tampering a data byte', () => {
    const data = [0x01, 0x02];
    const [c0, c1] = checkBytes16(data);
    expect(verifyAppended([0x09, 0x02, c0, c1], 'fletcher16').valid).toBe(false);
  });

  it('works for Fletcher-32 with 16-bit check words', () => {
    const data = [0x01, 0x02, 0x03, 0x04];
    const checkWords = checkWords32(data);
    expect(verifyAppended([...data, ...checkWords], 'fletcher32').valid).toBe(true);
  });

  it('reports non-zero sums for raw data without check bytes', () => {
    expect(verifyAppended([0x01], 'fletcher16').valid).toBe(false);
  });
});

describe('computeAll', () => {
  it('returns all three variants with fixed-width hex', () => {
    const results = computeAll([0x01]);
    expect(results.map((item) => item.key)).toEqual(['fletcher16', 'fletcher32', 'fletcher64']);
    expect(results.map((item) => item.hex.length)).toEqual([4, 8, 16]);
  });
});
