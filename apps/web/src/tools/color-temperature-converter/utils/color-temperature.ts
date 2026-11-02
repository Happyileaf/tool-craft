/**
 * 色温（开尔文 K）↔ sRGB 颜色双向转换（零依赖纯函数）
 *
 * - K → RGB：采用 Tanner Helland 发布、被广泛使用的黑体辐射近似公式
 *   （红/绿/蓝分段多项式，有效范围 1000–40000K），结果裁剪到 0–255。
 * - RGB → CCT：采用 McCamy (1992) 相关色温近似公式：
 *   n = (x - xe) / (y - ye)，CCT = 437n³ + 3601n² - 6861n + 5517
 *   （xe = 0.3320, ye = 0.1858），输入为 sRGB（sRGB 传递函数 → 线性 → XYZ）。
 *
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export const MIN_KELVIN = 1000;
export const MAX_KELVIN = 40000;

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const clamp255 = (value: number): number => {
  if (value < 0) return 0;
  if (value > 255) return 255;
  return Math.round(value);
};

/**
 * 由色温（K）计算 sRGB 分量。超出 1000–40000K 范围时按边界裁剪。
 * 分段常数 329.698727446 / 288.1221695283 等为经验拟合系数。
 */
export function kelvinToRgb(kelvin: number): RgbColor {
  const temperature = Math.min(MAX_KELVIN, Math.max(MIN_KELVIN, kelvin));
  const t = temperature / 100;

  let red: number;
  let green: number;
  let blue: number;

  if (t <= 66) {
    red = 255;
    green = 99.4708025861 * Math.log(t) - 161.1195681661;
    blue = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    red = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    green = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    blue = 255;
  }

  return { r: clamp255(red), g: clamp255(green), b: clamp255(blue) };
}

function toHexChannel(value: number): string {
  return value.toString(16).padStart(2, '0').toUpperCase();
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

/** 解析 #rgb / #rrggbb / rgb(r,g,b)；非法返回 null */
export function parseColor(input: string): RgbColor | null {
  const text = input.trim().toLowerCase().replace(/\s+/g, '');

  let match = /^#([0-9a-f]{3})$/.exec(text);
  if (match) {
    const hex = match[1] ?? '';
    return {
      r: parseInt(hex[0]! + hex[0]!, 16),
      g: parseInt(hex[1]! + hex[1]!, 16),
      b: parseInt(hex[2]! + hex[2]!, 16),
    };
  }

  match = /^#([0-9a-f]{6})$/.exec(text);
  if (match) {
    const hex = match[1] ?? '';
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  match = /^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/.exec(text);
  if (match) {
    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);
    if (r > 255 || g > 255 || b > 255) return null;
    return { r, g, b };
  }

  return null;
}

/** sRGB 通道值（0–255）转线性分量 */
function srgbChannelToLinear(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * 由 sRGB 颜色估算相关色温（CCT，单位 K）。
 * 对无色彩信息（x+y≈0，如纯黑）返回错误；对黑体轨迹之外的颜色
 * （如品红、高饱和绿）McCamy 公式仍给出数值但物理意义较弱。
 */
export function rgbToCct(rgb: RgbColor): number {
  const rLin = srgbChannelToLinear(rgb.r);
  const gLin = srgbChannelToLinear(rgb.g);
  const bLin = srgbChannelToLinear(rgb.b);

  // 线性 sRGB（D65）→ CIE XYZ
  const x = 0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin;
  const y = 0.2126729 * rLin + 0.7151522 * gLin + 0.072175 * bLin;
  const z = 0.0193339 * rLin + 0.119192 * gLin + 0.9503041 * bLin;

  const sum = x + y + z;
  if (sum === 0) {
    throw new Error('颜色为纯黑（无任何光通量），无法计算色温');
  }

  const cx = x / sum;
  const cy = y / sum;

  // McCamy 等色温线焦点
  const xe = 0.3320;
  const ye = 0.1858;
  const n = (cx - xe) / (cy - ye);

  const cct = 437 * n * n * n + 3601 * n * n - 6861 * n + 5517;
  return Math.round(cct);
}

export interface ColorToCctResult {
  cct: number | null;
  error: string | null;
}

export function colorInputToCct(input: string): ColorToCctResult {
  const rgb = parseColor(input);
  if (!rgb) {
    return { cct: null, error: '无法识别颜色：支持 #RRGGBB、#RGB 与 rgb(r,g,b) 格式' };
  }
  try {
    return { cct: rgbToCct(rgb), error: null };
  } catch (error) {
    return { cct: null, error: error instanceof Error ? error.message : '色温计算失败' };
  }
}
