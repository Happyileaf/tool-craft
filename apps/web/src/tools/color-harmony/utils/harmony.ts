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

/** 色彩调和方案类型 */
export type HarmonyType =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'splitComplementary'
  | 'tetradic'
  | 'monochromatic';

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

/** 各调和方案对应的色相旋转角度 */
const HARMONY_ANGLES: Record<HarmonyType, number[]> = {
  complementary: [0, 180],
  analogous: [-30, 0, 30],
  triadic: [0, 120, 240],
  splitComplementary: [0, 150, 210],
  tetradic: [0, 90, 180, 270],
  monochromatic: [0, 0, 0, 0, 0],
};

/**
 * 单色调和时各节点使用的明度档位
 */
const MONO_LIGHTNESS = [25, 38, 50, 65, 82];

/**
 * 依据基准色与调和类型生成配色集合
 *
 * @param base - 基准 HSL 颜色
 * @param type - 调和方案类型
 * @returns 调和后的 HSL 颜色集合
 */
export function buildHarmony(base: HslColor, type: HarmonyType): HslColor[] {
  const angles = HARMONY_ANGLES[type];
  if (type === 'monochromatic') {
    return MONO_LIGHTNESS.map((lightness) => ({
      h: base.h,
      s: Math.max(20, Math.min(90, base.s)),
      l: lightness,
    }));
  }
  return angles.map((angle) => ({
    h: (base.h + angle + 360) % 360,
    s: base.s,
    l: base.l,
  }));
}

/**
 * 将 HSL 颜色格式化为 CSS hsl() 文本
 *
 * @param hsl - HSL 颜色
 * @returns 形如 hsl(220, 80%, 60%) 的文本
 */
export function formatHslCss(hsl: HslColor): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}
