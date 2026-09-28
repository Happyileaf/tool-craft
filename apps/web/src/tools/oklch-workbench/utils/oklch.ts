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
 * OKLCH 圆柱坐标颜色
 */
export interface OklchColor {
  /** 感知亮度，取值 0 至 1 */
  lightness: number;
  /** 色度，通常在 0 至 0.4 之间 */
  chroma: number;
  /** 色相角，取值 0 至 360 */
  hue: number;
}

/**
 * 单档 OKLCH 衍生色
 */
export interface OklchShade {
  /** Tailwind 风格档位名称 */
  level: string;
  /** 大写 HEX 颜色值 */
  hex: string;
  /** 该档位对应的 OKLCH CSS 文本 */
  css: string;
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
export function formatRgbToHex(rgb: RgbColor): string {
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) =>
    Math.min(255, Math.max(0, Math.round(channel)))
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${channels.join('')}`.toUpperCase();
}

/**
 * sRGB 单通道转线性光
 *
 * @param channel - sRGB 通道值，取值 0 至 255
 * @returns 线性光通道，取值 0 至 1
 */
function srgbChannelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

/**
 * 线性光通道转 sRGB 通道
 *
 * @param value - 线性光通道，取值 0 至 1
 * @returns sRGB 通道值，取值 0 至 255
 */
function linearChannelToSrgb(value: number): number {
  const normalized =
    value <= 0.0031308
      ? value * 12.92
      : 1.055 * value ** (1 / 2.4) - 0.055;
  return normalized * 255;
}

/**
 * 将 sRGB 颜色转换为 OKLCH 坐标
 *
 * @param rgb - sRGB 颜色
 * @returns 对应的 OKLCH 颜色
 */
export function rgbToOklch(rgb: RgbColor): OklchColor {
  const red = srgbChannelToLinear(rgb.r);
  const green = srgbChannelToLinear(rgb.g);
  const blue = srgbChannelToLinear(rgb.b);

  const l_ =
    0.8189330101 * red + 0.3618667424 * green - 0.1288597137 * blue;
  const m_ =
    0.0329845436 * red + 0.9293118715 * green + 0.0361456387 * blue;
  const s_ =
    0.0482003018 * red + 0.2643662691 * green + 0.633851707 * blue;

  const lCube = Math.cbrt(l_);
  const mCube = Math.cbrt(m_);
  const sCube = Math.cbrt(s_);

  const lightness =
    0.2104542553 * lCube + 0.793617785 * mCube - 0.0040720468 * sCube;
  const a =
    1.9779984951 * lCube - 2.428592205 * mCube + 0.4505937099 * sCube;
  const b =
    0.0259040371 * lCube + 0.7827717662 * mCube - 0.808675766 * sCube;

  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  return {
    lightness,
    chroma: Math.sqrt(a * a + b * b),
    hue: hue < 0 ? hue + 360 : hue,
  };
}

/**
 * 判断线性 RGB 三通道是否全部落在合法色域内
 *
 * @param channels - 线性 RGB 通道
 * @returns 全部通道位于 0 至 1 时返回真
 */
function isInGamut(channels: [number, number, number]): boolean {
  return channels.every((value) => value >= -0.0001 && value <= 1.0001);
}

/**
 * 将 OKLCH 颜色转换为 sRGB，对超出色域的颜色按二分法收缩色度
 *
 * @param color - OKLCH 颜色
 * @returns sRGB 颜色
 */
export function oklchToRgb(color: OklchColor): RgbColor {
  const hueRadians = (color.hue * Math.PI) / 180;

  /**
   * 依据给定色度执行 OKLCH 到线性 RGB 的转换
   *
   * @param chroma - 当前尝试的色度
   * @returns 线性 RGB 通道
   */
  function convert(chroma: number): [number, number, number] {
    const a = chroma * Math.cos(hueRadians);
    const b = chroma * Math.sin(hueRadians);

    const lCube = color.lightness + 0.3963377774 * a + 0.2158037573 * b;
    const mCube = color.lightness - 0.1055613458 * a - 0.0638541728 * b;
    const sCube = color.lightness - 0.0894841775 * a - 1.291485548 * b;

    const l_ = lCube ** 3;
    const m_ = mCube ** 3;
    const s_ = sCube ** 3;

    return [
      4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
      -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
      -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
    ];
  }

  let lowChroma = 0;
  let highChroma = color.chroma;
  let channels = convert(highChroma);

  if (!isInGamut(channels)) {
    for (let index = 0; index < 24; index += 1) {
      const middleChroma = (lowChroma + highChroma) / 2;
      channels = convert(middleChroma);
      if (isInGamut(channels)) {
        lowChroma = middleChroma;
      } else {
        highChroma = middleChroma;
      }
    }
    channels = convert(lowChroma);
  }

  return {
    r: linearChannelToSrgb(channels[0]),
    g: linearChannelToSrgb(channels[1]),
    b: linearChannelToSrgb(channels[2]),
  };
}

/**
 * 将 OKLCH 颜色格式化为现代浏览器可用的 CSS 文本
 *
 * @param color - OKLCH 颜色
 * @returns 形如 oklch(65% 0.18 250) 的 CSS 文本
 */
export function formatOklchCss(color: OklchColor): string {
  return `oklch(${(color.lightness * 100).toFixed(1)}% ${color.chroma.toFixed(3)} ${color.hue.toFixed(1)})`;
}

/** 生成色阶时各档位对应的目标亮度 */
const SHADE_LIGHTNESS: Record<string, number> = {
  '50': 0.97,
  '100': 0.93,
  '200': 0.84,
  '300': 0.74,
  '400': 0.63,
  '500': 0.55,
  '600': 0.48,
  '700': 0.4,
  '800': 0.31,
  '900': 0.22,
};

/**
 * 依据 OKLCH 基准色的色度与色相生成感知均匀的十级色阶
 *
 * @param color - OKLCH 基准色
 * @returns 按档位排列的衍生色集合
 */
export function buildOklchShades(color: OklchColor): OklchShade[] {
  return Object.entries(SHADE_LIGHTNESS).map(([level, lightness]) => {
    const shade: OklchColor = {
      lightness,
      chroma: color.chroma,
      hue: color.hue,
    };
    const rgb = oklchToRgb(shade);
    return {
      level,
      hex: formatRgbToHex(rgb),
      css: formatOklchCss(shade),
    };
  });
}
