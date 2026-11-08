/**
 * 标准 5 段 cron（分 时 日 月 周）解析与触发时刻计算（零依赖纯函数）。
 * 本模块独立于仓库内 cron-parser 工具，按转换工具自身需要重写，
 * 全部按浏览器本地时区解释，不触碰 DOM / React，不发起网络请求。
 */

export type CronFieldKey =
  | 'minute'
  | 'hour'
  | 'dayOfMonth'
  | 'month'
  | 'dayOfWeek';

export interface CronFieldSpec {
  label: string;
  min: number;
  max: number;
  aliases?: Record<string, number>;
}

export interface ParsedCronField {
  raw: string;
  label: string;
  values: number[];
}

export interface ParsedCron {
  minute: ParsedCronField;
  hour: ParsedCronField;
  dayOfMonth: ParsedCronField;
  month: ParsedCronField;
  dayOfWeek: ParsedCronField;
}

export const CRON_FIELD_ORDER: CronFieldKey[] = [
  'minute',
  'hour',
  'dayOfMonth',
  'month',
  'dayOfWeek',
];

const MONTH_ALIASES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

const WEEKDAY_ALIASES: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

export const FIELD_SPECS: Record<CronFieldKey, CronFieldSpec> = {
  minute: { label: '分钟', min: 0, max: 59 },
  hour: { label: '小时', min: 0, max: 23 },
  dayOfMonth: { label: '日', min: 1, max: 31 },
  month: { label: '月', min: 1, max: 12, aliases: MONTH_ALIASES },
  dayOfWeek: { label: '星期', min: 0, max: 7, aliases: WEEKDAY_ALIASES },
};

function normalizeWeekday(value: number): number {
  return value === 7 ? 0 : value;
}

function parseValueToken(token: string, key: CronFieldKey): number {
  const spec = FIELD_SPECS[key];
  const trimmed = token.trim();
  const alias = spec.aliases?.[trimmed.toUpperCase()];
  if (alias !== undefined) return alias;
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`字段「${spec.label}」无法识别的取值「${token}」`);
  }
  const value = Number(trimmed);
  if (value < spec.min || value > spec.max) {
    throw new Error(
      `字段「${spec.label}」取值 ${value} 超出范围 ${spec.min}-${spec.max}`,
    );
  }
  return value;
}

function parseSegment(segment: string, key: CronFieldKey, set: Set<number>): void {
  const spec = FIELD_SPECS[key];
  const slashIndex = segment.indexOf('/');
  let body = segment;
  let step = 1;

  if (slashIndex >= 0) {
    body = segment.slice(0, slashIndex);
    const stepText = segment.slice(slashIndex + 1);
    if (!/^\d+$/.test(stepText) || Number(stepText) <= 0) {
      throw new Error(`字段「${spec.label}」步长「${stepText}」必须为正整数`);
    }
    step = Number(stepText);
    if (body === '') {
      throw new Error(`字段「${spec.label}」步长语法缺少前置取值`);
    }
  }

  let start: number;
  let end: number;
  if (body === '*') {
    start = spec.min;
    end = spec.max;
  } else if (body.includes('-')) {
    const parts = body.split('-');
    if (parts.length !== 2 || parts[0] === '' || parts[1] === '') {
      throw new Error(`字段「${spec.label}」范围格式非法：「${segment}」`);
    }
    start = parseValueToken(parts[0] ?? '', key);
    end = parseValueToken(parts[1] ?? '', key);
    if (start > end) {
      throw new Error(
        `字段「${spec.label}」范围起点 ${start} 大于终点 ${end}`,
      );
    }
  } else {
    start = parseValueToken(body, key);
    end = start;
  }

  for (let value = start; value <= end; value += step) {
    set.add(key === 'dayOfWeek' ? normalizeWeekday(value) : value);
  }
}

export function parseField(raw: string, key: CronFieldKey): ParsedCronField {
  const spec = FIELD_SPECS[key];
  const text = raw.trim();
  if (text === '') {
    throw new Error(`字段「${spec.label}」不能为空`);
  }
  const set = new Set<number>();
  for (const segment of text.split(',')) {
    if (segment === '') {
      throw new Error(`字段「${spec.label}」存在空段：「${raw}」`);
    }
    parseSegment(segment, key, set);
  }
  return {
    raw: text,
    label: spec.label,
    values: Array.from(set).sort((a, b) => a - b),
  };
}

export function parseCron(expression: string): ParsedCron {
  const fields = expression
    .trim()
    .split(/\s+/)
    .filter((item) => item !== '');
  if (fields.length !== 5) {
    throw new Error(
      `cron 表达式必须包含 5 个字段（分 时 日 月 周），当前为 ${fields.length} 个`,
    );
  }
  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields as [
    string,
    string,
    string,
    string,
    string,
  ];
  return {
    minute: parseField(minute, 'minute'),
    hour: parseField(hour, 'hour'),
    dayOfMonth: parseField(dayOfMonth, 'dayOfMonth'),
    month: parseField(month, 'month'),
    dayOfWeek: parseField(dayOfWeek, 'dayOfWeek'),
  };
}

export interface CronSets {
  minute: Set<number>;
  hour: Set<number>;
  dayOfMonth: Set<number>;
  month: Set<number>;
  dayOfWeek: Set<number>;
}

export function toSets(parsed: ParsedCron): CronSets {
  return {
    minute: new Set(parsed.minute.values),
    hour: new Set(parsed.hour.values),
    dayOfMonth: new Set(parsed.dayOfMonth.values),
    month: new Set(parsed.month.values),
    dayOfWeek: new Set(parsed.dayOfWeek.values),
  };
}

/**
 * 判断时刻是否命中 cron。
 * 注意标准 crontab 语义：日与星期同时受限时取「或」（并集）。
 */
export function cronMatches(
  parsed: ParsedCron,
  sets: CronSets,
  date: Date,
): boolean {
  if (!sets.minute.has(date.getMinutes())) return false;
  if (!sets.hour.has(date.getHours())) return false;
  if (!sets.month.has(date.getMonth() + 1)) return false;

  const domRestricted = parsed.dayOfMonth.raw !== '*';
  const dowRestricted = parsed.dayOfWeek.raw !== '*';
  const domMatch = sets.dayOfMonth.has(date.getDate());
  const dowMatch = sets.dayOfWeek.has(date.getDay());

  if (domRestricted && dowRestricted) return domMatch || dowMatch;
  if (domRestricted) return domMatch;
  if (dowRestricted) return dowMatch;
  return true;
}

/** 搜索上限（分钟），约 4 年，防止不可达表达式死循环 */
export const MAX_SEARCH_MINUTES = 4 * 366 * 24 * 60;

/** 计算严格晚于 from 的前 count 次触发时刻（分钟粒度，本地时区） */
export function getCronNextRuns(
  parsed: ParsedCron,
  count: number,
  from: Date,
): Date[] {
  const sets = toSets(parsed);
  const cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  cursor.setTime(cursor.getTime() + 60_000);

  const results: Date[] = [];
  let steps = 0;
  while (results.length < count && steps < MAX_SEARCH_MINUTES) {
    if (cronMatches(parsed, sets, cursor)) {
      results.push(new Date(cursor.getTime()));
    }
    cursor.setTime(cursor.getTime() + 60_000);
    steps += 1;
  }
  return results;
}
