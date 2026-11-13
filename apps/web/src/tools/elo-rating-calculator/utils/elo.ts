/**
 * Elo 等级分纯函数集合，不依赖 DOM 与 React；
 * 公式遵循 Arpad Elo 国际象棋评分体系，全部运算在浏览器本地完成
 */

/** 结果常量：胜（1 分）、平（0.5 分）、负（0 分） */
export const SCORE_WIN = 1;
export const SCORE_DRAW = 0.5;
export const SCORE_LOSS = 0;

/** 等级分计算的默认底数常数（FIDE 标准取 400） */
export const DEFAULT_SCALE = 400;

/** 批量推演中允许的最大对局条数，防止超长文本造成卡顿 */
export const MAX_MATCH_ROWS = 200;

/** 单场对局结果 */
export interface MatchResult {
  /** 对手赛前等级分 */
  opponentRating: number;
  /** 实际得分：1 胜 / 0.5 平 / 0 负 */
  score: number;
}

/** 单场对局推演明细 */
export interface MatchStep extends MatchResult {
  /** 序号，从 1 开始 */
  index: number;
  /** 赛前等级分 */
  ratingBefore: number;
  /** 期望胜率（0–1） */
  expected: number;
  /** 本场 K 因子 */
  kFactor: number;
  /** 本场得分变化（带符号） */
  delta: number;
  /** 赛后等级分（按两位小数保留） */
  ratingAfter: number;
}

/**
 * 计算期望胜率 E = 1 / (1 + 10^((Rb − Ra) / scale))
 *
 * @param ratingA - 己方等级分
 * @param ratingB - 对手等级分
 * @param scale - 底数常数，默认 400
 * @returns 己方的期望得分，区间 (0, 1)
 */
export function expectedScore(
  ratingA: number,
  ratingB: number,
  scale: number = DEFAULT_SCALE,
): number {
  if (!Number.isFinite(ratingA) || !Number.isFinite(ratingB) || !Number.isFinite(scale)) {
    throw new Error('等级分与底数常数必须为有限数值');
  }
  if (scale <= 0) {
    throw new Error('底数常数必须大于 0');
  }
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / scale));
}

/**
 * 计算单场赛后的等级分变化量 Δ = K × (S − E)
 *
 * @param kFactor - K 因子
 * @param actualScore - 实际得分（1 / 0.5 / 0）
 * @param expected - 期望胜率
 * @returns 带符号的分数变化
 */
export function ratingDelta(
  kFactor: number,
  actualScore: number,
  expected: number,
): number {
  if (!Number.isFinite(kFactor) || kFactor <= 0) {
    throw new Error('K 因子必须为大于 0 的有限数值');
  }
  if (actualScore !== SCORE_WIN && actualScore !== SCORE_DRAW && actualScore !== SCORE_LOSS) {
    throw new Error('实际得分只能为 1（胜）、0.5（平）或 0（负）');
  }
  if (expected < 0 || expected > 1) {
    throw new Error('期望胜率必须落在 0–1 区间');
  }
  return kFactor * (actualScore - expected);
}

/**
 * 按两位小数四舍五入，避免浮点尾差在明细表中累积
 *
 * @param value - 原始数值
 * @returns 保留两位小数的数值
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * 计算一场对局后的新等级分
 *
 * @param currentRating - 赛前等级分
 * @param opponentRating - 对手等级分
 * @param score - 实际得分
 * @param kFactor - K 因子
 * @param scale - 底数常数
 * @returns 赛后等级分（两位小数）
 */
export function updateRating(
  currentRating: number,
  opponentRating: number,
  score: number,
  kFactor: number,
  scale: number = DEFAULT_SCALE,
): number {
  const expected = expectedScore(currentRating, opponentRating, scale);
  const delta = ratingDelta(kFactor, score, expected);
  return round2(currentRating + delta);
}

/**
 * 校验初始等级分与 K 因子的合法性
 *
 * @param initialRating - 初始等级分
 * @param kFactor - K 因子
 * @returns 校验通过返回 null，否则返回中文错误信息
 */
