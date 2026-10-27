export const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

export const MIN_MIDI = 0;

export const MAX_MIDI = 127;

export const A4_MIDI = 69;

export const DEFAULT_A4_FREQUENCY = 440;

export const MIN_OCTAVE = -1;

export const MAX_OCTAVE = 9;

export interface NoteName {
  name: string;
  octave: number;
  full: string;
}

export interface FrequencyConversion {
  midi: number;
  nearestNote: number;
  cents: number;
}

export interface OctaveNote {
  midi: number;
  name: string;
  full: string;
  frequency: number;
}

/**
 * 校验 MIDI 编号是否为 0–127 的整数。
 *
 * @param note - MIDI 音符编号
 */
export function assertValidMidi(note: number): void {
  if (!Number.isInteger(note) || note < MIN_MIDI || note > MAX_MIDI) {
    throw new Error('MIDI 编号必须是 0–127 之间的整数。');
  }
}

/**
 * 校验 A4 基准频率为正数。
 *
 * @param a4Frequency - A4 基准频率（Hz）
 */
export function assertValidA4(a4Frequency: number): void {
  if (!Number.isFinite(a4Frequency) || a4Frequency <= 0) {
    throw new Error('A4 基准频率必须为正数。');
  }
}

/**
 * MIDI 编号转频率（十二平均律）。
 * f = a4Frequency × 2^((note − 69) / 12)
 *
 * @param note - MIDI 音符编号（0–127）
 * @param a4Frequency - A4 基准频率，默认 440 Hz
 * @returns 频率（Hz）
 */
export function midiToFrequency(note: number, a4Frequency = DEFAULT_A4_FREQUENCY): number {
  assertValidMidi(note);
  assertValidA4(a4Frequency);
  return a4Frequency * 2 ** ((note - A4_MIDI) / 12);
}

/**
 * MIDI 编号转音名（如 69 → A4）。
 *
 * @param note - MIDI 音符编号（0–127）
 * @returns 音名序号、八度与完整音名
 */
export function midiToNoteName(note: number): NoteName {
  assertValidMidi(note);
  const pitchClass = note % 12;
  const octave = Math.floor(note / 12) - 1;
  const name = NOTE_NAMES[pitchClass] ?? 'C';
  return { name, octave, full: `${name}${octave}` };
}

/**
 * 解析音名为 MIDI 编号，支持升号 # 与降号 b，如 A4 / C#4 / Bb3。
 *
 * @param input - 音名输入
 * @returns MIDI 音符编号（0–127）
 */
export function noteNameToMidi(input: string): number {
  const text = input.trim();
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(text);
  if (!match) {
    throw new Error('音名格式无效，示例：C4、A#4、Bb3（字母 + 可选 #/b + 八度数字）。');
  }
  const letter = match[1] ?? '';
  const accidental = match[2] ?? '';
  const octaveText = match[3] ?? '';
  const octave = Number(octaveText);
  let pitchClass = NOTE_NAMES.indexOf(letter.toUpperCase() as (typeof NOTE_NAMES)[number]);
  if (accidental === '#') {
    pitchClass += 1;
  } else if (accidental === 'b') {
    pitchClass -= 1;
  }
  const note = (octave + 1) * 12 + ((pitchClass + 12) % 12);
  assertValidMidi(note);
  return note;
}

/**
 * 频率反算 MIDI：返回浮点 MIDI 值、最近音符编号与音分偏差。
 *
 * @param frequency - 输入频率（Hz）
 * @param a4Frequency - A4 基准频率，默认 440 Hz
 * @returns 浮点 MIDI、最近音符、与最近音符的音分差
 */
export function frequencyToMidi(
  frequency: number,
  a4Frequency = DEFAULT_A4_FREQUENCY,
): FrequencyConversion {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    throw new Error('频率必须为正数（Hz）。');
  }
  assertValidA4(a4Frequency);
  const midi = A4_MIDI + 12 * Math.log2(frequency / a4Frequency);
  const nearestNote = Math.round(midi);
  const cents = (midi - nearestNote) * 100;
  return { midi, nearestNote, cents };
}

/**
 * 生成指定八度内 12 个半音（C 到 B）的音符与频率表。
 *
 * @param octave - 八度编号（-1–9）
 * @param a4Frequency - A4 基准频率
 * @returns 12 行音符数据
 */
export function getOctaveNotes(octave: number, a4Frequency = DEFAULT_A4_FREQUENCY): OctaveNote[] {
  if (!Number.isInteger(octave) || octave < MIN_OCTAVE || octave > MAX_OCTAVE) {
    throw new Error('八度编号必须是 -1–9 之间的整数。');
  }
  assertValidA4(a4Frequency);
  const baseMidi = (octave + 1) * 12;
  return NOTE_NAMES.map((name, pitchClass) => {
    const midi = baseMidi + pitchClass;
    return {
      midi,
      name,
      full: `${name}${octave}`,
      frequency: midiToFrequency(midi, a4Frequency),
    };
  });
}
