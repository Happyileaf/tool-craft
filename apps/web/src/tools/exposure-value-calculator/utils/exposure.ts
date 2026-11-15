import { APERTURE_STOPS_HALF, APERTURE_STOPS_THIRD } from '../constants';

/**
 * 曝光参数输入，快门时间统一换算为秒
 */
export interface ExposureInput {
  /** 光圈 f 值，例如 8 表示 f/8 */
  aperture: number;
  /** 快门时间（秒） */
  shutterSeconds: number;
  /** ISO 感光度 */
  iso: number;
}

export interface ExposureResult {
  /** ISO 100 基准下的曝光值 */
  ev100: number;
  /** 当前 ISO 下的等效曝光值 */
  evIso: number;
  /** 当前参数对应的光圈 f 值 */
  aperture: number;
  /** 当前参数对应的快门时间（秒） */
  shutterSeconds: number;
  /** 当前 ISO */
  iso: number;
}

export interface EquivalentPair {
  aperture: number;
  shutterSeconds: number;
  shutterLabel: string;
}

/**
 * 计算曝光值：EV100 = log2(N² / t)，当前 ISO 下 EV = EV100 + log2(ISO / 100)
 */
export function calculateExposure(input: ExposureInput): ExposureResult {
  const { aperture, shutterSeconds, iso } = input;
  if (!Number.isFinite(aperture) || aperture <= 0) {
    throw new Error('光圈值必须大于 0');
  }
  if (!Number.isFinite(shutterSeconds) || shutterSeconds <= 0) {
    throw new Error('快门时间必须大于 0');
  }
  if (!Number.isFinite(iso) || iso <= 0) {
    throw new Error('ISO 必须大于 0');
  }
  const ev100 = Math.log2((aperture * aperture) / shutterSeconds);
  const evIso = ev100 + Math.log2(iso / 100);
  return { ev100, evIso, aperture, shutterSeconds, iso };
}

/**
 * 由 EV100 与光圈求等效快门时间：t = N² / 2^EV100
 */
export function shutterFromEv(ev100: number, aperture: number): number {
  if (!Number.isFinite(ev100)) {
    throw new Error('EV 必须为有效数值');
  }
  if (!Number.isFinite(aperture) || aperture <= 0) {
    throw new Error('光圈值必须大于 0');
  }
  return (aperture * aperture) / 2 ** ev100;
}

/**
 * 生成等效曝光组合序列，按给定光圈档位序列计算每个光圈对应的快门时间
 */
export function equivalentExposures(
  ev100: number,
  step: 'third' | 'half',
  options: { minShutter?: number; maxShutter?: number } = {},
): EquivalentPair[] {
  const apertures = step === 'third' ? APERTURE_STOPS_THIRD : APERTURE_STOPS_HALF;
  const minShutter = options.minShutter ?? 1 / 8000;
  const maxShutter = options.maxShutter ?? 30;
  return apertures
    .map((aperture) => {
      const shutterSeconds = shutterFromEv(ev100, aperture);
      return { aperture, shutterSeconds, shutterLabel: formatShutter(shutterSeconds) };
    })
    .filter((pair) => pair.shutterSeconds >= minShutter && pair.shutterSeconds <= maxShutter);
}

/**
 * 格式化快门时间：小于 1 秒输出 1/x 形式，大于等于 1 秒输出秒数
 */
export function formatShutter(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '—';
  }
  if (seconds >= 1) {
    return `${Math.round(seconds * 10) / 10}s`;
  }
  const denominator = 1 / seconds;
  if (denominator >= 10) {
    return `1/${Math.round(denominator)}`;
  }
  return `1/${Math.round(denominator * 10) / 10}`;
}

/**
 * 解析快门输入，支持 1/125、0.5、2s、1/2.5 等写法
 */
export function parseShutter(input: string): number {
  const text = input.trim().toLowerCase().replace(/\s+/g, '');
  if (text === '') {
    throw new Error('请输入快门时间');
  }
  let seconds: number;
  if (text.includes('/')) {
    const [numeratorText, denominatorText] = text.split('/');
    if (denominatorText === undefined) {
      throw new Error('快门分数格式无效，应形如 1/125');
    }
    const numerator = Number(numeratorText);
    const denominator = Number(denominatorText.replace(/s$/, ''));
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
      throw new Error('快门分数格式无效，应形如 1/125');
    }
    seconds = numerator / denominator;
  } else {
    seconds = Number(text.replace(/s$/, ''));
  }
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error('快门时间必须大于 0');
  }
  return seconds;
}

/**
 * 根据 ND 滤镜减光档数计算新快门时间：t' = t × 2^stops
 */
export function applyNdFilter(shutterSeconds: number, stops: number): number {
  if (!Number.isFinite(shutterSeconds) || shutterSeconds <= 0) {
    throw new Error('原快门时间必须大于 0');
  }
  if (!Number.isFinite(stops) || stops < 0) {
    throw new Error('ND 减光档数必须为不小于 0 的数值');
  }
  return shutterSeconds * 2 ** stops;
}

/**
 * 由原快门时间与目标快门时间反推所需 ND 档数：stops = log2(t' / t)
 */
export function requiredNdStops(originalSeconds: number, targetSeconds: number): number {
  if (!Number.isFinite(originalSeconds) || originalSeconds <= 0) {
    throw new Error('原快门时间必须大于 0');
  }
  if (!Number.isFinite(targetSeconds) || targetSeconds <= 0) {
    throw new Error('目标快门时间必须大于 0');
  }
  if (targetSeconds < originalSeconds) {
    throw new Error('目标快门时间应不小于原快门时间');
  }
  return Math.log2(targetSeconds / originalSeconds);
}

/**
 * 由光学密度换算减光档数：stops = density × 10 / 3
 */
export function densityToStops(density: number): number {
  if (!Number.isFinite(density) || density < 0) {
    throw new Error('光学密度必须为不小于 0 的数值');
  }
  return (density * 10) / 3;
}

/**
 * 把秒数格式化为长曝光计时参考，如 125.5s → 02:05.5
 */
export function formatLongExposure(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '—';
  }
  const totalMinutes = Math.floor(seconds / 60);
  const remaining = seconds - totalMinutes * 60;
  const remainingText = remaining < 10 ? `0${(Math.round(remaining * 10) / 10).toFixed(1)}` : `${(Math.round(remaining * 10) / 10).toFixed(1)}`;
  return `${String(totalMinutes).padStart(2, '0')}:${remainingText}`;
}
