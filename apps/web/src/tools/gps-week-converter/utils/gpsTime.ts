/**
 * GPS 周数 / 周内秒（TOW）与 UTC 时间互转
 *
 * GPS 时（GPST）起点为 1980-01-06T00:00:00Z，不跳闰秒，比 UTC 快若干闰秒。
 * LNAV 电文的周数（WN）为 10 位，取值 0–1023，每 1024 周（约 19.7 年）回卷一次：
 *   第 1 次回卷边界 1999-08-22（周 1024 → WN 0）
 *   第 2 次回卷边界 2019-04-07（周 2048 → WN 0）
 * CNAV（GPS 现代化报文）使用 13 位连续周数，不回卷。
 */

/** GPS 纪元对应的 Unix 秒（1980-01-06T00:00:00Z） */
export const GPS_EPOCH_UNIX_SECONDS = 315964800;

/** 每周秒数 */
export const SECONDS_PER_WEEK = 604800;

/** LNAV 10 位周数模值 */
export const LNAV_WEEK_MODULO = 1024;

/** 回卷边界日期标签（仅用于展示） */
export const ROLLOVER_LABELS = ['1999-08-22', '2019-04-07', '2038-11-21'];

/**
 * 闰秒表：自该 UTC Unix 秒（含）起，GPS 比 UTC 快 leapSeconds 秒
 * 数据截至 2017-01-01（18 秒，IERS 最新一次插入）；之后按 18 秒计算。
 */
const LEAP_SECOND_TABLE: ReadonlyArray<{ unixSeconds: number; leapSeconds: number }> = [
  { unixSeconds: 0, leapSeconds: 0 },
  { unixSeconds: 362793600, leapSeconds: 1 }, // 1981-07-01
  { unixSeconds: 394329600, leapSeconds: 2 }, // 1982-07-01
  { unixSeconds: 425865600, leapSeconds: 3 }, // 1983-07-01
  { unixSeconds: 489024000, leapSeconds: 4 }, // 1985-07-01
  { unixSeconds: 567993600, leapSeconds: 5 }, // 1988-01-01
  { unixSeconds: 631152000, leapSeconds: 6 }, // 1990-01-01
  { unixSeconds: 662688000, leapSeconds: 7 }, // 1991-01-01
  { unixSeconds: 709948800, leapSeconds: 8 }, // 1992-07-01
  { unixSeconds: 741484800, leapSeconds: 9 }, // 1993-07-01
  { unixSeconds: 773020800, leapSeconds: 10 }, // 1994-07-01
  { unixSeconds: 820454400, leapSeconds: 11 }, // 1996-01-01
  { unixSeconds: 867715200, leapSeconds: 12 }, // 1997-07-01
  { unixSeconds: 915148800, leapSeconds: 13 }, // 1999-01-01
  { unixSeconds: 1136073600, leapSeconds: 14 }, // 2006-01-01
  { unixSeconds: 1230768000, leapSeconds: 15 }, // 2009-01-01
  { unixSeconds: 1341100800, leapSeconds: 16 }, // 2012-07-01
  { unixSeconds: 1435708800, leapSeconds: 17 }, // 2015-07-01
  { unixSeconds: 1483228800, leapSeconds: 18 }, // 2017-01-01
];

/** 查询某 UTC 秒时刻生效的闰秒数（GPS − UTC） */
export function leapSecondsAtUtc(unixSeconds: number): number {
  let current = 0;
  for (const entry of LEAP_SECOND_TABLE) {
    if (unixSeconds >= entry.unixSeconds) {
      current = entry.leapSeconds;
    } else {
      break;
    }
  }
  return current;
}

export interface GpsPosition {
  /** 连续 GPS 周数（CNAV 口径，不回卷） */
  week: number;
  /** 周内秒 [0, 604800) */
  tow: number;
}

/**
 * UTC 毫秒 → GPS 连续周数与周内秒
 */
export function utcMsToGps(unixMs: number): GpsPosition {
  const unixSeconds = unixMs / 1000;
  const leap = leapSecondsAtUtc(Math.floor(unixSeconds));
  const gpsSeconds = unixSeconds - GPS_EPOCH_UNIX_SECONDS + leap;
  const week = Math.floor(gpsSeconds / SECONDS_PER_WEEK);
  const tow = gpsSeconds - week * SECONDS_PER_WEEK;
  return { week, tow };
}

/**
 * GPS 连续周数与周内秒 → UTC 毫秒
 *
 * GPS 秒不含闰秒，需减去目标时刻生效的闰秒数。先用近似值（不减闰秒）
 * 定位闰秒区间，再做一次修正；闰秒间隔远大于几十秒的缓冲，因此一次即可收敛。
 */
export function gpsToUtcMs(position: GpsPosition): number {
  const gpsSeconds = position.week * SECONDS_PER_WEEK + position.tow;
  const unixSecondsApprox = GPS_EPOCH_UNIX_SECONDS + gpsSeconds;
  const leap = leapSecondsAtUtc(Math.floor(unixSecondsApprox) - 30);
  return (unixSecondsApprox - leap) * 1000;
}

/**
 * 由 10 位 LNAV WN 与所选回卷次数还原连续周数
 *
 * @param wn - 电文中的 0–1023 周数
 * @param rolloverCount - 已发生的回卷次数（0 = 1980–1999，1 = 1999–2019，2 = 2019–2038）
 */
export function lnavToContinuousWeek(wn: number, rolloverCount: number): number {
  return rolloverCount * LNAV_WEEK_MODULO + wn;
}

/** 连续周数 → 10 位 LNAV WN */
export function continuousToLnavWeek(week: number): number {
  return ((week % LNAV_WEEK_MODULO) + LNAV_WEEK_MODULO) % LNAV_WEEK_MODULO;
}

/** 推断连续周数落在哪次回卷周期（返回回卷次数） */
export function inferRolloverCount(continuousWeek: number): number {
  return Math.max(0, Math.floor(continuousWeek / LNAV_WEEK_MODULO));
}

/** 校验周内秒是否合法 */
export function isValidTow(tow: number): boolean {
  return Number.isFinite(tow) && tow >= 0 && tow < SECONDS_PER_WEEK;
}

/** 校验 LNAV 周数是否在 0–1023 */
export function isValidLnavWeek(wn: number): boolean {
  return Number.isInteger(wn) && wn >= 0 && wn < LNAV_WEEK_MODULO;
}

/** 把周内秒格式化为 天 + HH:MM:SS */
export function formatTowClock(tow: number): string {
  const day = Math.floor(tow / 86400);
  let rest = tow - day * 86400;
  const h = Math.floor(rest / 3600);
  rest -= h * 3600;
  const m = Math.floor(rest / 60);
  const s = rest - m * 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${day} 天 ${pad(h)}:${pad(m)}:${pad(s)}`;
}
