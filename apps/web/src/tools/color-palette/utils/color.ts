import { SHADE_STOPS } from '../constants';

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
 * 单档衍生色
 */
export interface ColorShade {
  /** Tailwind 风格档位名称 */
  level: string;
  /** 大写 HEX 颜色值 */
  hex: string;
  /** RGB 通道值 */
  rgb: RgbColor;
}

/**
 * 将十六进制颜色串解析为 RGB 通道，支持三位与六位写法
 *
 * @param hex - 形如 "#FFF" 或 "#2563EB" 的颜色串
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
export function formatRgbToHex(rgb: RgbColor) {
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    return Math.min(255, Math.max(0, Math.round(channel)))
      .toString(16)
      .padStart(2, '0');
  });
  return `#${channels.join('')}`.toUpperCase();
}

/**
 * 按 WCAG 2.1 规范计算颜色的相对亮度
 *
 * @param rgb - RGB 通道值
 * @returns 相对亮度，取值 0 至 1
 */
export function getRelativeLuminance(rgb: RgbColor) {
  const linearized = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (
    (linearized[0] ?? 0) * 0.2126 +
    (linearized[1] ?? 0) * 0.7152 +
    (linearized[2] ?? 0) * 0.0722
  );
}

/**
 * 计算两种颜色之间的 WCAG 对比度
 *
 * @param first - 第一种颜色
 * @param second - 第二种颜色
 * @returns 对比度，取值 1 至 21
 */
export function getContrastRatio(first: RgbColor, second: RgbColor) {
  const firstLuminance = getRelativeLuminance(first);
  const secondLuminance = getRelativeLuminance(second);
  const brightest = Math.max(firstLuminance, secondLuminance);
  const darkest = Math.min(firstLuminance, secondLuminance);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * 根据基准色与明暗系数衍生单档颜色，系数小于 1 时向白色混合，
 * 大于 1 时直接压缩通道得到更深的颜色
 *
 * @param base - 基准色 RGB 值
 * @param factor - 明暗系数
 * @returns 该档位的 RGB 值
 */
export function mixShade(base: RgbColor, factor: number): RgbColor {
  if (factor < 1) {
    return {
      r: base.r * factor + (1 - factor) * 255,
      g: base.g * factor + (1 - factor) * 255,
      b: base.b * factor + (1 - factor) * 255,
    };
  }
  const darkFactor = 2 - factor;
  return {
    r: base.r * darkFactor,
    g: base.g * darkFactor,
    b: base.b * darkFactor,
  };
}

/**
 * 基于基准色生成完整的十级 Tailwind 风格色阶
 *
 * @param base - 基准色 RGB 值
 * @returns 按档位排列的衍生色集合
 */
export function buildShades(base: RgbColor): ColorShade[] {
  return SHADE_STOPS.map((stop) => {
    const rgb = mixShade(base, stop.factor);
    return {
      level: stop.level,
      hex: formatRgbToHex(rgb),
      rgb: {
        r: Math.round(rgb.r),
        g: Math.round(rgb.g),
        b: Math.round(rgb.b),
      },
    };
  });
}

/**
 * 生成一个饱和度与明度适中的随机颜色，便于快速探索配色
 *
 * @returns 随机颜色的 RGB 值
 */
export function createRandomRgb(): RgbColor {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 0.45 + Math.random() * 0.3;
  const lightness = 0.4 + Math.random() * 0.2;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = hue / 60;
  const intermediate = chroma * (1 - Math.abs((sector % 2) - 1));
  const match = lightness - chroma / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (sector < 1) {
    r = chroma;
    g = intermediate;
  } else if (sector < 2) {
    r = intermediate;
    g = chroma;
  } else if (sector < 3) {
    g = chroma;
    b = intermediate;
  } else if (sector < 4) {
    g = intermediate;
    b = chroma;
  } else if (sector < 5) {
    r = intermediate;
    b = chroma;
  } else {
    r = chroma;
    b = intermediate;
  }
  return {
    r: Math.round((r + match) * 255),
    g: Math.round((g + match) * 255),
    b: Math.round((b + match) * 255),
  };
}
