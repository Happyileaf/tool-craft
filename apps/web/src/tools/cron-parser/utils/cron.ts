/**
 * CRON 表达式解析与执行时间预览纯函数集合。
 * 支持标准 5 段表达式（分 时 日 月 周），全部基于浏览器本地时区计算，
 * 不触碰 DOM / React，也不发起任何网络请求。
 */

/** CRON 字段键名，顺序与表达式书写顺序一致 */
export type CronFieldKey = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

/** 单个 CRON 字段的取值范围与别名定义 */
interface CronFieldSpec {
  /** 字段中文名 */
  label: string;
  /** 允许的最小取值 */
  min: number;
  /** 允许的最大取值 */
  max: number;
  /** 别名（大小写不敏感）到数值的映射 */
  aliases?: Record<string, number>;
}

/** 解析后的单个 CRON 字段 */
export interface ParsedCronField {
  /** 字段原始文本 */
  raw: string;
  /** 字段中文名 */
  label: string;
  /** 展开、去重并排序后的取值集合 */
  values: number[];
}

/** CRON 表达式完整解析结果 */
export interface ParsedCron {
  /** 分钟字段（0-59） */
  minute: ParsedCronField;
  /** 小时字段（0-23） */
  hour: ParsedCronField;
  /** 日字段（1-31） */
  dayOfMonth: ParsedCronField;
  /** 月字段（1-12） */
  month: ParsedCronField;
  /** 星期字段（0-6，0 为周日） */
  dayOfWeek: ParsedCronField;
}

/** 字段顺序（与 CRON 表达式书写顺序一致） */
export const CRON_FIELD_ORDER: CronFieldKey[] = [
  'minute',
  'hour',
  'dayOfMonth',
  'month',
  'dayOfWeek',
];

/** 月份英文缩写到数值的映射 */
const MONTH_ALIASES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

/** 星期英文缩写到数值的映射（周日为 0，7 亦视为周日） */
const WEEKDAY_ALIASES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

/** 星期中文名，索引与 0-6 取值对应（0 为周日） */
const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 各字段的取值范围与别名定义 */
const FIELD_SPECS: Record<CronFieldKey, CronFieldSpec> = {
  minute: { label: '分钟', min: 0, max: 59 },
  hour: { label: '小时', min: 0, max: 23 },
  dayOfMonth: { label: '日', min: 1, max: 31 },
  month: { label: '月', min: 1, max: 12, aliases: MONTH_ALIASES },
  dayOfWeek: { label: '星期', min: 0, max: 7, aliases: WEEKDAY_ALIASES },
};

/**
 * 把星期字段的取值 7 归一化为 0（周日）
 *
 * @param value - 字段原始取值
 * @returns 归一化后的星期取值
 */
function normalizeWeekday(value: number): number {
  return value === 7 ? 0 : value;
}

/**
 * 解析单个取值 token（数字或英文别名）
 *
 * @param token - 待解析的取值文本
 * @param key - 所属字段
 * @returns 解析后的数值
 * @throws 取值无法识别或超出字段范围时抛出可读错误
 */
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
    throw new Error(`字段「${spec.label}」取值 ${value} 超出范围 ${spec.min}-${spec.max}`);
  }
  return value;
}

/**
 * 解析单个以逗号分隔的段，支持 `*`、`a`、`a-b`、`a/s`、`*&#47;s`、`a-b/s` 语法
 *
 * @param segment - 单个段文本
 * @param key - 所属字段
 * @param set - 收集解析结果的集合，解析到的取值写入其中
 * @throws 语法非法、步长非正或取值越界时抛出可读错误
 */
function parseSegment(segment: string, key: CronFieldKey, set: Set<number>): void {
  const spec = FIELD_SPECS[key];
  const slashIndex = segment.indexOf('/');
  let body = segment;
  let step = 1;

  if (slashIndex >= 0) {
    body = segment.slice(0, slashIndex);
    const stepText = segment.slice(slashIndex + 1);
    if (!/^\d+$/.test(stepText)) {
      throw new Error(`字段「${spec.label}」步长「${stepText}」必须为正整数`);
    }
    step = Number(stepText);
    if (step <= 0) {
      throw new Error(`字段「${spec.label}」步长必须为正整数`);
    }
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
      throw new Error(`字段「${spec.label}」范围起点 ${start} 大于终点 ${end}`);
    }
  } else {
    start = parseValueToken(body, key);
    end = start;
  }

  for (let value = start; value <= end; value += step) {
    set.add(key === 'dayOfWeek' ? normalizeWeekday(value) : value);
  }
}

/**
 * 解析单个 CRON 字段文本
 *
 * @param raw - 字段原始文本
 * @param key - 字段键名
 * @returns 含原始文本、中文名与展开取值集合的解析结果
 * @throws 字段为空或含空段时抛出可读错误
 */
