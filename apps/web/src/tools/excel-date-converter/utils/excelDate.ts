/**
 * Excel 日期序列号与公历日期互转纯函数。
 *
 * Excel 有两套日期系统：
 * - 1900 系统（Windows 默认）：序列号 1 = 1900-01-01；Excel 出于与
 *   Lotus 1-2-3 兼容的历史原因，错误地把 1900 年当作闰年，因此
 *   序列号 60 是一个现实中不存在的「1900-02-29」（phantom date），
 *   序列号 ≥ 61 的部分整体比真实公历多出 1 天。
 * - 1904 系统（Mac 早期默认）：序列号 0 = 1904-01-01，连续计数、
 *   无 phantom 日期，且允许负序列号（表示 1904 年之前）。
 *
 * 为避免浏览器时区与夏令时造成歧义，本模块完全不使用 Date 对象，
 * 公历日序采用 Howard Hinnant 的 days-from-civil 算法（proleptic
 * Gregorian），日期比较与运算均在 UTC 意义下进行。
 */

export type DateSystem = '1900' | '1904';

/** 以「日」为单位的公历日期（不含时间） */
export interface CivilDate {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
}

/** 一天内的时刻分量 */
export interface DayTime {
  hour: number;
  minute: number;
  second: number;
  /** 毫秒（序列号小数部分换算后保留的余量，通常为 0） */
  millisecond: number;
}

export interface SerialToDateResult {
  date: CivilDate;
  time: DayTime;
  /** 是否落在 1900 系统独有的 phantom 日期（序列号 60） */
  isPhantom: boolean;
}

/** 1900 系统在 phantom 日期之后的连续锚点：日序 61 = 1900-03-01 */
const EPOCH1900_FLOOR_DAYS = 61;
const EPOCH1900_ANCHOR: CivilDate = { year: 1900, month: 3, day: 1 };

/** 1904 系统锚点：日序 0 = 1904-01-01 */
const EPOCH1904_ANCHOR: CivilDate = { year: 1904, month: 1, day: 1 };

const SERIAL_1900_JAN1 = 1;
const SERIAL_1900_FEB28 = 59;
const SERIAL_1900_PHANTOM = 60;

/**
 * days-from-civil：公历日期 → 自 1970-01-01 起的日序数（可负）。
 * 算法来源：Howard Hinnant, "chrono-Compatible Low-Level Date Algorithms"。
 */
export function daysFromCivil(d: CivilDate): number {
  const y = d.month <= 2 ? d.year - 1 : d.year;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400; // [0, 399]
  const doy =
    Math.floor((153 * (d.month > 2 ? d.month - 3 : d.month + 9) + 2) / 5) +
    d.day -
    1; // [0, 365]
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy; // [0, 146096]
  return era * 146097 + doe - 719468;
}

/** days-from-civil 的逆运算：日序数 → 公历日期 */
export function civilFromDays(z: number): CivilDate {
  const zz = z + 719468;
  const era = Math.floor(zz / 146097);
  const doe = zz - era * 146097; // [0, 146096]
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) /
      365,
  ); // [0, 399]
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100)); // [0, 365]
  const mp = Math.floor((5 * doy + 2) / 153); // [0, 11]
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1; // [1, 31]
  const month = mp < 10 ? mp + 3 : mp - 9; // [1, 12]
  return { year: y + (month <= 2 ? 1 : 0), month, day };
}

