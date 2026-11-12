/**
 * RFC 9111 HTTP 缓存控制解析与新鲜度计算的纯函数实现
 * 关键模型：
 * - freshness_lifetime：s-maxage > max-age > (Expires - Date) > 启发式（未知）
 * - current_age：corrected_initial_age 与 resident_time(now - date_value) 取大
 * - fresh 当且仅当 current_age < freshness_lifetime
 * 所有时间以可注入 now（毫秒时间戳）驱动，保证单测确定性
 */

/** 单条 Cache-Control 指令 */
export interface CacheDirective {
  /** 指令名（小写） */
  name: string;
  /** 指令值；布尔型指令为 null */
  value: string | null;
  /** 是否为本工具识别的标准指令 */
  known: boolean;
}

/** 解析后的头部集合 */
export interface ParsedHeaders {
  /** Cache-Control 指令（保留出现顺序） */
  directives: CacheDirective[];
  /** Age 头秒数（解析失败为 null） */
  ageSeconds: number | null;
  /** Date 头时间戳（毫秒，缺失或非法为 null） */
  dateValue: number | null;
  /** Expires 头时间戳（毫秒，缺失或非法为 null） */
  expiresValue: number | null;
  /** 是否存在 ETag */
  hasEtag: boolean;
  /** 是否存在 Last-Modified */
  hasLastModified: boolean;
  /** 解析过程中的错误信息 */
  errors: string[];
}

/** 新鲜度结论 */
export type FreshnessStatus = 'no-store' | 'fresh' | 'stale' | 'revalidate' | 'heuristic';

/** 最终评估结果 */
export interface FreshnessResult {
  status: FreshnessStatus;
  /** 新鲜度寿命（秒）；启发式未知时为 null */
  freshnessLifetimeSec: number | null;
  /** 校正后的当前年龄（秒） */
  currentAgeSec: number;
  /** 剩余新鲜秒数（stale 时为负数；未知寿命时为 null） */
  remainingFreshSec: number | null;
  /** 是否共享缓存语境（存在 s-maxage 时为 true） */
  sharedCache: boolean;
  /** 提示信息（冲突、未知指令、协商缓存等） */
  notices: string[];
  directives: CacheDirective[];
}

const KNOWN_DIRECTIVES = new Set([
  'public',
  'private',
  'no-cache',
  'no-store',
  'max-age',
  's-maxage',
  'must-revalidate',
  'proxy-revalidate',
  'immutable',
  'stale-while-revalidate',
  'stale-if-error',
  'no-transform',
]);

/**
 * 将多行 `Key: Value` 头部文本解析为不区分大小写的 Map
 */
export function parseHeaderBlock(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const index = trimmed.indexOf(':');
    if (index <= 0) {
      continue;
    }
    const key = trimmed.slice(0, index).trim().toLowerCase();
    const value = trimmed.slice(index + 1).trim();
    // 同名头按 RFC 规则逗号合并，Cache-Control 多值合并是安全的
    const existing = map.get(key);
    map.set(key, existing === undefined ? value : `${existing}, ${value}`);
  }
  return map;
}

/**
 * 解析 Cache-Control 头为指令数组
 */
export function parseDirectives(cacheControl: string | undefined): CacheDirective[] {
  if (!cacheControl) {
    return [];
  }
  return cacheControl
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .map((token) => {
      const eq = token.indexOf('=');
      if (eq === -1) {
        const name = token.toLowerCase();
        return { name, value: null, known: KNOWN_DIRECTIVES.has(name) };
      }
      const name = token.slice(0, eq).trim().toLowerCase();
      const rawValue = token.slice(eq + 1).trim();
      const value = rawValue.startsWith('"') && rawValue.endsWith('"')
        ? rawValue.slice(1, -1)
        : rawValue;
      return { name, value, known: KNOWN_DIRECTIVES.has(name) };
    });
}

/**
 * 解析完整响应头文本
 */
export function parseResponseHeaders(raw: string): ParsedHeaders {
  const map = parseHeaderBlock(raw);
  const directives = parseDirectives(map.get('cache-control'));
  const errors: string[] = [];

  const ageRaw = map.get('age');
  let ageSeconds: number | null = null;
  if (ageRaw !== undefined) {
    const parsed = Number(ageRaw);
    if (Number.isFinite(parsed) && parsed >= 0) {
      ageSeconds = Math.floor(parsed);
    } else {
      errors.push(`Age 头无法解析为非负整数：${ageRaw}`);
    }
  }

  const dateRaw = map.get('date');
  const dateValue = dateRaw ? parseHttpDate(dateRaw) : null;
  if (dateRaw && dateValue === null) {
    errors.push(`Date 头无法解析：${dateRaw}`);
  }

  const expiresRaw = map.get('expires');
  const expiresValue = expiresRaw ? parseHttpDate(expiresRaw) : null;
  if (expiresRaw && expiresValue === null && expiresRaw !== '0' && expiresRaw.toLowerCase() !== 'invalid date') {
    errors.push(`Expires 头无法解析：${expiresRaw}`);
  }

  return {
    directives,
    ageSeconds,
    dateValue,
    expiresValue,
    hasEtag: map.has('etag'),
    hasLastModified: map.has('last-modified'),
    errors,
  };
}

/**
 * 解析 IMF-fixdate（RFC 7231）形式的 HTTP 日期
 */
