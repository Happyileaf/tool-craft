/**
 * Elo 等级分计算的纯函数实现
 * 基于 Arpad Elo 提出的等级分模型：
 * - 期望得分：Ea = 1 / (1 + 10^((Rb - Ra) / 400))
 * - 等级分更新：R' = R + K × (S - E)，结果四舍五入到整数
 * 本模块不依赖 React 或 DOM，所有函数均为确定性纯函数，便于单元测试
 */

/** 单场比赛结果：胜 W / 和 D / 负 L */
export type MatchResult = 'W' | 'D' | 'L';

/** 评分允许的最小值 */
export const RATING_MIN = 0;
/** 评分允许的最大值 */
export const RATING_MAX = 10000;
/** K 系数允许的最小值 */
export const K_FACTOR_MIN = 1;
/** K 系数允许的最大值 */
export const K_FACTOR_MAX = 200;
/** 比赛序列长度上限 */
export const SEQUENCE_LIMIT = 500;
/** 目标胜场估算的迭代上限，防止极端参数下死循环 */
export const MAX_WIN_ITERATIONS = 10000;

/** K 系数预设选项 */
export interface KFactorPreset {
  /** K 系数数值 */
  value: number;
  /** 预设名称 */
  label: string;
  /** 适用场景说明 */
  description: string;
}

/** 常见棋类评级体系使用的 K 系数预设 */
export const K_FACTOR_PRESETS: ReadonlyArray<KFactorPreset> = [
  { value: 40, label: 'FIDE 新棋手', description: '等级分对局未满 30 场的新注册棋手' },
  { value: 20, label: 'FIDE 2400 以下', description: '等级分低于 2400 的在册棋手' },
  { value: 10, label: 'FIDE 2400+', description: '等级分达到 2400 及以上的棋手' },
  { value: 32, label: '通用 / USCF', description: 'USCF 及多数在线对战平台的常用值' },
];

/** 序列文本的分隔规则：逗号（中英文）、空白、分号、顿号等 */
const SEQUENCE_SPLIT_RE = /[\s,，、;；/|]+/;

/** 参数校验结果 */
export interface ValidationResult {
  /** 是否全部通过校验 */
  valid: boolean;
  /** 逐条错误信息，valid 为 true 时为空数组 */
  errors: string[];
}

/** validateEloInputs 的入参，仅校验实际传入的字段 */
export interface EloValidationInput {
  /** 棋手 A 当前评分 */
  ratingA?: number | null;
  /** 棋手 B（对手）评分 */
  ratingB?: number | null;
  /** K 系数 */
  kFactor?: number | null;
  /** 序列推演中的固定对手评分 */
  opponentRating?: number | null;
  /** 目标胜场估算中的目标评分 */
  targetRating?: number | null;
  /** 原始比赛序列文本 */
  sequence?: string;
}

/** 序列推演的单场明细行 */
export interface SimulationRow {
  /** 场次序号，从 1 开始 */
  index: number;
  /** 本场结果 */
  result: MatchResult;
  /** 实际得分：胜 1、和 0.5、负 0 */
  score: number;
  /** 赛前推算的期望得分 */
  expected: number;
  /** 赛前评分 */
  ratingBefore: number;
  /** 赛后评分 */
  ratingAfter: number;
  /** 本场评分变动（赛后 - 赛前） */
  delta: number;
}

/** 序列推演完整结果 */
export interface SequenceSimulation {
  /** 逐场明细 */
  rows: SimulationRow[];
  /** 推演结束后的最终评分 */
  finalRating: number;
  /** 相对起始评分的总变动 */
  totalDelta: number;
}

/** 目标胜场估算结果 */
export interface WinsEstimate {
  /** 达到目标所需的连胜场数 */
  wins: number;
  /** 目标是否可通过连胜达到 */
  feasible: boolean;
  /** 不可行时的原因说明 */
  reason?: string;
}

/**
 * 计算棋手 A 对棋手 B 的期望得分
 * @param ratingA - 棋手 A 当前评分
 * @param ratingB - 棋手 B 当前评分
 * @returns 期望得分 Ea，取值区间 (0, 1)
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * 依据单场实际得分更新等级分
 * @param rating - 赛前评分
 * @param score - 实际得分，胜 1、和 0.5、负 0
 * @param expected - 赛前期望得分
 * @param kFactor - K 系数
 * @returns 四舍五入到整数的赛后评分
 */
export function updateRating(
  rating: number,
  score: number,
  expected: number,
  kFactor: number,
): number {
  return Math.round(rating + kFactor * (score - expected));
}

/**
 * 比赛结果转换为实际得分
 * @param result - 比赛结果 W / D / L
 * @returns 胜 1、和 0.5、负 0
 */
export function matchScore(result: MatchResult): number {
  if (result === 'W') {
    return 1;
  }
  if (result === 'D') {
    return 0.5;
  }
  return 0;
}

/**
 * 将单个序列记号归一化为比赛结果，无法识别时返回 null
 * @param token - 原始记号，支持 W/D/L（大小写不敏感）与 1/0.5/0
 * @returns 归一化后的比赛结果，非法记号返回 null
 */
function normalizeToken(token: string): MatchResult | null {
  const upper = token.toUpperCase();
  if (upper === 'W' || upper === '1') {
    return 'W';
  }
  if (upper === 'D' || upper === '0.5') {
    return 'D';
  }
  if (upper === 'L' || upper === '0') {
    return 'L';
  }
  return null;
}

/**
 * 解析比赛序列文本
 * @param text - 以逗号或空白分隔的 W/D/L 序列，也接受 1/0.5/0 词法
 * @returns 归一化后的比赛结果数组
 * @throws 遇到无法识别的记号时抛出错误
 */
