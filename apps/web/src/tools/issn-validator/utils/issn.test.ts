import { describe, it, expect } from 'vitest';
import {
  computeCheckDigit,
  validateIssn,
  completeIssn,
  validateBatch,
  normalizeDigits,
} from './issn';

describe('computeCheckDigit mod-11 rule', () => {
  it('returns 5 for prefix 0378595 (ISSN 0378-5955)', () => {
    expect(computeCheckDigit('0378595')).toBe('5');
  });

  it('returns X when remainder maps to 10 (prefix 1000002, sum mod 11 = 1)', () => {
    expect(computeCheckDigit('1000002')).toBe('X');
  });

  it('returns 0 when remainder maps to 11 (prefix 1000007, sum mod 11 = 0)', () => {
    expect(computeCheckDigit('1000007')).toBe('0');
  });
});

describe('validateIssn', () => {
  it('accepts the authoritative valid number with normalized form', () => {
    const r = validateIssn('0378-5955');
    expect(r.ok).toBe(true);
    expect(r.normalized).toBe('0378-5955');
    expect(r.checkDigit).toBe('5');
    expect(r.error).toBeNull();
  });

  it('accepts a valid X-check number and tolerates spaces and lowercase x', () => {
    expect(validateIssn('1000-002X').ok).toBe(true);
    expect(validateIssn('1000 002X').normalized).toBe('1000-002X');
    const lower = validateIssn('1000-002x');
    expect(lower.ok).toBe(true);
    expect(lower.normalized).toBe('1000-002X');
  });

  it('rejects a wrong check digit and reports the expected one', () => {
    const r = validateIssn('0378-5950');
    expect(r.ok).toBe(false);
    expect(r.expectedCheckDigit).toBe('5');
    expect(r.error).toContain('期望为 5');
  });

  it('rejects illegal characters and wrong lengths without throwing', () => {
    expect(validateIssn('0378-595A').error).toContain('校验位');
    expect(validateIssn('0378595').error).toContain('8 位');
    expect(validateIssn('037859555').error).toContain('8 位');
    expect(validateIssn('').error).toContain('为空');
    expect(validateIssn('03A8-5955').error).toContain('数字');
  });
});

describe('completeIssn', () => {
  it('completes a 7-digit prefix into standard form', () => {
    const r = completeIssn('0378595');
    expect(r.ok).toBe(true);
    expect(r.normalized).toBe('0378-5955');
    expect(r.checkDigit).toBe('5');
  });

  it('supports hyphenated 7-digit input and X/0 boundaries', () => {
    expect(completeIssn('1000002').normalized).toBe('1000-002X');
    expect(completeIssn('1000007').normalized).toBe('1000-0070');
    expect(completeIssn('037-8595').normalized).toBe('0378-5955');
  });

  it('rejects bad prefix length or non-digits', () => {
    expect(completeIssn('123456').error).toContain('7 位');
    expect(completeIssn('123456X').error).toContain('数字');
  });
});

describe('validateBatch', () => {
  it('labels each line, skips blanks and aggregates counts', () => {
    const result = validateBatch('0378-5955\n\n1000-002X\nbad-row\n03785950\n');
    expect(result.total).toBe(4);
    expect(result.valid).toBe(2);
    expect(result.invalid).toBe(2);
    expect(result.rows[0]?.index).toBe(1);
    expect(result.rows[1]?.raw).toBe('1000-002X');
    expect(result.rows[2]?.error).toContain('8 位');
    expect(result.rows[3]?.expectedCheckDigit).toBe('5');
  });

  it('returns zeroed stats for empty input', () => {
    const result = validateBatch('\n  \n');
    expect(result.rows).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.valid).toBe(0);
    expect(result.invalid).toBe(0);
  });
});

describe('normalizeDigits', () => {
  it('strips spaces and hyphens and uppercases x', () => {
    expect(normalizeDigits(' 1000-002x ')).toBe('1000002X');
  });
});
