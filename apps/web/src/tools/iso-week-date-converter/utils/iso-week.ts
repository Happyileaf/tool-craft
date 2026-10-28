/**
 * ISO 8601 周边历与公历日期双向转换（零依赖纯函数）
 *
 * 规则（ISO 8601）：
 * - 周一为一周第一天，星期编号 1–7；
 * - 含 1 月 4 日的周为该 ISO 年的第 1 周；
 * - ISO 年可能含 52 或 53 周（长年）；
 * - 公历年初 / 年末的日期可能归属上一 / 下一 ISO 年。
 *
 * 全部运算基于公历序数日（1970-01-01 = 4），不使用 Date 的时分秒与时区，
 * 非法输入以结果对象的 error 字段返回而非抛出异常。
 */

export interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

export interface WeekDate {
  isoYear: number;
  week: number;
  weekday: number;
}

export interface WeekConversionResult {
  /** 公历日期 */
  gregorian: GregorianDate | null;
  /** ISO 周边历分量 */
  weekDate: WeekDate | null;
  /** 规范串 YYYY-Www-D，如 2026-W44-4 */
  isoString: string | null;
  /** 该 ISO 年的总周数（52 或 53） */
  weeksInYear: number | null;
  /** 跨年周边界归属提示；普通日期为 null */
  boundaryNote: string | null;
  error: string | null;
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

/** 公历日期 → 序数日（1970-01-01 为 0）；非法日期返回 null */
export function toOrdinal(date: GregorianDate): number | null {
  const { year, month, day } = date;
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    return null;
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  if (!Number.isInteger(day) || day < 1) {
    return null;
  }
  const maxDay = month === 2 && isLeapYear(year) ? 29 : (MONTH_DAYS[month - 1] ?? 31);
  if (day > maxDay) {
    return null;
  }
  let ordinal = 0;
  for (let y = 1970; y < year; y += 1) {
    ordinal += isLeapYear(y) ? 366 : 365;
  }
  for (let y = 1969; y >= year; y -= 1) {
    ordinal -= isLeapYear(y) ? 366 : 365;
  }
  for (let m = 1; m < month; m += 1) {
    ordinal += m === 2 && isLeapYear(year) ? 29 : (MONTH_DAYS[m - 1] ?? 31);
  }
  return ordinal + day - 1;
}

/** 序数日 → 公历日期 */
export function fromOrdinal(ordinal: number): GregorianDate {
  let year = 1970;
  if (ordinal >= 0) {
    for (;;) {
      const yearDays = isLeapYear(year) ? 366 : 365;
      if (ordinal < yearDays) {
        break;
      }
      ordinal -= yearDays;
      year += 1;
    }
  } else {
    while (ordinal < 0) {
      year -= 1;
      ordinal += isLeapYear(year) ? 366 : 365;
    }
  }
  let month = 1;
  let day = ordinal + 1;
  while (month <= 12) {
    const monthDays = month === 2 && isLeapYear(year) ? 29 : (MONTH_DAYS[month - 1] ?? 31);
    if (day <= monthDays) {
      break;
    }
    day -= monthDays;
    month += 1;
  }
  return { year, month, day };
}

/** 序数日的 ISO 星期（1=周一 … 7=周日）。1970-01-01 为周四（4） */
export function weekdayOfOrdinal(ordinal: number): number {
  return ((ordinal + 3) % 7 + 7) % 7 + 1;
}

/** ISO 年的总周数：53 长年（1 月 1 日为周四，或闰年且为周三），否则 52 */
export function weeksInIsoYear(isoYear: number): number {
  const jan1 = toOrdinal({ year: isoYear, month: 1, day: 1 });
  if (jan1 === null) {
    return 52;
  }
  const jan1Weekday = weekdayOfOrdinal(jan1);
  if (jan1Weekday === 4 || (isLeapYear(isoYear) && jan1Weekday === 3)) {
    return 53;
  }
  return 52;
}

/** 公历日期 → ISO 周边历分量 */
export function gregorianToWeek(date: GregorianDate): WeekDate | null {
  const ordinal = toOrdinal(date);
  if (ordinal === null) {
    return null;
  }
  const weekday = weekdayOfOrdinal(ordinal);
  // 本周四所在公历年即 ISO 周年（周一为首日，故回退 weekday-1 天，再前进 3 天）
  const thursday = fromOrdinal(ordinal - weekday + 4);
  const isoYear = thursday.year;
  // ISO 年第 1 周的周一 = 该年 1 月 4 日所在周的周一
  const jan4 = toOrdinal({ year: isoYear, month: 1, day: 4 });
  if (jan4 === null) {
    return null;
  }
  const jan4Weekday = weekdayOfOrdinal(jan4);
  const weekOneMonday = jan4 - jan4Weekday + 1;
  const week = Math.floor((ordinal - weekOneMonday) / 7) + 1;
  return { isoYear, week, weekday };
}

/** ISO 周边历分量 → 公历日期；周数 / 星期非法返回 null */
export function weekToGregorian(weekDate: WeekDate): GregorianDate | null {
  const { isoYear, week, weekday } = weekDate;
  if (!Number.isInteger(isoYear) || isoYear < 1 || isoYear > 9999) {
    return null;
  }
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
    return null;
  }
  const maxWeek = weeksInIsoYear(isoYear);
  if (!Number.isInteger(week) || week < 1 || week > maxWeek) {
    return null;
  }
  const jan4 = toOrdinal({ year: isoYear, month: 1, day: 4 });
  if (jan4 === null) {
    return null;
  }
  const jan4Weekday = weekdayOfOrdinal(jan4);
  const weekOneMonday = jan4 - jan4Weekday + 1;
  const ordinal = weekOneMonday + (week - 1) * 7 + (weekday - 1);
  return fromOrdinal(ordinal);
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function pad4(value: number): string {
  return String(value).padStart(4, '0');
}

/** 组合规范串 YYYY-Www-D */
export function formatWeekDate(weekDate: WeekDate): string {
  return `${pad4(weekDate.isoYear)}-W${pad2(weekDate.week)}-${weekDate.weekday}`;
}

const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function weekdayName(weekday: number): string {
  return WEEKDAY_NAMES[weekday - 1] ?? '';
}

const GREGORIAN_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEK_RE = /^(\d{4})-W(\d{2})-([1-7])$/i;

/** 公历 YYYY-MM-DD → 完整转换结果 */
export function convertGregorian(input: string): WeekConversionResult {
  const trimmed = input.trim();
  const match = GREGORIAN_RE.exec(trimmed);
  if (!match) {
    return {
      gregorian: null,
      weekDate: null,
      isoString: null,
      weeksInYear: null,
      boundaryNote: null,
      error: '公历日期格式应为 YYYY-MM-DD，例如 2026-10-29',
    };
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ordinal = toOrdinal({ year, month, day });
  if (ordinal === null) {
    return {
      gregorian: null,
      weekDate: null,
      isoString: null,
      weeksInYear: null,
      boundaryNote: null,
      error: `非法公历日期：${trimmed}（请检查年月日是否存在，如 2 月 30 日）`,
    };
  }
  const weekDate = gregorianToWeek({ year, month, day });
  if (!weekDate) {
    return {
      gregorian: null,
      weekDate: null,
      isoString: null,
      weeksInYear: null,
      boundaryNote: null,
      error: '日期超出可计算范围（支持 0001–9999 年）',
    };
  }
  const weeksInYear = weeksInIsoYear(weekDate.isoYear);
  let boundaryNote: string | null = null;
  if (weekDate.isoYear !== year) {
    boundaryNote =
      weekDate.isoYear > year
        ? `跨年周边界：该公历日位于公历年 ${year} 年末，但 ISO 周边历归属下一 ISO 年 ${weekDate.isoYear} 年`
        : `跨年周边界：该公历日位于公历年 ${year} 年初，但 ISO 周边历归属上一 ISO 年 ${weekDate.isoYear} 年`;
  }
  return {
    gregorian: { year, month, day },
    weekDate,
    isoString: formatWeekDate(weekDate),
    weeksInYear,
    boundaryNote,
    error: null,
  };
}

/** ISO 周边历 YYYY-Www-D → 完整转换结果 */
export function convertWeekDate(input: string): WeekConversionResult {
  const trimmed = input.trim();
  const match = WEEK_RE.exec(trimmed);
  if (!match) {
    return {
      gregorian: null,
      weekDate: null,
      isoString: null,
      weeksInYear: null,
      boundaryNote: null,
      error: 'ISO 周边历格式应为 YYYY-Www-D，例如 2026-W44-4（星期 1–7，周一为 1）',
    };
  }
  const isoYear = Number(match[1]);
  const week = Number(match[2]);
  const weekday = Number(match[3]);
  const maxWeek = weeksInIsoYear(isoYear);
  if (week > maxWeek) {
    return {
      gregorian: null,
      weekDate: null,
      isoString: null,
      weeksInYear: maxWeek,
      boundaryNote: null,
      error: `${isoYear} ISO 年只有 ${maxWeek} 周，不存在 W${pad2(week)}`,
    };
  }
  const gregorian = weekToGregorian({ isoYear, week, weekday });
  if (!gregorian) {
    return {
      gregorian: null,
      weekDate: null,
      isoString: null,
      weeksInYear: maxWeek,
      boundaryNote: null,
      error: `非法 ISO 周边历：${trimmed}`,
    };
  }
  let boundaryNote: string | null = null;
  if (gregorian.year !== isoYear) {
    boundaryNote =
      gregorian.year > isoYear
        ? `跨年周边界：该 ISO 周边历日落入下一公历年 ${gregorian.year} 年`
        : `跨年周边界：该 ISO 周边历日落入上一公历年 ${gregorian.year} 年`;
  }
  return {
    gregorian,
    weekDate: { isoYear, week, weekday },
    isoString: formatWeekDate({ isoYear, week, weekday }),
    weeksInYear: maxWeek,
    boundaryNote,
    error: null,
  };
}

/** 自动识别每行格式并转换，返回可读文本块 */
export function processLines(input: string): { output: string; warnings: string[] } {
  const lines = input.split('\n');
  const outputBlocks: string[] = [];
  const warnings: string[] = [];
  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === '') {
      outputBlocks.push('');
      return;
    }
    const isWeek = /^\d{4}-W/i.test(line);
    const result = isWeek ? convertWeekDate(line) : convertGregorian(line);
    if (result.error || !result.gregorian || !result.weekDate) {
      outputBlocks.push(`${line}\n  错误：${result.error ?? '无法解析'}`);
      warnings.push(`第 ${index + 1} 行：${result.error ?? '无法解析'}`);
      return;
    }
    const g = result.gregorian;
    const w = result.weekDate;
    const gregorianText = `${pad4(g.year)}-${pad2(g.month)}-${pad2(g.day)}（${weekdayName(w.weekday)}）`;
    const rows = [
      line,
      `  公历：${gregorianText}`,
      `  ISO 周边历：${result.isoString}（${weekdayName(w.weekday)}）`,
      `  ISO 周年：${w.isoYear}，第 ${pad2(w.week)} 周（该 ISO 年共 ${result.weeksInYear} 周）`,
    ];
    if (result.boundaryNote) {
      rows.push(`  提示：${result.boundaryNote}`);
    }
    outputBlocks.push(rows.join('\n'));
  });
  return { output: outputBlocks.join('\n'), warnings };
}
