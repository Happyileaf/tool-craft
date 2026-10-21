/**
 * 百分比计算纯函数集合，不依赖 DOM 与 React；
 * 除数为 0 或输入非法时返回 null，由调用方渲染提示
 */

/** 展示时保留的最大小数位数 */
export const MAX_DISPLAY_DECIMALS = 6;

/**
 * 将用户输入解析为有限数值；空串、空白或非有限数值（NaN / Infinity）返回 null
 *
 * @param input - 原始输入文本
 * @returns 解析后的数值，无法解析时为 null
 */
export function parseNumeric(input: string): number | null {
  if (input == null) {
    return null;
  }
  const trimmed = input.trim();
  if (trimmed === '') {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/**
 * 计算「x 的 y% 是多少」：x × y / 100
 *
 * @param x - 基数
 * @param y - 百分比数值（如 25 表示 25%）
 * @returns 计算结果
 */
export function percentOf(x: number, y: number): number {
  return (x * y) / 100;
}

/**
 * 计算「x 是 y 的百分之几」：x / y × 100
 *
 * @param x - 部分值
 * @param y - 整体值
 * @returns 百分比数值；y 为 0 时返回 null
 */
export function percentageRatio(x: number, y: number): number | null {
  if (y === 0) {
    return null;
  }
  return (x / y) * 100;
}

/**
 * 计算「to 相对 from 变化百分之几」：(to − from) / from × 100；
 * 正值表示增长，负值表示下降
 *
 * @param from - 变化前的值
 * @param to - 变化后的值
 * @returns 变化百分比；from 为 0 时返回 null
 */
export function percentageChange(from: number, to: number): number | null {
  if (from === 0) {
    return null;
  }
  return ((to - from) / from) * 100;
}

/**
 * 将数值格式化为至多 6 位小数并去除尾随 0 的展示文本
 *
 * @param value - 待展示数值
 * @returns 格式化后的字符串
 */
export function formatResult(value: number): string {
  const fixed = value.toFixed(MAX_DISPLAY_DECIMALS);
  return fixed.replace(/\.?0+$/, '');
}
