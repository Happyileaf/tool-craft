/**
 * 音乐音高与频率互算纯函数
 *
 * 基于十二平均律：f = f_A4 × 2^((n − 69) / 12)
 * 支持自定义调音基准、音名 / 频率双向换算、音程与频率比计算。
 */

/** 12 个音级（升号体系） */
export const PITCH_CLASSES = [
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

/** A4 的 MIDI 编号（参考锚点） */
export const A4_MIDI = 69;

/** 默认调音基准 A4 = 440 Hz */
export const DEFAULT_A4_FREQUENCY = 440;

/** 支持的八度范围（与科学音高记法常用范围一致） */
export const MIN_OCTAVE = -1;
export const MAX_OCTAVE = 9;

/** 解析后的音名结构 */
export interface ParsedNote {
  /** 音级序号 0–11（C = 0） */
  pitchClass: number;
  /** 八度编号 */
  octave: number;
  /** 规范化完整音名，如 A4、C#5 */
  full: string;
  /** 等价 MIDI 编号 */
  midi: number;
}

/** 频率反查结果 */
export interface PitchFromFrequency {
  /** 最近音名 */
  nearest: ParsedNote;
  /** 与最近音名的音分偏差（−50 ~ +50） */
  cents: number;
  /** 未取整的连续音高编号（MIDI 标尺） */
  continuousMidi: number;
}

/** 音程计算结果 */
export interface IntervalResult {
  /** 半音数（后音 − 前音，可为负） */
  semitones: number;
  /** 半音绝对值 */
  absoluteSemitones: number;
  /** 音程名称（八度复合音程，如 大九度） */
  intervalName: string;
  /** 英文音程名称 */
  intervalNameEn: string;
  /** 频率比 f2 / f1 */
  frequencyRatio: number;
  /** 音分距离（1200 × log2(ratio)，可为负） */
  cents: number;
}

/** 八度频率表中的一行 */
export interface PitchTableRow {
  /** 完整音名 */
  note: string;
  /** 音级序号 */
  pitchClass: number;
  /** 八度 */
  octave: number;
  /** 频率 Hz */
  frequency: number;
}

/** 0–12 半音对应的简单音程名称（单八度内 + 纯八度） */
const SIMPLE_INTERVAL_NAMES: ReadonlyArray<{ zh: string; en: string }> = [
  { zh: '纯一度', en: 'Perfect Unison' },
  { zh: '小二度', en: 'Minor Second' },
  { zh: '大二度', en: 'Major Second' },
  { zh: '小三度', en: 'Minor Third' },
  { zh: '大三度', en: 'Major Third' },
  { zh: '纯四度', en: 'Perfect Fourth' },
  { zh: '增四度 / 减五度', en: 'Tritone' },
  { zh: '纯五度', en: 'Perfect Fifth' },
  { zh: '小六度', en: 'Minor Sixth' },
  { zh: '大六度', en: 'Major Sixth' },
  { zh: '小七度', en: 'Minor Seventh' },
  { zh: '大七度', en: 'Major Seventh' },
  { zh: '纯八度', en: 'Perfect Octave' },
];

/**
 * 校验调音基准频率。
 *
 * @param a4Frequency - A4 基准频率 Hz
 */
export function assertValidA4(a4Frequency: number): void {
  if (!Number.isFinite(a4Frequency) || a4Frequency <= 0) {
    throw new Error('A4 调音基准必须为正数（Hz）。');
  }
}

/**
 * 解析科学音高记法（SPN），支持升号 # 与降号 b，如 A4 / C#5 / Bb3。
 *
 * @param input - 音名文本
 * @returns 解析后的音名结构
 */
export function parseNote(input: string): ParsedNote {
  const text = input.trim();
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(text);
  if (!match) {
    throw new Error('音名格式无效，示例：C4、A#4、Bb3（字母 + 可选 #/b + 八度数字）。');
  }
  const letter = match[1] ?? '';
  const accidental = match[2] ?? '';
  const octave = Number(match[3] ?? '0');
  if (!Number.isInteger(octave) || octave < MIN_OCTAVE || octave > MAX_OCTAVE) {
    throw new Error(`八度编号必须是 ${MIN_OCTAVE}–${MAX_OCTAVE} 之间的整数。`);
  }
  let pitchClass = PITCH_CLASSES.indexOf(letter.toUpperCase() as (typeof PITCH_CLASSES)[number]);
  let shiftedOctave = octave;
  if (accidental === '#') {
    pitchClass += 1;
  } else if (accidental === 'b') {
    pitchClass -= 1;
  }
  // 处理 B# / Cb 等跨界等音：先随半音偏移调整八度，再归一化音级
  if (pitchClass >= 12) {
    pitchClass -= 12;
    shiftedOctave += 1;
  } else if (pitchClass < 0) {
    pitchClass += 12;
    shiftedOctave -= 1;
  }
  if (shiftedOctave < MIN_OCTAVE || shiftedOctave > MAX_OCTAVE) {
    throw new Error(`八度编号必须是 ${MIN_OCTAVE}–${MAX_OCTAVE} 之间的整数。`);
  }
  const midi = (shiftedOctave + 1) * 12 + pitchClass;
  if (midi < 0 || midi > 127) {
    throw new Error('音符超出可表示范围（等价 MIDI 0–127）。');
  }
  const name = PITCH_CLASSES[pitchClass] ?? 'C';
  return {
    pitchClass,
    octave: shiftedOctave,
    full: `${name}${shiftedOctave}`,
    midi,
  };
}

/**
 * 音名转频率。
 * f = a4Frequency × 2^((midi − 69) / 12)
 *
 * @param input - 音名文本
 * @param a4Frequency - A4 基准频率，默认 440 Hz
 * @returns 频率 Hz
 */
export function noteToFrequency(input: string, a4Frequency: number = DEFAULT_A4_FREQUENCY): number {
  assertValidA4(a4Frequency);
  const note = parseNote(input);
  return a4Frequency * 2 ** ((note.midi - A4_MIDI) / 12);
}

/**
 * 频率反查最近音名与音分偏差。
 *
 * @param frequency - 输入频率 Hz
 * @param a4Frequency - A4 基准频率，默认 440 Hz
 * @returns 最近音名、音分偏差与连续音高编号
 */
export function frequencyToNote(
  frequency: number,
  a4Frequency: number = DEFAULT_A4_FREQUENCY,
): PitchFromFrequency {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    throw new Error('频率必须为正数（Hz）。');
  }
  assertValidA4(a4Frequency);
  const continuousMidi = A4_MIDI + 12 * Math.log2(frequency / a4Frequency);
  const nearestMidi = Math.round(continuousMidi);
  if (nearestMidi < 0 || nearestMidi > 127) {
    throw new Error('频率对应的音高超出可表示范围（等价 MIDI 0–127）。');
  }
  const cents = (continuousMidi - nearestMidi) * 100;
  const pitchClass = nearestMidi % 12;
  const octave = Math.floor(nearestMidi / 12) - 1;
  const name = PITCH_CLASSES[pitchClass] ?? 'C';
  return {
    nearest: {
      pitchClass,
      octave,
      full: `${name}${octave}`,
      midi: nearestMidi,
    },
    cents,
    continuousMidi,
  };
}

