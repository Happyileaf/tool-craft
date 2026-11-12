/**
 * APCA（Advanced Perceptual Contrast Algorithm）感知对比度纯函数。
 * 常量与算法严格遵循 SAPC-8 / APCA 0.0.98G-4g W3 候选版本
 * （对照 apca-w3@0.1.9 官方参考实现），全部为确定性数值运算，
 * 无 DOM 依赖，可在 Node 与浏览器运行。
 */

/** sRGB 颜色（0–255 通道） */
export interface RgbColor {
  /** 红通道 0–255 */
  r: number;
  /** 绿通道 0–255 */
  g: number;
  /** 蓝通道 0–255 */
  b: number;
}

/** 解析后的颜色，携带可选 alpha（0–1） */
export interface ParsedColor extends RgbColor {
  /** 不透明度 0–1，缺省为 1 */
  alpha: number;
}

/** APCA 计算结果 */
export interface ApcaResult {
  /** 感知对比度 Lc，范围约 -108 至 +108；正值表示浅色背景上的深色文字 */
  lc: number;
  /** Lc 的绝对值，便于按等级查表 */
  magnitude: number;
  /** 对比极性：normal 深字浅底（BoW）/ reverse 浅字深底（WoB）/ none 对比被裁剪为 0 */
  polarity: 'normal' | 'reverse' | 'none';
  /** 前景感知亮度 Y（soft-clamp 后） */
  yText: number;
  /** 背景感知亮度 Y（soft-clamp 后） */
  yBackground: number;
  /** 达到的最高使用等级标识 */
  level: string;
  /** 等级对应的推荐用法 */
  recommendation: string;
}

/* APCA 0.0.98G-4g 官方常量（apca-w3 SA98G） */
const MAIN_TRC = 2.4;
const SRCO = 0.2126729;
const SGCO = 0.7151522;
const SBCO = 0.072175;
const NORM_BG = 0.56;
const NORM_TXT = 0.57;
const REV_TXT = 0.62;
const REV_BG = 0.65;
const BLK_THRS = 0.022;
const BLK_CLMP = 1.414;
const SCALE_BOW = 1.14;
const SCALE_WOB = 1.14;
const LO_BOW_OFFSET = 0.027;
const LO_WOB_OFFSET = 0.027;
const DELTA_Y_MIN = 0.0005;
const LO_CLIP = 0.1;

/**
 * 把 hex 或 rgb()/rgba() 颜色字符串解析为 sRGB 通道。
 * 支持 #rgb、#rgba、#rrggbb、#rrggbbaa、rgb(r,g,b)、rgba(r,g,b,a)。
 *
 * @param input - 颜色文本
 * @returns 解析后的颜色；非法输入返回 null
 */
export function parseColor(input: string): ParsedColor | null {
  const text = input.trim().toLowerCase();
  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(text);
  if (hexMatch && hexMatch[1]) {
    let hex = hexMatch[1];
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split('')
        .map((char) => char + char)
        .join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, alpha };
  }
  const rgbMatch =
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(1|0|0?\.\d+))?\s*\)$/.exec(text);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    if (r > 255 || g > 255 || b > 255) {
      return null;
    }
    const alpha = rgbMatch[4] === undefined ? 1 : Number(rgbMatch[4]);
    if (alpha < 0 || alpha > 1) {
      return null;
    }
    return { r, g, b, alpha };
  }
  return null;
}

/**
 * APCA 官方 sRGB → Y 亮度转换：直接对归一化通道做 2.4 次幂再加权
 * （注意：这不是 WCAG 2.1 的分段线性化）。
 *
 * @param color - sRGB 颜色
 * @returns APCA 线性亮度 Y
 */
export function apcaLuminance(color: RgbColor): number {
  const linear = (channel: number): number => Math.pow(channel / 255, MAIN_TRC);
  return SRCO * linear(color.r) + SGCO * linear(color.g) + SBCO * linear(color.b);
}

/**
 * WCAG 2.1 相对亮度：分段 sRGB 线性化 + BT.709 加权。
 *
 * @param color - sRGB 颜色
 * @returns WCAG 相对亮度，约 0–1
 */
export function wcagLuminance(color: RgbColor): number {
  const linear = (channel: number): number => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, MAIN_TRC);
  };
  return SRCO * linear(color.r) + SGCO * linear(color.g) + SBCO * linear(color.b);
}

/**
 * 前景 alpha 混合到不透明背景上（gamma 编码空间内按 alpha 合成后取整）。
 *
 * @param foreground - 可能带透明度的前景
 * @param background - 不透明背景
 * @returns 混合后的不透明颜色
 */
function alphaBlend(foreground: ParsedColor, background: RgbColor): RgbColor {
  const a = foreground.alpha;
  const blend = (fg: number, bg: number): number =>
    Math.min(Math.round(bg * (1 - a) + fg * a), 255);
  return {
    r: blend(foreground.r, background.r),
    g: blend(foreground.g, background.g),
    b: blend(foreground.b, background.b),
  };
}

