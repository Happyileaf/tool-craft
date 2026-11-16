import type { Polarity, RoundingMode } from './utils/quantizer';

export const BIT_PRESETS = [8, 10, 12, 16, 24] as const;

export const POLARITY_OPTIONS: { value: Polarity; label: string; hint: string }[] = [
  { value: 'unipolar', label: '单极性 0..Vref', hint: 'LSB = Vref / 2^N，码值 0 对应 0V' },
  { value: 'bipolar', label: '双极性 ±Vref', hint: 'LSB = 2·Vref / 2^N，偏移二进制码，中点对应 0V' },
];

export const ROUNDING_OPTIONS: { value: RoundingMode; label: string }[] = [
  { value: 'round', label: '四舍五入（round）' },
  { value: 'floor', label: '向下截断（floor）' },
];

export const DEFAULT_PARAMS = {
  bits: 12,
  vref: 3.3,
  polarity: 'unipolar' as Polarity,
};