/**
 * 计算两个音名之间的音程：半音数、音程名称、频率比与音分距离。
 *
 * @param fromNote - 起始音名
 * @param toNote - 目标音名
 * @param a4Frequency - A4 基准频率
 * @returns 音程结果
 */
export function calculateInterval(
  fromNote: string,
  toNote: string,
  a4Frequency: number = DEFAULT_A4_FREQUENCY,
): IntervalResult {
  assertValidA4(a4Frequency);
  const from = parseNote(fromNote);
  const to = parseNote(toNote);
  const semitones = to.midi - from.midi;
  const absoluteSemitones = Math.abs(semitones);
  const f1 = noteToFrequency(from.full, a4Frequency);
  const f2 = noteToFrequency(to.full, a4Frequency);
  const frequencyRatio = f2 / f1;
  const cents = 1200 * Math.log2(frequencyRatio);
  const simple = SIMPLE_INTERVAL_NAMES[absoluteSemitones % 12] ?? SIMPLE_INTERVAL_NAMES[0]!;
  const octaves = Math.floor(absoluteSemitones / 12);
  const intervalName = octaves === 0 ? simple.zh : `${octaves} 个八度 + ${simple.zh}`;
  const intervalNameEn = octaves === 0 ? simple.en : `${octaves} octave(s) + ${simple.en}`;
  return {
    semitones,
    absoluteSemitones,
    intervalName,
    intervalNameEn,
    frequencyRatio,
    cents,
  };
}

/**
 * 任意两个频率之间的音分距离。
 *
 * @param fromFrequency - 起始频率 Hz
 * @param toFrequency - 目标频率 Hz
 * @returns 音分值（可为负）
 */
export function frequencyDistanceInCents(fromFrequency: number, toFrequency: number): number {
  if (
    !Number.isFinite(fromFrequency) ||
    !Number.isFinite(toFrequency) ||
    fromFrequency <= 0 ||
    toFrequency <= 0
  ) {
    throw new Error('两个频率都必须为正数（Hz）。');
  }
  return 1200 * Math.log2(toFrequency / fromFrequency);
}

/**
 * 生成指定八度内 12 个半音的音名 / 频率表。
 *
 * @param octave - 八度编号（-1–9）
 * @param a4Frequency - A4 基准频率
 * @returns 12 行频率表数据
 */
export function getOctaveFrequencyTable(
  octave: number,
  a4Frequency: number = DEFAULT_A4_FREQUENCY,
): PitchTableRow[] {
  if (!Number.isInteger(octave) || octave < MIN_OCTAVE || octave > MAX_OCTAVE) {
    throw new Error(`八度编号必须是 ${MIN_OCTAVE}–${MAX_OCTAVE} 之间的整数。`);
  }
  assertValidA4(a4Frequency);
  const baseMidi = (octave + 1) * 12;
  return PITCH_CLASSES.map((name, pitchClass) => {
    const midi = baseMidi + pitchClass;
    return {
      note: `${name}${octave}`,
      pitchClass,
      octave,
      frequency: a4Frequency * 2 ** ((midi - A4_MIDI) / 12),
    };
  });
}
