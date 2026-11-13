import {
  K_FACTOR_MAX,
  K_FACTOR_MIN,
  K_FACTOR_PRESETS,
  RATING_MAX,
  RATING_MIN,
  SEQUENCE_LIMIT,
  type MatchResult,
} from './utils/elo';

export { K_FACTOR_MAX, K_FACTOR_MIN, K_FACTOR_PRESETS, RATING_MAX, RATING_MIN, SEQUENCE_LIMIT };

/** 各功能区的默认参数 */
export const DEFAULT_PARAMS = {
  /** 默认棋手 A 评分 */
  ratingA: 1500,
  /** 默认棋手 B / 对手评分 */
  ratingB: 1500,
  /** 默认 K 系数（通用 / USCF） */
  kFactor: 32,
  /** 默认比赛序列文本 */
  sequence: 'W,D,W,L,D,W',
  /** 默认目标评分 */
  targetRating: 1600,
};

/** 单场比赛结果选项 */
export const RESULT_OPTIONS: Array<{ value: MatchResult; label: string; score: number }> = [
  { value: 'W', label: '胜', score: 1 },
  { value: 'D', label: '和', score: 0.5 },
  { value: 'L', label: '负', score: 0 },
];
