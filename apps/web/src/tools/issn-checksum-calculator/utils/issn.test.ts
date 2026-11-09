import { describe, it, expect } from 'vitest';
import { computeCheckDigit, formatIssn, processIssn, processLines } from './issn';

describe('computeCheckDigit', () => {
  it('matches known ISSN vectors', () => {
    // 0378-5955（Nature 印刷版）
    expect(computeCheckDigit('0378595')).toBe('5');
    // 2049-3630（Science Advances）
    expect(computeCheckDigit('2049363')).toBe('0');
  });

  it('returns X when the mod-11 complement is 10', () => {
    // 构造向量：加权和模 11 余 1，补码为 10 -> X
    expect(computeCheckDigit('2049369')).toBe('X');
  });

  it('returns 0 when the weighted sum is a multiple of 11', () => {
    expect(computeCheckDigit('2049363')).toBe('0');
  });
});

describe('processIssn 7 位补全模式', () => {
  it('completes a 7-digit body with the standard hyphen format', () => {
    const result = processIssn('0378595');
    expect(result.output).toBe('0378-5955');
    expect(result.checkDigit).toBe('5');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('appends X and formats NNNN-NNNN when the complement is 10', () => {
    const result = processIssn('2049369');
    expect(result.output).toBe('2049-369X');
    expect(result.checkDigit).toBe('X');
    expect(result.valid).toBe(true);
  });

  it('tolerates spaces and hyphens in a 7-digit body', () => {
    const result = processIssn('0378-595');
    expect(result.output).toBe('0378-5955');
    expect(result.valid).toBe(true);
  });
});

describe('processIssn 8 位校验模式', () => {
  it('accepts a valid 8-digit ISSN and normalizes the format', () => {
    const result = processIssn('0378-5955');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('0378-5955');
    expect(result.checkDigit).toBe('5');
  });

  it('accepts a lower-case x and outputs an upper-case X', () => {
    const lower = processIssn('2049369x');
    expect(lower.valid).toBe(true);
    expect(lower.output).toBe('2049-369X');
    expect(lower.checkDigit).toBe('X');

    const upper = processIssn('2049-369X');
    expect(upper.valid).toBe(true);
    expect(upper.output).toBe('2049-369X');
  });

  it('accepts an ISSN whose check digit is 0', () => {
    const result = processIssn('20493630');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('2049-3630');
    expect(result.checkDigit).toBe('0');
  });

  it('rejects a tampered check digit and reports the corrected ISSN', () => {
    const result = processIssn('03785957');
    expect(result.valid).toBe(false);
    expect(result.checkDigit).toBe('5');
    expect(result.error).toMatch(/正确校验位应为 5/);
    expect(result.error).toMatch(/0378-5955/);
    expect(result.output).toBe('0378-5955');
  });
});

describe('processIssn 非法输入', () => {
  it('rejects letters other than a trailing X', () => {
    const result = processIssn('0378595A');
    expect(result.valid).toBe(false);
    expect(result.output).toBe('');
    expect(result.error).toMatch(/非法字符/);
  });

  it('rejects an X placed outside the last position', () => {
    const result = processIssn('0378X955');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/X 只能出现在末位/);
  });

  it('rejects wrong lengths and empty input', () => {
    expect(processIssn('123').error).toMatch(/长度必须为 7 位/);
    expect(processIssn('037859555').error).toMatch(/长度必须为/);
    expect(processIssn('').error).toMatch(/不能为空/);
  });
});

describe('formatIssn', () => {
  it('inserts the hyphen after the fourth character', () => {
    expect(formatIssn('03785955')).toBe('0378-5955');
    expect(formatIssn('2049369X')).toBe('2049-369X');
  });
});

describe('processLines 批量处理', () => {
  it('processes multiple ISSNs and keeps blank lines', () => {
    const result = processLines('0378595\n\n20493630');
    expect(result.output).toBe('0378-5955\n\n2049-3630');
    expect(result.warnings).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('flags invalid lines with line numbers and preserves the raw line', () => {
    const result = processLines('0378595\nABC\n03785957\n2049369x');
    const lines = result.output.split('\n');
    expect(lines[0]).toBe('0378-5955');
    expect(lines[1]).toBe('ABC');
    expect(lines[2]).toBe('0378-5955');
    expect(lines[3]).toBe('2049-369X');
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toMatch(/第 2 行/);
    expect(result.warnings[1]).toMatch(/第 3 行/);
  });

  it('returns empty output for empty input', () => {
    expect(processLines('').output).toBe('');
  });
});
