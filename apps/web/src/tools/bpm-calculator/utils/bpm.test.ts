import { describe, it, expect } from 'vitest';
import {
  assertValidBpm,
  beatMs,
  bpmFromDuration,
  noteTable,
  syncTimes,
  formatMs,
  formatHz,
} from './bpm';

describe('beatMs 基础换算', () => {
  it('120 BPM 时一拍恰为 500 ms', () => {
    expect(beatMs(120)).toBe(500);
  });

  it('60 BPM 时一拍为 1000 ms', () => {
    expect(beatMs(60)).toBe(1000);
  });

  it('BPM 翻倍则时长减半', () => {
    expect(beatMs(140)).toBeCloseTo(beatMs(70) / 2, 10);
  });

  it('非法 BPM 抛错', () => {
    expect(() => beatMs(0)).toThrow(/大于 0/);
    expect(() => beatMs(-120)).toThrow(/大于 0/);
    expect(() => beatMs(Number.NaN)).toThrow(/数值无效/);
    expect(() => beatMs(Infinity)).toThrow(/数值无效/);
    expect(() => assertValidBpm(1001)).toThrow(/上限 1000/);
  });
});

describe('bpmFromDuration 反算', () => {
  it('500ms 的四分音符反算为 120 BPM', () => {
    expect(bpmFromDuration(500, 1)).toBe(120);
  });

  it('250ms 的八分音符（0.5 拍）反算为 120 BPM', () => {
    // bpm = beats · 60000 / ms = 0.5 · 60000 / 250 = 120
    expect(bpmFromDuration(250, 0.5)).toBe(120);
  });

  it('375ms 的八分附点（0.75 拍）反算为 120 BPM', () => {
    expect(bpmFromDuration(375, 0.75)).toBe(120);
  });

  it('正反复算一致', () => {
    const bpm = 96;
    const ms = beatMs(bpm);
    expect(bpmFromDuration(ms, 1)).toBeCloseTo(bpm, 10);
  });

  it('非法时长或拍数抛错', () => {
    expect(() => bpmFromDuration(0, 1)).toThrow(/时长/);
    expect(() => bpmFromDuration(-5, 1)).toThrow(/时长/);
    expect(() => bpmFromDuration(500, 0)).toThrow(/拍数/);
  });
});

describe('noteTable 音符时长表', () => {
  const table = noteTable(120);

  it('6 种音符 × 普通/附点/三连音共 18 行', () => {
    expect(table).toHaveLength(18);
    expect(table.filter((row) => row.kind === 'normal')).toHaveLength(6);
    expect(table.filter((row) => row.kind === 'dotted')).toHaveLength(6);
    expect(table.filter((row) => row.kind === 'triplet')).toHaveLength(6);
  });

  it('120 BPM 常规音符时长：全 2s、四分 500ms、八分 250ms、三十二分 62.5ms', () => {
    const normal = table.filter((row) => row.kind === 'normal');
    expect(normal.map((row) => row.ms)).toEqual([2000, 1000, 500, 250, 125, 62.5]);
  });

  it('附点为原时长 1.5 倍', () => {
    const dottedQuarter = table.find(
      (row) => row.kind === 'dotted' && row.label === '四分音符',
    );
    expect(dottedQuarter?.ms).toBe(750);
    expect(dottedQuarter?.beats).toBe(1.5);
  });

  it('三连音单个音符为原时长 2/3', () => {
    const tripletQuarter = table.find(
      (row) => row.kind === 'triplet' && row.label === '四分音符',
    );
    expect(tripletQuarter?.ms).toBeCloseTo(1000 / 3, 6);
    expect(tripletQuarter?.beats).toBeCloseTo(2 / 3, 10);
  });

  it('每行 hz 与 ms 互为倒数', () => {
    for (const row of table) {
      expect(row.hz).toBeCloseTo(1000 / row.ms, 10);
    }
  });
});

describe('syncTimes 效果器同步档位', () => {
  it('120 BPM 常用档位数值正确', () => {
    const times = syncTimes(120);
    const byLabel = new Map(times.map((item) => [item.label, item]));
    expect(byLabel.get('四分音符 1/4')?.ms).toBe(500);
    expect(byLabel.get('四分附点 1/4D')?.ms).toBe(750);
    expect(byLabel.get('八分附点 1/8D')?.ms).toBe(375);
    expect(byLabel.get('八分三连音 1/8T')?.ms).toBeCloseTo(500 / 3, 6);
    expect(byLabel.get('1 小节（4/4）')?.ms).toBe(2000);
  });

  it('1/8D 的频率约为 BPM/45（120 BPM ≈ 2.667 Hz）', () => {
    const dotted8th = syncTimes(120).find((item) => item.label === '八分附点 1/8D');
    expect(dotted8th?.hz).toBeCloseTo(120 / 45, 2);
  });
});

describe('格式化', () => {
  it('formatMs 在秒 / 毫秒间自动切换单位', () => {
    expect(formatMs(2000)).toBe('2.000 s');
    expect(formatMs(62.5)).toBe('62.50 ms');
  });

  it('formatHz 小于 1 时保留 3 位小数', () => {
    expect(formatHz(2.6667)).toBe('2.67 Hz');
    expect(formatHz(0.5)).toBe('0.500 Hz');
  });
});
