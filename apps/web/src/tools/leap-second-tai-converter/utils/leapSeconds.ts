/**
 * IERS 历史闰秒表与 TAI/UTC/Unix 换算纯函数（零依赖）
 *
 * TAI 是连续的原子时；UTC 通过插入正闰秒与地球自转保持对齐。
 * 每条闰秒在生效日（UTC 当日 00:00 起）使 TAI−UTC 偏移增加 1 秒。
 * 1972-01-01 起 TAI−UTC 初始为 10 秒，此前的平滑跳变不在本表覆盖范围。
 */

/** 一次正闰秒的生效时刻（UTC 当日 00:00:00，即上一日 23:59:60 之后） */
export interface LeapSecondEntry {
  /** 生效日 UTC 零点的 Unix 时间戳（秒） */
  at: number;
  /** 该时刻起的 TAI−UTC 偏移（秒） */
  offset: number;
  /** 生效日，便于 UI 展示 */
  date: string;
}

/**
 * IERS 公告的全部正闰秒（截至 2017-01-01，共 27 次，TAI−UTC = 37s）。
 * 最后一条之后的日期按 37s 外推；IERS 公告新闰秒后需更新此表。
 */
export const LEAP_SECONDS: readonly LeapSecondEntry[] = [
  { at: 63072000, offset: 10, date: "1972-01-01" },
  { at: 78796800, offset: 11, date: "1972-07-01" },
  { at: 94694400, offset: 12, date: "1973-01-01" },
  { at: 126230400, offset: 13, date: "1974-01-01" },
  { at: 157766400, offset: 14, date: "1975-01-01" },
  { at: 189302400, offset: 15, date: "1976-01-01" },
  { at: 220924800, offset: 16, date: "1977-01-01" },
  { at: 252460800, offset: 17, date: "1978-01-01" },
  { at: 283996800, offset: 18, date: "1979-01-01" },
  { at: 315532800, offset: 19, date: "1980-01-01" },
  { at: 362793600, offset: 20, date: "1981-07-01" },
  { at: 394329600, offset: 21, date: "1982-07-01" },
  { at: 425865600, offset: 22, date: "1983-07-01" },
  { at: 489024000, offset: 23, date: "1985-07-01" },
  { at: 567993600, offset: 24, date: "1988-01-01" },
  { at: 631152000, offset: 25, date: "1990-01-01" },
  { at: 662688000, offset: 26, date: "1991-01-01" },
  { at: 709948800, offset: 27, date: "1992-07-01" },
  { at: 741484800, offset: 28, date: "1993-07-01" },
  { at: 773020800, offset: 29, date: "1994-07-01" },
  { at: 820454400, offset: 30, date: "1996-01-01" },
  { at: 867715200, offset: 31, date: "1997-07-01" },
  { at: 915148800, offset: 32, date: "1999-01-01" },
  { at: 1136073600, offset: 33, date: "2006-01-01" },
  { at: 1230768000, offset: 34, date: "2009-01-01" },
  { at: 1341100800, offset: 35, date: "2012-07-01" },
  { at: 1435708800, offset: 36, date: "2015-07-01" },
  { at: 1483228800, offset: 37, date: "2017-01-01" },
];

/** 表覆盖范围起点（UTC 零点 Unix 秒）与当前外推偏移 */
export const TABLE_START_UNIX = LEAP_SECONDS[0]!.at;
export const LATEST_OFFSET = LEAP_SECONDS[LEAP_SECONDS.length - 1]!.offset;
export const LATEST_LEAP_DATE = LEAP_SECONDS[LEAP_SECONDS.length - 1]!.date;

/**
 * 返回给定 Unix 时间戳（UTC 常规时刻，不含 23:59:60 闰秒本身）对应的
 * TAI−UTC 偏移。1972-01-01 之前返回 null（本表不覆盖平滑跳变年代）。
 */
export function taiOffsetAt(unixSeconds: number): number | null {
  if (unixSeconds < TABLE_START_UNIX) {
    return null;
  }
  let current = LEAP_SECONDS[0]!.offset;
  for (const entry of LEAP_SECONDS) {
    if (unixSeconds >= entry.at) {
      current = entry.offset;
    } else {
      break;
    }
  }
  return current;
}

/** Unix 时间戳（UTC 常规秒）→ TAI 时间戳（TAI 秒，纪元同为 1970-01-01T00:00:00 TAI） */
export function unixToTai(unixSeconds: number): number | null {
  const offset = taiOffsetAt(unixSeconds);
  if (offset === null) {
    return null;
  }
  return unixSeconds + offset;
}

