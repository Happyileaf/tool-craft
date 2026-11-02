import { describe, expect, it } from 'vitest';
import { parseCacheControl } from './directives';
import {
  calculateCurrentAge,
  calculateFreshness,
  parseAgeHeader,
  parseHttpDate,
  type FreshnessInput,
} from './freshness';

const DATE = Date.parse('2026-11-03T12:00:00Z');
const NOW = Date.parse('2026-11-03T12:30:00Z'); // 1800 秒后

function buildInput(
  cacheControl: string,
  overrides: Partial<FreshnessInput> = {},
): FreshnessInput {
  const parsed = parseCacheControl(cacheControl, 'response');
  return {
    responseDirectives: parsed.directives,
    requestDirectives: [],
    dateValue: DATE,
    expiresValue: null,
    lastModifiedValue: null,
    ageSeconds: null,
    nowMs: NOW,
    cacheSide: 'browser',
    ...overrides,
  };
}

describe('parseHttpDate / parseAgeHeader', () => {
  it('解析标准 IMF-fixdate', () => {
    expect(parseHttpDate('Tue, 03 Nov 2026 12:00:00 GMT')).toBe(DATE);
  });

  it('非法日期返回 null', () => {
    expect(parseHttpDate('not-a-date')).toBeNull();
    expect(parseHttpDate('')).toBeNull();
    expect(parseHttpDate(null)).toBeNull();
  });

  it('解析 Age 头', () => {
    expect(parseAgeHeader('42')).toBe(42);
    expect(parseAgeHeader('42, 30')).toBe(42);
    expect(parseAgeHeader('garbage')).toBeNull();
    expect(parseAgeHeader(null)).toBeNull();
  });
});

describe('calculateCurrentAge', () => {
  it('仅根据 resident time 计算（无 Age 头）', () => {
    const age = calculateCurrentAge(
      { dateValue: DATE, expiresValue: null, lastModifiedValue: null, ageSeconds: null },
      DATE,
      NOW,
    );
    expect(age).toBe(1800);
  });

  it('Age 头大于 apparent age 时取 Age', () => {
    const age = calculateCurrentAge(
      { dateValue: DATE, expiresValue: null, lastModifiedValue: null, ageSeconds: 5000 },
      DATE,
      NOW,
    );
    expect(age).toBe(6800);
  });

  it('Date 时钟偏差导致 apparent age 为负时归零', () => {
    const age = calculateCurrentAge(
      { dateValue: NOW + 10000, expiresValue: null, lastModifiedValue: null, ageSeconds: null },
      NOW,
      NOW,
    );
    expect(age).toBe(0);
  });
});