export function parseHttpDate(value: string): number | null {
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

function directiveValue(directives: CacheDirective[], name: string): string | null | undefined {
  return directives.find((item) => item.name === name)?.value;
}

function hasDirective(directives: CacheDirective[], name: string): boolean {
  return directives.some((item) => item.name === name);
}

function nonNegativeInt(value: string | null | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.floor(parsed);
}

/**
 * 评估缓存新鲜度
 * @param rawHeaders - 多行响应头文本
 * @param nowMs - 当前时间戳（毫秒），默认 Date.now()，测试可注入
 */
export function evaluateFreshness(
  rawHeaders: string,
  nowMs: number = Date.now(),
): FreshnessResult {
  const parsed = parseResponseHeaders(rawHeaders);
  const { directives } = parsed;
  const notices: string[] = [...parsed.errors];
  const sharedCache = hasDirective(directives, 's-maxage');

  // no-store 最高优先级：禁止存储，直接短路
  if (hasDirective(directives, 'no-store')) {
    notices.push('存在 no-store：响应禁止被任何缓存存储，新鲜度指令不生效');
    return {
      status: 'no-store',
      freshnessLifetimeSec: 0,
      currentAgeSec: 0,
      remainingFreshSec: 0,
      sharedCache,
      notices,
      directives,
    };
  }

  // 未知指令提示（不影响解析）
  for (const directive of directives) {
    if (!directive.known) {
      notices.push(`未知指令：${directive.name}${directive.value === null ? '' : `=${directive.value}`}`);
    }
  }

  // 冲突与语义提示
  if (hasDirective(directives, 'no-cache') && hasDirective(directives, 'max-age')) {
    notices.push('同时存在 no-cache 与 max-age：使用缓存前必须向源站协商验证');
  }
  if (hasDirective(directives, 'private') && sharedCache) {
    notices.push('同时存在 private 与 s-maxage：共享缓存不应存储该响应');
  }

  // RFC 9111 §4.2.3 corrected initial age
  const dateValue = parsed.dateValue ?? nowMs;
  const apparentAge = Math.max(0, Math.floor((nowMs - dateValue) / 1000));
  const ageFromHeader = parsed.ageSeconds ?? 0;
  const correctedInitialAge = Math.max(apparentAge, ageFromHeader);
  const residentTime = Math.max(0, Math.floor((nowMs - dateValue) / 1000));
  const currentAgeSec = Math.max(correctedInitialAge, residentTime);

  // 新鲜度寿命优先级：s-maxage > max-age > Expires-Date > 启发式
  const sMaxAge = nonNegativeInt(directiveValue(directives, 's-maxage'));
  const maxAge = nonNegativeInt(directiveValue(directives, 'max-age'));

  let freshnessLifetimeSec: number | null = null;
  if (sharedCache && sMaxAge !== null) {
    freshnessLifetimeSec = sMaxAge;
    if (maxAge !== null && maxAge !== sMaxAge) {
      notices.push(`共享缓存采用 s-maxage=${sMaxAge}s，浏览器 max-age=${maxAge}s 仅对私有缓存生效`);
    }
  } else if (maxAge !== null) {
    freshnessLifetimeSec = maxAge;
  } else if (parsed.expiresValue !== null) {
    const diff = Math.floor((parsed.expiresValue - dateValue) / 1000);
    freshnessLifetimeSec = Math.max(0, diff);
    if (parsed.dateValue === null) {
      notices.push('缺少 Date 头，Expires 寿命按当前时间近似估算');
    }
  } else {
    notices.push('无 max-age / s-maxage / Expires：缓存可采用启发式新鲜度，本工具不臆测具体寿命');
  }

  if (hasDirective(directives, 'no-cache')) {
    return {
      status: 'revalidate',
      freshnessLifetimeSec,
      currentAgeSec,
      remainingFreshSec: freshnessLifetimeSec === null ? null : freshnessLifetimeSec - currentAgeSec,
      sharedCache,
      notices,
      directives,
    };
  }

  if (freshnessLifetimeSec === null) {
    return {
      status: 'heuristic',
      freshnessLifetimeSec: null,
      currentAgeSec,
      remainingFreshSec: null,
      sharedCache,
      notices,
      directives,
    };
  }

  const remainingFreshSec = freshnessLifetimeSec - currentAgeSec;
  const status: FreshnessStatus = remainingFreshSec > 0 ? 'fresh' : 'stale';

  if (status === 'stale') {
    if (hasDirective(directives, 'must-revalidate') || hasDirective(directives, 'proxy-revalidate')) {
      notices.push('已过期且存在 must-revalidate/proxy-revalidate：禁止直接使用陈旧响应，必须重新验证');
    }
    const swr = nonNegativeInt(directiveValue(directives, 'stale-while-revalidate'));
    if (swr !== null) {
      notices.push(`stale-while-revalidate=${swr}s：陈旧后 ${swr}s 内可后台刷新同时返回旧响应`);
    }
  }

  if (parsed.hasEtag || parsed.hasLastModified) {
    notices.push(
      `存在协商缓存头（${[parsed.hasEtag ? 'ETag' : null, parsed.hasLastModified ? 'Last-Modified' : null]
        .filter(Boolean)
        .join(' / ')}）：过期后可发起条件请求验证`,
    );
  }

  return {
    status,
    freshnessLifetimeSec,
    currentAgeSec,
    remainingFreshSec,
    sharedCache,
    notices,
    directives,
  };
}

/**
 * 状态码对应的中文标签与配色语义
 */
export const STATUS_META: Record<FreshnessStatus, { label: string; tone: 'success' | 'warning' | 'error' | 'default' }> = {
  fresh: { label: 'Fresh（新鲜）', tone: 'success' },
  stale: { label: 'Stale（已陈旧）', tone: 'error' },
  revalidate: { label: '需协商验证（no-cache）', tone: 'warning' },
  'no-store': { label: '禁止存储（no-store）', tone: 'error' },
  heuristic: { label: '启发式新鲜度（寿命未知）', tone: 'default' },
};
