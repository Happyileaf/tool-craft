/**
 * APCA（Advanced Perceptual Contrast Algorithm，WCAG 3 候选对比度算法）
 * 纯函数集合，不依赖 DOM 与 React；
 * 实现 W3C 公开的 APCA W3 常量版本（0.1.9 G 常数），全部运算在浏览器本地完成
 */

/** sRGB 三元组，各通道为 0–255 整数 */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** APCA 计算所需的归一化颜色（0–1） */
interface NormalizedColor {
  r: number;
  g: number;
  b: number;
}

/** APCA W3 0.1.9 G 常数 */
const APCG_BLACK_THRESHOLD = 0.022;
const APCG_BLACK_CLIP = 1.414;
const APCG_MAX_WHITE = 0.999;
const APCG_EPSILON = 0.0005;

/**
 * 解析十六进制颜色为 sRGB 三元组，支持 #RGB、#RRGGBB 与 #RRGGBBAA；
 * 带 alpha 时要求 alpha ≥ 128（半透明以上），否则报错提示对比度无意义。
 *
 * @param hex - 十六进制颜色字符串
 * @returns RGB 三元组
 */
export function parseHexColor(hex: string): RgbColor {
  const normalized = hex.trim().replace(/^#/, '');
  const shortMatch = /^([0-9a-fA-F]{3})$/;
  const longMatch = /^([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/;

  if (shortMatch.test(normalized)) {
    const chars = normalized.split('');
    return {
      r: parseInt(`${chars[0]}${chars[0]}`, 16),
      g: parseInt(`${chars[1]}${chars[1]}`, 16),
      b: parseInt(`${chars[2]}${chars[2]}`, 16),
    };
  }

  const long = longMatch.exec(normalized);
  if (long) {
    const rgbPart = long[1] ?? '';
    const alphaPart = long[2];
    if (alphaPart !== undefined) {
      const alpha = parseInt(alphaPart, 16);
      if (alpha < 128) {
        throw new Error('颜色透明度低于 50%，无法计算有意义的不透明对比度');
      }
    }
    return {
      r: parseInt(rgbPart.slice(0, 2), 16),
      g: parseInt(rgbPart.slice(2, 4), 16),
      b: parseInt(rgbPart.slice(4, 6), 16),
    };
  }

  throw new Error('颜色格式非法，仅支持 #RGB、#RRGGBB 或 #RRGGBBAA');
}

/**
 * 将 RGB 颜色格式化为大写十六进制字符串
 *
 * @param color - RGB 三元组
 * @returns 形如 #RRGGBB 的字符串
 */
export function toHex(color: RgbColor): string {
  const toByte = (value: number): string =>
    Math.round(value).toString(16).padStart(2, '0').toUpperCase();
  return `#${toByte(color.r)}${toByte(color.g)}${toByte(color.b)}`;
}

/**
 * sRGB 单通道反伽马：归一化值 → 线性光值
 *
 * @param channel - 0–1 的 sRGB 通道值
 * @returns 线性光值
 */
function srgbToLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/**
 * 计算 APCA 感知亮度 Y（软裁剪黑位与白位后的线性亮度）
 *
 * @param color - sRGB 三元组
 * @returns APCA 亮度值
 */
function apcaLuminance(color: NormalizedColor): number {
  // sRGB → 线性光
  const linearR = srgbToLinear(color.r);
  const linearG = srgbToLinear(color.g);
  const linearB = srgbToLinear(color.b);

  // APCA 感知加权（区别于 WCAG 2 的 0.2126/0.7152/0.0722）
  let luminance = 0.2126729 * linearR + 0.7151522 * linearG + 0.072175 * linearB;

  // 软黑位裁剪
  luminance =
    luminance < APCG_BLACK_THRESHOLD
      ? luminance + (APCG_BLACK_THRESHOLD - luminance) ** APCG_BLACK_CLIP
      : luminance;

  // 软白位裁剪
  luminance =
    luminance > APCG_MAX_WHITE
      ? APCG_MAX_WHITE
      : luminance;

  return luminance;
}

/**
 * 计算 APCA 对比度 L^c。
 * 结果为带符号数值：正值表示文字（前景）比背景深（深色文字 / 浅色底），
 * 负值表示文字比背景浅（浅色文字 / 深色底），0 表示对比不足被阈值截断。
 *
 * @param textColor - 文字（前景）颜色
 * @param backgroundColor - 背景颜色
 * @returns Lc 对比度，区间约为 −108 至 +106
 */
export function apcaContrast(textColor: RgbColor, backgroundColor: RgbColor): number {
  const text: NormalizedColor = {
    r: textColor.r / 255,
    g: textColor.g / 255,
    b: textColor.b / 255,
  };
  const background: NormalizedColor = {
    r: backgroundColor.r / 255,
    g: backgroundColor.g / 255,
    b: backgroundColor.b / 255,
  };

  const textY = apcaLuminance(text);
  const backgroundY = apcaLuminance(background);

  let contrast: number;
  if (Math.abs(backgroundY - textY) < APCG_EPSILON) {
    return 0;
  }

  if (backgroundY > textY) {
    // 背景更亮 → 深色文字，输出正值（正常极性）
    contrast = (Math.pow(backgroundY, 0.56) - Math.pow(textY, 0.57)) * 1.14;
    contrast = contrast < 0.1 ? 0 : contrast - 0.027;
  } else {
    // 背景更暗 → 浅色文字，输出负值（反转极性）
    contrast = (Math.pow(backgroundY, 0.65) - Math.pow(textY, 0.62)) * 1.14;
    contrast = contrast > -0.1 ? 0 : contrast + 0.027;
  }

  // 缩放到 Lc 百分制量级并保留一位小数
  return Math.round(contrast * 1000) / 10;
}

/** APCA 可读性用途分级（基于 |Lc| 的推荐阈值） */
export interface Apcalevel {
  /** 阈值下界（含），单位 |Lc| */
  min: number;
  /** 等级标识 */
  grade: string;
  /** 中文用途说明 */
  usage: string;
  /** Ant Design 语义色 */
  color: string;
}

/**
 * 根据 |Lc| 给出推荐用途分级；
 * 阈值参考 APCA 官方可读性等级表（Lc 90/75/60/45/30/15）
 *
 * @param lc - APCA 对比度（带符号也可，内部取绝对值）
 * @returns 分级信息
 */
export function getReadabilityLevel(lc: number): Apcalevel {
  const magnitude = Math.abs(lc);
  if (magnitude >= 90) {
    return { min: 90, grade: 'Lc 90+', usage: '最优正文可读性，适合大段小字正文', color: '#389e0d' };
  }
  if (magnitude >= 75) {
    return { min: 75, grade: 'Lc 75+', usage: '合格正文级，适合常规字号正文', color: '#52c41a' };
  }
  if (magnitude >= 60) {
    return { min: 60, grade: 'Lc 60+', usage: '适合中号文字与表单内容', color: '#7cb305' };
  }
  if (magnitude >= 45) {
    return { min: 45, grade: 'Lc 45+', usage: '适合大号文字、标题与粗体', color: '#d48806' };
  }
  if (magnitude >= 30) {
    return { min: 30, grade: 'Lc 30+', usage: '仅限超大标题或装饰性文字', color: '#d46b08' };
  }
  if (magnitude >= 15) {
    return { min: 15, grade: 'Lc 15+', usage: '仅适合非文字图形元素', color: '#cf1322' };
  }
  return { min: 0, grade: 'Lc < 15', usage: '对比不足，不适合任何文字内容', color: '#a8071a' };
}

/** 校验两个颜色输入的合法性，返回中文错误信息或 null */
export function validateColorPair(textHex: string, backgroundHex: string): string | null {
  try {
    parseHexColor(textHex);
  } catch (error) {
    return `文字颜色无效：${error instanceof Error ? error.message : '未知错误'}`;
  }
  try {
    parseHexColor(backgroundHex);
  } catch (error) {
    return `背景颜色无效：${error instanceof Error ? error.message : '未知错误'}`;
  }
  return null;
}
