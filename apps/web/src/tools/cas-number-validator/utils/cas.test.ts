import { describe, it, expect } from 'vitest';
import { computeCasCheckDigit, normalizeCasInput, processCas, processCasLines } from './cas';

describe('computeCasCheckDigit', () => {
  it('matches official CAS vectors', () => {
    // 水 7732-18-5
    expect(computeCasCheckDigit('773218')).toBe('5');
    // 乙醇 64-17-5
    expect(computeCasCheckDigit('6417')).toBe('5');
    // 咖啡因 58-08-2
    expect(computeCasCheckDigit('5808')).toBe('2');
    // 阿司匹林 50-78-2
    expect(computeCasCheckDigit('5078')).toBe('2');
    // 氯化钠 7647-14-5
    expect(computeCasCheckDigit('764714')).toBe('5');
  });
});

describe('normalizeCasInput', () => {
  it('removes whitespace and converts full-width digits/hyphens', () => {
    expect(normalizeCasInput(' 7732-18-5 ')).toBe('7732-18-5');
    expect(normalizeCasInput('７７３２－１８－５')).toBe('7732-18-5');
    expect(normalizeCasInput('7732\u300018\u00a05').replace(/\u3000|\u00a0/g, '')).toBe(
      '7732185',
    );
  });
});

describe('processCas validate mode', () => {
  it('accepts all official vectors', () => {
    for (const code of ['7732-18-5', '64-17-5', '58-08-2', '50-78-2', '7647-14-5']) {
      const result = processCas(code, 'validate');
      expect(result.valid, code).toBe(true);
      expect(result.output).toBe(code);
      expect(result.error).toBeNull();
    }
  });

  it('rejects a tampered check digit and reports the correct one', () => {
    const result = processCas('7732-18-0', 'validate');
    expect(result.valid).toBe(false);
    expect(result.checkDigit).toBe('5');
    expect(result.output).toBe('7732-18-5');
  });

  it('rejects malformed structures', () => {
    expect(processCas('12-3-4', 'validate').valid).toBe(false);
    expect(processCas('7732-1-5', 'validate').valid).toBe(false);
    expect(processCas('0732-18-5', 'validate').error).toContain('首位不能为 0');
    expect(processCas('abc', 'validate').error).toContain('非数字');
    expect(processCas('', 'validate').error).toBe('内容不能为空');
  });

  it('tolerates spaces and full-width characters', () => {
    const result = processCas('７７３２－１８－５', 'validate');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('7732-18-5');
  });
});

describe('processCas generate mode', () => {
  it('appends the check digit to a two-segment body', () => {
    expect(processCas('7732-18', 'generate').output).toBe('7732-18-5');
    expect(processCas('64-17', 'generate').output).toBe('64-17-5');
  });

  it('corrects a full code with a wrong check digit', () => {
    expect(processCas('58-08-9', 'generate').output).toBe('58-08-2');
  });
});

describe('processCasLines', () => {
  it('validates line by line and counts results', () => {
    const result = processCasLines('7732-18-5\n7732-18-0\n\n64-17-5');
    expect(result.output).toBe('7732-18-5\n7732-18-5\n\n64-17-5');
    expect(result.validCount).toBe(2);
    expect(result.totalCount).toBe(3);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('第 2 行');
  });
});
