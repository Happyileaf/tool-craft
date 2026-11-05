import { describe, expect, it } from 'vitest';
import { decodeBcd, encodeBcd, packBcd, processBatch, unpackBcd } from './bcd';

describe('encodeBcd 8421', () => {
  it('maps each decimal digit to its 4-bit group', () => {
    const result = encodeBcd('259', '8421');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('0010 0101 1001');
    expect(result.nibbles.map((n) => n.digit)).toEqual(['2', '5', '9']);
  });

  it('encodes zero', () => {
    expect(encodeBcd('0', '8421').output).toBe('0000');
  });

  it('rejects non-digit input', () => {
    const result = encodeBcd('12A', '8421');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('十进制数字');
  });

  it('rejects empty input', () => {
    expect(encodeBcd('   ', '8421').valid).toBe(false);
  });
});

describe('encodeBcd excess-3', () => {
  it('adds 3 to every digit', () => {
    const result = encodeBcd('039', 'excess3');
    expect(result.output).toBe('0011 0110 1100');
  });

  it('is self-complementing: bitwise NOT of n equals code of 9-n', () => {
    for (let n = 0; n <= 9; n += 1) {
      const code = encodeBcd(String(n), 'excess3').nibbles[0]!.binary;
      const complement = code
        .split('')
        .map((bit) => (bit === '0' ? '1' : '0'))
        .join('');
      const counterpart = encodeBcd(String(9 - n), 'excess3').nibbles[0]!.binary;
      expect(complement).toBe(counterpart);
    }
  });
});

describe('encodeBcd 2421', () => {
  it('uses the standard weighted table', () => {
    const result = encodeBcd('059', '2421');
    expect(result.output).toBe('0000 1011 1111');
  });

  it('keeps 0..4 identical to 8421', () => {
    for (let n = 0; n <= 4; n += 1) {
      expect(encodeBcd(String(n), '2421').output).toBe(encodeBcd(String(n), '8421').output);
    }
  });
});

describe('decodeBcd', () => {
  it('round-trips 8421 groups', () => {
    const result = decodeBcd('0010 0101 1001', '8421');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('259');
  });

  it('accepts a continuous bit string whose length is a multiple of 4', () => {
    expect(decodeBcd('001001011001', '8421').output).toBe('259');
  });

  it('accepts 0b prefix', () => {
    expect(decodeBcd('0b0010 0101', '8421').output).toBe('25');
  });

  it('rejects illegal 8421 groups 1010..1111', () => {
    const result = decodeBcd('1010', '8421');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('非法码组');
  });

  it('rejects illegal 2421 gap groups 0101..1010', () => {
    expect(decodeBcd('1000', '2421').valid).toBe(false);
    expect(decodeBcd('1000', '2421').error).toContain('非法码组');
  });

  it('round-trips excess-3', () => {
    expect(decodeBcd('0011 1100', 'excess3').output).toBe('09');
  });

  it('rejects groups that are not 4 bits', () => {
    expect(decodeBcd('010', '8421').valid).toBe(false);
  });

  it('rejects continuous bit string with non-multiple-of-4 length', () => {
    expect(decodeBcd('00101', '8421').valid).toBe(false);
  });
});

describe('packBcd / unpackBcd', () => {
  it('packs even digit count into bytes', () => {
    const result = packBcd('1234');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('12 34');
    expect(result.bytes).toEqual(['12', '34']);
    expect(result.error).toBeNull();
  });

  it('pads odd digit count with trailing F nibble', () => {
    const result = packBcd('123');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('12 3F');
    expect(result.error).toContain('0xF');
  });

  it('unpacks bytes back to digits', () => {
    const result = unpackBcd('12 34');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('1234');
  });

  it('unpacks 0x-prefixed comma-separated hex', () => {
    expect(unpackBcd('0x12,0x34').output).toBe('1234');
  });

  it('rejects nibble values above 9 when unpacking', () => {
    const result = unpackBcd('1A');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('非法 8421 码组');
  });

  it('rejects odd-length hex input', () => {
    expect(unpackBcd('123').valid).toBe(false);
  });

  it('rejects non-hex input', () => {
    expect(unpackBcd('ZZ').valid).toBe(false);
  });

  it('round-trips pack then unpack for odd count', () => {
    const packed = packBcd('98765');
    expect(packed.output).toBe('98 76 5F');
    const unpacked = unpackBcd(packed.output);
    expect(unpacked.output).toBe('98765');
  });
});

describe('processBatch', () => {
  it('processes multiple lines and skips blanks', () => {
    const results = processBatch('259\n\n007\n', 'encode', '8421');
    expect(results).toHaveLength(2);
    expect(results[0]!.output).toBe('0010 0101 1001');
    expect(results[1]!.output).toBe('0000 0000 0111');
  });
});
