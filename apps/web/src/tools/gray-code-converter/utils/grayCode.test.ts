import { describe, it, expect } from 'vitest';
import { processCode, processLines } from './grayCode';

describe('processCode bin2gray', () => {
  it('matches known Gray code vectors', () => {
    // 经典序列：0,1,3,2,6,7,5,4
    const vectors: Array<[string, string]> = [
      ['0000', '0000'],
      ['0001', '0001'],
      ['0010', '0011'],
      ['0011', '0010'],
      ['0100', '0110'],
      ['0101', '0111'],
      ['0110', '0101'],
      ['0111', '0100'],
    ];
    vectors.forEach((pair) => {
      expect(processCode(pair[0]!, 'bin2gray').output).toBe(pair[1]);
    });
  });

  it('handles single bit and wider bit patterns', () => {
    expect(processCode('0', 'bin2gray').output).toBe('0');
    expect(processCode('1', 'bin2gray').output).toBe('1');
    expect(processCode('110110', 'bin2gray').output).toBe('101101');
  });

  it('supports BigInt-width input beyond 32/53 bits', () => {
    const allOnes = processCode('1'.repeat(80), 'bin2gray');
    expect(allOnes.output).toBe(`1${'0'.repeat(79)}`);
    expect(allOnes.decimal).not.toBe('');
    expect(allOnes.hex).toHaveLength(20);

    const alternating = processCode('10'.repeat(40), 'bin2gray');
    expect(alternating.output).toBe('1'.repeat(80));
  });

  it('tolerates spaces, underscores and 0b prefix', () => {
    expect(processCode('0b0111', 'bin2gray').output).toBe('0100');
    expect(processCode(' 0111 \n', 'bin2gray').output).toBe('0100');
    expect(processCode('01_11', 'bin2gray').output).toBe('0100');
  });

  it('reports decimal and hex counterparts', () => {
    const result = processCode('1101', 'bin2gray'); // G=1011 = 11 = B
    expect(result.output).toBe('1011');
    expect(result.decimal).toBe('11');
    expect(result.hex).toBe('B');
  });

  it('builds per-bit derivation steps', () => {
    const result = processCode('0111', 'bin2gray');
    expect(result.steps).toHaveLength(4);
    expect(result.steps[0]!.reason).toMatch(/最高位直接保留/);
    expect(result.steps[3]!.reason).toBe('G0 = B0 xor B1 = 1 xor 1 = 0');
  });

  it('returns readable errors', () => {
    expect(processCode('', 'bin2gray').error).toMatch(/不能为空/);
    expect(processCode('012', 'bin2gray').error).toMatch(/只接受二进制/);
  });
});

describe('processCode gray2bin', () => {
  it('inverts the known sequence', () => {
    const vectors: Array<[string, string]> = [
      ['0000', '0000'],
      ['0001', '0001'],
      ['0011', '0010'],
      ['0010', '0011'],
      ['0110', '0100'],
      ['0111', '0101'],
      ['0101', '0110'],
      ['0100', '0111'],
    ];
    vectors.forEach((pair) => {
      expect(processCode(pair[0]!, 'gray2bin').output).toBe(pair[1]);
    });
  });

  it('round-trips arbitrary bit strings', () => {
    ['101101001010', '1', '0', '10000000000000000000000000000000000000000'].forEach((bits) => {
      const gray = processCode(bits, 'bin2gray').output;
      expect(processCode(gray, 'gray2bin').output).toBe(bits);
    });
  });

  it('rejects non-binary input', () => {
    expect(processCode('10x', 'gray2bin').error).toMatch(/只接受二进制/);
  });
});

describe('processLines', () => {
  it('processes multiple lines and keeps blank lines', () => {
    const result = processLines('0001\n\n0111', 'bin2gray');
    expect(result.output).toBe('0001\n\n0100');
    expect(result.warnings).toEqual([]);
  });

  it('flags invalid lines with line numbers', () => {
    const result = processLines('0001\n12\n0111', 'bin2gray');
    expect(result.output.split('\n')[1]).toBe('12');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/第 2 行/);
  });
});
