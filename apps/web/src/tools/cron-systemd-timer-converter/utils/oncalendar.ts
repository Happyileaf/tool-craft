/**
 * systemd OnCalendar 表达式解析、cron ↔ OnCalendar 双向转换与触发对照（零依赖）。
 *
 * 语法基线：systemd 官方文档 OnCalendar=
 *   [DayOfWeek...] [Year-]Month-Day [Hour:Minute[:Second]]
 * 支持 *、列表、a..b 范围、a/b 与 *:0/n 步进、英文星期（Mon..Sun）、
 * minutely/hourly/daily/weekly/monthly/yearly/annually 命名快捷方式。
 * 全部按本地时区、分钟粒度计算；秒级与年级在反向转 cron 时标注降级。
 */

import {
  parseCron,
  parseField,
  toSets,
  getCronNextRuns,
  type CronFieldKey,
  type ParsedCron,
} from './cron';

export const WEEKDAY_ABBR = [
  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
] as const;

const WEEKDAY_LOOKUP: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

const MONTH_LOOKUP: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

/** 命名快捷方式 → 等价表达式（systemd 文档定义） */
const SHORTCUTS: Record<string, string> = {
  minutely: '*:0/1',
  hourly: '*-*-* *:00:00',
  daily: '*-*-* 00:00:00',
  midnight: '*-*-* 00:00:00',
  weekly: 'Mon *-*-* 00:00:00',
  monthly: '*-*-01 00:00:00',
  annually: '*-01-01 00:00:00',
  yearly: '*-01-01 00:00:00',
};

export interface ParsedOnCalendar {
  /** 0-6，空数组表示任意星期 */
  weekdays: number[];
  /** 年份集合；空数组表示不限制（cron 无年级，反向转换时降级） */
  years: number[];
  months: number[];
  days: number[];
  hours: number[];
  minutes: number[];
  seconds: number[];
  /** 解析过程中产生的降级/告警信息 */
  warnings: string[];
  raw: string;
}

/** 通用数值字段展开：支持 *、数字、a..b、逗号列表、/step（含 *:0/n 风格） */
function expandNumeric(
  token: string,
  min: number,
  max: number,
  label: string,
  aliases?: Record<string, number>,
): number[] {
  const set = new Set<number>();
  for (const part of token.split(',')) {
    if (part === '') throw new Error(`OnCalendar 字段「${label}」存在空段`);
    const slashIdx = part.indexOf('/');
    let body = part;
    let step = 1;
    if (slashIdx >= 0) {
      body = part.slice(0, slashIdx);
      const stepText = part.slice(slashIdx + 1);
      if (!/^\d+$/.test(stepText) || Number(stepText) <= 0) {
        throw new Error(`OnCalendar 字段「${label}」步长「${stepText}」必须为正整数`);
      }
      step = Number(stepText);
    }

    let start: number;
    let end: number;
    if (body === '*' || body === '') {
      start = min;
      end = max;
    } else if (slashIdx >= 0 && /^\d+$/.test(body)) {
      // 0/5 风格：从显式起点按步长走到字段上限
      start = resolveToken(body, min, max, label, aliases);
      end = max;
    } else if (body.includes('..')) {
      const [a, b] = body.split('..');
      if (a === undefined || b === undefined || a === '' || b === '') {
        throw new Error(`OnCalendar 字段「${label}」范围非法：「${part}」`);
      }
      start = resolveToken(a, min, max, label, aliases);
      end = resolveToken(b, min, max, label, aliases);
      if (start > end) {
        throw new Error(`OnCalendar 字段「${label}」范围起点 ${start} 大于终点 ${end}`);
      }
    } else {
      start = resolveToken(body, min, max, label, aliases);
      end = slashIdx >= 0 ? max : start;
    }

    for (let v = start; v <= end; v += step) set.add(v);
  }
  return Array.from(set).sort((a, b) => a - b);
}

function resolveToken(
  token: string,
  min: number,
  max: number,
  label: string,
  aliases?: Record<string, number>,
): number {
  const upper = token.trim().toUpperCase();
  const alias = aliases?.[upper];
  if (alias !== undefined) return alias;
  if (!/^\d+$/.test(token.trim())) {
    throw new Error(`OnCalendar 字段「${label}」无法识别的取值「${token}」`);
  }
  const value = Number(token.trim());
  if (value < min || value > max) {
    throw new Error(`OnCalendar 字段「${label}」取值 ${value} 超出范围 ${min}-${max}`);
  }
  return value;
}

function expandWeekdays(token: string): number[] {
  return expandNumeric(token, 0, 6, '星期', WEEKDAY_LOOKUP);
}

