/**
 * 儒略日（JD / MJD）与 UTC 公历日期时间互转的纯函数实现。
 * 约定：JD 从世界时正午起算，J2000.0 = JD 2451545.0 = 2000-01-01T12:00:00Z。
 * 公式：Meeus《Astronomical Algorithms》第 7 章（格里高利历）。
 */

/** MJD = JD - 2400000.5 */
export const MJD_OFFSET = 2400000.5;

/** Unix 历元 1970-01-01T00:00:00Z 对应的 JD */
export const UNIX_EPOCH_JD = 2440587.5;

/** 一天的秒数 */
const SECONDS_PER_DAY = 86400;

/** 格里高利历起始日 1582-10-15（JD 00:00 UT，含） */
export const GREGORIAN_START_JD = 2299160.5;

/** 支持区间上界 2100-12-31（JD 日末，不含） */
export const MAX_SUPPORTED_JD = 2488435.5;

export interface CalendarParts {
  /** 公历年（四位） */
  year: number;
  /** 月（1–12） */
  month: number;
  /** 日（1–31） */
  day: number;
  /** 时（0–23，UTC） */
  hour: number;
  /** 分（0–59） */
  minute: number;
  /** 秒（0–59，含小数） */
  second: number;
}

export interface JulianResult {
  /** 转换结果，出错时为 null */
  jd: number | null;
  /** 约化儒略日 MJD = JD - 2400000.5 */
  mjd: number | null;
  /** 对应的 Unix 时间戳（秒，含小数） */
  unix: number | null;
  /** 错误信息 */
  error: string | null;
}

/**
 * 公历日期时间（UTC）→ 儒略日 JD（Meeus 7.1 正向公式）。
 */
export function calendarToJulian(parts: CalendarParts): number {
  let { year, month } = parts;
  const { day, hour, minute, second } = parts;
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jdMidnight =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    b -
    1524.5;
  const fraction = (hour * 3600 + minute * 60 + second) / SECONDS_PER_DAY;
  return jdMidnight + fraction;
}

/**
 * 儒略日 JD → 公历日期时间（UTC），Meeus 7.1 反解公式。
 * 秒级浮点误差通过「先四舍五入到毫秒再逐级进位」消除。
 */
export function julianToCalendar(jd: number): CalendarParts {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;

  let a: number;
  if (z < 2299161) {
    a = z;
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);

  const dayFraction = b - d - Math.floor(30.6001 * e) + f;
  const day = Math.floor(dayFraction);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;

  // 当日小数（UTC 0 时起）→ 时/分/秒；先取整到毫秒总量再分解，消除 59.999… 浮点边界
  const totalMs = Math.round((dayFraction - day) * SECONDS_PER_DAY * 1000);
  const hour = Math.floor(totalMs / 3600000);
  const minute = Math.floor((totalMs % 3600000) / 60000);
  const second = (totalMs % 60000) / 1000;

  return { year, month, day, hour, minute, second };
}

/** 公历日期时间 → JD/MJD/Unix 完整结果对象（含校验） */
export function convertCalendar(parts: CalendarParts): JulianResult {
  const error = validateParts(parts);
  if (error) {
    return { jd: null, mjd: null, unix: null, error };
  }
  const jd = roundPrecision(calendarToJulian(parts), 8);
  return {
    jd,
    mjd: roundPrecision(jd - MJD_OFFSET, 8),
    unix: roundPrecision((jd - UNIX_EPOCH_JD) * SECONDS_PER_DAY, 3),
    error: null,
  };
}

/** JD 数字 → 公历日期时间及 MJD/Unix */
export function convertJulian(jdInput: string): {
  parts: CalendarParts | null;
  mjd: number | null;
  unix: number | null;
  error: string | null;
} {
  const trimmed = jdInput.trim();
  if (trimmed === '') {
    return { parts: null, mjd: null, unix: null, error: '请输入儒略日数字' };
  }
  const jd = Number(trimmed);
  if (!Number.isFinite(jd)) {
    return { parts: null, mjd: null, unix: null, error: '儒略日必须是有效数字' };
  }
  if (jd < GREGORIAN_START_JD || jd >= MAX_SUPPORTED_JD) {
    return {
      parts: null,
      mjd: null,
      unix: null,
      error: '当前支持 1582-10-15 至 2100-12-31（格里高利历）区间',
    };
  }
  const parts = julianToCalendar(jd);
  return {
    parts,
    mjd: roundPrecision(jd - MJD_OFFSET, 8),
    unix: roundPrecision((jd - UNIX_EPOCH_JD) * SECONDS_PER_DAY, 3),
    error: null,
  };
}

/** 年月日时分秒合法性校验 */
export function validateParts(parts: CalendarParts): string | null {
  const { year, month, day, hour, minute, second } = parts;
  if (!Number.isInteger(year) || year < 1582 || year > 2100) {
    return '年份需为 1582–2100 的整数';
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return '月份需为 1–12';
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth) {
    return `日期需为该月 1–${daysInMonth}`;
  }
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return '小时需为 0–23';
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    return '分钟需为 0–59';
  }
  if (typeof second !== 'number' || second < 0 || second >= 60) {
    return '秒需为 [0, 60) 区间';
  }
  return null;
}

/** 将数字四舍五入到指定小数位，消除浮点尾数误差 */
export function roundPrecision(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** 把日期时间各部分格式化为可读的 UTC 字符串 */
export function formatParts(parts: CalendarParts): string {
  const pad = (n: number, width = 2) => String(n).padStart(width, '0');
  let secText: string;
  if (Number.isInteger(parts.second)) {
    secText = pad(parts.second);
  } else {
    const fixed = parts.second.toFixed(3);
    const [whole, frac] = fixed.split('.');
    secText = `${pad(Number(whole))}.${frac}`;
  }
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(
    parts.minute,
  )}:${secText} UTC`;
}
