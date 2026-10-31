/**
 * 电阻色环计算（零依赖纯函数）
 *
 * 支持 4 / 5 / 6 色环：
 * - 4 环：2 位有效数字 + 倍率 + 误差
 * - 5 环：3 位有效数字 + 倍率 + 误差（精密电阻）
 * - 6 环：5 环基础上再加温度系数环（ppm/K）
 *
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export type ColorName =
  | 'pink'
  | 'silver'
  | 'gold'
  | 'black'
  | 'brown'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'violet'
  | 'gray'
  | 'white';

export interface ColorInfo {
  key: ColorName;
  /** 中文名 */
  label: string;
  /** 英文名 */
  labelEn: string;
  /** 十六进制展示色 */
  hex: string;
  /** 有效数字（粉/银/金不可作有效数字，为 null） */
  digit: number | null;
  /** 倍率（倍数颜色才有） */
  multiplier: number | null;
  /** 误差百分比（公差颜色才有，单位 %） */
  tolerance: number | null;
  /** 温度系数 ppm/K（棕红橙黄蓝紫才有） */
  tempCoeff: number | null;
}

export const COLORS: ColorInfo[] = [
  { key: 'pink', label: '粉', labelEn: 'Pink', hex: '#F7A7C0', digit: null, multiplier: 0.001, tolerance: null, tempCoeff: null },
  { key: 'silver', label: '银', labelEn: 'Silver', hex: '#C0C0C0', digit: null, multiplier: 0.01, tolerance: 10, tempCoeff: null },
  { key: 'gold', label: '金', labelEn: 'Gold', hex: '#D9B44A', digit: null, multiplier: 0.1, tolerance: 5, tempCoeff: null },
  { key: 'black', label: '黑', labelEn: 'Black', hex: '#2B2B2B', digit: 0, multiplier: 1, tolerance: null, tempCoeff: null },
  { key: 'brown', label: '棕', labelEn: 'Brown', hex: '#7C4A20', digit: 1, multiplier: 10, tolerance: 1, tempCoeff: 100 },
  { key: 'red', label: '红', labelEn: 'Red', hex: '#D33131', digit: 2, multiplier: 100, tolerance: 2, tempCoeff: 50 },
  { key: 'orange', label: '橙', labelEn: 'Orange', hex: '#E8852A', digit: 3, multiplier: 1000, tolerance: null, tempCoeff: 15 },
  { key: 'yellow', label: '黄', labelEn: 'Yellow', hex: '#F2D024', digit: 4, multiplier: 10000, tolerance: null, tempCoeff: 25 },
  { key: 'green', label: '绿', labelEn: 'Green', hex: '#3FA34D', digit: 5, multiplier: 100000, tolerance: 0.5, tempCoeff: 20 },
  { key: 'blue', label: '蓝', labelEn: 'Blue', hex: '#2F6DB3', digit: 6, multiplier: 1000000, tolerance: 0.25, tempCoeff: 10 },
  { key: 'violet', label: '紫', labelEn: 'Violet', hex: '#7A4FA3', digit: 7, multiplier: 10000000, tolerance: 0.1, tempCoeff: 5 },
  { key: 'gray', label: '灰', labelEn: 'Gray', hex: '#8C8C8C', digit: 8, multiplier: 100000000, tolerance: 0.05, tempCoeff: null },
  { key: 'white', label: '白', labelEn: 'White', hex: '#F5F5F5', digit: 9, multiplier: 1000000000, tolerance: null, tempCoeff: null },
];

const COLOR_MAP: Partial<Record<ColorName, ColorInfo>> = Object.fromEntries(
  COLORS.map((c) => [c.key, c]),
);

export function getColor(key: ColorName): ColorInfo | undefined {
  return COLOR_MAP[key];
}

/** 可作有效数字的颜色（黑~白） */
export const DIGIT_COLORS: ColorName[] = COLORS.filter((c) => c.digit !== null).map((c) => c.key);
/** 可作倍率的颜色 */
export const MULTIPLIER_COLORS: ColorName[] = COLORS.filter((c) => c.multiplier !== null).map((c) => c.key);
/** 可作误差环的颜色 */
export const TOLERANCE_COLORS: ColorName[] = COLORS.filter((c) => c.tolerance !== null).map((c) => c.key);
/** 可作温度系数环的颜色 */
export const TEMP_COLORS: ColorName[] = COLORS.filter((c) => c.tempCoeff !== null).map((c) => c.key);

export type BandCount = 4 | 5 | 6;

