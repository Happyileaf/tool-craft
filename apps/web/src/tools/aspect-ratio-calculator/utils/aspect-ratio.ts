/**
 * 宽高比计算纯函数集合，不依赖 DOM 与 React；
 * 输入非法或除数为 0 时返回 null，由调用方渲染提示
 */
import { MATCH_TOLERANCE, STANDARD_RATIOS } from '../constants';

/** 展示时保留的最大小数位数 */
export const MAX_DISPLAY_DECIMALS = 4;

/** 内部整数化的小数放大倍数（保留 6 位小数） */
const INTEGER_SCALE = 1_000_000;

/**
 * 将用户输入解析为正的有限数值；空串、非数字、0 与负数返回 null
 *
 * @param input - 原始输入文本
 * @returns 解析后的正数，无法解析时为 null
 */
export function parsePositive(input: string): number | null {
  if (input == null) {
    return null;
  }
  const trimmed = input.trim();
  if (trimmed === '') {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

/**
 * 计算两个正整数的最大公约数（迭代版欧几里得算法）
 *
 * @param a - 正整数
 * @param b - 正整数
 * @returns 最大公约数
 */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x;
}

/**
 * 将任意正实数宽高化简为最小整数比：先按 6 位小数整数化再约去最大公约数
 *
 * @param width - 宽度（正实数）
 * @param height - 高度（正实数）
 * @returns 最简整数比 `{ width, height }`
 */
export function simplifyRatio(width: number, height: number): { width: number; height: number } {
  const intWidth = Math.round(width * INTEGER_SCALE);
  const intHeight = Math.round(height * INTEGER_SCALE);
  const divisor = gcd(intWidth, intHeight);
  if (divisor === 0) {
    return { width: intWidth, height: intHeight };
  }
  return { width: intWidth / divisor, height: intHeight / divisor };
}

/**
 * 解析 `W:H` 形式的比值文本，两侧均须为正数
 *
 * @param text - 比值文本，如 `16:9`
 * @returns 解析出的比值 `{ width, height }`，非法时为 null
 */
export function parseRatioText(text: string): { width: number; height: number } | null {
  if (text == null) {
    return null;
  }
  const parts = text.trim().split(':');
  if (parts.length !== 2) {
    return null;
  }
  const widthText = parts[0];
  const heightText = parts[1];
  if (widthText === undefined || heightText === undefined) {
    return null;
  }
  const width = Number(widthText.trim());
  const height = Number(heightText.trim());
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}

/**
 * 知二求三：已知比值与一条边，补全另一条边
 *
 * @param ratioWidth - 比值宽度分量
 * @param ratioHeight - 比值高度分量
 * @param target - 待补全的维度（`width` 求宽 / `height` 求高）
 * @param knownSide - 已知边长
 * @returns 补全后的边长；比值分量为 0 时返回 null
 */
export function resolveSide(
  ratioWidth: number,
  ratioHeight: number,
  target: 'width' | 'height',
  knownSide: number,
): number | null {
  if (ratioWidth <= 0 || ratioHeight <= 0) {
    return null;
  }
  if (target === 'width') {
    return (knownSide * ratioWidth) / ratioHeight;
  }
  return (knownSide * ratioHeight) / ratioWidth;
}

/**
 * 按倍数等比缩放
 *
 * @param width - 原始宽度
 * @param height - 原始高度
 * @param factor - 缩放倍数（须为正数）
 * @returns 缩放后的尺寸
 */
export function scaleByFactor(
  width: number,
  height: number,
  factor: number,
): { width: number; height: number } | null {
  if (factor <= 0) {
    return null;
  }
  return { width: width * factor, height: height * factor };
}

/**
 * 按目标宽度等比缩放
 *
 * @param width - 原始宽度
 * @param height - 原始高度
 * @param targetWidth - 目标宽度
 * @returns 缩放后的尺寸；原始宽度为 0 时返回 null
 */
export function scaleToWidth(
  width: number,
  height: number,
  targetWidth: number,
): { width: number; height: number } | null {
  if (width <= 0) {
    return null;
  }
  const factor = targetWidth / width;
  return { width: targetWidth, height: height * factor };
}

/**
 * 按目标高度等比缩放
 *
 * @param width - 原始宽度
 * @param height - 原始高度
 * @param targetHeight - 目标高度
 * @returns 缩放后的尺寸；原始高度为 0 时返回 null
 */
export function scaleToHeight(
  width: number,
  height: number,
  targetHeight: number,
): { width: number; height: number } | null {
  if (height <= 0) {
    return null;
  }
  const factor = targetHeight / height;
  return { width: width * factor, height: targetHeight };
}

/** 标准比例近似匹配结果 */
export interface RatioMatch {
  /** 命中的标准比例名称 */
  name: string;
  /** 实际比例相对标准比例的相对误差（绝对值） */
  deviation: number;
}

/**
 * 在常见标准宽高比表中寻找相对误差不超过 1% 的最接近项
 *
 * @param width - 宽度（正实数）
 * @param height - 高度（正实数）
 * @returns 最接近的标准比例及误差；无命中时返回 null
 */
export function matchStandardRatio(width: number, height: number): RatioMatch | null {
  if (width <= 0 || height <= 0) {
    return null;
  }
  const actual = width / height;
  let best: RatioMatch | null = null;
  for (const standard of STANDARD_RATIOS) {
    const candidate = standard.width / standard.height;
    const deviation = Math.abs(actual - candidate) / candidate;
    if (deviation <= MATCH_TOLERANCE && (best === null || deviation < best.deviation)) {
      best = { name: standard.name, deviation };
    }
  }
  return best;
}

/**
 * 将数值格式化为至多 4 位小数并去除尾随 0 的展示文本
 *
 * @param value - 待展示数值
 * @returns 格式化后的字符串
 */
export function formatResult(value: number): string {
  const fixed = value.toFixed(MAX_DISPLAY_DECIMALS);
  return fixed.replace(/\.?0+$/, '');
}
