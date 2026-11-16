/**
 * 纸张尺寸与 DPI 像素换算的纯函数模块（零依赖，不触碰 DOM / React）
 *
 * 核心关系：像素 = 英寸 × DPI，而 1in = 25.4mm，
 * 因此 px = mm / 25.4 × DPI；像素统一 Math.round 四舍五入取整。
 */
import {
  MATCH_TOLERANCE,
  MAX_DPI,
  MAX_PIXEL_SIDE,
  MAX_SIDE_MM,
  MAX_TOTAL_PIXELS,
  MIN_DPI,
  MIN_PIXEL_SIDE,
  MIN_SIDE_MM,
  MM_PER_INCH,
  PAPER_PRESETS,
  type Orientation,
  type PaperPreset,
  type PhysicalUnit,
} from '../constants';

export interface PhysicalDimensions {
  widthMm: number;
  heightMm: number;
}

export interface PixelDimensions {
  widthPx: number;
  heightPx: number;
}

/** 正向换算结果 */
export interface ForwardResult {
  physical: PhysicalDimensions;
  pixels: PixelDimensions;
  totalPixels: number;
  megapixels: number;
  error: string | null;
}

/** 反向匹配到的标准纸张 */
export interface MatchedPaper {
  preset: PaperPreset;
  orientation: Orientation;
  /** 宽高相对误差的最大值（0–1） */
  relativeError: number;
  withinTolerance: boolean;
}

/** 反向换算结果 */
export interface ReverseResult {
  physical: PhysicalDimensions;
  pixels: PixelDimensions;
  totalPixels: number;
  megapixels: number;
  match: MatchedPaper | null;
  error: string | null;
}

/** 解析有限数字，NaN / Infinity 或空值返回 null */
function parseNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

/** 校验 DPI 范围（1–2400） */
export function validateDpi(rawDpi: number | string): { dpi: number | null; error: string | null } {
  const dpi = parseNumber(rawDpi);
  if (dpi === null) {
    return { dpi: null, error: 'DPI 必须是有效数字' };
  }
  if (dpi < MIN_DPI || dpi > MAX_DPI) {
    return { dpi: null, error: `DPI 需在 ${MIN_DPI}–${MAX_DPI} 之间` };
  }
  return { dpi, error: null };
}

/** 把带单位的物理边长换算为毫米并校验范围（1–2000mm） */
function toMillimeters(raw: number | string, unit: PhysicalUnit, label: string): { mm: number | null; error: string | null } {
  const value = parseNumber(raw);
  if (value === null) {
    return { mm: null, error: `${label}必须是有效数字` };
  }
  if (value <= 0) {
    return { mm: null, error: `${label}必须大于 0` };
  }
  const mmPerUnit = unit === 'mm' ? 1 : unit === 'cm' ? 10 : MM_PER_INCH;
  const mm = value * mmPerUnit;
  if (mm < MIN_SIDE_MM || mm > MAX_SIDE_MM) {
    return { mm: null, error: `${label}换算后需在 ${MIN_SIDE_MM}–${MAX_SIDE_MM} mm 之间` };
  }
  return { mm, error: null };
}

/** 按方向交换宽高（横向时宽 ≥ 高），面积保持不变 */
export function applyOrientation(dimensions: PhysicalDimensions, orientation: Orientation): PhysicalDimensions {
  if (orientation === 'landscape' && dimensions.widthMm < dimensions.heightMm) {
    return { widthMm: dimensions.heightMm, heightMm: dimensions.widthMm };
  }
  if (orientation === 'portrait' && dimensions.widthMm > dimensions.heightMm) {
    return { widthMm: dimensions.heightMm, heightMm: dimensions.widthMm };
  }
  return { ...dimensions };
}

/** 毫米 → 像素（四舍五入取整） */
export function mmToPixels(mm: number, dpi: number): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

/** 像素 → 毫米（保留浮点，由展示层决定小数位） */
export function pixelsToMm(px: number, dpi: number): number {
  return (px / dpi) * MM_PER_INCH;
}

/**
 * 正向换算：物理纸张 + DPI → 像素尺寸
 * 宽高以毫米输入，单位可为 mm / cm / in；方向仅交换宽高。
 */
export function paperToPixels(input: {
  width: number | string;
  height: number | string;
  unit: PhysicalUnit;
  dpi: number | string;
  orientation: Orientation;
}): ForwardResult {
  const dpiCheck = validateDpi(input.dpi);
  if (dpiCheck.error || dpiCheck.dpi === null) {
    return emptyForward(dpiCheck.error ?? 'DPI 非法');
  }
  const widthResult = toMillimeters(input.width, input.unit, '宽度');
  if (widthResult.error || widthResult.mm === null) {
    return emptyForward(widthResult.error ?? '宽度非法');
  }
  const heightResult = toMillimeters(input.height, input.unit, '高度');
  if (heightResult.error || heightResult.mm === null) {
    return emptyForward(heightResult.error ?? '高度非法');
  }

  const oriented = applyOrientation(
    { widthMm: widthResult.mm, heightMm: heightResult.mm },
    input.orientation,
  );
  const widthPx = mmToPixels(oriented.widthMm, dpiCheck.dpi);
  const heightPx = mmToPixels(oriented.heightMm, dpiCheck.dpi);
  const totalPixels = widthPx * heightPx;

  return {
    physical: oriented,
    pixels: { widthPx, heightPx },
    totalPixels,
    megapixels: totalPixels / 1_000_000,
    error: null,
  };
}

