import { describe, expect, it } from 'vitest';
import {
  computeDelay,
  formatMs,
  planRetries,
  upperBound,
  validateParams,
  type BackoffParams,
} from './backoff';

const BASE_PARAMS: BackoffParams = {
  baseMs: 100,
  multiplier: 2,
  capMs: 1000,
  maxRetries: 6,
  jitter: 'none',
};

/** 恒返回 0 的 RNG：Full Jitter 取下界，Equal Jitter 取下界 */
const zeroRng = (): number => 0;
/** 恒返回 0.99999 的 RNG，用于逼近上界而不依赖 Math.random */
const nearOneRng = (): number => 0.99999;

describe('validateParams', () => {
  it('accepts valid parameters', () => {
    expect(validateParams(BASE_PARAMS).valid).toBe(true);
  });

  it('rejects non-positive base', () => {
    expect(validateParams({ ...BASE_PARAMS, baseMs: 0 }).valid).toBe(false);
    expect(validateParams({ ...BASE_PARAMS, baseMs: -5 }).errors.join('')).toContain('base');
  });

  it('rejects multiplier <= 1', () => {
    expect(validateParams({ ...BASE_PARAMS, multiplier: 1 }).valid).toBe(false);
  });

  it('rejects cap smaller than base and non-positive cap', () => {
    expect(validateParams({ ...BASE_PARAMS, capMs: 50 }).valid).toBe(false);
    expect(validateParams({ ...BASE_PARAMS, capMs: 0 }).valid).toBe(false);
  });

  it('rejects retry counts outside 1-20 or non-integers', () => {
    expect(validateParams({ ...BASE_PARAMS, maxRetries: 0 }).valid).toBe(false);
    expect(validateParams({ ...BASE_PARAMS, maxRetries: 21 }).valid).toBe(false);
    expect(validateParams({ ...BASE_PARAMS, maxRetries: 2.5 }).valid).toBe(false);
  });
});

describe('upperBound', () => {
  it('grows exponentially then clamps at cap', () => {
    expect(upperBound(BASE_PARAMS, 1)).toBe(100);
    expect(upperBound(BASE_PARAMS, 2)).toBe(200);
    expect(upperBound(BASE_PARAMS, 3)).toBe(400);
    expect(upperBound(BASE_PARAMS, 4)).toBe(800);
    // 1600 被 cap 截断为 1000
    expect(upperBound(BASE_PARAMS, 5)).toBe(1000);
    expect(upperBound(BASE_PARAMS, 6)).toBe(1000);
  });
});

describe('planRetries without jitter', () => {
  it('produces deterministic delays equal to the upper bound', () => {
    const rows = planRetries(BASE_PARAMS, zeroRng);
    expect(rows.map((row) => row.delayMs)).toEqual([100, 200, 400, 800, 1000, 1000]);
  });

  it('accumulates cumulative delay correctly', () => {
    const rows = planRetries(BASE_PARAMS, zeroRng);
    expect(rows.map((row) => row.cumulativeMs)).toEqual([100, 300, 700, 1500, 2500, 3500]);
  });

  it('throws when parameters are invalid', () => {
    expect(() => planRetries({ ...BASE_PARAMS, baseMs: 0 })).toThrow();
  });
});

describe('full jitter', () => {
  it('keeps every delay within [0, upper bound]', () => {
    const params: BackoffParams = { ...BASE_PARAMS, jitter: 'full' };
    const rowsMin = planRetries(params, zeroRng);
    const rowsMax = planRetries(params, nearOneRng);
    rowsMin.forEach((row) => {
      expect(row.minMs).toBe(0);
      expect(row.maxMs).toBe(row.upperBoundMs);
      expect(row.delayMs).toBeGreaterThanOrEqual(0);
      expect(row.delayMs).toBeLessThanOrEqual(row.upperBoundMs);
      expect(row.expectedMs).toBeCloseTo(row.upperBoundMs / 2);
    });
    rowsMax.forEach((row) => {
      expect(row.delayMs).toBeLessThanOrEqual(row.upperBoundMs);
    });
  });

  it('is deterministic with an injected RNG', () => {
    const params: BackoffParams = { ...BASE_PARAMS, jitter: 'full', maxRetries: 3 };
    expect(planRetries(params, zeroRng).map((row) => row.delayMs)).toEqual([0, 0, 0]);
    const expected = planRetries(params, nearOneRng).map((row) =>
      Number((0.99999 * row.upperBoundMs).toFixed(5)),
    );
    expect(planRetries(params, nearOneRng).map((row) => Number(row.delayMs.toFixed(5)))).toEqual(
      expected,
    );
  });
});

describe('equal jitter', () => {
  it('keeps every delay within [bound/2, bound]', () => {
    const params: BackoffParams = { ...BASE_PARAMS, jitter: 'equal' };
    const rows = planRetries(params, zeroRng);
    rows.forEach((row) => {
      expect(row.minMs).toBeCloseTo(row.upperBoundMs / 2);
      expect(row.maxMs).toBe(row.upperBoundMs);
      expect(row.delayMs).toBeCloseTo(row.upperBoundMs / 2);
      // 均匀分布期望 = 3/4 * bound
      expect(row.expectedMs).toBeCloseTo((row.upperBoundMs * 3) / 4);
    });
  });

  it('approaches the upper bound with RNG near one', () => {
    const params: BackoffParams = { ...BASE_PARAMS, jitter: 'equal' };
    const rows = planRetries(params, nearOneRng);
    rows.forEach((row) => {
      expect(row.delayMs).toBeLessThanOrEqual(row.maxMs);
      expect(row.delayMs).toBeGreaterThanOrEqual(row.minMs);
    });
  });
});

describe('computeDelay', () => {
  it('returns the bound unchanged without jitter', () => {
    expect(computeDelay(500, 'none', Math.random).delayMs).toBe(500);
  });

  it('covers full jitter range endpoints', () => {
    expect(computeDelay(500, 'full', zeroRng).delayMs).toBe(0);
    expect(computeDelay(500, 'full', nearOneRng).delayMs).toBeCloseTo(499.995);
  });
});

describe('formatMs', () => {
  it('renders sub-second values in ms only', () => {
    expect(formatMs(250)).toBe('250 ms');
  });

  it('appends seconds for values >= 1000 ms', () => {
    expect(formatMs(1500)).toBe('1500 ms（1.50 s）');
  });
});
