/**
 * RFC 9111 缓存年龄与新鲜度计算
 *
 * 参考：
 * - 4.2.1 Calculating Age
 * - 4.2.2 Freshness Lifetime
 * - 4.2.3 Calculating Heuristic Freshness
 * - 5.2 各 Cache-Control 指令语义
 */

import type { Directive } from './directives';
import { findDirective, hasDirective } from './directives';

/** 缓存侧类型 */
export type CacheSide = 'browser' | 'shared';

/** 新鲜度结论状态 */
export type FreshnessStatus =
  | 'FORBIDDEN' // no-store：禁止缓存
  | 'REVALIDATE' // no-cache / 请求端 max-age=0：使用前必须重新验证
  | 'FRESH' // 新鲜
  | 'STALE_GRACE' // 已过期但处于 stale-while-revalidate / stale-if-error 宽限期
  | 'STALE_ALLOWED' // 请求端 max-stale 显式允许陈旧
  | 'STALE' // 已过期且无宽限
  | 'HEURISTIC'; // 无显式寿命，只能启发式估算

/** 解析后的相关响应头时间值 */
export interface HeaderTimes {
  /** Date 头毫秒时间戳；缺失时为 null */
  dateValue: number | null;
  /** Expires 头毫秒时间戳；缺失或非法为 null */
  expiresValue: number | null;
  /** Last-Modified 头毫秒时间戳；缺失为 null */
  lastModifiedValue: number | null;
  /** Age 头秒数；缺失为 null */
  ageSeconds: number | null;
}

/** 新鲜度计算输入 */
export interface FreshnessInput extends HeaderTimes {
  /** 已解析的响应 Cache-Control 指令 */
  responseDirectives: Directive[];
  /** 已解析的请求 Cache-Control 指令（可为空数组） */
  requestDirectives: Directive[];
  /** 判定时刻（毫秒） */
  nowMs: number;
  /** 响应到达时刻（毫秒），即「响应里 Age 被观察到」的时刻；默认取 nowMs */
  receivedAtMs?: number;
  /** 缓存侧：浏览器或共享缓存（影响 s-maxage 选择） */
  cacheSide: CacheSide;
  /** 是否存在 ETag 协商缓存头 */
  hasEtag?: boolean;
  /** 启发式过期比例（Last-Modified 年龄的 10%），默认 0.1 */
  heuristicFraction?: number;
}

/** 计算明细，便于 UI 展示推导过程 */
export interface FreshnessResult {
  status: FreshnessStatus;
  /** 新鲜度寿命（秒）；启发式模式为估算值 */
  freshnessLifetimeSec: number | null;
  /** 当前年龄 corrected current age（秒，向上取整） */
  currentAgeSec: number;
  /** 剩余新鲜秒数；过期为负；无寿命为 null */
  remainingFreshSec: number | null;
  /** stale-while-revalidate 宽限剩余秒数；不适用为 null */
  graceRemainingSec: number | null;
  /** 寿命来源说明 */
  lifetimeSource: string;
  /** 结论的人类可读解释（中文） */
  explanation: string;
  /** 是否存在 ETag / Last-Modified 可用于协商缓存 */
  hasValidator: boolean;
}

/** 解析 HTTP 日期（RFC 7231 IMF-fixdate 等），非法返回 null */
export function parseHttpDate(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  // 0 / -1 是合法的 Expires「已过期」写法，但 Date.parse 对 "0" 返回 1970 附近值
  const ms = Date.parse(trimmed);
  return Number.isNaN(ms) ? null : ms;
}

/** 解析 Age 头（delta-seconds，非负整数） */
export function parseAgeHeader(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const match = value.trim().match(/^(\d+)/);
  if (!match || match[1] === undefined) {
    return null;
  }
  return Number(match[1]);
}

/** 计算 RFC 9111 的 corrected current age（秒） */
export function calculateCurrentAge(times: HeaderTimes, receivedAtMs: number, nowMs: number): number {
  const dateValue = times.dateValue ?? receivedAtMs;
  const apparentAge = Math.max(0, (receivedAtMs - dateValue) / 1000);
  const ageValue = times.ageSeconds ?? 0;
  const correctedInitialAge = Math.max(apparentAge, ageValue);
  const residentTime = (nowMs - receivedAtMs) / 1000;
  const currentAge = correctedInitialAge + Math.max(0, residentTime);
  // RFC 9111：年龄用整秒向上取整，保守判定
  return Math.ceil(currentAge);
}

/**
 * 计算新鲜度寿命与当前状态
 */
