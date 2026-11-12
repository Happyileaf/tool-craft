import { describe, expect, it } from 'vitest';
import {
  evaluateFreshness,
  parseDirectives,
  parseHeaderBlock,
  parseResponseHeaders,
} from './cache-control';

/** 固定「当前时间」：2026-11-12T00:00:00Z */
const NOW = Date.UTC(2026, 10, 12, 0, 0, 0);
const DATE_HEADER = 'Wed, 12 Nov 2026 00:00:00 GMT';

describe('parseHeaderBlock', () => {
  it('lower-cases keys and preserves values', () => {
    const map = parseHeaderBlock('Cache-Control: max-age=60\nAge: 10');
    expect(map.get('cache-control')).toBe('max-age=60');
    expect(map.get('age')).toBe('10');
  });

  it('merges repeated headers with a comma', () => {
    const map = parseHeaderBlock('Cache-Control: public\nCache-Control: max-age=60');
    expect(map.get('cache-control')).toBe('public, max-age=60');
  });

  it('ignores blank and malformed lines', () => {
    const map = parseHeaderBlock('\nnot-a-header\nCache-Control: no-store\n');
    expect(map.size).toBe(1);
  });
});

describe('parseDirectives', () => {
  it('parses boolean and value directives', () => {
    const directives = parseDirectives('public, max-age=60, no-cache');
    expect(directives).toEqual([
      { name: 'public', value: null, known: true },
      { name: 'max-age', value: '60', known: true },
      { name: 'no-cache', value: null, known: true },
    ]);
  });

  it('flags unknown directives while keeping them', () => {
    const directives = parseDirectives('x-foo=bar, immutable');
    expect(directives[0]).toEqual({ name: 'x-foo', value: 'bar', known: false });
    expect(directives[1]!.known).toBe(true);
  });

  it('strips double quotes from values', () => {
    expect(parseDirectives('no-cache="Set-Cookie"')[0]!.value).toBe('Set-Cookie');
  });
});

describe('evaluateFreshness', () => {
  it('marks a response fresh when age is below max-age', () => {
    const result = evaluateFreshness(
      `Cache-Control: max-age=60\nDate: ${DATE_HEADER}\nAge: 0`,
      NOW,
    );
    expect(result.status).toBe('fresh');
    expect(result.freshnessLifetimeSec).toBe(60);
    expect(result.currentAgeSec).toBe(0);
    expect(result.remainingFreshSec).toBe(60);
  });

  it('marks a response stale once age exceeds max-age', () => {
    const result = evaluateFreshness(
      `Cache-Control: max-age=60\nDate: ${DATE_HEADER}\nAge: 61`,
      NOW,
    );
    expect(result.status).toBe('stale');
    expect(result.remainingFreshSec).toBe(-1);
  });

  it('prefers s-maxage over max-age for shared caches', () => {
    const result = evaluateFreshness(
      `Cache-Control: public, s-maxage=120, max-age=60\nDate: ${DATE_HEADER}`,
      NOW,
    );
    expect(result.sharedCache).toBe(true);
    expect(result.freshnessLifetimeSec).toBe(120);
    expect(result.notices.join('')).toContain('s-maxage');
  });

  it('short-circuits on no-store regardless of other directives', () => {
    const result = evaluateFreshness(
      `Cache-Control: no-store, max-age=9999\nDate: ${DATE_HEADER}`,
      NOW,
    );
    expect(result.status).toBe('no-store');
    expect(result.freshnessLifetimeSec).toBe(0);
  });

  it('forces revalidate for no-cache even while fresh by age', () => {
    const result = evaluateFreshness(
      `Cache-Control: no-cache, max-age=600\nDate: ${DATE_HEADER}`,
      NOW,
    );
    expect(result.status).toBe('revalidate');
    expect(result.notices.join('')).toContain('no-cache');
  });

  it('derives lifetime from Expires minus Date when max-age is absent', () => {
    const result = evaluateFreshness(
      `Date: ${DATE_HEADER}\nExpires: Wed, 12 Nov 2026 00:01:30 GMT`,
      NOW,
    );
    expect(result.freshnessLifetimeSec).toBe(90);
    expect(result.status).toBe('fresh');
  });

  it('falls back to heuristic status with a notice when no lifetime source exists', () => {
    const result = evaluateFreshness(`Date: ${DATE_HEADER}`, NOW);
    expect(result.status).toBe('heuristic');
    expect(result.freshnessLifetimeSec).toBeNull();
    expect(result.notices.join('')).toContain('启发式');
  });

  it('accounts for resident time when no Age header is present', () => {
    // 响应在 30 秒前产生，无 Age 头，current age 应为 30
    const result = evaluateFreshness(
      `Cache-Control: max-age=60\nDate: Wed, 12 Nov 2026 00:00:00 GMT`,
      NOW + 30_000,
    );
    expect(result.currentAgeSec).toBe(30);
    expect(result.remainingFreshSec).toBe(30);
  });

  it('takes the max of Age header and apparent age', () => {
    const result = parseResponseHeaders(
      `Cache-Control: max-age=60\nDate: ${DATE_HEADER}\nAge: 45`,
    );
    expect(result.ageSeconds).toBe(45);
    const evaluated = evaluateFreshness(
      `Cache-Control: max-age=60\nDate: ${DATE_HEADER}\nAge: 45`,
      NOW + 60_000,
    );
    // apparent/resident age = 60，Age=45，取大值 60 → stale
    expect(evaluated.currentAgeSec).toBe(60);
    expect(evaluated.status).toBe('stale');
  });

  it('records invalid Age values as errors without crashing', () => {
    const parsed = parseResponseHeaders(`Cache-Control: max-age=60\nAge: abc`);
    expect(parsed.ageSeconds).toBeNull();
    expect(parsed.errors.join('')).toContain('Age');
  });

  it('surfaces ETag and Last-Modified as conditional-request hints', () => {
    const result = evaluateFreshness(
      `Cache-Control: max-age=60\nDate: ${DATE_HEADER}\nETag: "v1"\nLast-Modified: ${DATE_HEADER}`,
      NOW,
    );
    expect(result.notices.join('')).toContain('ETag');
    expect(result.notices.join('')).toContain('Last-Modified');
  });

  it('explains stale-while-revalidate window after expiry', () => {
    const result = evaluateFreshness(
      `Cache-Control: max-age=10, stale-while-revalidate=30\nDate: ${DATE_HEADER}\nAge: 15`,
      NOW,
    );
    expect(result.status).toBe('stale');
    expect(result.notices.join('')).toContain('stale-while-revalidate');
  });
});