describe('calculateFreshness', () => {
  it('max-age 内为 FRESH', () => {
    const result = calculateFreshness(buildInput('public, max-age=3600'));
    expect(result.status).toBe('FRESH');
    expect(result.freshnessLifetimeSec).toBe(3600);
    expect(result.remainingFreshSec).toBe(1800);
    expect(result.lifetimeSource).toBe('max-age');
  });

  it('超过 max-age 为 STALE', () => {
    const result = calculateFreshness(buildInput('max-age=600'));
    expect(result.status).toBe('STALE');
    expect(result.remainingFreshSec).toBe(-1200);
  });

  it('must-revalidate 过期后解释包含强制重验', () => {
    const result = calculateFreshness(buildInput('max-age=600, must-revalidate'));
    expect(result.status).toBe('STALE');
    expect(result.explanation).toContain('must-revalidate');
  });

  it('no-store 直接禁止缓存', () => {
    const result = calculateFreshness(buildInput('no-store, max-age=600'));
    expect(result.status).toBe('FORBIDDEN');
    expect(result.freshnessLifetimeSec).toBeNull();
  });

  it('无参数 no-cache 要求每次重验', () => {
    const result = calculateFreshness(buildInput('no-cache'));
    expect(result.status).toBe('REVALIDATE');
  });

  it('请求端 no-cache 强制重验', () => {
    const result = calculateFreshness(
      buildInput('max-age=3600', {
        requestDirectives: parseCacheControl('no-cache', 'request').directives,
      }),
    );
    expect(result.status).toBe('REVALIDATE');
  });

  it('请求端 max-age=0 强制重验', () => {
    const result = calculateFreshness(
      buildInput('max-age=3600', {
        requestDirectives: parseCacheControl('max-age=0', 'request').directives,
      }),
    );
    expect(result.status).toBe('REVALIDATE');
  });

  it('共享缓存优先使用 s-maxage', () => {
    const fresh = calculateFreshness(
      buildInput('max-age=60, s-maxage=3600', { cacheSide: 'shared' }),
    );
    expect(fresh.status).toBe('FRESH');
    expect(fresh.freshnessLifetimeSec).toBe(3600);

    const browser = calculateFreshness(
      buildInput('max-age=60, s-maxage=3600', { cacheSide: 'browser' }),
    );
    expect(browser.status).toBe('STALE');
    expect(browser.freshnessLifetimeSec).toBe(60);
  });

  it('无 max-age 时使用 Expires - Date', () => {
    const result = calculateFreshness(
      buildInput('public', { expiresValue: DATE + 3600_000 }),
    );
    expect(result.status).toBe('FRESH');
    expect(result.freshnessLifetimeSec).toBe(3600);
  });

  it('stale-while-revalidate 宽限期为 STALE_GRACE', () => {
    // 寿命 600，当前 1800，过期 1200 秒；swr=3600，宽限剩余 2400
    const result = calculateFreshness(buildInput('max-age=600, stale-while-revalidate=3600'));
    expect(result.status).toBe('STALE_GRACE');
    expect(result.graceRemainingSec).toBe(2400);
  });

  it('超出 swr 宽限期为 STALE', () => {
    const result = calculateFreshness(buildInput('max-age=600, stale-while-revalidate=600'));
    expect(result.status).toBe('STALE');
    expect(result.graceRemainingSec).toBeNull();
  });

  it('请求端 max-stale 容忍过期响应', () => {
    // 过期 1200 秒，max-stale=2000 允许
    const allowed = calculateFreshness(
      buildInput('max-age=600', {
        requestDirectives: parseCacheControl('max-stale=2000', 'request').directives,
      }),
    );
    expect(allowed.status).toBe('STALE_ALLOWED');
  });

  it('max-stale 不足时回落为 STALE', () => {
    const result = calculateFreshness(
      buildInput('max-age=600', {
        requestDirectives: parseCacheControl('max-stale=600', 'request').directives,
      }),
    );
    expect(result.status).toBe('STALE');
  });

  it('min-fresh 要求更多新鲜时间', () => {
    // 剩余 1800 秒，min-fresh=3600 不满足
    const fail = calculateFreshness(
      buildInput('max-age=3600', {
        requestDirectives: parseCacheControl('min-fresh=3600', 'request').directives,
      }),
    );
    expect(fail.status).toBe('STALE');

    // min-fresh=600 满足（1800 >= 600）
    const pass = calculateFreshness(
      buildInput('max-age=3600', {
        requestDirectives: parseCacheControl('min-fresh=600', 'request').directives,
      }),
    );
    expect(pass.status).toBe('FRESH');
  });

  it('无任何寿命但有 Last-Modified 时启发式估算 10%', () => {
    // Last-Modified 比 Date 早 10 小时 → 启发式寿命 3600 秒；当前年龄 1800 → 仍在启发式新鲜期
    const result = calculateFreshness(
      buildInput('public', { lastModifiedValue: DATE - 10 * 3600_000 }),
    );
    expect(result.status).toBe('HEURISTIC');
    expect(result.freshnessLifetimeSec).toBe(3600);
    expect(result.remainingFreshSec).toBe(1800);
  });

  it('无寿命且无 Last-Modified 时启发式寿命为 0', () => {
    const result = calculateFreshness(buildInput('public'));
    expect(result.status).toBe('HEURISTIC');
    expect(result.freshnessLifetimeSec).toBe(0);
  });

  it('存在 ETag 时 hasValidator 为 true', () => {
    const result = calculateFreshness(buildInput('no-cache', { hasEtag: true }));
    expect(result.hasValidator).toBe(true);
  });

  it('immutable 在新鲜解释中提示', () => {
    const result = calculateFreshness(buildInput('max-age=3600, immutable'));
    expect(result.status).toBe('FRESH');
    expect(result.explanation).toContain('immutable');
  });
});
