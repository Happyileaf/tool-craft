import { SECOND_MAX_DIGITS } from '../constants';

/**
 * 时间戳转日期的结果
 */
export interface TimestampDateResult {
  /** 是否解析为有效日期 */
  success: boolean;
  /** 当前语言环境下的本地时间文本 */
  local: string;
  /** UTC 标准时间文本 */
  utc: string;
  /** ISO 8601 标准文本 */
  iso: string;
  /** 输入非法时的错误信息 */
  errorMessage?: string;
}

/**
 * 日期转时间戳的结果
 */
export interface DateTimestampResult {
  /** 是否解析为有效日期 */
  success: boolean;
  /** Unix 秒级时间戳 */
  seconds: number;
  /** Unix 毫秒级时间戳 */
  milliseconds: number;
  /** 输入非法时的错误信息 */
  errorMessage?: string;
}

/**
 * 将时间戳数字解析为日期，自动识别 10 位秒级与 13 位毫秒级输入，
 * 按当前界面语言环境输出本地化时间
 *
 * @param input - 用户输入的时间戳字符串
 * @param locale - 格式化使用的 BCP 47 语言标签
 * @returns 多格式日期结果或解析错误
 */
export function parseTimestampToDate(
  input: string,
  locale: string,
): TimestampDateResult {
  const cleanInput = input.trim();
  if (!/^-?\d+$/.test(cleanInput)) {
    return {
      success: false,
      local: '',
      utc: '',
      iso: '',
      errorMessage: '请输入有效的数字时间戳',
    };
  }
  let milliseconds = Number(cleanInput);
  if (cleanInput.replace('-', '').length <= SECOND_MAX_DIGITS) {
    milliseconds *= 1000;
  }
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) {
    return {
      success: false,
      local: '',
      utc: '',
      iso: '',
      errorMessage: '时间戳超出可表示范围',
    };
  }
  return {
    success: true,
    local: date.toLocaleString(locale, { hour12: false }),
    utc: date.toUTCString(),
    iso: date.toISOString(),
  };
}

/**
 * 将日期时间字符串解析为 Unix 时间戳
 *
 * @param dateInput - datetime-local 控件产出的字符串
 * @returns 秒级与毫秒级时间戳结果或解析错误
 */
export function parseDateToTimestamp(
  dateInput: string,
): DateTimestampResult {
  if (!dateInput) {
    return {
      success: false,
      seconds: 0,
      milliseconds: 0,
      errorMessage: '请选择有效的日期和时间',
    };
  }
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return {
      success: false,
      seconds: 0,
      milliseconds: 0,
      errorMessage: '请选择有效的日期和时间',
    };
  }
  const milliseconds = date.getTime();
  return {
    success: true,
    seconds: Math.floor(milliseconds / 1000),
    milliseconds,
  };
}

/**
 * 按指定 IANA 时区读取某一时刻的时间与日期文本
 *
 * @param milliseconds - Unix 毫秒时间戳
 * @param timeZone - IANA 时区标识符
 * @param locale - 格式化使用的语言标签
 * @returns 该时区下的时间与日期文本
 */
export function formatZonedClock(
  milliseconds: number,
  timeZone: string,
  locale: string,
) {
  return {
    time: new Date(milliseconds).toLocaleTimeString(locale, {
      timeZone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    date: new Date(milliseconds).toLocaleDateString(locale, {
      timeZone,
      month: 'short',
      day: 'numeric',
    }),
  };
}

/**
 * 相对时间描述所需的本地化文案
 */
export interface RelativeTimeLabels {
  /** 不足一分钟且时刻在过去时的描述，如“刚刚” */
  justNow: string;
  /** 不足一分钟且时刻在未来时的描述，如“稍后” */
  shortly: string;
  /** 秒单位文案 */
  second: string;
  /** 分钟单位文案 */
  minute: string;
  /** 小时单位文案 */
  hour: string;
  /** 天单位文案 */
  day: string;
  /** 月单位文案 */
  month: string;
  /** 年单位文案 */
  year: string;
  /** 过去时间模板，{value} 替换数值、{unit} 替换单位 */
  pastTemplate: string;
  /** 未来时间模板，{value} 替换数值、{unit} 替换单位 */
  futureTemplate: string;
}

/**
 * 将某一时刻描述为相对于当前时间的友好文本，如“3 分钟前”，
 * 单位与语序通过 labels 注入以支持多语言
 *
 * @param milliseconds - 目标时刻的毫秒时间戳
 * @param now - 当前时刻的毫秒时间戳
 * @param labels - 当前语言对应的相对时间文案
 * @returns 相对时间描述
 */
export function describeRelativeTime(
  milliseconds: number,
  now: number,
  labels: RelativeTimeLabels,
): string {
  const diffSeconds = Math.round((milliseconds - now) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  if (absSeconds < 60) {
    return diffSeconds >= 0 ? labels.shortly : labels.justNow;
  }
  const units: Array<{ divisor: number; label: string }> = [
    { divisor: 60, label: labels.minute },
    { divisor: 60, label: labels.hour },
    { divisor: 24, label: labels.day },
    { divisor: 30, label: labels.month },
    { divisor: 12, label: labels.year },
  ];
  let value = absSeconds;
  let unit = labels.second;
  for (const item of units) {
    const nextValue = Math.round(value / item.divisor);
    if (nextValue < 1) break;
    value = nextValue;
    unit = item.label;
  }
  const template = diffSeconds >= 0 ? labels.futureTemplate : labels.pastTemplate;
  return template.replace('{value}', String(value)).replace('{unit}', unit);
}
