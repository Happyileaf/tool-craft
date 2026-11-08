/**
 * 音乐音高与频率互算器常量
 */

/** 计算模式 */
export const PITCH_MODE = Object.freeze({
  NOTE_TO_FREQ: 'note-to-freq',
  FREQ_TO_NOTE: 'freq-to-note',
  INTERVAL: 'interval',
  TABLE: 'table',
} as const);

export type PitchMode = (typeof PITCH_MODE)[keyof typeof PITCH_MODE];

/** 常见调音基准预设 */
export const A4_PRESETS: ReadonlyArray<{ label: string; value: number }> = Object.freeze([
  { label: '440 Hz（国际标准）', value: 440 },
  { label: '432 Hz（自然调音）', value: 432 },
  { label: '442 Hz（管弦乐常用）', value: 442 },
  { label: '415 Hz（巴洛克音高）', value: 415 },
]);

/** 音程演示的快捷音符对 */
export const INTERVAL_PRESETS: ReadonlyArray<{
  label: string;
  from: string;
  to: string;
}> = Object.freeze([
  { label: '纯五度 C4 → G4', from: 'C4', to: 'G4' },
  { label: '大三度 C4 → E4', from: 'C4', to: 'E4' },
  { label: '纯八度 A4 → A5', from: 'A4', to: 'A5' },
  { label: '三全音 C4 → F#4', from: 'C4', to: 'F#4' },
]);