/**
 * APCA 黑端 soft-clamp：仅对低于阈值的亮度做软钳制，无白端 clamp。
 *
 * @param y - 线性亮度
 * @returns 钳制后的亮度
 */
function softClampBlack(y: number): number {
  return y > BLK_THRS ? y : y + Math.pow(BLK_THRS - y, BLK_CLMP);
}

/**
 * 按 APCA 0.0.98G-4g 计算前景（文字）与背景之间的感知对比度 Lc。
 * 前景带 alpha 时先在背景上做 alpha 混合。
 *
 * @param text - 前景色（可带 alpha）
 * @param background - 背景色
 * @returns 完整 APCA 结果
 */
export function apcaContrast(text: ParsedColor, background: RgbColor): ApcaResult {
  const effectiveText = text.alpha < 1 ? alphaBlend(text, background) : text;

  let yText = softClampBlack(apcaLuminance(effectiveText));
  let yBg = softClampBlack(apcaLuminance(background));

  // 亮度差极小，直接判定为无对比
  if (Math.abs(yBg - yText) < DELTA_Y_MIN) {
    return buildResult(0, yText, yBg, 'none');
  }

  let outputContrast: number;
  let polarity: ApcaResult['polarity'];

  if (yBg > yText) {
    // BoW：深字浅底，正常极性，Lc 为正
    const sapc = (Math.pow(yBg, NORM_BG) - Math.pow(yText, NORM_TXT)) * SCALE_BOW;
    outputContrast = sapc < LO_CLIP ? 0 : sapc - LO_BOW_OFFSET;
    polarity = outputContrast === 0 ? 'none' : 'normal';
  } else {
    // WoB：浅字深底，反向极性，Lc 为负
    const sapc = (Math.pow(yBg, REV_BG) - Math.pow(yText, REV_TXT)) * SCALE_WOB;
    outputContrast = sapc > -LO_CLIP ? 0 : sapc + LO_WOB_OFFSET;
    polarity = outputContrast === 0 ? 'none' : 'reverse';
  }

  const lc = outputContrast * 100;
  return buildResult(lc, yText, yBg, polarity);
}

/**
 * 组装结果并附带等级推荐。
 *
 * @param lc - 带符号 Lc
 * @param yText - 前景亮度
 * @param yBg - 背景亮度
 * @param polarity - 极性
 * @returns 完整结果
 */
function buildResult(
  lc: number,
  yText: number,
  yBg: number,
  polarity: ApcaResult['polarity'],
): ApcaResult {
  const roundedLc = Math.round(lc * 10) / 10;
  const magnitude = Math.abs(roundedLc);
  const levelInfo = recommendLevel(magnitude);
  return {
    lc: roundedLc,
    magnitude,
    polarity,
    yText,
    yBackground: yBg,
    level: levelInfo.level,
    recommendation: levelInfo.recommendation,
  };
}

/**
 * 按 APCA 用法等级表给出推荐用途与字号/字重阈值。
 * 等级阈值 Lc90/Lc75/Lc60/Lc45/Lc30/Lc15 来自官方 fontLookupAPCA LUT 分级。
 *
 * @param magnitude - Lc 绝对值
 * @returns 等级与推荐文案
 */
export function recommendLevel(magnitude: number): {
  level: string;
  recommendation: string;
} {
  if (magnitude >= 90) {
    return {
      level: 'Lc90',
      recommendation: '适合任何字号的正文文本，包括 12px 及以下的小字与轻字重',
    };
  }
  if (magnitude >= 75) {
    return {
      level: 'Lc75',
      recommendation: '适合正文文本，最小约 14px（常规字重）或 12px 粗体',
    };
  }
  if (magnitude >= 60) {
    return {
      level: 'Lc60',
      recommendation: '适合 16px 常规字重或 14px 粗体以上的文本',
    };
  }
  if (magnitude >= 45) {
    return {
      level: 'Lc45',
      recommendation: '适合 18–24px 标题、粗体或大号展示文本',
    };
  }
  if (magnitude >= 30) {
    return {
      level: 'Lc30',
      recommendation: '仅适合 24px 以上的大标题或非文本图形元素',
    };
  }
  if (magnitude >= 15) {
    return {
      level: 'Lc15',
      recommendation: '仅适合非文本元素（如图标、图表、分隔线），不用于文本',
    };
  }
  return {
    level: '低于 Lc15',
    recommendation: '对比度过低，文本与关键图形均不建议使用此配色',
  };
}

/**
 * 同时计算 WCAG 2.1 相对亮度对比度比值（1–21），便于与 APCA 对照。
 *
 * @param text - 前景色
 * @param background - 背景色
 * @returns WCAG 对比度比值
 */
export function wcagContrastRatio(text: RgbColor, background: RgbColor): number {
  const yText = wcagLuminance(text);
  const yBg = wcagLuminance(background);
  const lighter = Math.max(yText, yBg);
  const darker = Math.min(yText, yBg);
  return (lighter + 0.05) / (darker + 0.05);
}
