/**
 * 月相 / 月龄纯计算。
 *
 * 采用平均朔望月取模模型（不依赖星历表）：
 * 以已知新月基准点 UTC 2000-01-06 18:14（Julian Day 2451550.259...）
 * 与平均朔望月长度 29.530588853 天，对目标日的 Julian Day 差取模得到月龄。
 * 结果为近似值，误差约 ±1 天，适合教学与一般查询。
 */

/** 平均朔望月长度（天）。 */
export const SYNODIC_MONTH = 29.530588853;

/**
 * 基准新月 Julian Day。
 * 真实新月时刻 UTC 2000-01-06 18:14（JD 2451550.259），本工具按日历日中午
 * （整数 JD）计算，故基准取该日整数 JD 2451550；月龄结果为日级近似。
 */
export const NEW_MOON_REF_JD = 2451550;

/** 满月相对新月的月龄（半个朔望月）。 */
export const FULL_MOON_AGE = SYNODIC_MONTH / 2;

/** 八个相位的标识。 */
export type PhaseKey =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

export interface PhaseInfo {
  /** 月龄，单位天，范围 [0, SYNODIC_MONTH)。 */
  age: number;
  /** 相位角（弧度），0 对应新月。 */
  phaseAngle: number;
  /** 照亮比例，范围 [0, 1]。 */
  illumination: number;
  /** 八相位标识。 */
  phase: PhaseKey;
  /** 相位中文名。 */
  phaseNameZh: string;
  /** 相位英文名。 */
  phaseNameEn: string;
  /** 距上一次新月的天数。 */
  daysSinceNewMoon: number;
  /** 距下一次新月的天数。 */
  daysUntilNewMoon: number;
}

