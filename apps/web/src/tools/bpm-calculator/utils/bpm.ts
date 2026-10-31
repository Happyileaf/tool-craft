/**
 * BPM 音符时长与节拍同步延迟时间纯函数
 *
 * 以四分音符为一拍：一拍时长（ms）= 60000 / BPM。
 * 常规音符按相对一拍的比例换算（全音符 4 拍、二分 2 拍、四分 1 拍……），
 * 附点为原时长的 1.5 倍，三连音中的单个音符为原时长的 2/3。
 */

/** 音符行标识：普通音符 / 附点 / 三连音 */
export type NoteKind = 'normal' | 'dotted' | 'triplet';

/** 一行音符时长结果 */
export interface NoteDuration {
  /** 行标识 */
  kind: NoteKind;
  /** 音符中文名，如「四分音符」 */
  label:
    | '全音符'
    | '二分音符'
    | '四分音符'
    | '八分音符'
    | '十六分音符'
    | '三十二分音符';
  /** 相对四分音符（一拍）的拍数：全=4、二分=2、四分=1、八分=0.5…… */
  beats: number;
  /** 时长（毫秒） */
  ms: number;
  /** 同值的赫兹数（1000 / ms），用于 LFO 速率参考 */
  hz: number;
}

/** 常规音符（全音符至三十二分音符）定义 */
const BASE_NOTES: { label: NoteDuration['label']; beats: number }[] = [
  { label: '全音符', beats: 4 },
  { label: '二分音符', beats: 2 },
  { label: '四分音符', beats: 1 },
  { label: '八分音符', beats: 0.5 },
  { label: '十六分音符', beats: 0.25 },
  { label: '三十二分音符', beats: 0.125 },
];

/**
 * 校验 BPM 输入
 *
 * @param bpm - 每分钟拍数
 * @throws 当 BPM 非有限数或不在 (0, 1000] 范围时抛出错误
 */
export function assertValidBpm(bpm: number): void {
  if (!Number.isFinite(bpm)) {
    throw new Error('BPM 数值无效');
  }
  if (bpm <= 0) {
    throw new Error('BPM 必须大于 0');
  }
  if (bpm > 1000) {
    throw new Error('BPM 超出合理范围（上限 1000）');
  }
}

/**
 * 计算一拍（四分音符）的毫秒时长
 *
 * @param bpm - 每分钟拍数
 * @returns 一拍时长（毫秒）
 */
export function beatMs(bpm: number): number {
  assertValidBpm(bpm);
  return 60000 / bpm;
}

/**
 * 由音符时长反算 BPM
 *
 * 由 quarter = 60000 / bpm、ms = quarter · beats 反解：
 * bpm = beats · 60000 / ms。
 *
 * @param ms - 音符时长（毫秒）
 * @param beats - 该音符相对四分音符的拍数（四分为 1）
 * @returns 对应的 BPM
 * @throws 当时长或拍数非法时抛出错误
 */
export function bpmFromDuration(ms: number, beats: number): number {
  if (!Number.isFinite(ms) || ms <= 0) {
    throw new Error('时长必须为大于 0 的有限数值（毫秒）');
  }
  if (!Number.isFinite(beats) || beats <= 0) {
    throw new Error('拍数必须为大于 0 的有限数值');
  }
  return (beats * 60000) / ms;
}

/**
 * 生成从全音符到三十二分音符的常规 / 附点 / 三连音时长表
 *
 * @param bpm - 每分钟拍数
 * @returns 按「常规组 → 附点组 → 三连音组」排列的 18 行时长
 */
export function noteTable(bpm: number): NoteDuration[] {
  const quarter = beatMs(bpm);
  const row = (kind: NoteKind, label: NoteDuration['label'], beats: number): NoteDuration => {
    const ms = quarter * beats;
    return { kind, label, beats, ms, hz: 1000 / ms };
  };
  const normals = BASE_NOTES.map((note) => row('normal', note.label, note.beats));
  const dotted = BASE_NOTES.map((note) => row('dotted', note.label, note.beats * 1.5));
  const triplets = BASE_NOTES.map((note) => row('triplet', note.label, (note.beats * 2) / 3));
  return [...normals, ...dotted, ...triplets];
}

/** 节拍同步效果参数定义（delay / reverb 常用） */
export interface SyncTime {
  /** 参数中文名 */
  label: string;
  /** 相对四分音符的拍数 */
  beats: number;
  /** 时长（毫秒） */
  ms: number;
  /** 同值赫兹数 */
  hz: number;
}

/**
 * 计算延迟 / 混响效果器常用的节拍同步时间
 *
 * @param bpm - 每分钟拍数
 * @returns 1 小节、1/2、1/4、1/4 附点、1/4 三连音、1/8、1/8 附点、1/8 三连音、
 *          1/16、1/16 附点、1/32 等常用档位
 */
export function syncTimes(bpm: number): SyncTime[] {
  const quarter = beatMs(bpm);
  const specs: { label: string; beats: number }[] = [
    { label: '1 小节（4/4）', beats: 4 },
    { label: '二分音符 1/2', beats: 2 },
    { label: '四分音符 1/4', beats: 1 },
    { label: '四分附点 1/4D', beats: 1.5 },
    { label: '四分三连音 1/4T', beats: 2 / 3 },
    { label: '八分音符 1/8', beats: 0.5 },
    { label: '八分附点 1/8D', beats: 0.75 },
    { label: '八分三连音 1/8T', beats: 1 / 3 },
    { label: '十六分音符 1/16', beats: 0.25 },
    { label: '十六分附点 1/16D', beats: 0.375 },
    { label: '三十二分音符 1/32', beats: 0.125 },
  ];
  return specs.map((spec) => {
    const ms = quarter * spec.beats;
    return { label: spec.label, beats: spec.beats, ms, hz: 1000 / ms };
  });
}

/**
 * 格式化毫秒时长：≥1000 显示秒（3 位小数），否则显示毫秒（2 位小数）
 *
 * @param ms - 时长（毫秒）
 * @returns 带单位的展示文本
 */
export function formatMs(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(3)} s`;
  }
  return `${ms.toFixed(2)} ms`;
}

/**
 * 格式化赫兹频率：不足 1 显示 3 位小数，否则 2 位
 *
 * @param hz - 频率（赫兹）
 * @returns 带单位的展示文本
 */
export function formatHz(hz: number): string {
  return `${hz.toFixed(hz < 1 ? 3 : 2)} Hz`;
}
