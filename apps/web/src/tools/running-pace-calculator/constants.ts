/**
 * 跑步配速计算器内常量
 */

/** 互算模式 */
export enum PaceModeEnum {
  /** 已知配速与距离，求完赛时间 */
  PACE_DISTANCE_TO_DURATION = 'pace-distance-to-duration',
  /** 已知完赛时间与距离，求配速 */
  DURATION_DISTANCE_TO_PACE = 'duration-distance-to-pace',
  /** 已知配速与完赛时间，求距离 */
  PACE_DURATION_TO_DISTANCE = 'pace-duration-to-distance',
}

/** 模式选择项数据源 */
export const MODE_OPTIONS: { label: string; value: PaceModeEnum }[] = [
  { label: '配速 + 距离 → 完赛时间', value: PaceModeEnum.PACE_DISTANCE_TO_DURATION },
  { label: '完赛时间 + 距离 → 配速', value: PaceModeEnum.DURATION_DISTANCE_TO_PACE },
  { label: '配速 + 完赛时间 → 距离', value: PaceModeEnum.PACE_DURATION_TO_DISTANCE },
];

/** 标准赛事 / 常用距离预设（公里） */
export const DISTANCE_PRESETS: { label: string; value: number }[] = [
  { label: '5K', value: 5 },
  { label: '10K', value: 10 },
  { label: '半程马拉松', value: 21.0975 },
  { label: '全程马拉松', value: 42.195 },
];

/** 默认配速（mm:ss /km） */
export const DEFAULT_PACE_TEXT = '5:00';

/** 默认距离（公里） */
export const DEFAULT_DISTANCE = 10;

/** 默认完赛时间（mm:ss） */
export const DEFAULT_DURATION_TEXT = '50:00';
