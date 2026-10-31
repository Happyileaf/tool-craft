/**
 * 多纪元时间戳换算（零依赖纯函数，全程 BigInt 避免精度丢失）
 *
 * 统一内部表示：Unix 纪元起的纳秒整数（bigint，可为负）。
 * 支持纪元：
 * - Unix epoch：秒 / 毫秒 / 微秒 / 纳秒
 * - Windows FILETIME：1601-01-01T00:00:00Z 起的 100ns 间隔
 * - .NET DateTimeOffset Ticks：0001-01-01T00:00:00Z 起的 100ns 间隔
 * - Google Chrome / WebKit：1601-01-01T00:00:00Z 起的微秒
 * - Apple Cocoa / Core Data：2001-01-01T00:00:00Z 起的秒
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export type EpochKey =
  | 'unix-sec'
  | 'unix-ms'
  | 'unix-us'
  | 'unix-ns'
  | 'filetime'
  | 'dotnet-ticks'
  | 'chrome'
  | 'cocoa';

export interface EpochDef {
  key: EpochKey;
  label: string;
  labelEn: string;
  description: string;
  /** 该纪元零点相对 Unix 零点的纳秒偏移（epochNs = epochValue 表示的绝对纳秒 - offset） */
  offsetNs: bigint;
  /** 1 个该纪元单位等于多少纳秒 */
  unitNs: bigint;
  /** 是否仅接受非负整数（纪元起点之前无定义） */
  nonNegative: boolean;
}

const NS_PER_US = BigInt(1000);
const NS_PER_MS = BigInt(1_000_000);
const NS_PER_SEC = BigInt(1_000_000_000);
const NS_PER_TICK = BigInt(100);

/** 1601-01-01T00:00:00Z 相对 Unix 纪元的纳秒偏移（= -11644473600s） */
const FILETIME_OFFSET_NS = BigInt(-11644473600) * NS_PER_SEC;
/** 0001-01-01T00:00:00Z 相对 Unix 纪元的纳秒偏移（= -62135596800s） */
const DOTNET_OFFSET_NS = BigInt(-62135596800) * NS_PER_SEC;
/** 2001-01-01T00:00:00Z 相对 Unix 纪元的纳秒偏移（= 978307200s） */
const COCOA_OFFSET_NS = BigInt(978307200) * NS_PER_SEC;

export const EPOCH_DEFS: EpochDef[] = [
  {
    key: 'unix-sec',
    label: 'Unix 秒',
    labelEn: 'Unix seconds',
    description: '1970-01-01 起的秒数',
    offsetNs: BigInt(0),
    unitNs: NS_PER_SEC,
    nonNegative: false,
  },
  {
    key: 'unix-ms',
    label: 'Unix 毫秒',
    labelEn: 'Unix milliseconds',
    description: '1970-01-01 起的毫秒数（Java/JS Date）',
    offsetNs: BigInt(0),
    unitNs: NS_PER_MS,
    nonNegative: false,
  },
  {
    key: 'unix-us',
    label: 'Unix 微秒',
    labelEn: 'Unix microseconds',
    description: '1970-01-01 起的微秒数',
    offsetNs: BigInt(0),
    unitNs: NS_PER_US,
    nonNegative: false,
  },
  {
    key: 'unix-ns',
    label: 'Unix 纳秒',
    labelEn: 'Unix nanoseconds',
    description: '1970-01-01 起的纳秒数',
    offsetNs: BigInt(0),
    unitNs: BigInt(1),
    nonNegative: false,
  },
  {
    key: 'filetime',
    label: 'Windows FILETIME',
    labelEn: 'Windows FILETIME',
    description: '1601-01-01 起的 100ns 间隔数',
    offsetNs: FILETIME_OFFSET_NS,
    unitNs: NS_PER_TICK,
    nonNegative: true,
  },
  {
    key: 'dotnet-ticks',
    label: '.NET Ticks',
    labelEn: '.NET Ticks',
    description: '0001-01-01 起的 100ns 间隔数（DateTimeOffset）',
    offsetNs: DOTNET_OFFSET_NS,
    unitNs: NS_PER_TICK,
    nonNegative: true,
  },
  {
    key: 'chrome',
    label: 'Chrome / WebKit 微秒',
    labelEn: 'Chrome / WebKit microseconds',
    description: '1601-01-01 起的微秒数（内部时间戳）',
    offsetNs: FILETIME_OFFSET_NS,
    unitNs: NS_PER_US,
    nonNegative: true,
  },
  {
    key: 'cocoa',
    label: 'Apple Cocoa 秒',
    labelEn: 'Apple Cocoa seconds',
    description: '2001-01-01 起的秒数（Core Data 时间）',
    offsetNs: COCOA_OFFSET_NS,
    unitNs: NS_PER_SEC,
    nonNegative: false,
  },
];

export function getEpochDef(key: EpochKey): EpochDef {
  const def = EPOCH_DEFS.find((item) => item.key === key);
  if (!def) {
    throw new Error(`未知纪元：${key}`);
  }
  return def;
}

