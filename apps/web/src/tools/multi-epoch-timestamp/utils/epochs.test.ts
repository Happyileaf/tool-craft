import { describe, it, expect } from 'vitest';
import {
  convertTimestamp,
  fromUtcDateTime,
  toUtcDateTime,
  formatAllEpochs,
  EPOCH_DEFS,
  type EpochKey,
} from './epochs';

// 2000-01-01T00:00:00Z = Unix 秒 946684800
const Y2K_UNIX_SEC = '946684800';
const Y2K_FILETIME = '125911584000000000';
const Y2K_DOTNET_TICKS = '630822816000000000';

describe('convertTimestamp fixed vectors (2000-01-01T00:00:00Z)', () => {
  it('converts Unix seconds to FILETIME and .NET Ticks', () => {
    const r = convertTimestamp(Y2K_UNIX_SEC, 'unix-sec');
    expect(r.error).toBeNull();
    expect(r.values['filetime']).toBe(Y2K_FILETIME);
    expect(r.values['dotnet-ticks']).toBe(Y2K_DOTNET_TICKS);
    expect(r.values['unix-ms']).toBe('946684800000');
    expect(r.values['unix-us']).toBe('946684800000000');
    expect(r.values['unix-ns']).toBe('946684800000000000');
    expect(r.values['cocoa']).toBe('-31622400');
  });

  it('converts FILETIME back to all other epochs', () => {
    const r = convertTimestamp(Y2K_FILETIME, 'filetime');
    expect(r.error).toBeNull();
    expect(r.values['unix-sec']).toBe(Y2K_UNIX_SEC);
    expect(r.values['dotnet-ticks']).toBe(Y2K_DOTNET_TICKS);
    // Chrome 微秒 = FILETIME / 10
    expect(r.values['chrome']).toBe('12591158400000000');
  });

  it('converts .NET Ticks back to Unix seconds', () => {
    const r = convertTimestamp(Y2K_DOTNET_TICKS, 'dotnet-ticks');
    expect(r.error).toBeNull();
    expect(r.values['unix-sec']).toBe(Y2K_UNIX_SEC);
    expect(r.values['filetime']).toBe(Y2K_FILETIME);
  });

  it('keeps nanosecond precision with BigInt', () => {
    const r = convertTimestamp('1700000000123456789', 'unix-ns');
    expect(r.error).toBeNull();
    expect(r.values['unix-sec']).toBe('1700000000');
    expect(r.values['unix-ms']).toBe('1700000000123');
    expect(r.values['unix-us']).toBe('1700000000123456');
    expect(r.values['unix-ns']).toBe('1700000000123456789');
  });
});

describe('convertTimestamp round-trip across every epoch', () => {
  it('returns the same unixNs no matter which epoch is the source', () => {
    const base = convertTimestamp(Y2K_UNIX_SEC, 'unix-sec');
    EPOCH_DEFS.forEach((def) => {
      const value = base.values[def.key as EpochKey];
      expect(value).toBeDefined();
      const again = convertTimestamp(value as string, def.key);
      expect(again.error).toBeNull();
      expect(again.unixNs).toBe(base.unixNs);
    });
  });
});

describe('convertTimestamp errors', () => {
  it('rejects empty, fractional, and non-numeric input', () => {
    expect(convertTimestamp('  ', 'unix-sec').error).toMatch(/不能为空/);
    expect(convertTimestamp('946684800.5', 'unix-sec').error).toMatch(/必须是整数/);
    expect(convertTimestamp('abc', 'unix-sec').error).toMatch(/必须是整数/);
    expect(convertTimestamp('1e9', 'unix-sec').error).toMatch(/必须是整数/);
  });

  it('rejects negative FILETIME / Ticks / Chrome values', () => {
    expect(convertTimestamp('-1', 'filetime').error).toMatch(/不能为负数/);
    expect(convertTimestamp('-1', 'dotnet-ticks').error).toMatch(/不能为负数/);
    expect(convertTimestamp('-1', 'chrome').error).toMatch(/不能为负数/);
  });

  it('accepts negative Unix and Cocoa values (pre-1970 / pre-2001)', () => {
    expect(convertTimestamp('-1', 'unix-sec').error).toBeNull();
    expect(convertTimestamp('-31622400', 'cocoa').error).toBeNull();
  });
});

describe('fromUtcDateTime and toUtcDateTime', () => {
  it('derives every epoch from 2000-01-01T00:00:00.000Z', () => {
    const r = fromUtcDateTime({
      year: 2000,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    expect(r.error).toBeNull();
    expect(r.iso).toBe('2000-01-01T00:00:00.000Z');
    expect(r.values['unix-sec']).toBe(Y2K_UNIX_SEC);
    expect(r.values['filetime']).toBe(Y2K_FILETIME);
    expect(r.values['dotnet-ticks']).toBe(Y2K_DOTNET_TICKS);
  });

  it('round-trips date fields via unixNs', () => {
    const r = fromUtcDateTime({
      year: 2024,
      month: 6,
      day: 15,
      hour: 12,
      minute: 30,
      second: 45,
      millisecond: 250,
    });
    expect(r.error).toBeNull();
    const back = toUtcDateTime(r.unixNs as bigint);
    expect(back.fields).toEqual({
      year: 2024,
      month: 6,
      day: 15,
      hour: 12,
      minute: 30,
      second: 45,
      millisecond: 250,
    });
  });

  it('handles leap days and reports invalid dates', () => {
    expect(
      fromUtcDateTime({ year: 2024, month: 2, day: 29, hour: 0, minute: 0, second: 0, millisecond: 0 })
        .error,
    ).toBeNull();
    expect(
      fromUtcDateTime({ year: 2023, month: 2, day: 29, hour: 0, minute: 0, second: 0, millisecond: 0 })
        .error,
    ).toMatch(/有效日/);
    expect(
      fromUtcDateTime({ year: 2024, month: 13, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 })
        .error,
    ).toMatch(/月份/);
    expect(
      fromUtcDateTime({ year: 2024, month: 1, day: 1, hour: 24, minute: 0, second: 0, millisecond: 0 })
        .error,
    ).toMatch(/小时/);
    expect(
      fromUtcDateTime({ year: 10000, month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 })
        .error,
    ).toMatch(/年份/);
  });
});

describe('formatAllEpochs', () => {
  it('covers every defined epoch', () => {
    const values = formatAllEpochs(BigInt(0));
    EPOCH_DEFS.forEach((def) => {
      expect(typeof values[def.key]).toBe('string');
    });
  });
});
