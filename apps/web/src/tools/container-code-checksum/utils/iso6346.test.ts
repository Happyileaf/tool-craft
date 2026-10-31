import { describe, it, expect } from 'vitest';
import { computeCheckDigit, processCode, processLines } from './iso6346';

describe('computeCheckDigit', () => {
  it('matches the canonical ISO 6346 vector CSQU3054383 -> 3', () => {
    expect(computeCheckDigit('CSQU305438')).toBe('3');
  });

  it('covers letters after skipped multiples (L=23, V=34)', () => {
    // 仅验证不抛异常且为单个数字
    expect(computeCheckDigit('VLXV000000')).toMatch(/^\d$/);
  });
});

describe('processCode', () => {
  it('completes a 10-character body', () => {
    const result = processCode('CSQU305438');
    expect(result.output).toBe('CSQU3054383');
    expect(result.checkDigit).toBe('3');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('accepts a valid 11-character code', () => {
    const result = processCode('CSQU3054383');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('CSQU3054383');
    expect(result.givenDigit).toBe('3');
  });

  it('rejects a tampered check digit and reports the correct one', () => {
    const result = processCode('CSQU3054380');
    expect(result.valid).toBe(false);
    expect(result.checkDigit).toBe('3');
    expect(result.output).toBe('CSQU3054383');
    expect(result.error).toMatch(/校验位不正确/);
  });

  it('tolerates lowercase, spaces and hyphens', () => {
    const result = processCode('csqu 305438-3');
    expect(result.valid).toBe(true);
    expect(result.output).toBe('CSQU3054383');
  });

  it('produces ten weighted steps with 2^i weights', () => {
    const result = processCode('CSQU305438');
    expect(result.steps).toHaveLength(10);
    expect(result.steps[0]?.weight).toBe(1);
    expect(result.steps[1]?.weight).toBe(2);
    expect(result.steps[9]?.weight).toBe(512);
    expect(result.steps[0]?.char).toBe('C');
    expect(result.steps[0]?.value).toBe(13);
    expect(result.steps[4]?.char).toBe('3');
    expect(result.steps[4]?.value).toBe(3);
    const total = result.steps.reduce((acc, s) => acc + s.contribution, 0);
    expect(total).toBe(result.sum);
    expect(result.sum % 11).toBe(3);
  });

  it('notices non-standard category letters but still computes', () => {
    const result = processCode('CSQX3054383');
    expect(result.notices.some((n) => n.includes('U / J / Z'))).toBe(true);
  });

  it('returns readable errors for bad chars and bad lengths', () => {
    expect(processCode('', ).error).toMatch(/不能为空/);
    expect(processCode('CSQ305438').error).toMatch(/长度必须为/);
    expect(processCode('CSQU30543833').error).toMatch(/长度必须为/);
    expect(processCode('1SQU3054383').error).toMatch(/第 1 位/);
    expect(processCode('CSQUT054383').error).toMatch(/第 5 位/);
    expect(processCode('CSQU305438A').error).toMatch(/第 11 位校验位/);
  });
});

describe('processLines', () => {
  it('processes multiple codes and keeps blank lines', () => {
    const result = processLines('CSQU305438\n\nCSQU3054383');
    expect(result.output).toBe('CSQU3054383\n\nCSQU3054383');
    expect(result.warnings).toEqual([]);
  });

  it('flags invalid lines with line numbers and keeps first detail', () => {
    const result = processLines('CSQU3054383\n123\nCSQU3054380');
    const lines = result.output.split('\n');
    expect(lines[0]).toBe('CSQU3054383');
    expect(lines[1]).toBe('123');
    expect(lines[2]).toBe('CSQU3054383');
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toMatch(/第 2 行/);
    expect(result.warnings[1]).toMatch(/第 3 行/);
    expect(result.detailLine).toBe(1);
    expect(result.detail?.steps).toHaveLength(10);
  });

  it('returns empty output for empty input', () => {
    const result = processLines('');
    expect(result.output).toBe('');
    expect(result.detail).toBeNull();
  });
});
