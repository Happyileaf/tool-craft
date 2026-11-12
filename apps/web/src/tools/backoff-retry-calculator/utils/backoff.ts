/**
 * 指数退避与抖动重试策略的纯函数实现
 * 参考 AWS Architecture Blog "Exponential Backoff And Jitter"：
 * - 无抖动：delay = min(base * multiplier^n, cap)
 * - Full Jitter：delay = random(0, 上限)
 * - Equal Jitter：delay = 上限/2 + random(0, 上限/2)
 * 随机数以可注入 RNG 形式提供，保证纯函数可测试
 */

/** 抖动模式 */
export type JitterMode = 'none' | 'full' | 'equal';

/** 退避策略输入参数 */
export interface BackoffParams {
  /** 初始延迟（毫秒），必须为正数 */
  baseMs: number;
  /** 退避乘数，必须大于 1 */
  multiplier: number;
  /** 单次延迟上限（毫秒），必须为正数 */
  capMs: number;
  /** 重试次数（延迟条目数），范围 1-20 */
  maxRetries: number;
  /** 抖动模式 */
  jitter: JitterMode;
}

/** 单次重试的延迟推演结果 */
export interface RetryRow {
  /** 重试序号，从 1 开始 */
  attempt: number;
  /** 该次退避的理论上限 min(base * multiplier^(n-1), cap) */
  upperBoundMs: number;
  /** 实际延迟（无抖动时等于上限；抖动模式由 RNG 决定） */
  delayMs: number;
  /** 抖动模式下的延迟下界 */
  minMs: number;
  /** 抖动模式下的延迟上界 */
  maxMs: number;
  /** 期望延迟（均匀分布取区间中点；无抖动等于上限） */
  expectedMs: number;
  /** 含本次在内的累计实际延迟 */
  cumulativeMs: number;
  /** 含本次在内的累计期望延迟 */
  cumulativeExpectedMs: number;
}

/** 参数校验结果 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** 均匀随机数生成器，返回 [0, 1)；默认 Math.random，测试时可注入 */
export type Rng = () => number;

/**
 * 校验输入参数
 */
export function validateParams(params: BackoffParams): ValidationResult {
  const errors: string[] = [];
  if (!Number.isFinite(params.baseMs) || params.baseMs <= 0) {
    errors.push('初始延迟 base 必须为正数');
  }
  if (!Number.isFinite(params.multiplier) || params.multiplier <= 1) {
    errors.push('乘数 multiplier 必须大于 1');
  }
  if (!Number.isFinite(params.capMs) || params.capMs <= 0) {
    errors.push('最大延迟 cap 必须为正数');
  }
  if (
    Number.isFinite(params.baseMs) &&
    Number.isFinite(params.capMs) &&
    params.capMs < params.baseMs
  ) {
    errors.push('最大延迟 cap 不能小于初始延迟 base');
  }
  if (!Number.isInteger(params.maxRetries) || params.maxRetries < 1 || params.maxRetries > 20) {
    errors.push('重试次数必须为 1-20 之间的整数');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * 计算第 n 次重试（n 从 1 开始）的退避上限
 */
export function upperBound(params: BackoffParams, attempt: number): number {
  const raw = params.baseMs * Math.pow(params.multiplier, attempt - 1);
  return Math.min(raw, params.capMs);
}

/**
 * 依据抖动模式与 RNG 计算单次实际延迟及其区间
 */
export function computeDelay(
  bound: number,
  jitter: JitterMode,
  rng: Rng,
): { delayMs: number; minMs: number; maxMs: number; expectedMs: number } {
  if (jitter === 'full') {
    return {
      delayMs: rng() * bound,
      minMs: 0,
      maxMs: bound,
      expectedMs: bound / 2,
    };
  }
  if (jitter === 'equal') {
    const half = bound / 2;
    return {
      delayMs: half + rng() * half,
      minMs: half,
      maxMs: bound,
      expectedMs: (half + bound) / 2,
    };
  }
  return {
    delayMs: bound,
    minMs: bound,
    maxMs: bound,
    expectedMs: bound,
  };
}

/**
 * 推演完整重试时间表
 * @param params - 退避参数
 * @param rng - 可选随机数生成器，默认 Math.random
 */
export function planRetries(params: BackoffParams, rng: Rng = Math.random): RetryRow[] {
  const validation = validateParams(params);
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }
  const rows: RetryRow[] = [];
  let cumulative = 0;
  let cumulativeExpected = 0;
  for (let attempt = 1; attempt <= params.maxRetries; attempt += 1) {
    const bound = upperBound(params, attempt);
    const { delayMs, minMs, maxMs, expectedMs } = computeDelay(bound, params.jitter, rng);
    cumulative += delayMs;
    cumulativeExpected += expectedMs;
    rows.push({
      attempt,
      upperBoundMs: bound,
      delayMs,
      minMs,
      maxMs,
      expectedMs,
      cumulativeMs: cumulative,
      cumulativeExpectedMs: cumulativeExpected,
    });
  }
  return rows;
}

/**
 * 毫秒格式化为带秒换算的展示文本
 */
export function formatMs(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  return `${Math.round(ms)} ms（${(ms / 1000).toFixed(2)} s）`;
}
