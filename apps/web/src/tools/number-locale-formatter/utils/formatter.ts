/**
 * 基于浏览器原生 Intl.NumberFormat 的数字区域化格式化纯函数集合，
 * 不依赖 DOM 与 React；同一数值可按多个 BCP 47 区域设置渲染本地排版。
 */
import { NotationEnum, NumberFormatModeEnum } from '../constants';

/** 格式化入参 */
export interface FormatNumberOptions {
  /** BCP 47 语言标签，如 zh-CN / en-US */
  locale: string;
  /** 格式化模式：数字 / 货币 / 百分比 */
  mode: NumberFormatModeEnum;
  /** ISO 4217 货币代码，仅 mode=currency 时使用 */
  currency?: string;
  /** 记法：标准或紧凑 */
  notation: NotationEnum;
  /** 是否启用千分位分组 */
  useGrouping: boolean;
  /** 最小小数位（0-20） */
  minimumFractionDigits?: number;
  /** 最大小数位（0-20） */
  maximumFractionDigits?: number;
  /** 负数是否渲染为括号形式，如 (1,234.50) */
  negativeParentheses: boolean;
}

/** 单个区域的格式化结果 */
export interface LocaleFormatResult {
  /** 区域语言标签 */
  locale: string;
  /** 格式化文本 */
  text: string;
}

/** 解析错误类型 */
export type NumberParseError = 'empty' | 'invalid';

/**
 * 将输入文本解析为有限数值；空串与空白返回 empty，无法解析或非有限数返回 invalid
 *
 * @param input - 原始输入文本
 * @returns 数值，或错误类型
 */
export function parseNumberInput(input: string): number | NumberParseError {
  const trimmed = input.trim();
  if (trimmed === '') {
    return 'empty';
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return 'invalid';
  }
  return value;
}

/**
 * 把 Intl 输出中的负号替换为会计括号写法，如 -1.234,5 → (1.234,5)、-$5 → ($5)
 *
 * @param text - Intl 格式化结果
 * @param value - 原始数值（用于判断正负）
 * @returns 括号化后的文本；非负数原样返回
 */
function applyNegativeParentheses(text: string, value: number): string {
  if (value >= 0 || Object.is(value, -0)) {
    return text;
  }
  let body = text;
  if (body.startsWith('-')) {
    body = body.slice(1);
  } else {
    const minusIndex = body.indexOf('-');
    if (minusIndex !== -1) {
      body = body.slice(0, minusIndex) + body.slice(minusIndex + 1);
    }
  }
  return `(${body})`;
}

/**
 * 按单个区域设置格式化数值
 *
 * @param value - 待格式化数值
 * @param options - 格式化选项
 * @returns 格式化文本
 */
export function formatNumber(value: number, options: FormatNumberOptions): string {
  const intlOptions: Intl.NumberFormatOptions = {
    notation: options.notation,
    useGrouping: options.useGrouping,
  };

  if (options.minimumFractionDigits !== undefined) {
    intlOptions.minimumFractionDigits = clampFractionDigits(options.minimumFractionDigits);
  }
  if (options.maximumFractionDigits !== undefined) {
    intlOptions.maximumFractionDigits = clampFractionDigits(options.maximumFractionDigits);
  }

  if (options.mode === NumberFormatModeEnum.CURRENCY) {
    intlOptions.style = 'currency';
    intlOptions.currency = options.currency ?? 'USD';
  } else if (options.mode === NumberFormatModeEnum.PERCENT) {
    intlOptions.style = 'percent';
  }

  const formatted = new Intl.NumberFormat(options.locale, intlOptions).format(value);
  return options.negativeParentheses
    ? applyNegativeParentheses(formatted, value)
    : formatted;
}

/**
 * 将小数位限制在 Intl 支持的 0-20 区间
 *
 * @param digits - 期望小数位
 * @returns 合法小数位
 */
function clampFractionDigits(digits: number): number {
  if (!Number.isFinite(digits)) {
    return 0;
  }
  return Math.min(20, Math.max(0, Math.round(digits)));
}

/**
 * 批量按多个区域设置格式化同一数值
 *
 * @param value - 待格式化数值
 * @param locales - 区域语言标签集合
 * @param options - 不含 locale 的格式化选项
 * @returns 各区域格式化结果，顺序与 locales 一致
 */
export function formatNumberAcrossLocales(
  value: number,
  locales: readonly string[],
  options: Omit<FormatNumberOptions, 'locale'>,
): LocaleFormatResult[] {
  return locales.map((locale) => ({
    locale,
    text: formatNumber(value, { ...options, locale }),
  }));
}