export function calculateFreshness(input: FreshnessInput): FreshnessResult {
  const {
    responseDirectives,
    requestDirectives,
    nowMs,
    cacheSide,
    heuristicFraction = 0.1,
  } = input;
  const receivedAtMs = input.receivedAtMs ?? nowMs;

  const ageSec = calculateCurrentAge(input, receivedAtMs, nowMs);
  const hasValidator = input.hasEtag === true || input.lastModifiedValue !== null;
  const base = {
    currentAgeSec: ageSec,
    hasValidator,
  };

  // 1. no-store：禁止存储
  if (hasDirective(responseDirectives, 'no-store') || hasDirective(requestDirectives, 'no-store')) {
    return {
      ...base,
      status: 'FORBIDDEN',
      freshnessLifetimeSec: null,
      remainingFreshSec: null,
      graceRemainingSec: null,
      lifetimeSource: 'no-store',
      explanation: '响应（或请求）携带 no-store：任何缓存都不得存储该响应，每次都需向源站重新获取。',
    };
  }

  // 2. 请求端 no-cache / max-age=0：强制重验
  const reqMaxAge = findDirective(requestDirectives, 'max-age');
  if (hasDirective(requestDirectives, 'no-cache') || (reqMaxAge && (reqMaxAge.numericValue ?? 0) === 0)) {
    return {
      ...base,
      status: 'REVALIDATE',
      freshnessLifetimeSec: null,
      remainingFreshSec: null,
      graceRemainingSec: null,
      lifetimeSource: 'request no-cache/max-age=0',
      explanation: '请求端携带 no-cache 或 max-age=0（典型场景：Ctrl/Cmd+Shift+R 或普通刷新）：缓存必须向源站重新验证后才能使用。',
    };
  }

  // 3. 无参数 no-cache：每次使用前重验
  const noCache = findDirective(responseDirectives, 'no-cache');
  if (noCache && noCache.value === null) {
    return {
      ...base,
      status: 'REVALIDATE',
      freshnessLifetimeSec: 0,
      remainingFreshSec: -ageSec,
      graceRemainingSec: null,
      lifetimeSource: 'no-cache',
      explanation: '响应携带无字段列表的 no-cache：响应可以被存储，但每次使用前都必须向源站重新验证（ETag/Last-Modified 命中时返回 304）。',
    };
  }

  // 4. 计算显式新鲜度寿命
  const sMaxAge = findDirective(responseDirectives, 's-maxage');
  const maxAge = findDirective(responseDirectives, 'max-age');

  let lifetimeSec: number | null = null;
  let source = '';

  if (cacheSide === 'shared' && sMaxAge && sMaxAge.numericValue !== null) {
    lifetimeSec = sMaxAge.numericValue;
    source = 's-maxage（共享缓存优先于 max-age 与 Expires）';
  } else if (maxAge && maxAge.numericValue !== null) {
    lifetimeSec = maxAge.numericValue;
    source = 'max-age';
  } else if (input.expiresValue !== null) {
    const dateValue = input.dateValue ?? receivedAtMs;
    lifetimeSec = Math.max(0, Math.round((input.expiresValue - dateValue) / 1000));
    source = 'Expires - Date';
  }

  // 5. 请求端 max-age（非 0）：覆盖响应端寿命，只允许年龄小于该值的响应
  let requestMaxAgeCap: number | null = null;
  if (reqMaxAge && reqMaxAge.numericValue !== null && reqMaxAge.numericValue > 0) {
    requestMaxAgeCap = reqMaxAge.numericValue;
  }

  // 6. 无显式寿命：启发式
  if (lifetimeSec === null) {
    let heuristicSec = 0;
    if (input.lastModifiedValue !== null && input.dateValue !== null) {
      const sinceLastModified = Math.max(0, (input.dateValue - input.lastModifiedValue) / 1000);
      heuristicSec = Math.floor(sinceLastModified * heuristicFraction);
    }
    return {
      ...base,
      status: 'HEURISTIC',
      freshnessLifetimeSec: heuristicSec,
      remainingFreshSec: heuristicSec - ageSec,
      graceRemainingSec: null,
      lifetimeSource: input.lastModifiedValue !== null
        ? `启发式：(Date - Last-Modified) × ${heuristicFraction * 100}% ≈ ${heuristicSec} 秒`
        : '启发式：无 Last-Modified，寿命不可估算，保守视为立即过期',
      explanation:
        heuristicSec > 0
          ? `响应未提供显式缓存寿命，按 RFC 9111 启发式以 Last-Modified 年龄的 ${heuristicFraction * 100}% 估算（约 ${heuristicSec} 秒）。各缓存实现比例不同，建议显式给出 max-age。`
          : '响应未提供 max-age / s-maxage / Expires，也没有 Last-Modified 可供启发式估算，缓存通常会保守地立即重新验证。',
    };
  }

  // 7. 新鲜/过期判定（请求 max-age 作为年龄上限）
  const effectiveAge = requestMaxAgeCap !== null ? ageSec : ageSec;
  const ageCap = requestMaxAgeCap;
  const remaining = lifetimeSec - effectiveAge;
  const freshByLifetime = remaining > 0;
  const freshByRequestCap = ageCap === null || ageSec < ageCap;
  const minFresh = findDirective(requestDirectives, 'min-fresh');
  const minFreshSec = minFresh?.numericValue ?? 0;
  const freshWithMinFresh = lifetimeSec - ageSec >= minFreshSec;

  const swr = findDirective(responseDirectives, 'stale-while-revalidate');
  const swrSec = swr?.numericValue ?? null;
  const staleFor = ageSec - lifetimeSec;
  const graceRemaining = swrSec !== null && staleFor >= 0 ? Math.max(0, swrSec - staleFor) : null;

  if (freshByLifetime && freshByRequestCap && freshWithMinFresh) {
    return {
      ...base,
      status: 'FRESH',
      freshnessLifetimeSec: lifetimeSec,
      remainingFreshSec: remaining,
      graceRemainingSec: swrSec,
      lifetimeSource: source,
      explanation: buildFreshExplanation(lifetimeSec, ageSec, remaining, responseDirectives),
    };
  }

  // 响应本身新鲜，但被请求端约束判为不可直接使用
  if (freshByLifetime && !freshByRequestCap) {
    return {
      ...base,
      status: 'STALE',
      freshnessLifetimeSec: lifetimeSec,
      remainingFreshSec: remaining,
      graceRemainingSec: null,
      lifetimeSource: source,
      explanation: `响应按其自身寿命仍新鲜（剩余 ${remaining} 秒），但请求端 max-age=${ageCap ?? 0} 要求当前年龄（${ageSec} 秒）小于该值，按请求约束需重新验证后才能使用。`,
    };
  }

  if (freshByLifetime && freshByRequestCap && !freshWithMinFresh) {
    return {
      ...base,
      status: 'STALE',
      freshnessLifetimeSec: lifetimeSec,
      remainingFreshSec: remaining,
      graceRemainingSec: null,
      lifetimeSource: source,
      explanation: `响应仍新鲜（剩余 ${remaining} 秒），但请求端 min-fresh=${minFreshSec} 要求至少还新鲜该秒数，当前余量不足，需重新验证。`,
    };
  }

  // 请求端 max-stale：允许接受过期响应
  const maxStale = findDirective(requestDirectives, 'max-stale');
  if (maxStale) {
    const maxStaleSec = maxStale.numericValue;
    if (maxStaleSec === null || staleFor <= maxStaleSec) {
      return {
        ...base,
        status: 'STALE_ALLOWED',
        freshnessLifetimeSec: lifetimeSec,
        remainingFreshSec: remaining,
        graceRemainingSec: graceRemaining,
        lifetimeSource: source,
        explanation:
          maxStaleSec === null
            ? `响应已过期 ${staleFor} 秒，但请求端 max-stale 未设上限，允许直接使用陈旧响应。`
            : `响应已过期 ${staleFor} 秒，未超过请求端 max-stale=${maxStaleSec} 秒的容忍上限，可使用陈旧响应。`,
      };
    }
  }

  // stale-while-revalidate 宽限期
  if (graceRemaining !== null && graceRemaining > 0) {
    return {
      ...base,
      status: 'STALE_GRACE',
      freshnessLifetimeSec: lifetimeSec,
      remainingFreshSec: remaining,
      graceRemainingSec: graceRemaining,
      lifetimeSource: source,
      explanation: `响应已过期 ${staleFor} 秒，但仍在 stale-while-revalidate=${swrSec ?? 0} 秒宽限期内：可立即返回陈旧响应，同时在后台发起重新验证；宽限剩余 ${graceRemaining} 秒。`,
    };
  }

  const mustRevalidate = hasDirective(responseDirectives, 'must-revalidate')
    || (cacheSide === 'shared' && hasDirective(responseDirectives, 'proxy-revalidate'));

  return {
    ...base,
    status: 'STALE',
    freshnessLifetimeSec: lifetimeSec,
    remainingFreshSec: remaining,
    graceRemainingSec: null,
    lifetimeSource: source,
    explanation: mustRevalidate
      ? `响应已过期 ${staleFor} 秒，且存在 must-revalidate${cacheSide === 'shared' ? '/proxy-revalidate' : ''}：禁止使用陈旧响应（即使源站不可达也不行），必须成功重新验证。`
      : `响应已过期 ${staleFor} 秒：正常情况下应向源站重新验证；若源站不可达，缓存可在风险自担的前提下临时返回陈旧响应（RFC 9111 §4.2.4）。`,
  };
}

function buildFreshExplanation(lifetime: number, age: number, remaining: number, directives: Directive[]): string {
  const immutable = hasDirective(directives, 'immutable');
  const parts = [
    `新鲜度寿命 ${lifetime} 秒，当前年龄 ${age} 秒，剩余新鲜时间约 ${remaining} 秒，响应处于新鲜状态，缓存可直接使用而无需请求源站。`,
  ];
  if (immutable) {
    parts.push('immutable 表示新鲜期内即使用户点击刷新也不发起重新验证。');
  }
  return parts.join('');
}
