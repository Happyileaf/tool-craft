/**
 * CSS 长度单位换算纯函数集合，不依赖 DOM 与 React；
 * 以 px 为内部基准：1in = 96px = 72pt，1rem = rootFontSize px，1em = parentFontSize px；
 * 输入非法（NaN / Infinity / 非正基准 / 不支持单位）时返回 null
 */

/** 支持的 CSS 长度单位 */
export enum CssUnitEnum {
  /** 像素（基准单位） */
  PX = 'px',
  /** 根元素字号倍数 */
  REM = 'rem',
  /** 当前元素字号倍数 */
  EM = 'em',
  /** 磅（1in = 72pt = 96px） */
  PT = 'pt',
}

/** 单位换算上下文：根字号与父级字号（px） */
export interface UnitContext {
  /** 根字号（rem 基准），单位 px */
  rootFontSize: number;
  /** 父级字号（em 基准），单位 px */
  parentFontSize: number;
}

/** 每英寸对应的像素数 */
export const PX_PER_INCH = 96;

/** 每英寸对应的磅数 */
export const PT_PER_INCH = 72;

/** 默认根字号与父级字号（px） */
export const DEFAULT_FONT_SIZE = 16;

/** 对照表使用的常用 px 值 */
export const SCALE_BASE_PX = [1, 2, 4, 8, 12, 14, 16, 18, 20, 24, 32, 48];

/** 展示时保留的最大小数位数 */
export const MAX_DISPLAY_DECIMALS = 6;

/**
 * 判断字符串是否为受支持的单位
 *
 * @param unit - 待判断的单位字符串
 * @returns 是否受支持
 */
export function isSupportedUnit(unit: string): unit is CssUnitEnum {
  return (Object.values(CssUnitEnum) as string[]).includes(unit);
}

/**
 * 判断换算上下文是否合法：根字号与父级字号都必须是正有限数
 *
 * @param ctx - 换算上下文
 * @returns 是否合法
 */
export function isValidContext(ctx: UnitContext): boolean {
  return (
    Number.isFinite(ctx.rootFontSize) &&
    ctx.rootFontSize > 0 &&
    Number.isFinite(ctx.parentFontSize) &&
    ctx.parentFontSize > 0
  );
}

/**
 * 将给定单位的数值换算为 px
 *
 * @param value - 原始数值
 * @param from - 原始单位
 * @param ctx - 换算上下文
 * @returns 对应的 px 数值；非法时返回 null
 */
export function toPx(value: number, from: CssUnitEnum, ctx: UnitContext): number | null {
  if (!Number.isFinite(value) || !isValidContext(ctx)) {
    return null;
  }
  switch (from) {
    case CssUnitEnum.PX:
      return value;
    case CssUnitEnum.REM:
      return value * ctx.rootFontSize;
    case CssUnitEnum.EM:
      return value * ctx.parentFontSize;
    case CssUnitEnum.PT:
      return (value * PX_PER_INCH) / PT_PER_INCH;
    default:
      return null;
  }
}

/**
 * 将 px 数值换算为目标单位
 *
 * @param pxValue - px 数值
 * @param to - 目标单位
 * @param ctx - 换算上下文
 * @returns 目标单位数值；非法时返回 null
 */
export function fromPx(pxValue: number, to: CssUnitEnum, ctx: UnitContext): number | null {
  if (!Number.isFinite(pxValue) || !isValidContext(ctx)) {
    return null;
  }
  switch (to) {
    case CssUnitEnum.PX:
      return pxValue;
    case CssUnitEnum.REM:
      return pxValue / ctx.rootFontSize;
    case CssUnitEnum.EM:
      return pxValue / ctx.parentFontSize;
    case CssUnitEnum.PT:
      return (pxValue * PT_PER_INCH) / PX_PER_INCH;
    default:
      return null;
  }
}

/**
 * 在两种 CSS 长度单位之间换算
 *
 * @param value - 原始数值
 * @param from - 原始单位
 * @param to - 目标单位
 * @param ctx - 换算上下文（根字号 / 父级字号）
 * @returns 目标单位数值；任何输入非法时返回 null
 */
export function convertUnit(
  value: number,
  from: CssUnitEnum,
  to: CssUnitEnum,
  ctx: UnitContext,
): number | null {
  if (!isSupportedUnit(from) || !isSupportedUnit(to)) {
    return null;
  }
  const pxValue = toPx(value, from, ctx);
  if (pxValue === null) {
    return null;
  }
  return fromPx(pxValue, to, ctx);
}

/** 对照表单行：一个基准 px 值对应的四种单位数值 */
export interface ScaleRow {
  /** 基准 px 值 */
  px: number;
  /** rem 数值 */
  rem: number;
  /** em 数值 */
  em: number;
  /** pt 数值 */
  pt: number;
}

/**
 * 依据当前上下文构建常用 px 值的四单位对照表
 *
 * @param ctx - 换算上下文
 * @returns 对照表行集合；上下文非法时返回 null
 */
export function buildScaleTable(ctx: UnitContext): ScaleRow[] | null {
  if (!isValidContext(ctx)) {
    return null;
  }
  return SCALE_BASE_PX.map((px) => ({
    px,
    rem: px / ctx.rootFontSize,
    em: px / ctx.parentFontSize,
    pt: (px * PT_PER_INCH) / PX_PER_INCH,
  }));
}

/**
 * 将换算结果格式化为至多 6 位小数并去除尾随 0 的展示文本
 *
 * @param value - 待展示数值
 * @returns 格式化后的字符串
 */
export function formatUnit(value: number): string {
  const fixed = value.toFixed(MAX_DISPLAY_DECIMALS);
  return fixed.replace(/\.?0+$/, '');
}
