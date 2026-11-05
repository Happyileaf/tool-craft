import { describe, it, expect } from 'vitest';
import { compressUpcA, expandUpcE, convertBatch, mod10CheckDigit } from './upcE';

describe('mod10CheckDigit', () => {
  it('computes the UPC-A mod-10 check digit (odd positions weighted 3)', () => {
    expect(mod10CheckDigit('01200000345')).toBe('5');
    expect(mod10CheckDigit('03600029145')).toBe('2');
  });
});

describe('expandUpcE (UPC-E → UPC-A)', () => {
  it('expands mode 0/1/2 codes (M = X1X2X600, I = 00X3X4X5)', () => {
    expect(expandUpcE('0123450').output).toBe('012000003455');
    expect(expandUpcE('0123451').output).toBe('012100003454');
    expect(expandUpcE('0123452').output).toBe('012200003453');
  });

  it('expands mode 3 (M = X100X20)', () => {
    const result = expandUpcE('0123453');
    expect(result.valid).toBe(true);
    expect(result.output.slice(0, 11)).toBe('01002000345');
  });

  it('expands mode 4 (M = X1X2000, X1 ∈ {5,6})', () => {
    const result = expandUpcE('0523454');
    expect(result.valid).toBe(true);
    expect(result.output.slice(0, 11)).toBe('05200000345');
  });

  it('expands modes 5..9 (M = X1..X5, I = 0000X6)', () => {
    expect(expandUpcE('0123455').output).toBe('012345000058');
    expect(expandUpcE('0123459').output).toBe('012345000096');
  });

  it('always produces a 12-digit UPC-A', () => {
    for (let mode = 0; mode <= 9; mode += 1) {
      const x = mode === 4 ? '523454' : `12345${mode}`;
      const result = expandUpcE(`0${x}`);
      expect(result.output).toHaveLength(12);
    }
  });

  it('rejects a wrong check digit on 8-digit input', () => {
    const result = expandUpcE('01234500');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/校验位/);
  });

  it('rejects invalid length, non-numeric input and number system 2..9', () => {
    expect(expandUpcE('12345').error).toMatch(/7 位|8 位/);
    expect(expandUpcE('abcdefgh').error).toMatch(/数字/);
    expect(expandUpcE('21234505').error).toMatch(/编号系统位/);
  });
});

describe('compressUpcA (UPC-A → UPC-E)', () => {
  it('compresses mode 0/1/2 patterns and is the exact inverse of expand', () => {
    expect(compressUpcA('012000003455').output).toBe('01234505');
    expect(compressUpcA('012100003454').output).toBe('01234514');
    expect(compressUpcA('012200003453').output).toBe('01234523');
  });

  it('compresses mode 3 and mode 4 patterns', () => {
    expect(compressUpcA('010020003455').output).toBe('01234535');
    expect(compressUpcA('052000003451').output).toBe('05234541');
  });

  it('compresses modes 5..9 patterns', () => {
    expect(compressUpcA('012345000058').output).toBe('01234558');
    expect(compressUpcA('012345000096').output).toBe('01234596');
  });

  it('accepts 11-digit input without check digit', () => {
    expect(compressUpcA('01234500005').output).toBe('01234558');
  });

  it('rejects non-compressible UPC-A with a clear reason', () => {
    // 校验位合法，但厂商码与产品码的零串布局不符合任何 UPC-E 压缩模式
    const result = compressUpcA('076999003452');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/不满足 UPC-E/);
  });

  it('rejects number system 2..9 and a wrong check digit', () => {
    expect(compressUpcA('212345000058').error).toMatch(/编号系统位/);
    expect(compressUpcA('012345000050').error).toMatch(/校验位/);
  });

  it('round-trips every mode: expand(compress(x)) === x', () => {
    const samples = [
      '012000003455',
      '012100003454',
      '012200003453',
      '010020003455',
      '052000003451',
      '012345000058',
      '012345000065',
      '012345000072',
      '012345000089',
      '012345000096',
    ];
    for (const sample of samples) {
      const compressed = compressUpcA(sample);
      expect(compressed.valid, sample).toBe(true);
      expect(expandUpcE(compressed.output).output, sample).toBe(sample);
    }
  });
});

describe('convertBatch', () => {
  it('processes multiple lines and skips blanks', () => {
    const results = convertBatch('012000003455\n\n012345000058\n', 'a-to-e');
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.valid)).toBe(true);
    expect(results[0]!.output).toBe('01234505');
    expect(results[1]!.output).toBe('01234558');
  });
});
