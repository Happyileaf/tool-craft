import { describe, expect, it } from 'vitest';
import {
  A4_MIDI,
  DEFAULT_A4_FREQUENCY,
  calculateInterval,
  frequencyDistanceInCents,
  frequencyToNote,
  getOctaveFrequencyTable,
  noteToFrequency,
  parseNote,
} from './pitch';

describe('parseNote', () => {
  it('解析自然音与升降号', () => {
    expect(parseNote('A4')).toMatchObject({ pitchClass: 9, octave: 4, midi: A4_MIDI, full: 'A4' });
    expect(parseNote('c#5')).toMatchObject({ pitchClass: 1, octave: 5, full: 'C#5' });
    expect(parseNote('Bb3')).toMatchObject({ pitchClass: 10, octave: 3, full: 'A#3' });
  });

  it('规范化为升号体系并处理跨界等音', () => {
    expect(parseNote('Cb4').full).toBe('B3');
    expect(parseNote('B#3').full).toBe('C4');
  });

  it('拒绝非法格式', () => {
    expect(() => parseNote('H4')).toThrow();
    expect(() => parseNote('C')).toThrow();
    expect(() => parseNote('C##4')).toThrow();
  });

  it('拒绝越界八度', () => {
    expect(() => parseNote('C10')).toThrow();
    expect(() => parseNote('C-2')).toThrow();
  });
});

describe('noteToFrequency', () => {
  it('A4 在 440 基准下等于 440 Hz', () => {
    expect(noteToFrequency('A4')).toBeCloseTo(440, 6);
  });

  it('自定义 432 基准下 A4 等于 432 Hz', () => {
    expect(noteToFrequency('A4', 432)).toBeCloseTo(432, 6);
  });

  it('C4 在 440 基准下约为 261.6256 Hz', () => {
    expect(noteToFrequency('C4')).toBeCloseTo(261.6256, 3);
  });

  it('升高一个八度频率翻倍', () => {
    expect(noteToFrequency('A5') / noteToFrequency('A4')).toBeCloseTo(2, 6);
  });

  it('相邻半音频率比为 2^(1/12)', () => {
    expect(noteToFrequency('A#4') / noteToFrequency('A4')).toBeCloseTo(2 ** (1 / 12), 6);
  });

  it('非法基准抛错', () => {
    expect(() => noteToFrequency('A4', 0)).toThrow();
    expect(() => noteToFrequency('A4', Number.NaN)).toThrow();
  });
});

describe('frequencyToNote', () => {
  it('440 Hz 反查为 A4 且音分偏差为 0', () => {
    const result = frequencyToNote(440);
    expect(result.nearest.full).toBe('A4');
    expect(result.cents).toBeCloseTo(0, 6);
  });

  it('432 Hz 在 432 基准下反查为 A4', () => {
    const result = frequencyToNote(432, 432);
    expect(result.nearest.full).toBe('A4');
    expect(result.cents).toBeCloseTo(0, 6);
  });

  it('261.6256 Hz 反查为 C4', () => {
    const result = frequencyToNote(261.6256);
    expect(result.nearest.full).toBe('C4');
    expect(Math.abs(result.cents)).toBeLessThan(1);
  });

  it('偏高 50 音分内吸附到最近音', () => {
    const sharp = 440 * 2 ** (30 / 1200);
    const result = frequencyToNote(sharp);
    expect(result.nearest.full).toBe('A4');
    expect(result.cents).toBeCloseTo(30, 1);
  });

  it('非法频率抛错', () => {
    expect(() => frequencyToNote(0)).toThrow();
    expect(() => frequencyToNote(-1)).toThrow();
  });
});

describe('calculateInterval', () => {
  it('同度音程', () => {
    const result = calculateInterval('A4', 'A4');
    expect(result.semitones).toBe(0);
    expect(result.intervalName).toBe('纯一度');
    expect(result.frequencyRatio).toBeCloseTo(1, 6);
    expect(result.cents).toBeCloseTo(0, 6);
  });

  it('A4 到 C5 为小三度（3 半音）', () => {
    const result = calculateInterval('A4', 'C5');
    expect(result.semitones).toBe(3);
    expect(result.intervalName).toBe('小三度');
    expect(result.frequencyRatio).toBeCloseTo(2 ** (3 / 12), 6);
    expect(result.cents).toBeCloseTo(300, 6);
  });

  it('C4 到 G4 为纯五度（7 半音）', () => {
    const result = calculateInterval('C4', 'G4');
    expect(result.semitones).toBe(7);
    expect(result.intervalName).toBe('纯五度');
    expect(result.cents).toBeCloseTo(700, 6);
  });

  it('下行音程半音数与音分为负', () => {
    const result = calculateInterval('C5', 'A4');
    expect(result.semitones).toBe(-3);
    expect(result.absoluteSemitones).toBe(3);
    expect(result.cents).toBeCloseTo(-300, 6);
  });

  it('跨八度复合音程带八度前缀', () => {
    const result = calculateInterval('C4', 'D5');
    expect(result.absoluteSemitones).toBe(14);
    expect(result.intervalName).toContain('1 个八度');
    expect(result.intervalName).toContain('大二度');
    expect(result.cents).toBeCloseTo(1400, 6);
  });

  it('音程结果与调音基准无关', () => {
    const r440 = calculateInterval('C4', 'G4', 440);
    const r432 = calculateInterval('C4', 'G4', 432);
    expect(r440.semitones).toBe(r432.semitones);
    expect(r440.cents).toBeCloseTo(r432.cents, 6);
  });
});

describe('frequencyDistanceInCents', () => {
  it('倍频为 1200 音分', () => {
    expect(frequencyDistanceInCents(220, 440)).toBeCloseTo(1200, 6);
  });

  it('反向为负值', () => {
    expect(frequencyDistanceInCents(440, 220)).toBeCloseTo(-1200, 6);
  });

  it('非法输入抛错', () => {
    expect(() => frequencyDistanceInCents(0, 440)).toThrow();
  });
});

describe('getOctaveFrequencyTable', () => {
  it('每个八度返回 12 个半音且首尾为 C 与 B', () => {
    const table = getOctaveFrequencyTable(4);
    expect(table).toHaveLength(12);
    expect(table[0]!.note).toBe('C4');
    expect(table[11]!.note).toBe('B4');
  });

  it('表内 A4 频率等于基准', () => {
    const table = getOctaveFrequencyTable(4, DEFAULT_A4_FREQUENCY);
    const a4 = table.find((row) => row.note === 'A4');
    expect(a4?.frequency).toBeCloseTo(440, 6);
  });

  it('相邻行相差 100 音分', () => {
    const table = getOctaveFrequencyTable(4);
    const cents = 1200 * Math.log2(table[1]!.frequency / table[0]!.frequency);
    expect(cents).toBeCloseTo(100, 6);
  });

  it('非法八度抛错', () => {
    expect(() => getOctaveFrequencyTable(10)).toThrow();
  });
});