/** 校验公历日期是否真实存在（含闰年判断） */
export function isValidCivilDate(d: CivilDate): boolean {
  if (!Number.isInteger(d.year) || d.year < 1 || d.year > 9999) {
    return false;
  }
  if (!Number.isInteger(d.month) || d.month < 1 || d.month > 12) {
    return false;
  }
  if (!Number.isInteger(d.day) || d.day < 1) {
    return false;
  }
  const dims = [31, isLeapYear(d.year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return d.day <= (dims[d.month - 1] ?? 0);
}

/** 公历闰年判断 */
export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** 格式化为 YYYY-MM-DD */
export function formatDate(d: CivilDate): string {
  return `${String(d.year).padStart(4, '0')}-${pad2(d.month)}-${pad2(d.day)}`;
}

/** 格式化为 HH:mm:ss（含毫秒时追加 .fff） */
export function formatTime(t: DayTime): string {
  const base = `${pad2(t.hour)}:${pad2(t.minute)}:${pad2(t.second)}`;
  return t.millisecond > 0 ? `${base}.${String(t.millisecond).padStart(3, '0')}` : base;
}

/**
 * Excel 序列号 → 公历日期时间。
 * 序列号可带小数（小数部分 = 自午夜起的一天占比）。
 * 1900 系统：1–59 为 1900-01-01～1900-02-28，60 为 phantom，≥ 61 自 1900-03-01 连续。
 * 1904 系统：连续计数，允许负数。
 */
export function serialToDate(serial: number, system: DateSystem): SerialToDateResult {
  if (!Number.isFinite(serial)) {
    throw new Error('序列号必须是有限数字');
  }
  if (system === '1900' && serial < SERIAL_1900_JAN1) {
    throw new Error('1900 日期系统的序列号不能小于 1');
  }

  const dayPart = Math.floor(serial);
  const frac = serial - dayPart; // [0, 1)
  const time = fractionToTime(frac);

  if (system === '1900') {
    if (dayPart === SERIAL_1900_PHANTOM) {
      // phantom 1900-02-29：现实中不存在，日期按 Excel 显示值给出并打标
      return {
        date: { year: 1900, month: 2, day: 29 },
        time,
        isPhantom: true,
      };
    }
    // 1–59：以 1899-12-31 为日序 0 连续（1 → 1900-01-01）
    if (dayPart <= SERIAL_1900_FEB28) {
      const anchorDays = daysFromCivil({ year: 1899, month: 12, day: 31 });
      return { date: civilFromDays(anchorDays + dayPart), time, isPhantom: false };
    }
    // ≥ 61：以 1900-03-01（日序 61）为锚点
    const anchorDays = daysFromCivil(EPOCH1900_ANCHOR);
    return {
      date: civilFromDays(anchorDays + (dayPart - EPOCH1900_FLOOR_DAYS)),
      time,
      isPhantom: false,
    };
  }

  // 1904 系统：日序 0 = 1904-01-01，连续且允许负数
  const anchorDays = daysFromCivil(EPOCH1904_ANCHOR);
  return { date: civilFromDays(anchorDays + dayPart), time, isPhantom: false };
}

/**
 * 公历日期时间 → Excel 序列号。
 * 1900 系统不接受 1900-02-29（phantom 只存在于序列号反向显示中），
 * 也不接受早于 1900-01-01 的日期。
 */
export function dateToSerial(
  date: CivilDate,
  time: Partial<DayTime> | undefined,
  system: DateSystem,
): number {
  if (!isValidCivilDate(date)) {
    throw new Error('不是有效的公历日期');
  }
  const t = normalizeTime(time);
  const frac = timeToFraction(t);

  if (system === '1904') {
    const serial = daysFromCivil(date) - daysFromCivil(EPOCH1904_ANCHOR) + frac;
    return roundSerial(serial);
  }

  // 1900 系统：仅支持 1900-01-01（序列号 1）及以后；phantom 1900-02-29
  // 不是合法公历日期，已由 isValidCivilDate 拦截。
  // 1900-01-01～1900-02-28 走连续段（1899-12-31 为日序 0），
  // 1900-03-01 起走锚点段（1900-03-01 = 61，跨过 phantom 60）。
  const dateDays = daysFromCivil(date);
  const anchorDays = daysFromCivil(EPOCH1900_ANCHOR);
  let serialDays: number;
  if (dateDays < anchorDays) {
    // 1900-03-01 之前：与 1899-12-31（日序 0）连续，phantom 60 无对应公历日期
    serialDays = dateDays - daysFromCivil({ year: 1899, month: 12, day: 31 });
  } else {
    serialDays = dateDays - anchorDays + EPOCH1900_FLOOR_DAYS;
  }
  if (serialDays < SERIAL_1900_JAN1) {
    throw new Error('1900 日期系统仅支持 1900-01-01 及以后的日期');
  }
  return roundSerial(serialDays + frac);
}

function normalizeTime(time?: Partial<DayTime>): DayTime {
  const t: DayTime = {
    hour: time?.hour ?? 0,
    minute: time?.minute ?? 0,
    second: time?.second ?? 0,
    millisecond: time?.millisecond ?? 0,
  };
  if (
    !Number.isInteger(t.hour) ||
    t.hour < 0 ||
    t.hour > 23 ||
    !Number.isInteger(t.minute) ||
    t.minute < 0 ||
    t.minute > 59 ||
    !Number.isInteger(t.second) ||
    t.second < 0 ||
    t.second > 59 ||
    !Number.isInteger(t.millisecond) ||
    t.millisecond < 0 ||
    t.millisecond > 999
  ) {
    throw new Error('时间分量超出范围');
  }
  return t;
}

/** 一天内的时刻 → 序列号小数部分 */
export function timeToFraction(t: DayTime): number {
  const msOfDay =
    ((t.hour * 60 + t.minute) * 60 + t.second) * 1000 + t.millisecond;
  return msOfDay / 86_400_000;
}

/** 序列号小数部分 → 时刻分量（就近取整到毫秒） */
export function fractionToTime(frac: number): DayTime {
  let f = frac;
  if (f < 0) {
    // 负序列号（1904 系统）：小数部分也要向午夜对齐
    f += 1;
  }
  let ms = Math.round(f * 86_400_000);
  if (ms >= 86_400_000) {
    ms = 0; // 四舍五入进位到次日的极端情况
  }
  const millisecond = ms % 1000;
  const totalSeconds = Math.floor(ms / 1000);
  const second = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minute = totalMinutes % 60;
  const hour = Math.floor(totalMinutes / 60);
  return { hour, minute, second, millisecond };
}

/** 序列号展示精度：保留 8 位小数，抹掉浮点尾差（1 位小数 ≈ 8.6 秒 → 毫秒级足够） */
function roundSerial(serial: number): number {
  return Number(serial.toFixed(8));
}
