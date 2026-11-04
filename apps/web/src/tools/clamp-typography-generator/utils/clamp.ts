import {
  MAX_PX_VALUE,
  MIN_PX_VALUE,
  OUTPUT_DECIMALS,
  type ClampInput,
  type ClampResult,
} from '../constants';

/**
 * 按固定小数位截断并去除多余的尾零
 *
 * @param value - 原始数值
 * @param decimals - 保留小数位
 * @returns 四舍五入后的数字
 */
export function roundNumber(value: number, decimals = OUTPUT_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * 校验生成器输入是否合法
 *
 * @param input - 待校验参数
 * @returns 合法返回 null，否则返回中文错误信息
 */
export function validateClampInput(input: ClampInput): string | null {
  const fields: [keyof ClampInput, number, string][] = [
    ['minFontSize', input.minFontSize, '最小字号'],
    ['maxFontSize', input.maxFontSize, '最大字号'],
    ['minViewport', input.minViewport, '最小视口宽度'],
    ['maxViewport', input.maxViewport, '最大视口宽度'],
  ];
  for (const [, value, label] of fields) {
    if (!Number.isFinite(value)) {
      return `${label}必须是有效数字`;
    }
    if (value <= MIN_PX_VALUE || value > MAX_PX_VALUE) {
      return `${label}必须落在 ${MIN_PX_VALUE}-${MAX_PX_VALUE}px 之间`;
    }
  }
  if (input.maxFontSize <= input.minFontSize) {
    return '最大字号必须严格大于最小字号';
  }
  if (input.maxViewport <= input.minViewport) {
    return '最大视口宽度必须严格大于最小视口宽度';
  }
  return null;
}

/**
 * 依据两端点计算流式排版线性公式并生成 clamp() 表达式
 *
 * 线性模型：fontSize = slope * viewport + intercept
 * 其中 slope = (maxFont - minFont) / (maxVw - minVw)，
 * 转换为视口百分比单位后与截距一起写入 clamp。
 *
 * @param input - 生成器参数
 * @returns 斜率、截距与 clamp 表达式等结果
 * @throws 输入非法时抛出错误
 */
export function generateClamp(input: ClampInput): ClampResult {
  const error = validateClampInput(input);
  if (error) {
    throw new Error(error);
  }

  const slope =
    (input.maxFontSize - input.minFontSize) /
    (input.maxViewport - input.minViewport);
  const intercept = input.minFontSize - slope * input.minViewport;
  const slopeInViewportUnit = slope * 100;

  const slopeText = String(roundNumber(slopeInViewportUnit));
  const interceptText = String(roundNumber(intercept));
  const clampExpression = `clamp(${input.minFontSize}px, ${interceptText}px + ${slopeText}${input.viewportUnit}, ${input.maxFontSize}px)`;

  return {
    slope: roundNumber(slope),
    slopeInViewportUnit: roundNumber(slopeInViewportUnit),
    intercept: roundNumber(intercept),
    rootFontSize: 16,
    clampExpression,
    cssDeclaration: `font-size: ${clampExpression};`,
  };
}

/**
 * 按给定视口宽度计算线性公式下的实际字号（未施加 clamp 边界）
 *
 * @param input - 生成器参数
 * @param viewportWidth - 当前视口/容器宽度（px）
 * @returns 线性插值字号（px）
 */
export function fontSizeAtViewport(
  input: ClampInput,
  viewportWidth: number,
): number {
  const error = validateClampInput(input);
  if (error) {
    throw new Error(error);
  }
  const slope =
    (input.maxFontSize - input.minFontSize) /
    (input.maxViewport - input.minViewport);
  const intercept = input.minFontSize - slope * input.minViewport;
  return roundNumber(slope * viewportWidth + intercept, 2);
}

/**
 * 计算施加 clamp 边界后的实际字号：低于最小视口取最小字号，
 * 高于最大视口取最大字号，区间内走线性插值
 *
 * @param input - 生成器参数
 * @param viewportWidth - 当前视口/容器宽度（px）
 * @returns 夹取后的实际字号（px）
 */
export function clampedFontSizeAtViewport(
  input: ClampInput,
  viewportWidth: number,
): number {
  const linear = fontSizeAtViewport(input, viewportWidth);
  if (viewportWidth <= input.minViewport) {
    return input.minFontSize;
  }
  if (viewportWidth >= input.maxViewport) {
    return input.maxFontSize;
  }
  return Math.min(input.maxFontSize, Math.max(input.minFontSize, linear));
}