/** 把 UTC 年月日（按当日 12:00 归一）转为 Julian Day。 */
export function toJulianDay(year: number, month: number, day: number): number {
  // Fliegel–Van Flandern 整数公式，输入为公历日期，取中午 12:00 的 JD。
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

/** 把 Date（UTC 年月日）转为 Julian Day，内部按 UTC 日历日取中午。 */
export function dateToJulianDay(date: Date): number {
  return toJulianDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** 由整数 Julian Day（中午 12:00 制）反算 UTC 日历日，返回该日 UTC 00:00 的 Date。 */
export function julianDayToDate(jd: number): Date {
  // Fliegel–Van Flandern 逆公式（J 为整数 Julian Day Number）。
  const j = Math.round(jd) + 32044;
  const g = Math.floor(j / 146097);
  const dg = j % 146097;
  const c = Math.floor((Math.floor(dg / 36524) + 1) * 3 / 4);
  const dc = dg - c * 36524;
  const b = Math.floor(dc / 1461);
  const db = dc % 1461;
  const a = Math.floor((Math.floor(db / 365) + 1) * 3 / 4);
  const da = db - a * 365;
  const y = g * 400 + c * 100 + b * 4 + a;
  const m = Math.floor((da * 5 + 308) / 153) - 2;
  const d = da - Math.floor((m + 4) * 153 / 5) + 122;
  const year = y - 4800 + Math.floor((m + 2) / 12);
  const month = ((m + 2) % 12) + 1;
  const day = d + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/** 月龄取模，保证落在 [0, SYNODIC_MONTH)。 */
export function moonAge(jd: number): number {
  const diff = jd - NEW_MOON_REF_JD;
  const cycles = ((diff % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  return cycles;
}

/** 按月龄映射八相位。边界以每个相位的中心 ±1.845 天划分（八等分朔望月）。 */
export function classifyPhase(age: number): { phase: PhaseKey; nameZh: string; nameEn: string } {
  const eighth = SYNODIC_MONTH / 8;
  // 以各相位中心为基准：新月 0、上弦 7.38、满月 14.77、下弦 22.15。
  if (age < eighth / 2 || age >= SYNODIC_MONTH - eighth / 2) {
    return { phase: 'new', nameZh: '新月', nameEn: 'New Moon' };
  }
  if (age < eighth * 1.5) {
    return { phase: 'waxing-crescent', nameZh: '蛾眉月（盈）', nameEn: 'Waxing Crescent' };
  }
  if (age < eighth * 2.5) {
    return { phase: 'first-quarter', nameZh: '上弦月', nameEn: 'First Quarter' };
  }
  if (age < eighth * 3.5) {
    return { phase: 'waxing-gibbous', nameZh: '盈凸月', nameEn: 'Waxing Gibbous' };
  }
  if (age < eighth * 4.5) {
    return { phase: 'full', nameZh: '满月', nameEn: 'Full Moon' };
  }
  if (age < eighth * 5.5) {
    return { phase: 'waning-gibbous', nameZh: '亏凸月', nameEn: 'Waning Gibbous' };
  }
  if (age < eighth * 6.5) {
    return { phase: 'last-quarter', nameZh: '下弦月', nameEn: 'Last Quarter' };
  }
  return { phase: 'waning-crescent', nameZh: '残月（亏）', nameEn: 'Waning Crescent' };
}

/** 计算指定 Julian Day 的完整月相信息。 */
export function getMoonPhase(jd: number): PhaseInfo {
  const age = moonAge(jd);
  const phaseAngle = (2 * Math.PI * age) / SYNODIC_MONTH;
  const illumination = (1 - Math.cos(phaseAngle)) / 2;
  const meta = classifyPhase(age);
  return {
    age,
    phaseAngle,
    illumination,
    phase: meta.phase,
    phaseNameZh: meta.nameZh,
    phaseNameEn: meta.nameEn,
    daysSinceNewMoon: age,
    daysUntilNewMoon: SYNODIC_MONTH - age,
  };
}

/** 便捷入口：输入 UTC Date 返回月相信息。 */
export function getMoonPhaseFromDate(date: Date): PhaseInfo {
  return getMoonPhase(dateToJulianDay(date));
}

/** 邻近朔望日期推算。 */
export function getNearestPhases(jd: number): {
  lastNewMoon: Date;
  nextNewMoon: Date;
  lastFullMoon: Date;
  nextFullMoon: Date;
} {
  const age = moonAge(jd);
  const lastNewMoonJd = jd - age;
  const nextNewMoonJd = lastNewMoonJd + SYNODIC_MONTH;
  // 满月位于相邻两次新月中点。
  const lastFullMoonJd = age >= FULL_MOON_AGE ? lastNewMoonJd + FULL_MOON_AGE : lastNewMoonJd - FULL_MOON_AGE;
  const nextFullMoonJd = lastFullMoonJd + SYNODIC_MONTH;
  return {
    lastNewMoon: julianDayToDate(lastNewMoonJd),
    nextNewMoon: julianDayToDate(nextNewMoonJd),
    lastFullMoon: julianDayToDate(lastFullMoonJd),
    nextFullMoon: julianDayToDate(nextFullMoonJd),
  };
}

/** 格式化为 YYYY-MM-DD（UTC）。 */
export function formatUTCDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 生成照亮层的 CSS clip-path（ellipse）。
 * 椭圆横向半径随月龄在 0%（新月，全暗）与 50%（满月，全亮）之间变化：
 * 盈月亮区锚定右边缘、亏月亮区锚定左边缘，半月时 rx≈50% 恰亮一半。
 * 返回可直接用于 style.clipPath 的字符串。
 */
export function moonClipPath(age: number): string {
  const t = age / SYNODIC_MONTH; // 0..1
  const waxing = t < 0.5;
  const x = waxing ? 100 : 0;
  // 盈月：rx 从 0 线性增到 50（t=0.5）；亏月：从 50 减回 0。
  const rx = waxing ? 100 * t : 100 * (1 - t);
  return `ellipse(${rx.toFixed(2)}% 50% at ${x}% 50%)`;
}
