import { describe, it, expect } from 'vitest';
import { computeCheckDigit, processCode, processLines } from './ean13';

describe('computeCheckDigit', () => {
  it('matches known EAN-13 vectors', () => {
    expect(computeCheckDigit('590123412345')).toBe('7');
    expect(computeCheckDigit('400638133393')).toBe('1');
  });

  it('matches the UPC-A vector', () => {
    expect(computeCheckDigit('03600029145')).toBe('2');
  });
});

describe('processCode EAN-13', () => {
  it('completes a 12-digit body', () => {
    const result = processCode('590123412345', 'ean13');
    expect(result.output).toBe('5901234123457');
    expect(result.checkDigit).toBe('7');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('accepts a valid 13-digit code', () => {
    const result = processCode('5901234123457', 'ean13');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('5901234123457');

    const second = processCode('4006381333931', 'ean13');
    expect(second.valid).toBe(true);
    expect(second.checkDigit).toBe('1');
  });

  it('rejects a tampered last digit and reports the correct one', () => {
    const result = processCode('5901234123450', 'ean13');
    expect(result.valid).toBe(false);
    expect(result.checkDigit).toBe('7');
    expect(result.error).toMatch(/正确校验位应为 7/);
    expect(result.output).toBe('5901234123457');
  });

  it('tolerates spaces and hyphens', () => {
    const result = processCode('590 1234 12345 7', 'ean13');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('5901234123457');
  });

  it('returns readable errors for non-digits and bad lengths', () => {
    expect(processCode('123', 'ean13').error).toMatch(/长度必须为 12 位/);
    expect(processCode('12345678901234', 'ean13').error).toMatch(/长度必须为/);
    expect(processCode('59012341234a', 'ean13').error).toMatch(/非数字字符/);
    expect(processCode('', 'ean13').error).toMatch(/不能为空/);
  });
});

describe('processCode UPC-A', () => {
  it('completes 11 digits and validates 12 digits', () => {
    const completed = processCode('03600029145', 'upca');
    expect(completed.output).toBe('036000291452');
    expect(completed.checkDigit).toBe('2');

    const valid = processCode('036000291452', 'upca');
    expect(valid.valid).toBe(true);
  });

  it('rejects wrong-length input for UPC-A', () => {
    expect(processCode('5901234123457', 'upca').error).toMatch(/长度必须为 11 位/);
  });
});

describe('processLines', () => {
  it('processes multiple codes and keeps blank lines', () => {
    const result = processLines('590123412345\n\n400638133393', 'ean13');
    expect(result.output).toBe('5901234123457\n\n4006381333931');
    expect(result.warnings).toEqual([]);
  });

  it('flags invalid lines with line numbers', () => {
    const result = processLines('590123412345\n123\n5901234123450', 'ean13');
    const lines = result.output.split('\n');
    expect(lines[0]).toBe('5901234123457');
    expect(lines[1]).toBe('123');
    expect(lines[2]).toBe('5901234123457');
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toMatch(/第 2 行/);
    expect(result.warnings[1]).toMatch(/第 3 行/);
  });

  it('returns empty output for empty input', () => {
    expect(processLines('', 'ean13').output).toBe('');
  });
});
