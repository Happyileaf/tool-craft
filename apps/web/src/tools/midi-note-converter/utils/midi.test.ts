import { describe, expect, it } from 'vitest';
import {
  frequencyToMidi,
  getOctaveNotes,
  midiToFrequency,
  midiToNoteName,
  noteNameToMidi,
} from './midi';

describe('midiToNoteName', () => {
  it('MIDI 69 → A4，MIDI 60 → C4', () => {
    expect(midiToNoteName(69)).toEqual({ name: 'A', octave: 4, full: 'A4' });
    expect(midiToNoteName(60)).toEqual({ name: 'C', octave: 4, full: 'C4' });
  });

  it('MIDI 70 → A#4，边界 0 → C-1、127 → G9', () => {
    expect(midiToNoteName(70).full).toBe('A#4');
    expect(midiToNoteName(0).full).toBe('C-1');
    expect(midiToNoteName(127).full).toBe('G9');
  });

  it('非法 MIDI 编号抛错', () => {
    expect(() => midiToNoteName(128)).toThrow();
    expect(() => midiToNoteName(-1)).toThrow();
    expect(() => midiToNoteName(60.5)).toThrow();
  });
});

describe('midiToFrequency', () => {
  it('A4=440 时 MIDI 69 → 440 Hz', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 10);
  });

  it('MIDI 70 ≈ 466.16 Hz，相邻半音频率比为 2^(1/12)', () => {
    expect(midiToFrequency(70)).toBeCloseTo(466.1637615, 6);
    expect(midiToFrequency(70) / midiToFrequency(69)).toBeCloseTo(2 ** (1 / 12), 10);
  });

  it('中央 C（MIDI 60）≈ 261.63 Hz', () => {
    expect(midiToFrequency(60)).toBeCloseTo(261.6255653, 6);
  });

  it('自定义 A4=432 时 MIDI 69 → 432 Hz', () => {
    expect(midiToFrequency(69, 432)).toBeCloseTo(432, 10);
  });

  it('非法 A4 基准频率抛错', () => {
    expect(() => midiToFrequency(69, 0)).toThrow();
    expect(() => midiToFrequency(69, -440)).toThrow();
  });
});

describe('noteNameToMidi', () => {
  it('A4 → 69，C4 → 60，A#4 → 70', () => {
    expect(noteNameToMidi('A4')).toBe(69);
    expect(noteNameToMidi('C4')).toBe(60);
    expect(noteNameToMidi('A#4')).toBe(70);
  });

  it('支持降号写法 Bb3 = A#3 = 58，小写字母亦可', () => {
    expect(noteNameToMidi('Bb3')).toBe(noteNameToMidi('A#3'));
    expect(noteNameToMidi('bb3')).toBe(58);
  });

  it('支持负八度 C-1 → 0', () => {
    expect(noteNameToMidi('C-1')).toBe(0);
  });

  it('非法音名抛错', () => {
    expect(() => noteNameToMidi('H4')).toThrow();
    expect(() => noteNameToMidi('C')).toThrow();
    expect(() => noteNameToMidi('G10')).toThrow();
  });
});

describe('frequencyToMidi', () => {
  it('440 Hz → 浮点 MIDI 69、最近音 69、偏差 0 音分', () => {
    const result = frequencyToMidi(440);
    expect(result.midi).toBeCloseTo(69, 10);
    expect(result.nearestNote).toBe(69);
    expect(result.cents).toBeCloseTo(0, 10);
  });

  it('约 432 Hz（A4=440）最近音为 A4，偏差约 -31.77 音分', () => {
    const result = frequencyToMidi(432);
    expect(result.nearestNote).toBe(69);
    expect(result.cents).toBeCloseTo(-31.77, 1);
  });

  it('自定义 A4=432 时 432 Hz 偏差为 0', () => {
    const result = frequencyToMidi(432, 432);
    expect(result.nearestNote).toBe(69);
    expect(result.cents).toBeCloseTo(0, 10);
  });

  it('非正频率抛错', () => {
    expect(() => frequencyToMidi(0)).toThrow();
    expect(() => frequencyToMidi(-10)).toThrow();
  });
});

describe('getOctaveNotes', () => {
  it('八度 4 展开为 C4–B4 共 12 行，MIDI 60–71，频率递增', () => {
    const notes = getOctaveNotes(4);
    expect(notes).toHaveLength(12);
    expect(notes[0]?.full).toBe('C4');
    expect(notes[0]?.midi).toBe(60);
    expect(notes[11]?.full).toBe('B4');
    expect(notes[11]?.midi).toBe(71);
    for (let index = 1; index < notes.length; index += 1) {
      expect(notes[index]!.frequency).toBeGreaterThan(notes[index - 1]!.frequency);
    }
  });

  it('自定义 A4 影响八度表频率', () => {
    const notes = getOctaveNotes(4, 432);
    const a4 = notes.find((note) => note.full === 'A4');
    expect(a4?.frequency).toBeCloseTo(432, 10);
  });

  it('非法八度抛错', () => {
    expect(() => getOctaveNotes(-2)).toThrow();
    expect(() => getOctaveNotes(10)).toThrow();
  });
});
