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
 * 按比例在两种颜色之间做线性混合
 *
 * @param first - 第一种颜色
 * @param second - 第二种颜色
 * @param ratio - 第一种颜色占比，取值 0 至 100
 * @returns 混合后的颜色
 */
export function mixColors(
  first: RgbColor,
  second: RgbColor,
  ratio: number,
): RgbColor {
  const weight = ratio / 100;
  return {
    r: first.r * weight + second.r * (1 - weight),
    g: first.g * weight + second.g * (1 - weight),
    b: first.b * weight + second.b * (1 - weight),
  };
}

/**
 * 生成两种颜色之间的等分中间色序列
 *
 * @param first - 第一种颜色
 * @param second - 第二种颜色
 * @param steps - 中间节点数量
 * @returns 包含两端的颜色序列
 */
export function buildMixSteps(first: RgbColor, second: RgbColor, steps: number) {
  const count = Math.max(2, steps + 2);
  return Array.from({ length: count }, (_, index) => {
    const ratio = (index / (count - 1)) * 100;
    return {
      ratio: Math.round(ratio),
      hex: formatRgbToHex(mixColors(first, second, ratio)),
    };
  });
}

/**
 * 生成 CSS color-mix() 函数文本
 *
 * @param first - 第一种 HEX 颜色
 * @param second - 第二种 HEX 颜色
 * @param ratio - 第一种颜色占比，取值 0 至 100
 * @returns 形如 color-mix(in srgb, #A 40%, #B) 的文本
 */
export function buildColorMixCss(
  first: string,
  second: string,
  ratio: number,
): string {
  return `color-mix(in srgb, ${first} ${ratio}%, ${second})`;
}
