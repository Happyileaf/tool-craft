/**
 * RGB / HEX / HSL ↔ CMYK 印刷四色换算纯函数。
 *
 * RGB→CMYK 采用标准 black-generation：
 *   归一化 r/g/b ∈ [0,1]，K = 1 − max(r,g,b)；
 *   K = 1（纯黑）时 C/M/Y = 0；否则 C = (1 − r − K)/(1 − K)，M/Y 同理。
 * CMYK→RGB：R = 255·(1 − C)·(1 − K)，G/B 同理，四舍五入为 0–255 整数。
 *
 * 全部为确定性数学运算，不触碰 DOM / React，零新增依赖。
 */

/** RGB 颜色（各通道 0–255 整数） */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** CMYK 印刷四色（各通道为 0–100 的百分比，保留一位小数） */
export interface CmykColor {
  c: number;
  m: number;
  y: number;
  k: number;
}

/** HSL 颜色（h ∈ 0–360，s/l ∈ 0–100，h 保留一位小数，s/l 取整） */
export interface HslColor {
  h: number;
  s: number;
  l: number;
}

/** 0–100 百分比保留一位小数，并夹紧到合法区间 */
function toPercent(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  return Math.round(clamped * 1000) / 10;
}

/**
 * 校验 RGB 通道是否为 0–255 整数。
 *
 * @param rgb - 待校验颜色
 */
export function assertValidRgb(rgb: RgbColor): void {
  for (const [channel, value] of [
    ['R', rgb.r],
    ['G', rgb.g],
    ['B', rgb.b],
  ] as const) {
    if (!Number.isFinite(value) || value < 0 || value > 255) {
      throw new Error(`${channel} 通道必须是 0–255 之间的数值，当前为 ${value}`);
    }
  }
}

/**
 * 校验 CMYK 百分比是否都在 0–100 之间。
 *
 * @param cmyk - 待校验颜色
 */
export function assertValidCmyk(cmyk: CmykColor): void {
  for (const [channel, value] of [
    ['C', cmyk.c],
    ['M', cmyk.m],
    ['Y', cmyk.y],
    ['K', cmyk.k],
  ] as const) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`${channel} 通道必须是 0–100 之间的百分比，当前为 ${value}`);
    }
  }
}

/**
 * RGB → CMYK（标准 black-generation）。
 *
 * @param rgb - RGB 颜色（0–255）
 * @returns CMYK 四色百分比（0–100，一位小数）
 */
export function rgbToCmyk(rgb: RgbColor): CmykColor {
  assertValidRgb(rgb);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const k = 1 - Math.max(r, g, b);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const denominator = 1 - k;
  return {
    c: toPercent((1 - r - k) / denominator),
    m: toPercent((1 - g - k) / denominator),
    y: toPercent((1 - b - k) / denominator),
    k: toPercent(k),
  };
}

/**
 * CMYK → RGB（四舍五入为 0–255 整数）。
 *
 * @param cmyk - CMYK 四色百分比
 * @returns RGB 颜色
 */
export function cmykToRgb(cmyk: CmykColor): RgbColor {
  assertValidCmyk(cmyk);
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;

  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  };
}

/**
 * RGB → HEX（#RRGGBB，大写）。
 *
 * @param rgb - RGB 颜色
 * @returns 形如 #3B82F6 的十六进制色值
 */
export function rgbToHex(rgb: RgbColor): string {
  assertValidRgb(rgb);
  const toByte = (value: number) => value.toString(16).padStart(2, '0').toUpperCase();
  return `#${toByte(rgb.r)}${toByte(rgb.g)}${toByte(rgb.b)}`;
}

/**
 * 解析 #RGB / RGB / #RRGGBB / RRGGBB（大小写不敏感）为 RGB 通道。
 *
 * @param input - 十六进制色值文本
 * @returns RGB 颜色
 */
export function parseHex(input: string): RgbColor {
  const text = (input ?? '').trim().replace(/^#/, '');
  if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(text)) {
    throw new Error('HEX 格式无效，仅支持 3 位或 6 位十六进制，示例：#3B82F6 或 #F00');
  }
  const full =
    text.length === 3
      ? text
          .split('')
          .map((char) => char + char)
          .join('')
      : text;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/**
 * RGB → HSL。
 *
 * @param rgb - RGB 颜色
 * @returns HSL（h 0–360 一位小数，s/l 0–100 整数百分比）
 */
export function rgbToHsl(rgb: RgbColor): HslColor {
  assertValidRgb(rgb);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) {
      hue += 360;
    }
  }

  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return {
    h: Math.round(hue * 10) / 10,
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

/**
 * 一次性取得 RGB 对应的全部表示（CMYK / HEX / HSL）。
 *
 * @param rgb - RGB 颜色
 * @returns 归一化后的颜色集合
 */
export function fromRgb(rgb: RgbColor): {
  rgb: RgbColor;
  cmyk: CmykColor;
  hex: string;
  hsl: HslColor;
} {
  const normalized: RgbColor = {
    r: Math.round(rgb.r),
    g: Math.round(rgb.g),
    b: Math.round(rgb.b),
  };
  assertValidRgb(normalized);
  return {
    rgb: normalized,
    cmyk: rgbToCmyk(normalized),
    hex: rgbToHex(normalized),
    hsl: rgbToHsl(normalized),
  };
}

/**
 * 一次性取得 CMYK 对应的全部表示（RGB / HEX / HSL）。
 *
 * @param cmyk - CMYK 颜色
 * @returns 归一化后的颜色集合
 */
export function fromCmyk(cmyk: CmykColor): {
  rgb: RgbColor;
  cmyk: CmykColor;
  hex: string;
  hsl: HslColor;
} {
  assertValidCmyk(cmyk);
  const rgb = cmykToRgb(cmyk);
  return {
    rgb,
    cmyk: rgbToCmyk(rgb),
    hex: rgbToHex(rgb),
    hsl: rgbToHsl(rgb),
  };
}