function emptyForward(error: string): ForwardResult {
  return {
    physical: { widthMm: 0, heightMm: 0 },
    pixels: { widthPx: 0, heightPx: 0 },
    totalPixels: 0,
    megapixels: 0,
    error,
  };
}

/** 校验像素边长（1–100000）与总像素上限（1e10） */
function validatePixels(rawWidth: number | string, rawHeight: number | string): {
  pixels: PixelDimensions | null;
  error: string | null;
} {
  const width = parseNumber(rawWidth);
  const height = parseNumber(rawHeight);
  if (width === null || height === null) {
    return { pixels: null, error: '像素宽高必须是有效数字' };
  }
  if (width <= 0 || height <= 0) {
    return { pixels: null, error: '像素宽高必须大于 0' };
  }
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    return { pixels: null, error: '像素宽高必须是整数' };
  }
  if (width < MIN_PIXEL_SIDE || width > MAX_PIXEL_SIDE || height < MIN_PIXEL_SIDE || height > MAX_PIXEL_SIDE) {
    return { pixels: null, error: `像素边长需在 ${MIN_PIXEL_SIDE}–${MAX_PIXEL_SIDE} 之间` };
  }
  if (width * height > MAX_TOTAL_PIXELS) {
    return { pixels: null, error: `总像素不能超过 ${MAX_TOTAL_PIXELS.toExponential(0)}（100 亿）` };
  }
  return { pixels: { widthPx: width, heightPx: height }, error: null };
}

/**
 * 反向换算：像素 + DPI → 物理尺寸，并在标准纸张（含横竖两个方向）中匹配最接近项。
 * 相对误差取宽、高各自误差的最大值；≤2% 时标注近似匹配。
 */
export function pixelsToPaper(input: {
  widthPx: number | string;
  heightPx: number | string;
  dpi: number | string;
}): ReverseResult {
  const dpiCheck = validateDpi(input.dpi);
  if (dpiCheck.error || dpiCheck.dpi === null) {
    return emptyReverse(dpiCheck.error ?? 'DPI 非法');
  }
  const pixelCheck = validatePixels(input.widthPx, input.heightPx);
  if (pixelCheck.error || pixelCheck.pixels === null) {
    return emptyReverse(pixelCheck.error ?? '像素尺寸非法');
  }

  const { widthPx, heightPx } = pixelCheck.pixels;
  const widthMm = pixelsToMm(widthPx, dpiCheck.dpi);
  const heightMm = pixelsToMm(heightPx, dpiCheck.dpi);
  const totalPixels = widthPx * heightPx;

  return {
    physical: { widthMm, heightMm },
    pixels: { widthPx, heightPx },
    totalPixels,
    megapixels: totalPixels / 1_000_000,
    match: findClosestPaper({ widthMm, heightMm }),
    error: null,
  };
}

function emptyReverse(error: string): ReverseResult {
  return {
    physical: { widthMm: 0, heightMm: 0 },
    pixels: { widthPx: 0, heightPx: 0 },
    totalPixels: 0,
    megapixels: 0,
    match: null,
    error,
  };
}

/** 计算两组宽高之间的最大相对误差 */
function relativeError(actual: PhysicalDimensions, target: PhysicalDimensions): number {
  const widthError = Math.abs(actual.widthMm - target.widthMm) / target.widthMm;
  const heightError = Math.abs(actual.heightMm - target.heightMm) / target.heightMm;
  return Math.max(widthError, heightError);
}

/** 在全部标准纸张的纵向、横向两种形态中找误差最小的匹配项 */
export function findClosestPaper(dimensions: PhysicalDimensions): MatchedPaper {
  let best: MatchedPaper | null = null;
  for (const preset of PAPER_PRESETS) {
    const candidates: Array<{ dims: PhysicalDimensions; orientation: Orientation }> = [
      { dims: { widthMm: preset.widthMm, heightMm: preset.heightMm }, orientation: 'portrait' },
      { dims: { widthMm: preset.heightMm, heightMm: preset.widthMm }, orientation: 'landscape' },
    ];
    for (const candidate of candidates) {
      const error = relativeError(dimensions, candidate.dims);
      if (best === null || error < best.relativeError) {
        best = {
          preset,
          orientation: candidate.orientation,
          relativeError: error,
          withinTolerance: error <= MATCH_TOLERANCE,
        };
      }
    }
  }
  return best as MatchedPaper;
}

/** 按 id 查找标准纸张 */
export function getPresetById(id: string): PaperPreset | undefined {
  return PAPER_PRESETS.find((preset) => preset.id === id);
}

/** 毫米换算为指定单位（展示层保留 2 位小数） */
export function mmToUnit(mm: number, unit: PhysicalUnit): number {
  const divisor = unit === 'mm' ? 1 : unit === 'cm' ? 10 : MM_PER_INCH;
  return mm / divisor;
}
