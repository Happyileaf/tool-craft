import { describe, expect, it } from 'vitest';
import {
  estimateWinsToTarget,
  expectedScore,
  K_FACTOR_PRESETS,
  matchScore,
  parseSequence,
  simulateSequence,
  updateRating,
  validateEloInputs,
} from './elo';

describe('expectedScore', () => {
  it('returns 0.5 for equal ratings', () => {
    expect(expectedScore(1500, 1500)).toBe(0.5);
  });

  it('matches the fixed vector 1500 vs 1700', () => {
    expect(expectedScore(1500, 1700)).toBeCloseTo(0.240253, 6);
  });

  it('is symmetric around 0.5 for swapped ratings', () => {
    const ea = expectedScore(1500, 1700);
    const eb = expectedScore(1700, 1500);
    expect(ea + eb).toBeCloseTo(1, 12);
  });
});

describe('updateRating', () => {
  it('reproduces the classic Ra=1613 Rb=1609 K=32 win vector', () => {
    const expected = expectedScore(1613, 1609);
    expect(expected).toBeCloseTo(0.50577, 4);
    expect(updateRating(1613, 1, expected, 32)).toBe(1629);
  });

  it('rounds to the nearest integer', () => {
    const expected = expectedScore(1500, 1700);
    // 1500 + 32 × (1 - 0.240253) ≈ 1524.31 → 1524
    expect(updateRating(1500, 1, expected, 32)).toBe(1524);
  });
});

describe('matchScore', () => {
  it('maps W/D/L to 1/0.5/0', () => {
    expect(matchScore('W')).toBe(1);
    expect(matchScore('D')).toBe(0.5);
    expect(matchScore('L')).toBe(0);
  });
});

describe('parseSequence', () => {
  it('parses comma, whitespace and Chinese separators', () => {
    expect(parseSequence('W, D,w')).toEqual(['W', 'D', 'W']);
    expect(parseSequence('W D\nL')).toEqual(['W', 'D', 'L']);
    expect(parseSequence('w，d、l')).toEqual(['W', 'D', 'L']);
  });

  it('accepts numeric 1/0.5/0 tokens', () => {
    expect(parseSequence('1,0.5,0')).toEqual(['W', 'D', 'L']);
  });

  it('throws on unrecognized tokens', () => {
    expect(() => parseSequence('W,X,L')).toThrow('无法识别');
  });
});

describe('simulateSequence', () => {
  it('produces 1516 / 1484 / 1500 for single W/L/D from 1500 with K=32', () => {
    expect(simulateSequence(1500, 32, ['W'], 1500).finalRating).toBe(1516);
    expect(simulateSequence(1500, 32, ['L'], 1500).finalRating).toBe(1484);
    expect(simulateSequence(1500, 32, ['D'], 1500).finalRating).toBe(1500);
  });

  it('simulates WWDL with per-game deltas and final rating', () => {
    const result = simulateSequence(1500, 32, ['W', 'W', 'D', 'L'], 1500);
    expect(result.rows.map((row) => row.delta)).toEqual([16, 15, -1, -17]);
    expect(result.rows.map((row) => row.ratingAfter)).toEqual([1516, 1531, 1530, 1513]);
    expect(result.finalRating).toBe(1513);
    expect(result.totalDelta).toBe(13);
    expect(result.rows[0]?.index).toBe(1);
    expect(result.rows[0]?.ratingBefore).toBe(1500);
  });
});

describe('estimateWinsToTarget', () => {
  it('returns 0 when target is not above start', () => {
    expect(estimateWinsToTarget(1500, 1500, 1500, 32)).toEqual({ wins: 0, feasible: true });
    expect(estimateWinsToTarget(1500, 1400, 1500, 32).wins).toBe(0);
  });

  it('recomputes expected score per round like simulateSequence', () => {
    // 严格逐场模型：1500 → 1516（胜）→ 1531（胜）→ 1546（胜）
    const twoWins = estimateWinsToTarget(1500, 1531, 1500, 32);
    expect(twoWins.feasible).toBe(true);
    expect(twoWins.wins).toBe(2);
    // 目标 1532 需第三场胜利才能达到
    const threeWins = estimateWinsToTarget(1500, 1532, 1500, 32);
    expect(threeWins.feasible).toBe(true);
    expect(threeWins.wins).toBe(3);
    // 与 simulateSequence 的三场连胜结果保持一致
    const sim = simulateSequence(1500, 32, ['W', 'W', 'W'], 1500);
    expect(sim.finalRating).toBe(1546);
  });

  it('is infeasible when each win rounds to zero gain', () => {
    const estimate = estimateWinsToTarget(3000, 3001, 0, 32);
    expect(estimate.feasible).toBe(false);
    expect(estimate.reason).toContain('四舍五入');
  });
});

describe('validateEloInputs', () => {
  it('accepts valid ratings, K and sequence', () => {
    expect(
      validateEloInputs({
        ratingA: 1500,
        ratingB: 1700,
        kFactor: 32,
        sequence: 'W,D,L',
      }).valid,
    ).toBe(true);
  });

  it('rejects negative and non-finite ratings', () => {
    const negative = validateEloInputs({ ratingA: -1 });
    expect(negative.valid).toBe(false);
    expect(negative.errors.join('')).toContain('评分');
    expect(validateEloInputs({ ratingA: Number.NaN }).valid).toBe(false);
    expect(validateEloInputs({ ratingA: Number.POSITIVE_INFINITY }).valid).toBe(false);
    expect(validateEloInputs({ ratingA: null }).valid).toBe(false);
  });

  it('rejects K factors outside 1-200', () => {
    expect(validateEloInputs({ kFactor: 0 }).valid).toBe(false);
    expect(validateEloInputs({ kFactor: 201 }).valid).toBe(false);
    expect(validateEloInputs({ kFactor: Number.NaN }).valid).toBe(false);
  });

  it('rejects empty, illegal and over-long sequences', () => {
    expect(validateEloInputs({ sequence: '   ' }).valid).toBe(false);
    expect(validateEloInputs({ sequence: 'W,X' }).valid).toBe(false);
    const longSequence = Array(501).fill('W').join(',');
    const overLimit = validateEloInputs({ sequence: longSequence });
    expect(overLimit.valid).toBe(false);
    expect(overLimit.errors.join('')).toContain('500');
  });

  it('ignores fields that were not provided', () => {
    expect(validateEloInputs({}).valid).toBe(true);
  });
});

describe('K_FACTOR_PRESETS', () => {
  it('covers FIDE and generic presets', () => {
    expect(K_FACTOR_PRESETS.map((preset) => preset.value)).toEqual([40, 20, 10, 32]);
  });
});
