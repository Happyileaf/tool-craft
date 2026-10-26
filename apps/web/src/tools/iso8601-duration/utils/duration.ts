/**
 * ISO 8601 时长（Durations，PnYnMnDTnHnMnS / PnW）解析与格式化的纯函数实现，
 * 不依赖 DOM 与 React。支持负号前缀（-P1D）、小数分量与周表示（P2W）；
 * 总秒数按固定折算（365 天/年、30 天/月、7 天/周）近似计算，
 * 因为「年」「月」在历法上没有固定秒数。
 */

import {
  DAYS_PER_MONTH,
  DAYS_PER_YEAR,
  MAX_COMPONENT_VALUE,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
} from '../constants';

/** 解析后的时长分量（各单位均为非负数，符号由 sign 表示） */
export interface DurationComponents {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** 解析结果 */
export interface DurationParseResult {
  /** 成功时的时长数据；失败为 null */
  value: (DurationComponents & { sign: 1 | -1 }) | null;
  /** 失败时的错误信息；成功为 null */
  error: string | null;
}

const EMPTY_COMPONENTS: DurationComponents = {
  years: 0,
  months: 0,
  weeks: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

const DATE_UNIT_KEYS = ['years', 'months', 'weeks', 'days'] as const;
const TIME_UNIT_KEYS = ['hours', 'minutes', 'seconds'] as const;
type UnitKey = (typeof DATE_UNIT_KEYS)[number] | (typeof TIME_UNIT_KEYS)[number];

const DATE_UNIT_CHARS: Record<string, UnitKey> = {
  Y: 'years',
  M: 'months',
  W: 'weeks',
  D: 'days',
};
const TIME_UNIT_CHARS: Record<string, UnitKey> = {
  H: 'hours',
  M: 'minutes',
  S: 'seconds',
};

/**
 * 解析 ISO 8601 时长字符串。
 * 语法：[−]P[nY][nM][nW][nD][T[nH][nM][nS]]；每个分量最多出现一次，
 * 仅最后一个出现的分量允许小数（逗号或点），周与其他分量互斥。
 *
 * @param input - 时长字符串
 * @returns 解析结果（含错误信息）
 */
export function parseDuration(input: string): DurationParseResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { value: null, error: '请输入 ISO 8601 时长，例如 P1Y2M3DT4H5M6S' };
  }

  let rest = trimmed;
  let sign: 1 | -1 = 1;
  if (rest.startsWith('-')) {
    sign = -1;
    rest = rest.slice(1);
  } else if (rest.startsWith('+')) {
    rest = rest.slice(1);
  }

  if (!rest.startsWith('P')) {
    return { value: null, error: '时长必须以 P 开头（负时长为 -P…）' };
  }
  rest = rest.slice(1);

  if (rest.length === 0) {
    return { value: null, error: 'P 之后至少需要一个时长分量' };
  }

  const components: DurationComponents = { ...EMPTY_COMPONENTS };
  const seen = new Set<UnitKey>();
  let inTimeSection = false;

  const numberPattern = /(\d+(?:[.,]\d+)?)([A-Za-z])/y;
  let cursor = 0;

  while (cursor < rest.length) {
    const ch = rest[cursor];
    if (ch === 'T' || ch === 't') {
      if (inTimeSection) {
        return { value: null, error: '时间分隔符 T 只能出现一次' };
      }
      inTimeSection = true;
      cursor += 1;
      continue;
    }

    numberPattern.lastIndex = cursor;
    const match = numberPattern.exec(rest);
    if (match === null || match.index !== cursor) {
      return {
        value: null,
        error: `无法识别的片段「${rest.slice(cursor)}」，合法示例如 PT1H30M、P2W`,
      };
    }
    const [, rawNumber = '', rawUnit = ''] = match;
    const numberText = rawNumber.replace(',', '.');
    const value = Number(numberText);
    const unitChar = rawUnit.toUpperCase();
    const unit = inTimeSection ? TIME_UNIT_CHARS[unitChar] : DATE_UNIT_CHARS[unitChar];

    if (unit === undefined) {
      return {
        value: null,
        error: inTimeSection
          ? `T 之后只能出现 H（时）、M（分）、S（秒），收到 "${rawUnit}"`
          : `日期部分只能出现 Y/M/W/D，T 之后才是 H/M/S；收到 "${rawUnit}"`,
      };
    }
    if (seen.has(unit)) {
      return { value: null, error: `分量 ${rawUnit} 重复出现，每个单位只能出现一次` };
    }
    if (!Number.isFinite(value) || value < 0) {
      return { value: null, error: `分量 ${rawUnit} 的数值不合法` };
    }
    if (value > MAX_COMPONENT_VALUE) {
      return { value: null, error: `分量 ${rawUnit} 的数值过大（上限 ${MAX_COMPONENT_VALUE}）` };
    }
    if (numberText.includes('.') && cursor + match[0].length < rest.length) {
      return {
        value: null,
        error: 'ISO 8601 规定只有最后一个分量允许使用小数，请把小数放到最小单位',
      };
    }

    components[unit] = value;
    seen.add(unit);
    cursor += match[0].length;
  }