export interface BandResult {
  bandCount: BandCount;
  bands: ColorName[];
  significant: number;
  multiplierColor: ColorName;
  multiplier: number;
  toleranceColor: ColorName;
  tolerancePercent: number;
  tempColor: ColorName | null;
  tempCoeff: number | null;
  ohms: number;
  minOhms: number;
  maxOhms: number;
  display: string;
  error: string | null;
}

/**
 * 正向：色环 → 阻值
 * @param bandCount 环数 4/5/6
 * @param bands 颜色数组（长度须与环数一致）
 */
export function decodeBands(bandCount: BandCount, bands: ColorName[]): BandResult {
  const base = {
    bandCount,
    bands,
    significant: 0,
    multiplierColor: 'black' as ColorName,
    multiplier: 1,
    toleranceColor: 'gold' as ColorName,
    tolerancePercent: 5,
    tempColor: null as ColorName | null,
    tempCoeff: null as number | null,
    ohms: 0,
    minOhms: 0,
    maxOhms: 0,
    display: '',
  };
  const fail = (error: string): BandResult => ({ ...base, error });

  if (bands.length !== bandCount) {
    return fail(`需要 ${bandCount} 个色环，实际传入 ${bands.length} 个`);
  }
  const sigCount: number = bandCount === 4 ? 2 : 3;

  let significant = 0;
  for (let i = 0; i < sigCount; i += 1) {
    const info = COLOR_MAP[bands[i] ?? 'black'];
    if (!info || info.digit === null) {
      return fail(`第 ${i + 1} 环「${info?.label ?? bands[i]}」不能作为有效数字环`);
    }
    significant = significant * 10 + info.digit;
  }

  const multInfo = COLOR_MAP[bands[sigCount] ?? 'black'];
  if (!multInfo || multInfo.multiplier === null) {
    return fail(`第 ${sigCount + 1} 环「${multInfo?.label ?? bands[sigCount]}」不能作为倍率环`);
  }

  const tolInfo = COLOR_MAP[bands[sigCount + 1] ?? 'gold'];
  if (!tolInfo || tolInfo.tolerance === null) {
    return fail(`第 ${sigCount + 2} 环「${tolInfo?.label ?? bands[sigCount + 1]}」不能作为误差环`);
  }

  let tempColor: ColorName | null = null;
  let tempCoeff: number | null = null;
  if (bandCount === 6) {
    const tempInfo = COLOR_MAP[bands[5] ?? 'brown'];
    if (!tempInfo || tempInfo.tempCoeff === null) {
      return fail(`第 6 环「${tempInfo?.label ?? bands[5]}」不能作为温度系数环`);
    }
    tempColor = tempInfo.key;
    tempCoeff = tempInfo.tempCoeff;
  }

  const ohms = significant * (multInfo.multiplier ?? 1);
  const tolerancePercent = tolInfo.tolerance ?? 0;

  return {
    ...base,
    significant,
    multiplierColor: multInfo.key,
    multiplier: multInfo.multiplier ?? 1,
    toleranceColor: tolInfo.key,
    tolerancePercent,
    tempColor,
    tempCoeff,
    ohms,
    minOhms: ohms * (1 - tolerancePercent / 100),
    maxOhms: ohms * (1 + tolerancePercent / 100),
    display: formatOhms(ohms),
    error: null,
  };
}

/**
 * 阻值格式化：自动选择 Ω / kΩ / MΩ / GΩ，保留至多 3 位有效数字并去掉尾零
 */
export function formatOhms(ohms: number): string {
  if (ohms === 0) return '0 Ω';
  const abs = Math.abs(ohms);
  const units: Array<{ threshold: number; suffix: string }> = [
    { threshold: 1e9, suffix: ' GΩ' },
    { threshold: 1e6, suffix: ' MΩ' },
    { threshold: 1e3, suffix: ' kΩ' },
    { threshold: 1, suffix: ' Ω' },
  ];
  const unit = units.find((u) => abs >= u.threshold) ?? { threshold: 1, suffix: ' Ω' };
  const value = ohms / unit.threshold;
  const rounded = parseFloat(value.toPrecision(3));
  return `${rounded}${unit.suffix}`;
}

export interface EncodeResult {
  bands: ColorName[];
  significant: number;
  multiplierColor: ColorName | null;
  toleranceColor: ColorName | null;
  ohms: number;
  display: string;
  error: string | null;
}

/**
 * 反向：阻值 + 有效数字位数（2→4环、3→5/6环）→ 色环
 * 倍率环必须使有效数字部分为整数；公差环按最接近的标准公差选择（默认 1%）。
 */