export interface TimestampResult {
  /** 统一内部表示：Unix 纪元起纳秒 */
  unixNs: bigint | null;
  values: Partial<Record<EpochKey, string>>;
  error: string | null;
}

const INTEGER_RE = /^[+-]?\d+$/;

/** 解析某纪元的整数时间戳为统一纳秒表示，并给出全部纪元的等价值 */
export function convertTimestamp(raw: string, source: EpochKey): TimestampResult {
  const text = raw.trim();
  if (text === '') {
    return { unixNs: null, values: {}, error: '内容不能为空' };
  }
  if (!INTEGER_RE.test(text)) {
    return { unixNs: null, values: {}, error: '时间戳必须是整数（不接受小数、科学计数法或其他字符）' };
  }

  const def = getEpochDef(source);
  let value: bigint;
  try {
    value = BigInt(text);
  } catch {
    return { unixNs: null, values: {}, error: '整数解析失败，请检查输入' };
  }
  if (def.nonNegative && value < BigInt(0)) {
    return {
      unixNs: null,
      values: {},
      error: `${def.label} 自纪元零点起算，不能为负数`,
    };
  }

  const unixNs = value * def.unitNs + def.offsetNs;
  return {
    unixNs,
    values: formatAllEpochs(unixNs),
    error: null,
  };
}

/** 由统一纳秒表示生成全部纪元值 */
export function formatAllEpochs(unixNs: bigint): Partial<Record<EpochKey, string>> {
  const out = {} as Partial<Record<EpochKey, string>>;
  EPOCH_DEFS.forEach((def) => {
    const v = (unixNs - def.offsetNs) / def.unitNs;
    out[def.key] = v.toString();
  });
  return out;
}

/**
 * 由 UTC 日期时间字段反推统一纳秒表示。
 * year 为公历年（1-9999），month 1-12，其余按常规范围；ms 额外允许 0-999。
 */
export interface DateTimeFields {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

export interface DateTimeResult {
  unixNs: bigint | null;
  values: Partial<Record<EpochKey, string>>;
  iso: string | null;
  error: string | null;
}

const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

/** 计算公历日期对应 Unix 纳秒（1970 前同样适用），字段非法时返回错误 */
export function fromUtcDateTime(fields: DateTimeFields): DateTimeResult {
  const { year, month, day, hour, minute, second, millisecond } = fields;

  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    return { unixNs: null, values: {}, iso: null, error: '年份必须为 1-9999 的整数' };
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { unixNs: null, values: {}, iso: null, error: '月份必须为 1-12' };
  }
  const maxDay = month === 2 && isLeapYear(year) ? 29 : DAYS_PER_MONTH[month - 1] ?? 31;
  if (!Number.isInteger(day) || day < 1 || day > maxDay) {
    return { unixNs: null, values: {}, iso: null, error: `日期必须为该月有效日（1-${maxDay}）` };
  }
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return { unixNs: null, values: {}, iso: null, error: '小时必须为 0-23' };
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    return { unixNs: null, values: {}, iso: null, error: '分钟必须为 0-59' };
  }
  if (!Number.isInteger(second) || second < 0 || second > 59) {
    return { unixNs: null, values: {}, iso: null, error: '秒必须为 0-59' };
  }
  if (!Number.isInteger(millisecond) || millisecond < 0 || millisecond > 999) {
    return { unixNs: null, values: {}, iso: null, error: '毫秒必须为 0-999' };
  }

  // 用 Date.UTC 计算到毫秒（Date 对 1-9999 年有效），再用 BigInt 转纳秒
  const ms = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  if (Number.isNaN(ms)) {
    return { unixNs: null, values: {}, iso: null, error: '日期时间无法解析' };
  }
  const unixNs = BigInt(ms) * NS_PER_MS;
  const iso = buildIsoUtc(fields);
  return { unixNs, values: formatAllEpochs(unixNs), iso, error: null };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

function pad4(n: number): string {
  return String(n).padStart(4, '0');
}

function buildIsoUtc(f: DateTimeFields): string {
  return `${pad4(f.year)}-${pad2(f.month)}-${pad2(f.day)}T${pad2(f.hour)}:${pad2(
    f.minute,
  )}:${pad2(f.second)}.${pad3(f.millisecond)}Z`;
}

/** 由统一纳秒表示反解 UTC 日期时间字段（仅保证 ±100,000,000 天范围内与 Date 一致） */
export function toUtcDateTime(unixNs: bigint): { iso: string; fields: DateTimeFields } {
  const ms = Number(unixNs / NS_PER_MS);
  const d = new Date(ms);
  const fields: DateTimeFields = {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    millisecond: d.getUTCMilliseconds(),
  };
  return { iso: buildIsoUtc(fields), fields };
}

/** 当前时刻的统一纳秒表示（毫秒精度，浏览器 clock 不提供更高精度） */
export function nowUnixNs(): bigint {
  return BigInt(Date.now()) * NS_PER_MS;
}