function parseField(raw: string, key: CronFieldKey): ParsedCronField {
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

/**
 * 解析标准 5 段 CRON 表达式（分 时 日 月 周）
 *
 * @param expression - CRON 表达式文本
 * @returns 各字段的解析结果
 * @throws 字段数量不为 5 或任一字段非法时抛出可读错误
 */
export function parseCron(expression: string): ParsedCron {
  const fields = expression.trim().split(/\s+/).filter((item) => item !== '');
  if (fields.length !== 5) {
    throw new Error(`CRON 表达式必须包含 5 个字段（分 时 日 月 周），当前为 ${fields.length} 个`);
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

/** `*` 写法对应的固定说明句式 */
const STAR_PHRASES: Record<CronFieldKey, string> = {
  minute: '每分钟',
  hour: '每小时',
  dayOfMonth: '每日',
  month: '每月',
  dayOfWeek: '每周任意一天',
};

/** 步长写法（星号加斜杠，如星号斜杠 n）对应的说明句式生成器 */
const STEP_PHRASES: Record<CronFieldKey, (step: string) => string> = {
  minute: (step) => `每 ${step} 分钟`,
  hour: (step) => `每 ${step} 小时`,
  dayOfMonth: (step) => `每 ${step} 天`,
  month: (step) => `每 ${step} 个月`,
  dayOfWeek: (step) => `每隔 ${step} 天（按星期取值）`,
};

/**
 * 把单个取值格式化为展示文本
 *
 * @param key - 字段键名
 * @param value - 取值
 * @returns 星期字段返回中文星期名，其余字段返回数字文本
 */
function formatNumber(key: CronFieldKey, value: number): string {
  if (key === 'dayOfWeek') return WEEKDAY_NAMES[value] ?? String(value);
  return String(value);
}

/**
 * 取字段对应的单位后缀
 *
 * @param key - 字段键名
 * @returns 单位后缀文本，星期字段无后缀
 */
function unitSuffix(key: CronFieldKey): string {
  if (key === 'dayOfWeek') return '';
  if (key === 'month') return ' 月';
  return ` ${FIELD_SPECS[key].label}`;
}

/**
 * 生成单个字段的人类可读说明
 *
 * @param key - 字段键名
 * @param field - 字段解析结果
 * @returns 中文说明，如「每 5 分钟」「1 至 5 日」
 */
export function describeField(key: CronFieldKey, field: ParsedCronField): string {
  const { raw, values } = field;
  if (raw === '*') return STAR_PHRASES[key];

  const stepOnly = /^\*\/(\d+)$/.exec(raw);
  if (stepOnly && stepOnly[1] !== undefined) {
    return STEP_PHRASES[key](stepOnly[1]);
  }

  const suffix = unitSuffix(key);
  const rangeMatch = /^([A-Za-z0-9]+)-([A-Za-z0-9]+)(?:\/(\d+))?$/.exec(raw);
  if (rangeMatch) {
    const first = values[0] ?? 0;
    const last = values[values.length - 1] ?? 0;
    const base = `${formatNumber(key, first)} 至 ${formatNumber(key, last)}${suffix}`;
    const step = rangeMatch[3];
    return step ? `${base}（步长 ${step}）` : base;
  }
  if (values.length > 1) {
    return `${values.map((value) => formatNumber(key, value)).join('、')}${suffix}`;
  }
  const only = values[0] ?? 0;
  return `${formatNumber(key, only)}${suffix}`;
}

/**
 * 生成整条表达式的综合说明
 *
 * @param parsed - 表达式解析结果
 * @returns 以「，」连接的各字段说明
 */
export function describeCron(parsed: ParsedCron): string {
  return CRON_FIELD_ORDER.map((key) => describeField(key, parsed[key])).join('，');
}

/**
 * 判断给定时刻是否命中解析后的表达式
 *
 * @param parsed - 表达式解析结果
 * @param sets - 各字段取值集合，用于快速判断
 * @param date - 待判断的时刻（按本地时区解读）
 * @returns 命中返回 true
 */
function matchesParsedCron(
  parsed: ParsedCron,
  sets: Record<CronFieldKey, Set<number>>,
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

/** 默认预览条数 */
export const DEFAULT_RUN_COUNT = 5;

/** 执行时间搜索上限（分钟），约 4 年，用于避免不可达表达式造成死循环 */
export const DEFAULT_MAX_SEARCH_MINUTES = 4 * 366 * 24 * 60;

/**
 * 预览表达式在给定时刻之后的若干次执行时间（按本地时区）
 *
 * @param expression - CRON 表达式文本
 * @param count - 期望预览的条数，默认为 5
 * @param from - 起始时刻，默认为当前时间，预览结果严格晚于该时刻
 * @param maxSearchMinutes - 向前搜索的分钟上限，用于防止不可达表达式死循环
 * @returns 命中的时刻列表；搜索上限内未凑够时返回已找到的部分
 * @throws 表达式非法时抛出可读错误
 */
export function getNextRuns(
  expression: string,
  count: number = DEFAULT_RUN_COUNT,
  from: Date = new Date(),
  maxSearchMinutes: number = DEFAULT_MAX_SEARCH_MINUTES,
): Date[] {
  const parsed = parseCron(expression);
  const sets: Record<CronFieldKey, Set<number>> = {
    minute: new Set(parsed.minute.values),
    hour: new Set(parsed.hour.values),
    dayOfMonth: new Set(parsed.dayOfMonth.values),
    month: new Set(parsed.month.values),
    dayOfWeek: new Set(parsed.dayOfWeek.values),
  };

  const target = Math.max(0, Math.floor(count));
  const cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  cursor.setTime(cursor.getTime() + 60_000);

  const results: Date[] = [];
  let steps = 0;
  const limit = Math.max(0, Math.floor(maxSearchMinutes));
  while (results.length < target && steps < limit) {
    if (matchesParsedCron(parsed, sets, cursor)) {
      results.push(new Date(cursor.getTime()));
    }
    cursor.setTime(cursor.getTime() + 60_000);
    steps += 1;
  }
  return results;
}
