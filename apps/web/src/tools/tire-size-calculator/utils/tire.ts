/** 轮胎规格解析与尺寸/速度换算的纯函数 */

/** 解析后的轮胎规格 */
export interface TireSpec {
  /** 原始输入 */
  raw: string;
  /** 前缀标记，如 LT、P、ST、C */
  prefix: string | null;
  /** 断面宽度（mm） */
  widthMm: number;
  /** 扁平比（%） */
  aspectPercent: number;
  /** 结构标记，通常为 R（子午线） */
  construction: string;
  /** 轮辋直径（英寸） */
  rimInches: number;
  /** 载重指数 */
  loadIndex: number | null;
  /** 速度级别 */
  speedRating: string | null;
  /** 结构前的附加标记，如 Z */
  extraMarking: string | null;
}

/** 轮胎几何尺寸 */
export interface TireGeometry {
  /** 胎侧高度（mm） */
  sidewallMm: number;
  /** 外径（mm） */
  overallDiameterMm: number;
  /** 周长（m） */
  circumferenceM: number;
  /** 每公里转数 */
  revsPerKm: number;
}

/** 新旧轮胎对比结果 */
export interface TireComparison {
  /** 外径变化（mm） */
  diameterDeltaMm: number;
  /** 外径变化百分比 */
  diameterDeltaPercent: number;
  /** 胎侧高度变化（mm） */
  sidewallDeltaMm: number;
  /** 实际车速（km/h） */
  actualSpeedKmh: number;
  /** 速度表误差（%） */
  speedErrorPercent: number;
  /** 是否在 ±3% 推荐范围内 */
  withinTolerance: boolean;
  /** 单侧离地间隙变化（mm） */
  clearanceDeltaMm: number;
}

const PREFIX_PATTERN = /^(LT|P|ST|C)\s*/;
const SPEC_PATTERN =
  /^(\d{3,4})\/(\d{2,3})([A-Z]{0,2})([RDB])(\d{2,3}(?:\.\d+)?)(?=\s|$)(?:\s+(\d{2,3})(?:\/?\s*([A-Z]{1,2}))?)?$/;

/**
 * 解析轮胎规格字符串，如 205/55R16、225/45ZR17 91W、LT265/70R17
 */
export function parseTireSize(input: string): TireSpec {
  const trimmed = input.trim().toUpperCase();
  if (trimmed === '') {
    throw new Error('请输入轮胎规格，例如 205/55R16');
  }

  const prefixMatch = PREFIX_PATTERN.exec(trimmed);
  const prefix = prefixMatch?.[1] ?? null;
  const body = trimmed.slice(prefixMatch?.[0].length ?? 0).replace(/\s+/g, ' ').trim();
  const match = SPEC_PATTERN.exec(body);
  if (!match) {
    throw new Error(`无法识别规格「${input.trim()}」，请使用 205/55R16 或 225/45ZR17 91W 这类格式`);
  }

  const widthMm = Number(match[1]);
  const aspectPercent = Number(match[2]);
  const construction = match[4] ?? '';
  const rimInches = Number(match[5]);
  const loadIndex = match[6] === undefined ? null : Number(match[6]);

  if (!Number.isFinite(widthMm) || widthMm < 20 || widthMm > 400) {
    throw new Error('断面宽度需在 20–400 mm 之间');
  }
  if (!Number.isFinite(aspectPercent) || aspectPercent < 10 || aspectPercent > 100) {
    throw new Error('扁平比需在 10–100 之间');
  }
  if (!Number.isFinite(rimInches) || rimInches < 5 || rimInches > 30) {
    throw new Error('轮辋直径需在 5–30 英寸之间');
  }
  if (loadIndex !== null && (!Number.isInteger(loadIndex) || loadIndex < 20 || loadIndex > 150)) {
    throw new Error('载重指数需在 20–150 之间');
  }

  return {
    raw: trimmed,
    prefix,
    widthMm,
    aspectPercent,
    construction,
    rimInches,
    loadIndex,
    speedRating: match[7] ?? null,
    extraMarking: (match[3] ?? '') === '' ? null : match[3] ?? null,
  };
}

/**
 * 按规格计算胎侧高度、外径、周长与每公里转数
 */
export function tireGeometry(spec: TireSpec): TireGeometry {
  const sidewallMm = (spec.widthMm * spec.aspectPercent) / 100;
  const overallDiameterMm = spec.rimInches * 25.4 + 2 * sidewallMm;
  const circumferenceM = (Math.PI * overallDiameterMm) / 1000;
  return {
    sidewallMm,
    overallDiameterMm,
    circumferenceM,
    revsPerKm: 1000 / circumferenceM,
  };
}

/**
 * 对比原厂规格与替换规格，计算速度表误差与离地间隙变化
 */
export function compareTires(
  original: TireSpec,
  replacement: TireSpec,
  indicatedSpeedKmh: number,
): TireComparison {
  if (!Number.isFinite(indicatedSpeedKmh) || indicatedSpeedKmh <= 0) {
    throw new Error('表显车速需为正数');
  }
  const originalGeometry = tireGeometry(original);
  const replacementGeometry = tireGeometry(replacement);
  const diameterDeltaMm = replacementGeometry.overallDiameterMm - originalGeometry.overallDiameterMm;
  const diameterDeltaPercent = (diameterDeltaMm / originalGeometry.overallDiameterMm) * 100;
  const actualSpeedKmh = indicatedSpeedKmh * (replacementGeometry.overallDiameterMm / originalGeometry.overallDiameterMm);

  return {
    diameterDeltaMm,
    diameterDeltaPercent,
    sidewallDeltaMm: replacementGeometry.sidewallMm - originalGeometry.sidewallMm,
    actualSpeedKmh,
    speedErrorPercent: ((actualSpeedKmh - indicatedSpeedKmh) / indicatedSpeedKmh) * 100,
    withinTolerance: Math.abs(diameterDeltaPercent) <= 3,
    clearanceDeltaMm: diameterDeltaMm / 2,
  };
}