/** 解析 OnCalendar 表达式 */
export function parseOnCalendar(expression: string): ParsedOnCalendar {
  const warnings: string[] = [];
  const trimmed = expression.trim();
  if (trimmed === '') throw new Error('OnCalendar 表达式不能为空');

  const lower = trimmed.toLowerCase();
  const shortcut = SHORTCUTS[lower];
  const effective = shortcut ?? trimmed;
  if (shortcut) {
    warnings.push(`命名快捷方式「${lower}」按「${shortcut}」解释`);
  }

  const tokens = effective.split(/\s+/).filter(Boolean);
  let weekdayToken = '';
  let dateToken = '';
  let timeToken = '';

  for (const token of tokens) {
    if (token.includes(':')) {
      if (timeToken !== '') throw new Error('OnCalendar 时间部分出现了多个带「:」的片段');
      timeToken = token;
    } else if (token.includes('-')) {
      // 日期片段（*-*-*、*-01-01、1-15 等）；星期范围用 .. 不用 -
      if (dateToken !== '') throw new Error('OnCalendar 日期部分出现了多个片段');
      dateToken = token;
    } else if (/^\d{4}$/.test(token)) {
      // 裸年份：等价于 Year-*-*
      if (dateToken !== '') throw new Error('OnCalendar 日期部分出现了多个片段');
      dateToken = `${token}-*-*`;
    } else {
      // 纯星期片段：Mon、Mon..Fri、Mon,Tue、*
      weekdayToken = weekdayToken === '' ? token : `${weekdayToken},${token}`;
    }
  }

  // 日期：可选年-月-日
  let years: number[] = [];
  let months: number[];
  let days: number[];
  if (dateToken === '') {
    months = [];
    days = [];
  } else {
    const dateParts = dateToken.split('-');
    if (dateParts.length === 3) {
      const [y, m, d] = dateParts as [string, string, string];
      years = y === '*' ? [] : expandNumeric(y, 1970, 2199, '年');
      months = m === '*' ? [] : expandNumeric(m, 1, 12, '月', MONTH_LOOKUP);
      days = d === '*' ? [] : expandNumeric(d, 1, 31, '日');
    } else if (dateParts.length === 2) {
      const [m, d] = dateParts as [string, string];
      months = m === '*' ? [] : expandNumeric(m, 1, 12, '月', MONTH_LOOKUP);
      days = d === '*' ? [] : expandNumeric(d, 1, 31, '日');
    } else {
      throw new Error(`OnCalendar 日期部分「${dateToken}」必须为 月-日 或 年-月-日`);
    }
  }

  // 时间：时:分[:秒]，各段支持 * 与 /step
  let hours: number[] = [];
  let minutes: number[] = [];
  let seconds: number[] = [];
  if (timeToken !== '') {
    const timeParts = timeToken.split(':');
    if (timeParts.length < 2 || timeParts.length > 3) {
      throw new Error(`OnCalendar 时间部分「${timeToken}」必须为 时:分 或 时:分:秒`);
    }
    const [h, mi, s] = timeParts as [string, string, string | undefined];
    hours = h === '*' ? [] : expandNumeric(h, 0, 23, '小时');
    minutes = mi === '*' ? [] : expandNumeric(mi, 0, 59, '分钟');
    if (s !== undefined) {
      seconds = s === '*' ? [] : expandNumeric(s, 0, 59, '秒');
      if (seconds.length > 0) {
        warnings.push(
          '表达式含秒级粒度，cron 最小粒度为分钟，反向转换时秒字段将被丢弃（降级）',
        );
      }
    }
  }
  if (years.length > 0) {
    warnings.push('表达式限制了年份，cron 不支持年级字段，反向转换时年份限制将被丢弃（降级）');
  }

  return {
    weekdays: weekdayToken === '' || weekdayToken === '*' ? [] : expandWeekdays(weekdayToken),
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    warnings,
    raw: trimmed,
  };
}

// ---------------------------------------------------------------------------
// 数值集合 → 表达式文本
// ---------------------------------------------------------------------------

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 连续整数集合压缩为 * / a / a,b / a..b / a..b/step 形式（OnCalendar 语法） */
function renderNumericSet(values: number[], min: number, max: number): string {
  if (values.length === 0) return '*';
  if (values.length === max - min + 1) return '*';
  if (values.length === 1) return String(values[0] ?? min);

  // 检测等步长连续序列
  const first = values[0] ?? min;
  const last = values[values.length - 1] ?? max;
  const step = values[1] !== undefined ? values[1] - first : 1;
  let isArithmetic = step > 0;
  for (let i = 1; i < values.length; i += 1) {
    if ((values[i] ?? 0) - (values[i - 1] ?? 0) !== step) {
      isArithmetic = false;
      break;
    }
  }
  if (!isArithmetic || step === 1) {
    return isArithmetic ? `${first}..${last}` : values.join(',');
  }
  // 等步长且 step>1：从字段域起点开始用 *:0/n，子范围用 first..last/step
  return first === min ? `*:0/${step}` : `${first}..${last}/${step}`;
}

