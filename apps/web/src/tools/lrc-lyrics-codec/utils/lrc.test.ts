import { describe, expect, it } from 'vitest';
import {
  formatTimeTag,
  parseLrc,
  shiftOffset,
  stringifyLrc,
  validateLrc,
} from './lrc';

const SAMPLE = `[ar:测试歌手]
[ti:歌曲标题]
[offset:+250]
[00:12.50]Hello
[01:05.250]World`;

describe('parseLrc', () => {
  it('解析 meta 与时间标签，秒数与文本逐字段一致', () => {
    const parsed = parseLrc(SAMPLE);
    expect(parsed.meta.ar).toBe('测试歌手');
    expect(parsed.meta.ti).toBe('歌曲标题');
    expect(parsed.meta.offset).toBe('+250');
    expect(parsed.lines).toHaveLength(2);
    expect(parsed.lines[0]!.time).toBeCloseTo(12.5, 6);
    expect(parsed.lines[0]!.text).toBe('Hello');
    expect(parsed.lines[1]!.time).toBeCloseTo(65.25, 6);
    expect(parsed.lines[1]!.text).toBe('World');
    expect(parsed.issues).toHaveLength(0);
  });

  it('一行双时间标签展开为两条', () => {
    const parsed = parseLrc('[00:10.00][00:20.00]合唱');
    expect(parsed.lines).toHaveLength(2);
    expect(parsed.lines[0]!.time).toBe(10);
    expect(parsed.lines[1]!.time).toBe(20);
    expect(parsed.lines.every((line) => line.text === '合唱')).toBe(true);
  });

  it('毫秒三位与百分秒两位都兼容，纯文本行进 plain', () => {
    const parsed = parseLrc('[00:01.500]A\n这是备注\n[00:02.25]B');
    expect(parsed.lines[0]!.time).toBeCloseTo(1.5, 6);
    expect(parsed.lines[1]!.time).toBeCloseTo(2.25, 6);
    expect(parsed.plain).toEqual(['这是备注']);
  });

  it('CRLF 与 BOM 归一化', () => {
    const parsed = parseLrc('\uFEFF[ar:x]\r\n[00:03.00]Z\r\n');
    expect(parsed.meta.ar).toBe('x');
    expect(parsed.lines[0]!.time).toBe(3);
  });

  it('越界时间标签产生带行号错误；乱序产生 warning', () => {
    const issues = validateLrc('[99:99.99]坏');
    expect(issues.some((i) => i.line === 1 && i.level === 'error')).toBe(true);
    const outOfOrder = parseLrc('[00:20.00]后\n[00:10.00]前');
    expect(outOfOrder.issues.some((i) => i.level === 'warning' && i.message.includes('乱序'))).toBe(
      true,
    );
  });

  it('无法识别的标签报错且不抛异常', () => {
    const parsed = parseLrc('[xx:yy]奇怪标签');
    expect(parsed.issues.some((i) => i.level === 'error')).toBe(true);
  });
});

describe('formatTimeTag / stringifyLrc 往返', () => {
  it('两位百分秒格式化与 59.999 进位', () => {
    expect(formatTimeTag(0)).toBe('[00:00.00]');
    expect(formatTimeTag(12.5)).toBe('[00:12.50]');
    expect(formatTimeTag(59.999)).toBe('[01:00.00]');
    expect(formatTimeTag(-5)).toBe('[00:00.00]');
  });

  it('parse → stringify → parse 语义往返一致', () => {
    const first = parseLrc(SAMPLE);
    const text = stringifyLrc(first);
    expect(text.startsWith('[ar:测试歌手]')).toBe(true);
    expect(text.includes('\r')).toBe(false);
    const second = parseLrc(text);
    expect(second.meta).toEqual(first.meta);
    expect(second.lines.map((l) => [Number(l.time.toFixed(2)), l.text])).toEqual(
      first.lines.map((l) => [Number(l.time.toFixed(2)), l.text]),
    );
  });
});

describe('shiftOffset', () => {
  it('整体 +1500ms', () => {
    const parsed = parseLrc('[00:10.00]A\n[00:20.00]B');
    const { result, clampedCount } = shiftOffset(parsed, 1500);
    expect(result.lines[0]!.time).toBeCloseTo(11.5, 6);
    expect(result.lines[1]!.time).toBeCloseTo(21.5, 6);
    expect(clampedCount).toBe(0);
  });

  it('负平移钳位到 0 并计数', () => {
    const parsed = parseLrc('[00:01.00]A\n[00:20.00]B');
    const { result, clampedCount } = shiftOffset(parsed, -5000);
    expect(result.lines[0]!.time).toBe(0);
    expect(result.lines[1]!.time).toBe(15);
    expect(clampedCount).toBe(1);
  });
});