export function encodeOhms(
  ohms: number,
  sigCount: 2 | 3,
  tolerancePercent = 1,
): EncodeResult {
  const base: EncodeResult = {
    bands: [],
    significant: 0,
    multiplierColor: null,
    toleranceColor: null,
    ohms,
    display: formatOhms(ohms),
    error: null,
  };
  const fail = (error: string): EncodeResult => ({ ...base, error });

  if (!Number.isFinite(ohms) || ohms < 0) {
    return fail('阻值必须为非负有限数');
  }
  if (ohms === 0) {
    return fail('0 Ω 为跨接电阻，实物通常为单个黑色环，无标准多色环编码');
  }

  const tolColor = TOLERANCE_COLORS.find((key) => getColor(key)?.tolerance === tolerancePercent);
  if (!tolColor) {
    return fail(`不支持的公差 ±${tolerancePercent}%`);
  }

  const sigMin = Math.pow(10, sigCount - 1);
  const sigMax = Math.pow(10, sigCount);
  for (const key of MULTIPLIER_COLORS) {
    const mult = getColor(key)?.multiplier ?? 0;
    const sig = ohms / mult;
    if (sig >= sigMin && sig < sigMax && Math.abs(sig - Math.round(sig)) < 1e-7) {
      const significant = Math.round(sig);
      const digitStr = significant.toString().padStart(sigCount, '0');
      const digitBands: ColorName[] = [];
      for (const ch of digitStr) {
        const color = COLORS.find((c) => c.digit === Number(ch));
        if (!color) return fail('有效数字映射失败');
        digitBands.push(color.key);
      }
      return {
        ...base,
        bands: [...digitBands, key, tolColor],
        significant,
        multiplierColor: key,
        toleranceColor: tolColor,
        error: null,
      };
    }
  }

  return fail(`阻值 ${formatOhms(ohms)} 无法用 ${sigCount} 位有效数字的标准倍率精确表示`);
}

/* ---------------- E 系列标准阻值 ---------------- */

export type ESeriesKey = 'E12' | 'E24' | 'E96';

/** E12 一个十进段（10~82） */
export const E12_BASE = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
/** E24 一个十进段（10~91） */
export const E24_BASE = [
  10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82,
  91,
];

/** E96 一个十进段（100~976，EIA 标准值） */
export const E96_BASE = [
  100, 102, 105, 107, 110, 113, 115, 118, 121, 124, 127, 130, 133, 137, 140, 143, 147, 150, 154,
  158, 162, 165, 169, 174, 178, 182, 187, 191, 196, 200, 205, 210, 215, 221, 226, 232, 237, 243,
  249, 255, 261, 267, 274, 280, 287, 294, 301, 309, 316, 324, 332, 340, 348, 357, 365, 374, 383,
  392, 402, 412, 422, 432, 442, 453, 464, 475, 487, 499, 511, 523, 536, 549, 562, 576, 590, 604,
  619, 634, 649, 665, 681, 698, 715, 732, 750, 768, 787, 806, 825, 845, 866, 887, 909, 931, 953,
  976,
];

export function eSeriesBase(series: ESeriesKey): number[] {
  if (series === 'E12') return E12_BASE;
  if (series === 'E24') return E24_BASE;
  return E96_BASE;
}

export interface NearestResult {
  ohms: number;
  nearest: number;
  nearestDisplay: string;
  /** 标准值相对输入值的偏差百分比（负值=标准值更小） */
  deviationPercent: number;
  isStandard: boolean;
  series: ESeriesKey;
}

/** 查找最接近的 E 系列标准阻值（覆盖 0.01 Ω ~ 100 MΩ 量级） */
export function nearestStandard(ohms: number, series: ESeriesKey): NearestResult | { error: string } {
  if (!Number.isFinite(ohms) || ohms <= 0) {
    return { error: '阻值必须为正数' };
  }
  const base = eSeriesBase(series);
  const scale = series === 'E96' ? 100 : 10;
  let best = 0;
  let bestDiff = Infinity;
  for (let decade = -5; decade <= 6; decade += 1) {
    const factor = Math.pow(10, decade) / scale;
    for (const v of base) {
      const candidate = v * factor;
      const diff = Math.abs(candidate - ohms);
      if (diff < bestDiff - 1e-12) {
        bestDiff = diff;
        best = candidate;
      }
    }
  }
  return {
    ohms,
    nearest: best,
    nearestDisplay: formatOhms(best),
    deviationPercent: ((best - ohms) / ohms) * 100,
    isStandard: bestDiff < ohms * 1e-6,
    series,
  };
}

/** 公差与 E 系列的常见搭配建议 */
export function suggestSeries(tolerancePercent: number): ESeriesKey {
  if (tolerancePercent <= 1) return 'E96';
  if (tolerancePercent <= 2) return 'E24';
  return 'E12';
}
