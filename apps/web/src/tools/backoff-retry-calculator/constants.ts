import type { JitterMode } from './utils/backoff';

export const DEFAULT_PARAMS = {
  baseMs: 100,
  multiplier: 2,
  capMs: 1000,
  maxRetries: 6,
  jitter: 'none' as JitterMode,
};

export const JITTER_OPTIONS: Array<{ value: JitterMode; label: string; hint: string }> = [
  { value: 'none', label: '无抖动', hint: 'delay = min(base × multiplierⁿ, cap)，结果确定' },
  { value: 'full', label: 'Full Jitter', hint: 'delay = random(0, 上限)，打散效果最强' },
  { value: 'equal', label: 'Equal Jitter', hint: 'delay = 上限/2 + random(0, 上限/2)，兼顾下限与打散' },
];

export const MAX_RETRIES_LIMIT = 20;