/** TAI 时间戳 → Unix 时间戳（UTC 常规秒） */
export function taiToUnix(taiSeconds: number): number | null {
  const firstTai = TABLE_START_UNIX + LEAP_SECONDS[0]!.offset;
  if (taiSeconds < firstTai) {
    return null;
  }
  // 定位 TAI 时刻落入的偏移区间：entry.at 处切换到 entry.offset，
  // 切换前一秒（含闰秒 23:59:60）仍属上一区间。
  let offset = LEAP_SECONDS[0]!.offset;
  for (let i = 1; i < LEAP_SECONDS.length; i += 1) {
    const boundary = LEAP_SECONDS[i]!.at + LEAP_SECONDS[i - 1]!.offset;
    if (taiSeconds < boundary) {
      break;
    }
    offset = LEAP_SECONDS[i]!.offset;
  }
  return taiSeconds - offset;
}

/**
 * 判断某 UTC 时刻是否落在闰秒插入日。
 * 正闰秒表现为月末最后一天的 23:59:60，次日 00:00 切换偏移，
 * 因此生效日的前一天（entry.at - 86400）与 entry 当天都标记为闰秒日。
 */
export function isLeapSecondDay(unixSeconds: number): LeapSecondEntry | null {
  const dayStart = Math.floor(unixSeconds / 86400) * 86400;
  return (
    LEAP_SECONDS.find(
      (entry) => entry.at === dayStart || entry.at - 86400 === dayStart,
    ) ?? null
  );
}

export interface ConversionResult {
  unix: number | null;
  tai: number | null;
  offset: number | null;
  /** 人类可读 UTC 时间（ISO 风格，秒精度） */
  utcText: string;
  /** 是否落在闰秒生效日 */
  leapDay: LeapSecondEntry | null;
  error: string | null;
}

const UTC_TEXT_FORMAT = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "UTC",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Unix 秒转 UTC 展示文本；直接用 Date 保证时区为 UTC */
export function formatUtc(unixSeconds: number): string {
  return UTC_TEXT_FORMAT.format(new Date(unixSeconds * 1000)).replace(
    /\//g,
    "-",
  );
}

/**
 * 以 Unix 时间戳为入口做完整换算。
 * 支持小数秒；1972 年之前的时间返回错误（超出闰秒表覆盖范围）。
 */
export function convertFromUnix(unixInput: string): ConversionResult {
  const trimmed = unixInput.trim();
  if (trimmed === "") {
    return {
      unix: null,
      tai: null,
      offset: null,
      utcText: "",
      leapDay: null,
      error: "内容不能为空",
    };
  }
  const unix = Number(trimmed);
  if (!Number.isFinite(unix)) {
    return {
      unix: null,
      tai: null,
      offset: null,
      utcText: "",
      leapDay: null,
      error: "Unix 时间戳必须是数字",
    };
  }
  if (unix < TABLE_START_UNIX) {
    return {
      unix,
      tai: null,
      offset: null,
      utcText: formatUtc(unix),
      leapDay: null,
      error:
        "闰秒表仅覆盖 1972-01-01 及之后的时间，此前的 UTC/TAI 平滑偏移不在支持范围",
    };
  }
  const offset = taiOffsetAt(unix);
  const tai = unixToTai(unix);
  return {
    unix,
    tai,
    offset,
    utcText: formatUtc(unix),
    leapDay: isLeapSecondDay(unix),
    error: null,
  };
}

/** 以 TAI 时间戳为入口做完整换算 */
export function convertFromTai(taiInput: string): ConversionResult {
  const trimmed = taiInput.trim();
  if (trimmed === "") {
    return {
      unix: null,
      tai: null,
      offset: null,
      utcText: "",
      leapDay: null,
      error: "内容不能为空",
    };
  }
  const tai = Number(trimmed);
  if (!Number.isFinite(tai)) {
    return {
      unix: null,
      tai: null,
      offset: null,
      utcText: "",
      leapDay: null,
      error: "TAI 时间戳必须是数字",
    };
  }
  const unix = taiToUnix(tai);
  if (unix === null) {
    return {
      unix: null,
      tai,
      offset: null,
      utcText: "",
      leapDay: null,
      error: "该 TAI 时间戳早于 1972-01-01，超出闰秒表覆盖范围",
    };
  }
  const offset = taiOffsetAt(unix);
  return {
    unix,
    tai,
    offset,
    utcText: formatUtc(unix),
    leapDay: isLeapSecondDay(unix),
    error: null,
  };
}
