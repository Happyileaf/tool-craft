import { describe, it, expect } from 'vitest';
import { encodeWord, processLines } from './soundex';

describe('encodeWord standard vectors', () => {
  it('matches the classic US Census / NARA test vectors', () => {
    const vectors: Array<[string, string]> = [
      ['Robert', 'R163'],
      ['Rupert', 'R163'],
      ['Rubin', 'R150'],
      ['Ashcraft', 'A261'],
      ['Ashcroft', 'A261'],
      ['Tymczak', 'T522'],
      ['Pfister', 'P236'],
      ['Honeyman', 'H555'],
    ];
    vectors.forEach(([word, expected]) => {
      expect(encodeWord(word).code).toBe(expected);
    });
  });

  it('pads codes shorter than 4 digits with zeros', () => {
    expect(encodeWord('Lee').code).toBe('L000');
    expect(encodeWord('A').code).toBe('A000');
  });

  it('truncates codes beyond 4 positions', () => {
    // Washington: W-252 (S removed adjacent, H skipped, N=5, G=2, T=3 → W2523 → W252)
    expect(encodeWord('Washington').code).toBe('W252');
  });

  it('merges same-code consonants separated only by H or W', () => {
    // Jackson: J-A-C-K-S-O-N → J250（C/K/S 相邻同音合并为 2）
    expect(encodeWord('Jackson').code).toBe('J250');
  });

  it('treats vowels (including Y) as separators that reset merging', () => {
    expect(encodeWord('Tymczak').code).toBe('T522');
  });

  it('is case-insensitive and ignores non-letter characters', () => {
    expect(encodeWord('robert').code).toBe('R163');
    expect(encodeWord('O’Conner').code).toBe(encodeWord('OConner').code);
    expect(encodeWord('  ash-craft ').code).toBe('A261');
  });

  it('returns a readable error for input without letters', () => {
    const result = encodeWord('123 !!!');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/字母/);
  });

  it('builds per-character derivation steps', () => {
    const result = encodeWord('Lee');
    // L 保留 + 两个 E + 最终补零步骤
    expect(result.steps.length).toBe(4);
    expect(result.steps[result.steps.length - 1]!.reason).toMatch(/补 0/);
  });
});

describe('processLines', () => {
  it('encodes every whitespace-separated token and keeps blank lines', () => {
    const result = processLines('Robert Rupert\n\nAshcraft');
    expect(result.output).toBe('R163 R163\n\nA261');
    expect(result.warnings).toEqual([]);
  });

  it('groups words sharing the same code', () => {
    const result = processLines('Robert\nRupert\nLee');
    const r163 = result.groups.find((group) => group.code === 'R163');
    expect(r163?.words).toEqual(['ROBERT', 'RUPERT']);
  });

  it('flags tokens without letters with line numbers and keeps them as-is', () => {
    const result = processLines('Robert\n123\nLee');
    expect(result.output.split('\n')[1]).toBe('123');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/第 2 行/);
  });
});