export function validateInputs(initialRating: number, kFactor: number): string | null {
  if (!Number.isFinite(initialRating)) {
    return '初始等级分必须为有限数值';
  }
  if (initialRating < 0 || initialRating > 10000) {
    return '初始等级分需落在 0–10000 区间';
  }
  if (!Number.isFinite(kFactor) || kFactor <= 0 || kFactor > 200) {
    return 'K 因子需为 0–200 之间的正数';
  }
  return null;
}

/**
 * 将批量文本解析为对局序列。
 * 每行格式：`对手分,结果`，结果接受 W/D/L（大小写均可）或 1/0.5/0；
 * 空行跳过，非法行带行号报错。
 *
 * @param text - 多行原始文本
 * @returns 对局结果数组
 */
export function parseMatchText(text: string): MatchResult[] {
  const lines = text.split(/\r?\n/);
  const matches: MatchResult[] = [];
  const errors: string[] = [];

  lines.forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (line === '') {
      return;
    }
    const parts = line.split(/[,\t]/).map((part) => part.trim());
    if (parts.length !== 2) {
      errors.push(`第 ${lineIndex + 1} 行格式错误，应为「对手等级分,结果」`);
      return;
    }
    const [rawOpponent = '', rawResult = ''] = parts;
    const opponent = Number(rawOpponent);
    if (!Number.isFinite(opponent) || opponent < 0 || opponent > 10000) {
      errors.push(`第 ${lineIndex + 1} 行对手等级分非法：${rawOpponent}`);
      return;
    }
    const resultToken = rawResult.toUpperCase();
    let score: number;
    if (resultToken === 'W' || resultToken === '1' || resultToken === 'WIN') {
      score = SCORE_WIN;
    } else if (resultToken === 'D' || resultToken === '0.5' || resultToken === 'DRAW') {
      score = SCORE_DRAW;
    } else if (resultToken === 'L' || resultToken === '0' || resultToken === 'LOSS') {
      score = SCORE_LOSS;
    } else {
      errors.push(`第 ${lineIndex + 1} 行结果非法：${rawResult}（仅支持 W/D/L）`);
      return;
    }
    matches.push({ opponentRating: opponent, score });
  });

  if (errors.length > 0) {
    throw new Error(errors.join('；'));
  }
  if (matches.length > MAX_MATCH_ROWS) {
    throw new Error(`对局条数超出上限 ${MAX_MATCH_ROWS}，当前 ${matches.length} 条`);
  }
  return matches;
}

/**
 * 按顺序推演整批对局，返回逐步明细与最终等级分；
 * 每一步均基于上一步的赛后等级分继续计算。
 *
 * @param initialRating - 初始等级分
 * @param kFactor - 固定 K 因子
 * @param matches - 对局序列
 * @param scale - 底数常数
 * @returns 逐步明细（含最终分）
 */
export function simulateSeries(
  initialRating: number,
  kFactor: number,
  matches: MatchResult[],
  scale: number = DEFAULT_SCALE,
): { steps: MatchStep[]; finalRating: number; totalDelta: number } {
  const error = validateInputs(initialRating, kFactor);
  if (error) {
    throw new Error(error);
  }
  let rating = initialRating;
  const steps: MatchStep[] = matches.map((match, index) => {
    const ratingBefore = rating;
    const expected = expectedScore(ratingBefore, match.opponentRating, scale);
    const delta = ratingDelta(kFactor, match.score, expected);
    const ratingAfter = round2(ratingBefore + delta);
    rating = ratingAfter;
    return {
      index: index + 1,
      opponentRating: match.opponentRating,
      score: match.score,
      ratingBefore: round2(ratingBefore),
      expected: round2(expected),
      kFactor,
      delta: round2(delta),
      ratingAfter,
    };
  });
  return {
    steps,
    finalRating: round2(rating),
    totalDelta: round2(rating - initialRating),
  };
}
