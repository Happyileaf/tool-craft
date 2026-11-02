import { describe, it, expect } from 'vitest';
import {
  computeIsinCheckDigit,
  expandChar,
  normalizeIsinInput,
  processIsin,
  processIsinLines,
} from './isin';

describe('normalizeIsinInput', () => {
  it('uppercases and strips separators and full-width digits', () => {
    expect(normalizeIsinInput(' us-0378 331005 ')).toBe('US0378331005');
    expect(normalizeIsinInput('ＵＳ０３７８３３１００５')).toBe('US0378331005');
  });
});

describe('expandChar', () => {
  it('keeps digits and maps A=10 … Z=35', () => {
    expect(expandChar('0')).toBe('0');
    expect(expandChar('9')).toBe('9');
    expect(expandChar('A')).toBe('10');
    expect(expandChar('U')).toBe('30');
    expect(expandChar('S')).toBe('28');
    expect(expandChar('Z')).toBe('35');
  });
});

describe('computeIsinCheckDigit', () => {
  it('matches official ISO examples', () => {
    // Apple Inc.
    expect(computeIsinCheckDigit('US037833100')).toBe('5');
    // BP
    expect(computeIsinCheckDigit('GB000263494')).toBe('6');
    // Intel
    expect(computeIsinCheckDigit('US458140100')).toBe('1');
    // Bayer (字母主体)
    expect(computeIsinCheckDigit('DE000BAY001')).toBe('7');
  });
});

describe('processIsin', () => {
  it('accepts the canonical Apple ISIN US0378331005', () => {
    const result = processIsin('US0378331005');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.givenCheck).toBe('5');
    expect(result.expectedCheck).toBe('5');
    // U=30 S=28 展开后数字串
    expect(result.expanded).toBe('3028037833100');
  });

  it('accepts other well-known valid ISINs', () => {
    expect(processIsin('GB0002634946').valid).toBe(true);
    expect(processIsin('US4581401001').valid).toBe(true);
    expect(processIsin('DE000BAY0017').valid).toBe(true);
    expect(processIsin('FR0000131906').valid).toBe(true);
  });

  it('rejects XS9135527440 with the corrected check digit 8', () => {
    const result = processIsin('XS9135527440');
    expect(result.valid).toBe(false);
    expect(result.expectedCheck).toBe('8');
    expect(result.error).toContain('校验位');
  });

  it('rejects malformed length, characters, and prefix', () => {
    expect(processIsin('US037833100').error).toContain('12 位');
    expect(processIsin('1S0378331005').error).toContain('ISO 6166');
    expect(processIsin('US037833100A').error).toContain('ISO 6166');
    expect(processIsin('').error).toContain('不能为空');
  });

  it('generate mode completes an 11-character body', () => {
    const result = processIsin('US037833100', 'generate');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('US0378331005');
  });

  it('generate mode corrects a wrong check digit without warning', () => {
    const result = processIsin('XS9135527440', 'generate');
    expect(result.error).toBeNull();
    expect(result.normalized).toBe('XS9135527448');
  });
});

describe('processIsinLines', () => {
  it('batch validates multiple codes with per-line warnings', () => {
    const batch = processIsinLines('US0378331005\nGB0002634946\nXS9135527440\n');
    expect(batch.totalCount).toBe(3);
    expect(batch.validCount).toBe(2);
    expect(batch.output.split('\n')).toEqual([
      'US0378331005',
      'GB0002634946',
      'XS9135527440',
      '',
    ]);
    expect(batch.warnings.length).toBe(1);
    expect(batch.warnings[0]).toContain('第 3 行');
  });
});
