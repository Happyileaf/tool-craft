import { describe, it, expect } from 'vitest';
import {
  computeCheckDigit,
  isValidDate,
  processCode,
  processLines,
} from './id-card';

describe('isValidDate', () => {
  it('handles leap years', () => {
    expect(isValidDate(2000, 2, 29)).toBe(true);
    expect(isValidDate(2020, 2, 29)).toBe(true);
    expect(isValidDate(1900, 2, 29)).toBe(false);
    expect(isValidDate(2021, 2, 29)).toBe(false);
    expect(isValidDate(2021, 4, 31)).toBe(false);
    expect(isValidDate(2021, 12, 31)).toBe(true);
    expect(isValidDate(2021, 0, 1)).toBe(false);
    expect(isValidDate(2021, 13, 1)).toBe(false);
  });
});

describe('computeCheckDigit', () => {
  it('matches known vectors', () => {
    // 110105 1949 12 31 801 -> check digit 3
    expect(computeCheckDigit('11010519491231801')).toBe('3');
    // 440103 1990 03 07 246 -> check digit 2
    expect(computeCheckDigit('44010319900307246')).toBe('2');
    // X check-digit vector: 110101 2021 02 29 001 -> check digit X
    expect(computeCheckDigit('11010520210229001')).toBe('X');
  });
});

describe('processCode 18-digit', () => {
  it('accepts a valid code and parses fields', () => {
    const result = processCode('110105194912318013');
    expect(result.valid).toBe(true);
    expect(result.upgraded).toBe(false);
    expect(result.normalized).toBe('110105194912318013');
    expect(result.info?.birthDate).toBe('1949-12-31');
    expect(result.info?.gender).toBe('男');
    expect(result.info?.regionCode).toBe('110105');
    expect(result.error).toBeNull();
  });

  it('accepts an uppercase-X check digit and detects female gender', () => {
    // 110101 2000-02-29（闰年合法）顺序码 000，校验码 X，末位 0 偶 → 女
    const result = processCode('11010120000229000X');
    expect(result.valid).toBe(true);
    expect(result.info?.gender).toBe('女');
    expect(result.info?.birthDate).toBe('2000-02-29');
  });

  it('normalizes lowercase x check digit', () => {
    expect(processCode('11010120000229000x').valid).toBe(true);
  });

  it('rejects a tampered check digit and reports the correct one', () => {
    const result = processCode('110105194912318010');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/正确校验码应为 3/);
    expect(result.normalized).toBe('110105194912318013');
  });

  it('rejects an impossible birth date including leap-year edge cases', () => {
    // 2021、1900 非闰年，2 月 29 日不存在（校验码虽匹配仍判非法）
    expect(processCode('11010520210229001X').error).toMatch(/不是合法日期/);
    expect(processCode('110105190002290017').error).toMatch(/不是合法日期/);
    // 2020 为闰年，2 月 29 日合法（该体校验码为 2）
    expect(processCode('110105202002290012').error).toBeNull();
  });

  it('returns readable errors for bad length and characters', () => {
    expect(processCode('123').error).toMatch(/长度必须为 15 位/);
    expect(processCode('1101051949123180').error).toMatch(/长度必须为 15 位/);
    expect(processCode('11010519491231801A').error).toMatch(/前 17 位必须为数字/);
    expect(processCode('').error).toMatch(/不能为空/);
  });

  it('tolerates spaces', () => {
    expect(processCode('110105 19491231 8013').valid).toBe(true);
  });
});

describe('processCode 15-digit upgrade', () => {
  it('upgrades a legacy 15-digit code to 18 digits', () => {
    // 15 位本体 110105491231801：1949-12-31，顺序码 801（奇 → 男）
    const result = processCode('110105491231801');
    expect(result.valid).toBe(true);
    expect(result.upgraded).toBe(true);
    expect(result.normalized).toBe('110105194912318013');
    expect(result.info?.birthDate).toBe('1949-12-31');
    expect(result.info?.gender).toBe('男');
    // 升位结果再校验通过
    expect(processCode(result.normalized).valid).toBe(true);
  });

  it('rejects non-numeric 15-digit input and impossible date', () => {
    expect(processCode('11010549123180X').error).toMatch(/15 位旧证号码必须全部为数字/);
    expect(processCode('110105490231801').error).toMatch(/不是合法日期/);
  });
});

describe('processLines', () => {
  it('processes multiple codes and keeps blank lines', () => {
    const result = processLines('110105194912318013\n\n110105491231801');
    expect(result.warnings).toEqual([]);
    expect(result.output).toContain('校验通过');
    expect(result.output).toContain('已升位');
  });

  it('flags invalid lines with line numbers', () => {
    const result = processLines('110105194912318013\n123\n110105490231801');
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toMatch(/第 2 行/);
    expect(result.warnings[1]).toMatch(/第 3 行/);
    // 非法行原样保留
    expect(result.output.split('\n')[1]).toBe('123');
  });
});
