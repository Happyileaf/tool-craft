import { describe, it, expect } from 'vitest';
import {
  columnToNumber,
  numberToColumn,
  convertLine,
  convertLines,
  EXCEL_MAX_COLUMN,
} from './excel-column';

describe('columnToNumber', () => {
  it('converts basic letters to numbers', () => {
    expect(columnToNumber('A')).toBe(1);
    expect(columnToNumber('B')).toBe(2);
    expect(columnToNumber('Z')).toBe(26);
    expect(columnToNumber('AA')).toBe(27);
    expect(columnToNumber('AZ')).toBe(52);
    expect(columnToNumber('ZZ')).toBe(702);
    expect(columnToNumber('AAA')).toBe(703);
    expect(columnToNumber('XFD')).toBe(16384);
  });

  it('is case-insensitive and tolerates surrounding whitespace', () => {
    expect(columnToNumber('aa')).toBe(27);
    expect(columnToNumber('aa')).toBe(columnToNumber('AA'));
    expect(columnToNumber('  z  ')).toBe(26);
    expect(columnToNumber('xfd')).toBe(16384);
  });

  it('throws on invalid letters', () => {
    expect(() => columnToNumber('')).toThrow(/不能为空/);
    expect(() => columnToNumber('A1')).toThrow(/不是合法列名/);
    expect(() => columnToNumber('12')).toThrow(/不是合法列名/);
    expect(() => columnToNumber('A B')).toThrow(/不是合法列名/);
  });

  it('throws beyond the Excel max column', () => {
    expect(() => columnToNumber('XFE')).toThrow(new RegExp(String(EXCEL_MAX_COLUMN)));
  });
});

describe('numberToColumn', () => {
  it('converts numbers to letters', () => {
    expect(numberToColumn(1)).toBe('A');
    expect(numberToColumn(26)).toBe('Z');
    expect(numberToColumn(27)).toBe('AA');
    expect(numberToColumn(52)).toBe('AZ');
    expect(numberToColumn(702)).toBe('ZZ');
    expect(numberToColumn(703)).toBe('AAA');
    expect(numberToColumn(16384)).toBe('XFD');
  });

  it('round-trips against columnToNumber', () => {
    for (const value of [1, 2, 25, 26, 27, 28, 701, 702, 703, 16384]) {
      expect(columnToNumber(numberToColumn(value))).toBe(value);
    }
  });

  it('throws on out-of-range or non-integer input', () => {
    expect(() => numberToColumn(0)).toThrow(/从 1 开始/);
    expect(() => numberToColumn(-1)).toThrow(/从 1 开始/);
    expect(() => numberToColumn(16385)).toThrow(/超出 Excel 最大列/);
    expect(() => numberToColumn(1.5)).toThrow(/整数/);
  });
});

describe('convertLine', () => {
  it('converts in both directions', () => {
    expect(convertLine('AA', 'toNumber')).toEqual({ output: '27', error: null });
    expect(convertLine('  xfd ', 'toNumber')).toEqual({ output: '16384', error: null });
    expect(convertLine('703', 'toColumn')).toEqual({ output: 'AAA', error: null });
  });

  it('returns readable errors instead of throwing', () => {
    expect(convertLine('A1', 'toNumber').error).toMatch(/不是合法列名/);
    expect(convertLine('0', 'toColumn').error).toMatch(/从 1 开始/);
    expect(convertLine('-1', 'toColumn').error).toMatch(/从 1 开始/);
    expect(convertLine('16385', 'toColumn').error).toMatch(/超出 Excel 最大列/);
    expect(convertLine('A1', 'toColumn').error).toMatch(/不是合法列序号/);
  });
});

describe('convertLines', () => {
  it('converts multiple lines independently', () => {
    const result = convertLines('A\nZ\nAA\nXFD', 'toNumber');
    expect(result.output).toBe('1\n26\n27\n16384');
    expect(result.warnings).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('reverse batch converts and keeps blank lines', () => {
    const result = convertLines('1\n\n27\n703', 'toColumn');
    expect(result.output).toBe('A\n\nAA\nAAA');
  });

  it('flags invalid lines with line numbers while keeping other lines valid', () => {
    const result = convertLines('702\n0\n-1\nA1\n16385\n27', 'toColumn');
    const lines = result.output.split('\n');
    expect(lines[0]).toBe('ZZ');
    expect(lines[1]).toBe('0');
    expect(lines[5]).toBe('AA');
    expect(result.warnings).toHaveLength(4);
    expect(result.warnings[0]).toMatch(/第 2 行/);
    expect(result.warnings[3]).toMatch(/第 5 行/);
  });

  it('returns empty output for empty input', () => {
    const result = convertLines('', 'toNumber');
    expect(result.output).toBe('');
  });
});
