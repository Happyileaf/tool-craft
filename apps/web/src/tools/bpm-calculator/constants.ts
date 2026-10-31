/**
 * BPM 音符时长计算器常量
 */

/** 默认 BPM（120 为电子音乐常见速度） */
export const DEFAULT_BPM = 120;

/** BPM 输入步长 */
export const BPM_STEP = 1;

/** BPM 允许范围 */
export const BPM_MIN = 1;
export const BPM_MAX = 300;

/** 常见速度预设 */
export interface BpmPreset {
  /** 风格 / 场景名 */
  name: string;
  /** BPM 值 */
  bpm: number;
}

/** 常见曲风速度参考 */
export const BPM_PRESETS: BpmPreset[] = [
  { name: '慢板 Ballad（70）', bpm: 70 },
  { name: 'Hip-Hop（90）', bpm: 90 },
  { name: 'House（120）', bpm: 120 },
  { name: 'Techno（130）', bpm: 130 },
  { name: 'Drum & Bass（170）', bpm: 170 },
];
