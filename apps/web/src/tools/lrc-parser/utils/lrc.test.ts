import { describe, it, expect } from 'vitest';
import {
  formatTimestamp,
  parseTimestamp,
  parseLrc,
  serializeLrc,
  parseTimestampedLyrics,
} from './lrc';

describe('formatTimestamp / parseTimestamp round trip', () => {
  it('formats milliseconds as [mm:ss.cc]', () => {
    expect(formatTimestamp(0)).toBe('[00:00.00]');
    expect(formatTimestamp(83450)).toBe('[01:23.45]');
    expect(formatTimestamp(600000)).toBe('[10:00.00]');
  });

  it('rounds sub-centisecond remainder', () => {
    expect(formatTimestamp(1299)).toBe('[00:01.30]');
  });

  it('parses [mm:ss.cc] back to milliseconds', () => {
    expect(parseTimestamp('[01:23.45]')).toBe(83450);
    expect(parseTimestamp('[00:00.00]')).toBe(0);
  });

  it('accepts three-digit millisecond fractions', () => {
    expect(parseTimestamp('[00:01.234]')).toBe(1234);
  });

  it('rejects invalid timestamps and seconds >= 60', () => {
    expect(() => parseTimestamp('[99]')).toThrow('非法时间戳');
    expect(() => parseTimestamp('[01:60.00]')).toThrow('小于 60');
    expect(() => formatTimestamp(-1)).toThrow('非负');
  });
});

describe('parseLrc', () => {
  it('extracts ID tags and lyric lines', () => {
    const input = [
      '[ti:测试歌曲]',
      '[ar:歌手]',
      '[00:10.00]第一句',
      '[00:15.50]第二句',
    ].join('\r\n');
    const result = parseLrc(input);
    expect(result.errors).toEqual([]);
    expect(result.tags).toEqual([
      { key: 'ti', value: '测试歌曲' },
      { key: 'ar', value: '歌手' },
    ]);
    expect(result.lines).toEqual([
      { timeMs: 10000, text: '第一句' },
      { timeMs: 15500, text: '第二句' },
    ]);
  });

  it('expands inline multi-timestamp lines and sorts by time', () => {
    const input = '[00:20.00][00:40.00]重复段落\n[00:05.00]前奏';
    const result = parseLrc(input);
    expect(result.lines.map((line) => line.timeMs)).toEqual([5000, 20000, 40000]);
    expect(result.lines[1].text).toBe('重复段落');
    expect(result.lines[2].text).toBe('重复段落');
  });

  it('keeps empty-text accompaniment lines', () => {
    const result = parseLrc('[00:10.00]\n[00:12.00]歌词');
    expect(result.lines[0]).toEqual({ timeMs: 10000, text: '' });
  });

  it('reports unrecognized rows as errors', () => {
    const result = parseLrc('没有标签的裸文本');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('第 1 行');
  });

  it('supports offset tag without treating it as a lyric', () => {
    const result = parseLrc('[offset:500]\n[00:01.00]词');
    expect(result.tags).toContainEqual({ key: 'offset', value: '500' });
    expect(result.lines).toHaveLength(1);
  });
});

describe('serializeLrc', () => {
  it('serializes tags and sorted lines with CRLF', () => {
    const output = serializeLrc(
      [
        { timeMs: 15500, text: '第二句' },
        { timeMs: 10000, text: '第一句' },
      ],
      { tags: [{ key: 'ti', value: '歌' }] },
    );
    expect(output).toBe('[ti:歌]\r\n[00:10.00]第一句\r\n[00:15.50]第二句');
  });

  it('emits an offset tag in centiseconds', () => {
    const output = serializeLrc([{ timeMs: 0, text: 'x' }], { offsetMs: 500 });
    expect(output).toContain('[offset:50]');
  });

  it('round trips parse -> serialize -> parse', () => {
    const source = '[ti:T]\r\n[00:01.00]a\r\n[00:02.50]b';
    const parsed = parseLrc(source);
    const rebuilt = serializeLrc(parsed.lines, { tags: parsed.tags });
    const reparsed = parseLrc(rebuilt);
    expect(reparsed.lines).toEqual(parsed.lines);
    expect(reparsed.tags).toEqual(parsed.tags);
  });
});

describe('parseTimestampedLyrics', () => {
  it('parses plain mm:ss.cc text rows', () => {
    const result = parseTimestampedLyrics('00:10.00 第一句\n00:20.50 第二句');
    expect(result).toEqual([
      { timeMs: 10000, text: '第一句' },
      { timeMs: 20500, text: '第二句' },
    ]);
  });

  it('skips blank rows and rejects malformed rows with line numbers', () => {
    expect(parseTimestampedLyrics('\n00:01.00 ok\n')).toEqual([
      { timeMs: 1000, text: 'ok' },
    ]);
    expect(() => parseTimestampedLyrics('坏行')).toThrow('第 1 行');
  });
});
