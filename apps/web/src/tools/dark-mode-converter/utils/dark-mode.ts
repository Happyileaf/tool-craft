/**
 * RGB 三通道颜色
 */
export interface RgbColor {
  /** 红色通道，取值 0 至 255 */
  r: number;
  /** 绿色通道，取值 0 至 255 */
  g: number;
  /** 蓝色通道，取值 0 至 255 */
  b: number;
}

/**
 * HSL 圆柱坐标颜色
 */
export interface HslColor {
  /** 色相，取值 0 至 360 */
  h: number;
  /** 饱和度，取值 0 至 100 */
  s: number;
  /** 明度，取值 0 至 100 */
  l: number;
}

/** 深色转换策略 */
export type DarkStrategy = 'invert' | 'soft' | 'vivid';

/**
 * 将十六进制颜色串解析为 RGB 通道
 *
 * @param hex - 形如 "#2563EB" 的颜色串
 * @returns RGB 通道值；输入非法时返回 null
 */
export function parseHexToRgb(hex: string): RgbColor | null {
  const cleanHex = hex.trim().replace(/^#/, '');
  const expandedHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((char) => char + char)
          .join('')
      : cleanHex;
  if (!/^[0-9a-fA-F]{6}$/.test(expandedHex)) {
    return null;
  }
  return {
    r: parseInt(expandedHex.slice(0, 2), 16),
    g: parseInt(expandedHex.slice(2, 4), 16),
    b: parseInt(expandedHex.slice(4, 6), 16),
  };
}

/**
 * 将 RGB 通道转换为大写 HEX 颜色串
 *
 * @param rgb - RGB 通道值
 * @returns 形如 "#2563EB" 的颜色串
 */
export function formatRgbToHex(rgb: RgbColor): string {
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) =>
    Math.min(255, Math.max(0, Math.round(channel)))
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${channels.join('')}`.toUpperCase();
}

/**
 * 将 RGB 转换为 HSL 坐标
 *
 * @param rgb - RGB 颜色
 * @returns HSL 颜色
 */
export function rgbToHsl(rgb: RgbColor): HslColor {
  const red = rgb.r / 255;
  const green = rgb.g / 255;
  const blue = rgb.b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return {
    h: Math.round(hue),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

/**
 * 将 HSL 转换为 RGB 颜色
 *
 * @param hsl - HSL 颜色
 * @returns RGB 颜色
 */
export function hslToRgb(hsl: HslColor): RgbColor {
  const hue = hsl.h / 360;
  const saturation = hsl.s / 100;
  const lightness = hsl.l / 100;

  if (saturation === 0) {
    const value = Math.round(lightness * 255);
    return { r: value, g: value, b: value };
  }

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = hue * 6;
  const intermediate = chroma * (1 - Math.abs((sector % 2) - 1));
  const match = lightness - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;
  if (sector < 1) {
    red = chroma;
    green = intermediate;
  } else if (sector < 2) {
    red = intermediate;
    green = chroma;
  } else if (sector < 3) {
    green = chroma;
    blue = intermediate;
  } else if (sector < 4) {
    green = intermediate;
    blue = chroma;
  } else if (sector < 5) {
    red = intermediate;
    blue = chroma;
  } else {
    red = chroma;
    blue = intermediate;
  }

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  };
}

/**
 * 依据策略将浅色主题颜色转换为深色主题对应色：保持色相稳定，
 * 将明度映射到暗色系区间，并按策略调整饱和度
 *
 * @param lightHex - 浅色主题颜色
 * @param strategy - 转换策略
 * @returns 深色主题 HEX；输入非法时返回 null
 */
export function convertToDark(
  lightHex: string,
  strategy: DarkStrategy,
): string | null {
  const rgb = parseHexToRgb(lightHex);
  if (!rgb) {
    return null;
  }
  const hsl = rgbToHsl(rgb);

  /** 明度按 100-L 映射后压缩到 12 至 82 的区间，避免纯黑与纯白 */
  let targetLightness = 100 - hsl.l;
  targetLightness = Math.min(82, Math.max(12, targetLightness));

  let targetSaturation = hsl.s;
  if (strategy === 'invert') {
    targetSaturation = Math.max(25, Math.min(95, hsl.s));
  } else if (strategy === 'soft') {
    targetSaturation = Math.max(15, hsl.s - 18);
    targetLightness = targetLightness * 0.85 + 10;
  } else {
    targetSaturation = Math.min(95, hsl.s + 12);
  }

  return formatRgbToHex(
    hslToRgb({
      h: hsl.h,
      s: Math.round(targetSaturation),
      l: Math.round(targetLightness),
    }),
  );
}

/** 浅深主题对照的语义令牌名称 */
export interface SemanticToken {
  /** 令牌名称 */
  name: string;
  /** 浅色主题颜色 */
  light: string;
}

/** 默认的语义令牌集合 */
export const DEFAULT_TOKENS: SemanticToken[] = [
  { name: 'background', light: '#FFFFFF' },
  { name: 'surface', light: '#F8FAFC' },
  { name: 'border', light: '#E2E8F0' },
  { name: 'text-primary', light: '#0F172A' },
  { name: 'text-secondary', light: '#475569' },
  { name: 'primary', light: '#2563EB' },
  { name: 'success', light: '#16A34A' },
  { name: 'warning', light: '#D97706' },
  { name: 'danger', light: '#DC2626' },
];