function renderWeekdaySet(values: number[]): string {
  if (values.length === 0) return '';
  if (values.length === 1) return WEEKDAY_ABBR[values[0] ?? 0] ?? '*';
  const sorted = [...values].sort((a, b) => a - b);
  // 连续星期区间用 Mon..Fri
  let isContinuous = true;
  for (let i = 1; i < sorted.length; i += 1) {
    if ((sorted[i] ?? 0) - (sorted[i - 1] ?? 0) !== 1) isContinuous = false;
  }
  if (isContinuous) {
    return `${WEEKDAY_ABBR[sorted[0] ?? 0]}..${WEEKDAY_ABBR[sorted[sorted.length - 1] ?? 0]}`;
  }
  return sorted.map((v) => WEEKDAY_ABBR[v] ?? 'Sun').join(',');
}

// ---------------------------------------------------------------------------
// cron → OnCalendar
// ---------------------------------------------------------------------------

export interface CronToOnCalendarResult {
  /** 主转换结果（单条表达式） */
  expression: string;
  /** 日与星期同时受限时给出的等价拆分方案 */
  alternatives: string[];
  warnings: string[];
}

function renderTime(hours: number[], minutes: number[]): string {
  const h = renderNumericSet(hours, 0, 23);
  const m = renderNumericSet(minutes, 0, 59);
  // 分钟若为 *:0/n 风格，整体时间需要保留冒号写法（systemd 步进不写秒）
  if (m.startsWith('*:0/')) {
    return `${h}:${m.replace('*:0/', '0/')}`;
  }
  const isSimple = (text: string) => text === '*' || /^\d+$/.test(text);
  if (isSimple(h) && isSimple(m)) {
    return `${h === '*' ? '*' : pad2(Number(h))}:${m === '*' ? '00' : pad2(Number(m))}:00`;
  }
  // 含范围/列表/步进的复合时间，分钟按原生表达式输出
  return `${h}:${m === '*' ? '00' : m}:00`;
}

export function cronToOnCalendar(cronExpression: string): CronToOnCalendarResult {
  const parsed = parseCron(cronExpression);
  const warnings: string[] = [];
  const alternatives: string[] = [];

  const weekdays = parsed.dayOfWeek.values;
  const domRestricted = parsed.dayOfMonth.raw !== '*';
  const dowRestricted = parsed.dayOfWeek.raw !== '*';

  const datePart = (dayValues: number[], monthValues: number[]): string => {
    const renderPadded = (vals: number[], min: number, max: number): string => {
      const text = renderNumericSet(vals, min, max);
      // 单值补零；范围/列表/步进表达式保持 systemd 原生写法
      if (/^\d+$/.test(text)) return pad2(Number(text));
      return text;
    };
    const month = monthValues.length === 0 ? '*' : renderPadded(monthValues, 1, 12);
    const day = dayValues.length === 0 ? '*' : renderPadded(dayValues, 1, 31);
    return `${month}-${day}`;
  };

  const time = renderTime(parsed.hour.values, parsed.minute.values);
  const weekText = renderWeekdaySet(weekdays);

  let expression: string;
  if (!domRestricted && !dowRestricted) {
    expression = `*-${datePart([], parsed.month.values)} ${time}`;
  } else if (!domRestricted && dowRestricted) {
    expression = `${weekText} *-*-* ${time}`;
  } else if (domRestricted && !dowRestricted) {
    expression = `${datePart(parsed.dayOfMonth.values, parsed.month.values)} ${time}`;
  } else {
    // 两者同时受限：cron 与 OnCalendar 均按「或」语义触发，但写法需要显式告警
    expression = `${weekText} ${datePart(parsed.dayOfMonth.values, parsed.month.values)} ${time}`;
    warnings.push(
      '日（每月几号）与星期同时受限：cron 与 OnCalendar 在此场景都按「或（并集）」触发，' +
        '即满足任一条件即执行，并非两者同时满足。请核对这是否符合预期。',
    );
    const onlyDow = `${weekText} *-*-* ${time}`;
    const onlyDom = `${datePart(parsed.dayOfMonth.values, parsed.month.values)} ${time}`;
    alternatives.push(onlyDow, onlyDom);
    warnings.push('若你期望的是「交集」语义，请改用两条独立 timer 或在脚本内自行判断日期。');
  }

  // 月份受限且表达式里月份被压成数字列表时保持原样；systemd 同样支持英文月缩写
  return { expression, alternatives, warnings };
}

