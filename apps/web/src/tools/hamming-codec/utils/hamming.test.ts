import { describe, expect, it } from 'vitest';
import {
  decodeBlock,
  decodeStream,
  encodeBlock,
  encodeStream,
  flipBits,
  normalizeBits,
  randomPositions,
} from './hamming';

describe('encodeBlock', () => {
  it('matches the textbook vector 1011 -> 0110011', () => {
    expect(encodeBlock('1011')).toBe('0110011');
  });

  it('encodes all-zero and all-one data', () => {
    expect(encodeBlock('0000')).toBe('0000000');
    // 1111: P1 组(3,5,7)=3 个 1 -> P1=1；P2 组(3,6,7)=3 -> P2=1；P4 组(5,6,7)=3 -> P4=1
    expect(encodeBlock('1111')).toBe('1111111');
  });

  it('rejects invalid length or characters', () => {
    expect(() => encodeBlock('101')).toThrow('4 位');
    expect(() => encodeBlock('10110')).toThrow('4 位');
    expect(() => encodeBlock('10A1')).toThrow('4 位');
  });
});

describe('single-bit error exhaustive correction (16 data x 7 positions = 112)', () => {
  const allData: string[] = [];
  for (let n = 0; n < 16; n += 1) {
    allData.push(n.toString(2).padStart(4, '0'));
  }

  it.each(allData)('encodes then corrects every single flip for data %s', (data) => {
    const codeword = encodeBlock(data);
    for (let pos = 1; pos <= 7; pos += 1) {
      const corrupted = flipBits(codeword, [pos]);
      const result = decodeBlock(corrupted);
      expect(result.status).toBe('corrected');
      expect(result.errorPosition).toBe(pos);
      expect(result.syndrome).toBe(pos);
      expect(result.codeword).toBe(codeword);
      expect(result.data).toBe(data);
    }
  });

  it('reports ok with syndrome 0 for an untouched codeword', () => {
    const result = decodeBlock(encodeBlock('1011'));
    expect(result.status).toBe('ok');
    expect(result.syndrome).toBe(0);
    expect(result.data).toBe('1011');
  });
});

describe('double-bit error detection (21 combinations)', () => {
  const codeword = encodeBlock('1011');
  const pairs: Array<[number, number]> = [];
  for (let i = 1; i <= 7; i += 1) {
    for (let j = i + 1; j <= 7; j += 1) {
      pairs.push([i, j]);
    }
  }

  it('covers exactly 21 pairs', () => {
    expect(pairs).toHaveLength(21);
  });

  it.each(pairs)('marks double error for flips at %s and %s', (a, b) => {
    const corrupted = flipBits(codeword, [a, b]);
    const { blocks } = decodeStream(corrupted, [2]);
    expect(blocks[0]?.status).toBe('double-error');
  });
});

describe('encodeStream / decodeStream', () => {
  it('groups an 8-bit stream and round-trips', () => {
    const { codeword, padded } = encodeStream('10111010');
    expect(padded).toBe(0);
    expect(codeword).toHaveLength(14);
    const { data } = decodeStream(codeword);
    expect(data).toBe('10111010');
  });

  it('right-pads a partial last group', () => {
    const { codeword, padded } = encodeStream('101');
    expect(padded).toBe(1);
    expect(codeword).toHaveLength(7);
    expect(decodeStream(codeword).data.startsWith('101')).toBe(true);
  });

  it('rejects stream length not divisible by 7 on decode', () => {
    expect(() => decodeStream('011001')).toThrow('7 的倍数');
  });
});

describe('normalizeBits', () => {
  it('strips whitespace', () => {
    expect(normalizeBits(' 01 10 \n')).toBe('0110');
  });

  it('rejects empty or non-binary input', () => {
    expect(() => normalizeBits('   ')).toThrow('为空');
    expect(() => normalizeBits('012')).toThrow('0 和 1');
  });
});

describe('flipBits / randomPositions', () => {
  it('flips each requested position', () => {
    expect(flipBits('0000000', [1, 7])).toBe('1000001');
  });

  it('rejects out-of-range positions', () => {
    expect(() => flipBits('0000000', [0])).toThrow('1–7');
    expect(() => flipBits('0000000', [8])).toThrow('1–7');
  });

  it('returns n unique positions within 1..7', () => {
    for (const n of [0, 1, 2]) {
      const positions = randomPositions(n);
      expect(positions).toHaveLength(n);
      expect(new Set(positions).size).toBe(n);
      expect(positions.every((p) => p >= 1 && p <= 7)).toBe(true);
    }
  });
});