  if (seen.size === 0) {
    return { value: null, error: '时长至少需要一个分量，例如 P1D 或 PT30M' };
  }
  if (seen.has('weeks') && seen.size > 1) {
    return {
      value: null,
      error: '周（W）不能与年 / 月 / 日 / 时分秒等其他分量同时出现（如 P2W，而非 P1W1D）',
    };
  }
  if (rest.includes('t') && !TIME_UNIT_KEYS.some((key) => seen.has(key))) {
    return { value: null, error: 'T 之后需要至少一个时间分量（H / M / S）' };
  }

  return { value: { ...components, sign }, error: null };
}

/**
 * 按固定折算把时长换算为总秒数（年=365 天、月=30 天、周=7 天）。
 *
 * @param value - 带符号的时长分量
 * @returns 总秒数（负时长返回负数）
 */
export function durationToSeconds(value: DurationComponents & { sign?: 1 | -1 }): number {
  const sign = value.sign ?? 1;
  const totalDays =
    value.years * DAYS_PER_YEAR +
    value.months * DAYS_PER_MONTH +
    value.weeks * 7 +
    value.days;
  const withinDaySeconds =
    value.hours * SECONDS_PER_HOUR +
    value.minutes * SECONDS_PER_MINUTE +
    value.seconds;
  return sign * (totalDays * SECONDS_PER_DAY + withinDaySeconds);
}

/**
 * 把秒数按「日 → 时 → 分 → 秒」进位归一化为非负分量。
 * 年 / 月 / 周字段恒为 0；秒保留最多 3 位小数以吸收毫秒输入。
 *
 * @param totalSeconds - 任意有限秒数（可为负）
 * @returns 带符号的时长分量
 */
export function normalizeSeconds(totalSeconds: number): DurationComponents & { sign: 1 | -1 } {
  const sign: 1 | -1 = totalSeconds < 0 ? -1 : 1;
  let absolute = Math.abs(totalSeconds);
  const days = Math.floor(absolute / SECONDS_PER_DAY);
  absolute -= days * SECONDS_PER_DAY;
  const hours = Math.floor(absolute / SECONDS_PER_HOUR);
  absolute -= hours * SECONDS_PER_HOUR;
  const minutes = Math.floor(absolute / SECONDS_PER_MINUTE);
  const seconds = absolute - minutes * SECONDS_PER_MINUTE;

  return {
    ...EMPTY_COMPONENTS,
    days,
    hours,
    minutes,
    seconds: Math.round(seconds * 1000) / 1000,
    sign,
  };
}

/**
 * 把时长分量格式化为 ISO 8601 字符串。
 * 各分量为非负数，整体符号由 sign 决定；零时长返回 PT0S。
 *
 * @param value - 带符号的时长分量
 * @returns ISO 8601 时长字符串
 */
export function formatDuration(value: DurationComponents & { sign?: 1 | -1 }): string {
  const sign = value.sign ?? 1;
  const hasDatePart =
    value.years > 0 || value.months > 0 || value.weeks > 0 || value.days > 0;
  const hasTimePart = value.hours > 0 || value.minutes > 0 || value.seconds > 0;

  if (!hasDatePart && !hasTimePart) {
    return 'PT0S';
  }

  let body = 'P';
  if (value.weeks > 0) {
    body += `${formatNumber(value.weeks)}W`;
  } else {
    if (value.years > 0) {
      body += `${formatNumber(value.years)}Y`;
    }
    if (value.months > 0) {
      body += `${formatNumber(value.months)}M`;
    }
    if (value.days > 0) {
      body += `${formatNumber(value.days)}D`;
    }
    if (hasTimePart) {
      body += 'T';
      if (value.hours > 0) {
        body += `${formatNumber(value.hours)}H`;
      }
      if (value.minutes > 0) {
        body += `${formatNumber(value.minutes)}M`;
      }
      if (value.seconds > 0) {
        body += `${formatNumber(value.seconds)}S`;
      }
    }
  }

  return sign < 0 ? `-${body}` : body;
}

/**
 * 数值转字符串：整数原样输出，小数保留最多 3 位并去掉尾随 0。
 *
 * @param value - 非负数
 * @returns 紧凑数字字符串
 */
function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return String(Math.round(value * 1000) / 1000);
}

/**
 * 把秒数转换为人类可读的「X 天 Y 小时 Z 分 W 秒」描述（忽略年月周折算）。
 *
 * @param totalSeconds - 任意有限秒数（可为负）
 * @returns 中文可读时长
 */
export function describeSeconds(totalSeconds: number): string {
  if (totalSeconds === 0) {
    return '0 秒';
  }
  const normalized = normalizeSeconds(totalSeconds);
  const parts: string[] = [];
  if (normalized.days > 0) {
    parts.push(`${formatNumber(normalized.days)} 天`);
  }
  if (normalized.hours > 0) {
    parts.push(`${normalized.hours} 小时`);
  }
  if (normalized.minutes > 0) {
    parts.push(`${normalized.minutes} 分`);
  }
  if (normalized.seconds > 0) {
    parts.push(`${formatNumber(normalized.seconds)} 秒`);
  }
  const text = parts.join(' ');
  return normalized.sign < 0 ? `负 ${text}` : text;
}