// ---------------------------------------------------------------------------
// OnCalendar → cron
// ---------------------------------------------------------------------------

export interface OnCalendarToCronResult {
  expression: string;
  warnings: string[];
}

function renderCronField(values: number[], key: CronFieldKey): string {
  const spec = { minute: [0, 59], hour: [0, 23], dayOfMonth: [1, 31], month: [1, 12], dayOfWeek: [0, 6] } as const;
  const [min, max] = spec[key];
  if (values.length === 0) return '*';
  if (values.length === (max - min + 1)) return '*';
  if (values.length === 1) return String(values[0] ?? min);
  const first = values[0] ?? min;
  const last = values[values.length - 1] ?? max;
  const step = values[1] !== undefined ? values[1] - first : 1;
  let isArithmetic = step > 0;
  for (let i = 1; i < values.length; i += 1) {
    if ((values[i] ?? 0) - (values[i - 1] ?? 0) !== step) isArithmetic = false;
  }
  if (isArithmetic && step === 1) return `${first}-${last}`;
  if (isArithmetic && first === min && last === max) return `*/${step}`;
  if (isArithmetic) return `${first}-${last}/${step}`;
  return values.join(',');
}

export function onCalendarToCron(expression: string): OnCalendarToCronResult {
  const parsed = parseOnCalendar(expression);
  const warnings = [...parsed.warnings];

  const minute = renderCronField(parsed.minutes, 'minute');
  const hour = renderCronField(parsed.hours, 'hour');
  const dom = renderCronField(parsed.days, 'dayOfMonth');
  const month = renderCronField(parsed.months, 'month');
  const dow = renderCronField(parsed.weekdays, 'dayOfWeek');

  return {
    expression: [minute, hour, dom, month, dow].join(' '),
    warnings,
  };
}

// ---------------------------------------------------------------------------
// OnCalendar 触发时刻（分钟粒度）
// ---------------------------------------------------------------------------

function onCalendarMatches(p: ParsedOnCalendar, date: Date): boolean {
  if (p.years.length > 0 && !p.years.includes(date.getFullYear())) return false;
  if (p.months.length > 0 && !p.months.includes(date.getMonth() + 1)) return false;
  if (p.days.length > 0 && !p.days.includes(date.getDate())) return false;
  if (p.weekdays.length > 0 && !p.weekdays.includes(date.getDay())) return false;
  if (p.hours.length > 0 && !p.hours.includes(date.getHours())) return false;
  if (p.minutes.length > 0 && !p.minutes.includes(date.getMinutes())) return false;
  // 秒级字段：分钟粒度预览仅在秒为 0 或未限制时命中
  if (p.seconds.length > 0 && !p.seconds.includes(0)) return false;
  return true;
}

export function getOnCalendarNextRuns(
  expression: string,
  count: number,
  from: Date,
): Date[] {
  const parsed = parseOnCalendar(expression);
  const cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  cursor.setTime(cursor.getTime() + 60_000);

  const results: Date[] = [];
  let steps = 0;
  const limit = 4 * 366 * 24 * 60;
  while (results.length < count && steps < limit) {
    if (onCalendarMatches(parsed, cursor)) {
      results.push(new Date(cursor.getTime()));
    }
    cursor.setTime(cursor.getTime() + 60_000);
    steps += 1;
  }
  return results;
}

// ---------------------------------------------------------------------------
// 双向触发对照
// ---------------------------------------------------------------------------

export interface RunComparison {
  cronRuns: Date[];
  onCalendarRuns: Date[];
  /** 两侧前 N 次触发时刻是否完全一致 */
  equivalent: boolean;
}

export function compareNextRuns(
  cronExpression: string,
  onCalendarExpression: string,
  count: number,
  from: Date,
): RunComparison {
  const cronParsed = parseCron(cronExpression);
  const cronRuns = getCronNextRuns(cronParsed, count, from);
  const onCalendarRuns = getOnCalendarNextRuns(onCalendarExpression, count, from);
  const equivalent =
    cronRuns.length === onCalendarRuns.length &&
    cronRuns.every((d, i) => d.getTime() === (onCalendarRuns[i]?.getTime() ?? -1));
  return { cronRuns, onCalendarRuns, equivalent };
}

/** 复用 cron 模块的字段解析，供 UI 做语法校验 */
export { parseCron, parseField, toSets };
export type { ParsedCron };
