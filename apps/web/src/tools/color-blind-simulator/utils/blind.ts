/**
 * RGB 三通道颜色，取值 0 至 255
 */
export interface RgbColor {
  /** 红色通道 */
  r: number;
  /** 绿色通道 */
  g: number;
  /** 蓝色通道 */
  b: number;
}

/** 色觉类型标识 */
export type BlindType =
  | 'normal'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia';

/**
 * 将十六进制颜色串解析为 RGB 通道
 *
 * @param hex - 形如 "#2563EB" 的颜色串
 * @returns RGB 通道值；输入非法时返回 null
 */
export function parseHexToRgb(hex: string): RgbColor | null {
  const cleanHex = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    return null;
  }
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  };
}

/**
 * 将 RGB 通道转换为大写 HEX
 *
 * @param rgb - RGB 通道值
 * @returns HEX 颜色串
 */
export function formatRgbToHex(rgb: RgbColor): string {
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) =>
    Math.min(255, Math.max(0, Math.round(channel)))
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${channels.join('')}`.toUpperCase();
}

/** 各色觉类型对应的 RGB 线性变换矩阵 */
const BLIND_MATRICES: Record<
  Exclude<BlindType, 'normal'>,
  [number, number, number, number, number, number, number, number, number]
> = {
  protanopia: [
    0.567, 0.433, 0,
    0.558, 0.442, 0,
    0, 0.242, 0.758,
  ],
  deuteranopia: [
    0.625, 0.375, 0,
    0.7, 0.3, 0,
    0, 0.3, 0.7,
  ],
  tritanopia: [
    0.95, 0.05, 0,
    0, 0.433, 0.567,
    0, 0.475, 0.525,
  ],
  achromatopsia: [
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
  ],
};

/**
 * 依据色觉类型模拟颜色在对应人群眼中的呈现
 *
 * @param rgb - 原始 RGB 颜色
 * @param type - 色觉类型
 * @returns 模拟后的 RGB 颜色
 */
export function simulateColor(rgb: RgbColor, type: BlindType): RgbColor {
  if (type === 'normal') {
    return rgb;
  }
  const matrix = BLIND_MATRICES[type];
  return {
    r: rgb.r * matrix[0] + rgb.g * matrix[1] + rgb.b * matrix[2],
    g: rgb.r * matrix[3] + rgb.g * matrix[4] + rgb.b * matrix[5],
    b: rgb.r * matrix[6] + rgb.g * matrix[7] + rgb.b * matrix[8],
  };
}

/**
 * 对整张画布的像素执行色觉模拟
 *
 * @param source - 原始画布
 * @param target - 输出画布
 * @param type - 色觉类型
 */
export function simulateCanvas(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  type: BlindType,
): void {
  const sourceContext = source.getContext('2d');
  const targetContext = target.getContext('2d');
  if (!sourceContext || !targetContext) {
    return;
  }
  target.width = source.width;
  target.height = source.height;
  const imageData = sourceContext.getImageData(0, 0, source.width, source.height);
  const pixels = imageData.data;
  for (let index = 0; index < pixels.length; index += 4) {
    const simulated = simulateColor(
      {
        r: pixels[index] ?? 0,
        g: pixels[index + 1] ?? 0,
        b: pixels[index + 2] ?? 0,
      },
      type,
    );
    pixels[index] = simulated.r;
    pixels[index + 1] = simulated.g;
    pixels[index + 2] = simulated.b;
  }
  targetContext.putImageData(imageData, 0, 0);
}

/**
 * 按 WCAG 计算相对亮度
 *
 * @param rgb - RGB 颜色
 * @returns 相对亮度
 */
function getLuminance(rgb: RgbColor): number {
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (
    (channels[0] ?? 0) * 0.2126 +
    (channels[1] ?? 0) * 0.7152 +
    (channels[2] ?? 0) * 0.0722
  );
}

/**
 * 判断一组颜色在指定色觉条件下是否仍两两可区分，
 * 同时要求相邻颜色的模拟亮度差异足够大
 *
 * @param palette - 原始 HEX 调色板
 * @param type - 色觉类型
 * @returns 该色觉条件下全部颜色可区分时返回真
 */
export function isPaletteSafe(palette: string[], type: BlindType): boolean {
  const simulated = palette.map((hex) => {
    const rgb = parseHexToRgb(hex);
    return rgb ? simulateColor(rgb, type) : { r: 0, g: 0, b: 0 };
  });

  for (let first = 0; first < simulated.length; first += 1) {
    for (let second = first + 1; second < simulated.length; second += 1) {
      const firstColor = simulated[first];
      const secondColor = simulated[second];
      if (!firstColor || !secondColor) {
        continue;
      }
      const firstLuminance = getLuminance(firstColor);
      const secondLuminance = getLuminance(secondColor);
      const colorDelta = Math.sqrt(
        (firstColor.r - secondColor.r) ** 2 +
          (firstColor.g - secondColor.g) ** 2 +
          (firstColor.b - secondColor.b) ** 2,
      );
      if (Math.abs(firstLuminance - secondLuminance) < 0.15 && colorDelta < 60) {
        return false;
      }
    }
  }
  return true;
}

/** 对色盲友好的推荐分类配色 */
export const SAFE_PALETTE: string[] = [
  '#0072B2',
  '#E69F00',
  '#009E73',
  '#CC79A7',
  '#56B4E9',
  '#D55E00',
  '#F0E442',
  '#000000',
];