export function parseSequence(text: string): MatchResult[] {
  const results: MatchResult[] = [];
  for (const token of text.split(SEQUENCE_SPLIT_RE)) {
    if (token.length === 0) {
      continue;
    }
    const normalized = normalizeToken(token);
    if (normalized === null) {
      throw new Error(`无法识别的比赛结果记号「${token}」`);
    }
    results.push(normalized);
  }
  return results;
}

/**
 * 校验单个评分字段
 * @param label - 字段中文名，用于错误信息
 * @param value - 待校验值
 * @param errors - 收集错误信息的数组
 */
function validateRating(label: string, value: number | null | undefined, errors: string[]): void {
  if (value === undefined || value === null) {
    errors.push(`${label}不能为空`);
    return;
  }
  if (!Number.isFinite(value) || value < RATING_MIN || value > RATING_MAX) {
    errors.push(`${label}必须为 ${RATING_MIN}-${RATING_MAX} 之间的有限数`);
  }
}

/**
 * 校验 Elo 计算器的各类输入，仅校验入参中实际提供的字段
 * @param input - 待校验字段集合
 * @returns 校验结论与逐条错误信息
 */
export function validateEloInputs(input: EloValidationInput): ValidationResult {
  const errors: string[] = [];
  if (input.ratingA !== undefined) {
    validateRating('棋手 A 评分', input.ratingA, errors);
  }
  if (input.ratingB !== undefined) {
    validateRating('棋手 B 评分', input.ratingB, errors);
  }
  if (input.opponentRating !== undefined) {
    validateRating('对手评分', input.opponentRating, errors);
  }
  if (input.targetRating !== undefined) {
    validateRating('目标评分', input.targetRating, errors);
  }
  if (input.kFactor !== undefined) {
    const kFactor = input.kFactor;
    if (kFactor === undefined || kFactor === null) {
      errors.push('K 系数不能为空');
    } else if (!Number.isFinite(kFactor) || kFactor < K_FACTOR_MIN || kFactor > K_FACTOR_MAX) {
      errors.push(`K 系数必须为 ${K_FACTOR_MIN}-${K_FACTOR_MAX} 之间的有限数`);
    }
  }
  if (input.sequence !== undefined) {
    const tokens = input.sequence.split(SEQUENCE_SPLIT_RE).filter((token) => token.length > 0);
    if (tokens.length === 0) {
      errors.push('比赛序列不能为空，请输入 W/D/L（可用逗号或空白分隔）');
    } else if (tokens.length > SEQUENCE_LIMIT) {
      errors.push(`比赛序列长度不能超过 ${SEQUENCE_LIMIT} 场，当前为 ${tokens.length} 场`);
    } else {
      const invalid = tokens.find((token) => normalizeToken(token) === null);
      if (invalid !== undefined) {
        errors.push(`序列包含无法识别的记号「${invalid}」，仅支持 W/D/L（或 1/0.5/0）`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * 逐场推演比赛序列，每场重新计算期望得分并四舍五入更新评分
 * @param startRating - 起始评分
 * @param kFactor - K 系数
 * @param sequence - 比赛结果序列
 * @param opponentRating - 固定对手评分
 * @returns 逐场明细、最终评分与总变动
 */
export function simulateSequence(
  startRating: number,
  kFactor: number,
  sequence: MatchResult[],
  opponentRating: number,
): SequenceSimulation {
  const rows: SimulationRow[] = [];
  let rating = startRating;
  sequence.forEach((result, index) => {
    const expected = expectedScore(rating, opponentRating);
    const score = matchScore(result);
    const ratingBefore = rating;
    const ratingAfter = updateRating(rating, score, expected, kFactor);
    rows.push({
      index: index + 1,
      result,
      score,
      expected,
      ratingBefore,
      ratingAfter,
      delta: ratingAfter - ratingBefore,
    });
    rating = ratingAfter;
  });
  return {
    rows,
    finalRating: rating,
    totalDelta: rating - startRating,
  };
}

/**
 * 估算达到目标评分所需的连胜场数
 * 假设每场都战胜同一固定对手，逐场重新计算期望得分并四舍五入更新评分
 * （与 simulateSequence 的单场模型完全一致），直到评分达到或超过目标
 * @param startRating - 起始评分
 * @param targetRating - 目标评分
 * @param opponentRating - 固定对手评分
 * @param kFactor - K 系数
 * @returns 所需连胜场数；不可行或超过迭代上限时 feasible 为 false 并附带原因
 */
export function estimateWinsToTarget(
  startRating: number,
  targetRating: number,
  opponentRating: number,
  kFactor: number,
): WinsEstimate {
  if (targetRating <= startRating) {
    return { wins: 0, feasible: true };
  }
  let rating = startRating;
  let wins = 0;
  while (rating < targetRating) {
    const expected = expectedScore(rating, opponentRating);
    const nextRating = updateRating(rating, 1, expected, kFactor);
    if (nextRating <= rating) {
      return {
        wins,
        feasible: false,
        reason: '对手评分远低于当前评分，单场胜利的积分增长经四舍五入后为 0，连胜也无法达到目标评分',
      };
    }
    rating = nextRating;
    wins += 1;
    if (wins >= MAX_WIN_ITERATIONS) {
      return {
        wins: MAX_WIN_ITERATIONS,
        feasible: false,
        reason: `连胜 ${MAX_WIN_ITERATIONS} 场后仍未达到目标评分，已停止估算`,
      };
    }
  }
  return { wins, feasible: true };
}
