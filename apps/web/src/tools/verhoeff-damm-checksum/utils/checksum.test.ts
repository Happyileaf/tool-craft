import { describe, it, expect } from 'vitest';
import { computeCheckDigit, processCode, processLines } from './checksum';

describe('Verhoeff computeCheckDigit', () => {
  it('matches the documented vectors (123 -> 3, 12345 -> 1)', () => {
    expect(computeCheckDigit('123', 'verhoeff')).toBe('3');
    expect(computeCheckDigit('12345', 'verhoeff')).toBe('1');
  });

  it('round-trips: appending the check digit validates', () => {
    for (const body of ['236', '12345678901', '590123412345', '0', '999999']) {
      const full = body + computeCheckDigit(body, 'verhoeff');
      expect(processCode(full, 'verhoeff', 'validate').valid).toBe(true);
    }
  });

  it('returns 0 for the empty body', () => {
    expect(computeCheckDigit('', 'verhoeff')).toBe('0');
  });
});

describe('Damm computeCheckDigit', () => {
  it('matches the published vector (572 -> 4)', () => {
    expect(computeCheckDigit('572', 'damm')).toBe('4');
  });

  it('round-trips arbitrary bodies', () => {
    for (const body of ['123', '12345', '572', '0000', '9876543210']) {
      const full = body + computeCheckDigit(body, 'damm');
      expect(processCode(full, 'damm', 'validate').valid).toBe(true);
    }
  });

  it('detects an adjacent transposition of two differing digits', () => {
    // 5724 为合法编码，将前两位 5、7 换位得 7524，校验必须失败
    expect(processCode('5724', 'damm', 'validate').valid).toBe(true);
    expect(processCode('7524', 'damm', 'validate').valid).toBe(false);
  });
});

describe('processCode generate mode', () => {
  it('appends the check digit to every body', () => {
    expect(processCode('123', 'verhoeff', 'generate').output).toBe('1233');
    expect(processCode('12345', 'verhoeff', 'generate').output).toBe('123451');
    expect(processCode('572', 'damm', 'generate').output).toBe('5724');
  });

  it('treats a single digit as a body and appends a check digit', () => {
    // body='0' 占据位置 1，校验位 inv(p(1,0)) = inv(1) = 4
    const result = processCode('0', 'verhoeff', 'generate');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('04');
    expect(processCode('04', 'verhoeff', 'validate').valid).toBe(true);
  });

  it('tolerates spaces and hyphens', () => {
    const result = processCode('123-45 ', 'verhoeff', 'generate');
    expect(result.output).toBe('123451');
    expect(result.error).toBeNull();
  });

  it('returns readable errors for empty and non-digit input', () => {
    expect(processCode('   ', 'verhoeff', 'generate').error).toMatch(/不能为空/);
    expect(processCode('12a3', 'damm', 'generate').error).toMatch(/非数字字符/);
  });
});

describe('processCode validate mode', () => {
  it('accepts a valid code and echoes it', () => {
    const result = processCode('1233', 'verhoeff', 'validate');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('1233');
    expect(result.checkDigit).toBe('3');
  });

  it('flags a wrong check digit and suggests the correct code', () => {
    const result = processCode('1230', 'verhoeff', 'validate');
    expect(result.valid).toBe(false);
    expect(result.checkDigit).toBe('3');
    expect(result.output).toBe('1233');
    expect(result.error).toMatch(/正确校验位应为 3/);
  });

  it('accepts a valid grouped code with spaces and hyphens', () => {
    const result = processCode('123-45 1', 'verhoeff', 'validate');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('123451');
  });

  it('handles the single-digit code 0 (its own check digit)', () => {
    const result = processCode('0', 'verhoeff', 'validate');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('0');
  });

  it('validates Damm vectors', () => {
    expect(processCode('5724', 'damm', 'validate').valid).toBe(true);
    expect(processCode('5720', 'damm', 'validate').valid).toBe(false);
  });
});

describe('processLines', () => {
  it('generates check digits in batch and keeps blank lines', () => {
    const result = processLines('123\n\n12345', 'verhoeff', 'generate');
    expect(result.output).toBe('1233\n\n123451');
    expect(result.warnings).toEqual([]);
  });

  it('flags invalid lines with line numbers in validate mode', () => {
    const result = processLines('1233\nabc\n1230', 'verhoeff', 'validate');
    const lines = result.output.split('\n');
    expect(lines[0]).toBe('1233');
    expect(lines[1]).toBe('abc');
    expect(lines[2]).toBe('1233');
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toMatch(/第 2 行/);
    expect(result.warnings[1]).toMatch(/第 3 行/);
  });

  it('returns empty output for empty input', () => {
    expect(processLines('', 'verhoeff', 'generate').output).toBe('');
  });
});
