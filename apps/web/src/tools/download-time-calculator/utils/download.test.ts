import { describe, it, expect } from 'vitest';
import {
  computeDownloadSeconds,
  splitDuration,
  formatClock,
  formatHuman,
  buildComparisonTable,
  BANDWIDTH_PRESETS,
} from './download';

describe('computeDownloadSeconds', () => {
  it('computes textbook vectors with decimal units', () => {
    // 1 GB @ 100 Mbps = 80 s
    expect(computeDownloadSeconds(1e9, 100e6)).toBe(80);
    // 1 MB @ 1 Mbps = 8 s
    expect(computeDownloadSeconds(1e6, 1e6)).toBe(8);
    // 1 GB @ 1 Gbps = 8 s
    expect(computeDownloadSeconds(1e9, 1e9)).toBe(8);
    // 100 GB @ 50 Mbps = 16000 s
    expect(computeDownloadSeconds(1e11, 50e6)).toBe(16000);
  });

  it('applies the efficiency factor', () => {
    // 1 GB @ 100 Mbps 且效率 80% → 100 s
    expect(computeDownloadSeconds(1e9, 100e6, 0.8)).toBe(100);
    expect(computeDownloadSeconds(1e9, 100e6, 0.5)).toBe(160);
  });

  it('accepts zero size and rejects bad inputs', () => {
    expect(computeDownloadSeconds(0, 1e6)).toBe(0);
    expect(() => computeDownloadSeconds(1e9, 0)).toThrow(/带宽必须为正数/);
    expect(() => computeDownloadSeconds(1e9, -1e6)).toThrow(/带宽必须为正数/);
    expect(() => computeDownloadSeconds(1e9, 1e6, 0)).toThrow(/效率系数/);
    expect(() => computeDownloadSeconds(1e9, 1e6, 1.2)).toThrow(/效率系数/);
    expect(() => computeDownloadSeconds(-1, 1e6)).toThrow(/文件大小/);
  });
});

describe('splitDuration', () => {
  it('breaks seconds into days/hours/minutes/seconds', () => {
    expect(splitDuration(80)).toEqual({ days: 0, hours: 0, minutes: 1, seconds: 20 });
    expect(splitDuration(16000)).toEqual({ days: 0, hours: 4, minutes: 26, seconds: 40 });
    // 100000 s = 1 天 3 小时 46 分 40 秒
    expect(splitDuration(100000)).toEqual({ days: 1, hours: 3, minutes: 46, seconds: 40 });
  });
});

describe('formatClock', () => {
  it('renders hh:mm:ss and N天 for multi-day durations', () => {
    expect(formatClock(80)).toBe('00:01:20');
    expect(formatClock(16000)).toBe('04:26:40');
    expect(formatClock(100000)).toBe('1天 03:46:40');
  });
});

describe('formatHuman', () => {
  it('joins non-zero units in Chinese', () => {
    expect(formatHuman(80)).toBe('1 分 20 秒');
    expect(formatHuman(100000)).toBe('1 天 3 小时 46 分 40 秒');
    expect(formatHuman(3600)).toBe('1 小时');
  });

  it('keeps decimals under one second', () => {
    // 1 KB @ 1 Gbps = 0.008 s
    expect(formatHuman(0.008)).toBe('0.01 秒');
  });
});

describe('buildComparisonTable', () => {
  it('covers every preset and applies efficiency', () => {
    const rows = buildComparisonTable(1e9, 1);
    expect(rows).toHaveLength(BANDWIDTH_PRESETS.length);
    const broadband = rows.find((row) => row.label.includes('宽带 100M'));
    expect(broadband?.seconds).toBe(80);
    expect(broadband?.clock).toBe('00:01:20');

    const reduced = buildComparisonTable(1e9, 0.8);
    expect(reduced.find((row) => row.label.includes('宽带 100M'))?.seconds).toBe(100);
  });
});
