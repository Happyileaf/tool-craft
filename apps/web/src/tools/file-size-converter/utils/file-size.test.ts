import { describe, it, expect } from 'vitest';
import { formatBytes, parseSize, convertLine, convertLines } from './file-size';

describe('formatBytes IEC (base 1024)', () => {
  const iec = { standard: 'iec' as const };

  it('formats acceptance vectors', () => {
    expect(formatBytes(0, iec)).toBe('0 B');
    expect(formatBytes(1023, iec)).toBe('1023 B');
    expect(formatBytes(1024, iec)).toBe('1 KiB');
    expect(formatBytes(1536, iec)).toBe('1.5 KiB');
    expect(formatBytes(1048576, iec)).toBe('1 MiB');
  });

  it('keeps at most two smart decimals and strips trailing zeros', () => {
    expect(formatBytes(1126, iec)).toBe('1.1 KiB');
    expect(formatBytes(1024 + Math.round(1024 / 3), iec)).toBe('1.33 KiB');
    expect(formatBytes(1024 ** 3 * 2, iec)).toBe('2 GiB');
  });

  it('supports fixed decimals', () => {
    expect(formatBytes(1536, { standard: 'iec', decimals: 2 })).toBe('1.50 KiB');
    expect(formatBytes(1024, { standard: 'iec', decimals: 3 })).toBe('1.000 KiB');
  });
});

describe('formatBytes SI (base 1000)', () => {
  const si = { standard: 'si' as const };

  it('formats acceptance vectors', () => {
    expect(formatBytes(999, si)).toBe('999 B');
    expect(formatBytes(1000, si)).toBe('1 KB');
    expect(formatBytes(1500, si)).toBe('1.5 KB');
    expect(formatBytes(1000000, si)).toBe('1 MB');
    expect(formatBytes(3000000000, si)).toBe('3 GB');
  });
});

describe('parseSize', () => {
  it('parses acceptance vectors', () => {
    expect(parseSize('1.5 MB')).toBe(1500000);
    expect(parseSize('2048 KiB')).toBe(2097152);
    expect(parseSize('3GB')).toBe(3000000000);
  });

  it('tolerates whitespace, case, and thousands separators', () => {
    expect(parseSize('  1.5 mb  ')).toBe(1500000);
    expect(parseSize('1,024 KB')).toBe(1024000);
    expect(parseSize('2048 kib')).toBe(2097152);
  });

  it('parses plain bytes', () => {
    expect(parseSize('512 B')).toBe(512);
  });

  it('round-trips against formatBytes', () => {
    const iec = { standard: 'iec' as const };
    const si = { standard: 'si' as const };
    for (const bytes of [1024, 1536, 1048576, 2621440]) {
      expect(parseSize(formatBytes(bytes, iec))).toBe(bytes);
    }
    for (const bytes of [1000, 1500, 1000000, 3500000]) {
      expect(parseSize(formatBytes(bytes, si))).toBe(bytes);
    }
  });

  it('throws on invalid input', () => {
    expect(() => parseSize('')).toThrow(/不能为空/);
    expect(() => parseSize('abc')).toThrow(/无法识别/);
    expect(() => parseSize('1.5')).toThrow(/缺少单位/);
    expect(() => parseSize('1.5 XB')).toThrow(/未知单位/);
    expect(() => parseSize('-3 MB')).toThrow(/不能为负数/);
  });
});

describe('convertLine', () => {
  const iec = { standard: 'iec' as const };

  it('formats and parses single lines', () => {
    expect(convertLine('1536', 'format', iec)).toEqual({ output: '1.5 KiB', error: null });
    expect(convertLine('1.5 MB', 'parse', iec)).toEqual({ output: '1500000', error: null });
  });

  it('returns readable errors instead of throwing', () => {
    expect(convertLine('-1', 'format', iec).error).toMatch(/不能为负数/);
    expect(convertLine('1.5 XB', 'parse', iec).error).toMatch(/未知单位/);
    expect(convertLine('abc', 'parse', iec).error).toMatch(/无法识别/);
  });
});

describe('convertLines', () => {
  const iec = { standard: 'iec' as const };

  it('formats multiple lines and keeps blanks', () => {
    const result = convertLines('1023\n1024\n\n1536', 'format', iec);
    expect(result.output).toBe('1023 B\n1 KiB\n\n1.5 KiB');
    expect(result.warnings).toEqual([]);
  });

  it('flags invalid parse lines with line numbers', () => {
    const result = convertLines('1.5 MB\n1.5 XB\n2048 KiB', 'parse', iec);
    expect(result.output.split('\n')[0]).toBe('1500000');
    expect(result.output.split('\n')[1]).toBe('1.5 XB');
    expect(result.output.split('\n')[2]).toBe('2097152');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/第 2 行/);
  });

  it('returns empty output for empty input', () => {
    expect(convertLines('', 'format', iec).output).toBe('');
  });
});
