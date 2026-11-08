/**
 * 多时区会议规划核心（零依赖，基于浏览器原生 Intl 时区能力）
 *
 * 所有换算都以 UTC 毫秒时间戳为唯一真源，时区仅用于「展示换算」，
 * 从而自动正确处理夏令时（DST）与历史偏移。
 */

export interface TimezoneOption {
  /** IANA 时区名，如 Asia/Shanghai */
  iana: string;
  /** 展示标签 */
  label: string;
  /** 默认勾选 */
  defaultSelected?: boolean;
}

/** 常用时区（覆盖美洲 / 欧洲 / 亚洲 / 大洋洲主要协作地区） */
export const COMMON_TIMEZONES: TimezoneOption[] = [
  { iana: "America/Los_Angeles", label: "太平洋时间（洛杉矶）", defaultSelected: true },
  { iana: "America/New_York", label: "美国东部（纽约）", defaultSelected: true },
  { iana: "America/Sao_Paulo", label: "圣保罗" },
  { iana: "Europe/London", label: "伦敦" },
  { iana: "Europe/Berlin", label: "柏林 / 中欧" },
  { iana: "Africa/Cairo", label: "开罗" },
  { iana: "Asia/Dubai", label: "迪拜" },
  { iana: "Asia/Kolkata", label: "印度（加尔各答）" },
  { iana: "Asia/Shanghai", label: "北京 / 上海", defaultSelected: true },
  { iana: "Asia/Singapore", label: "新加坡" },
  { iana: "Asia/Tokyo", label: "东京" },
  { iana: "Australia/Sydney", label: "悉尼" },
  { iana: "Pacific/Auckland", label: "奥克兰" },
  { iana: "UTC", label: "UTC" },
];

const HOUR_MS = 3600_000;
const DAY_MS = 24 * HOUR_MS;

/** 取某时刻在指定 IANA 时区下的日历字段 */
function partsInZone(
  instant: number,
  timeZone: string,
): ReturnType<Intl.DateTimeFormat["formatToParts"]> {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(new Date(instant));
}

function part(
  parts: ReturnType<Intl.DateTimeFormat["formatToParts"]>,
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((p) => p.type === type)?.value ?? "";
}

export interface ZonedWallTime {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
  weekday: string; // Mon/Tue...
}

/** 把 UTC 毫秒时间戳换算为指定时区的墙上时间 */
export function toWallTime(instant: number, timeZone: string): ZonedWallTime {
  const p = partsInZone(instant, timeZone);
  // 部分环境午夜 hour 输出 "24"，归一化为 0
  const hour = Number(part(p, "hour")) % 24;
  return {
    year: Number(part(p, "year")),
    month: Number(part(p, "month")),
    day: Number(part(p, "day")),
    hour,
    minute: Number(part(p, "minute")),
    second: Number(part(p, "second")),
    weekday: part(p, "weekday"),
  };
}

/** 取某时刻相对 UTC 的偏移分钟（东八区为 +480），自动反映 DST */
export function offsetMinutes(instant: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = dtf.formatToParts(new Date(instant));
  const asUTC = Date.UTC(
    Number(part(p, "year")),
    Number(part(p, "month")) - 1,
    Number(part(p, "day")),
    Number(part(p, "hour")) % 24,
    Number(part(p, "minute")),
    Number(part(p, "second")),
  );
  return Math.round((asUTC - instant) / 60000);
}

/** 偏移分钟格式化为 GMT+08:00 / GMT-05:30 */
export function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `GMT${sign}${hh}:${mm}`;
}

/** 数字补零 */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** HH:MM 展示 */
export function formatHM(hour: number, minute = 0): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

/**
 * 找到锚定时区中，包含 instant 的那一天的 UTC 0 点（当地午夜）对应的 UTC 毫秒。
 * 用于以「锚定时区的某一天」为基准生成跨时区网格。
 */
export function anchorDayStartUtc(instant: number, anchorZone: string): number {
  const wall = toWallTime(instant, anchorZone);
  // 当地午夜的墙上时间，借助 offset 反推 UTC；用两次校准消除 DST 切换日误差
  const guess =
    Date.UTC(wall.year, wall.month - 1, wall.day, 0, 0, 0) -
    offsetMinutes(instant, anchorZone) * 60000;
  const wallGuess = toWallTime(guess, anchorZone);
  if (wallGuess.hour === 0 && wallGuess.day === wall.day) return guess;
  // DST 日回退/跳变时再按猜测点的偏移校准一次
  return (
    Date.UTC(wall.year, wall.month - 1, wall.day, 0, 0, 0) -
    offsetMinutes(guess, anchorZone) * 60000
  );
}

export interface GridCell {
  /** 该小时格子的 UTC 起始毫秒 */
  instant: number;
  /** 在该时区下的小时（0-23） */
  hour: number;
  /** 是否落在工作时间窗内 */
  working: boolean;
}

export interface DayGrid {
  /** 锚定时区当日 UTC 午夜毫秒 */
  dayStartUtc: number;
  /** 24 个小时格子 */
  cells: GridCell[];
}

/**
 * 生成锚定时区某一天、在目标时区视角下的 24 小时格子。
 * 每格为锚定时区当地的一个整点小时（UTC 上可能因 DST 并非严格 60 分钟，
 * 但以锚定时区整点切片可保证所有时区看到同一批 instant）。
 */
export function buildDayGrid(
  dayStartUtc: number,
  timeZone: string,
  workStart: number,
  workEnd: number,
): DayGrid {
  const cells: GridCell[] = [];
  for (let h = 0; h < 24; h += 1) {
    const instant = dayStartUtc + h * HOUR_MS;
    const wall = toWallTime(instant, timeZone);
    const working = isWithinWorkWindow(wall.hour, workStart, workEnd);
    cells.push({ instant, hour: wall.hour, working });
  }
  return { dayStartUtc, cells };
}

/** 判断小时是否落在 [workStart, workEnd) 工作窗内；支持跨午夜（如 22-6） */
export function isWithinWorkWindow(
  hour: number,
  workStart: number,
  workEnd: number,
): boolean {
  if (workStart === workEnd) return false;
  if (workStart < workEnd) {
    return hour >= workStart && hour < workEnd;
  }
  // 跨午夜窗口
  return hour >= workStart || hour < workEnd;
}

export interface Participant {
  id: string;
  label: string;
  timeZone: string;
  workStart: number;
  workEnd: number;
}

export interface CommonSlot {
  /** 格子对应的 UTC 起始毫秒 */
  instant: number;
  /** 各参与时区在该 instant 的墙上小时 */
  hoursByZone: Record<string, number>;
}

/**
 * 在锚定一天的 24 个整点格子中，找出所有参与时区同时处于工作窗的小时。
 * 返回按 UTC 时间排序的公共空档。
 */
export function findCommonSlots(
  dayStartUtc: number,
  participants: Participant[],
): CommonSlot[] {
  if (participants.length === 0) return [];
  const slots: CommonSlot[] = [];
  for (let h = 0; h < 24; h += 1) {
    const instant = dayStartUtc + h * HOUR_MS;
    const hoursByZone: Record<string, number> = {};
    const allWorking = participants.every((p) => {
      const wall = toWallTime(instant, p.timeZone);
      hoursByZone[p.timeZone] = wall.hour;
      return isWithinWorkWindow(wall.hour, p.workStart, p.workEnd);
    });
    if (allWorking) slots.push({ instant, hoursByZone });
  }
  return slots;
}

/** 把相邻整点公共格子合并为时间段，输出各时区的起止墙上时间 */
export interface MergedRange {
  startInstant: number;
  endInstant: number;
  /** 每个参与时区的「HH:MM – HH:MM」 */
  labelByZone: Record<string, string>;
}

export function mergeSlots(slots: CommonSlot[], participants: Participant[]): MergedRange[] {
  if (slots.length === 0) return [];
  const ranges: MergedRange[] = [];
  let start = slots[0]!.instant;
  let prev = slots[0]!.instant;
  const flush = (endInstant: number) => {
    const labelByZone: Record<string, string> = {};
    participants.forEach((p) => {
      const s = toWallTime(start, p.timeZone);
      const e = toWallTime(endInstant, p.timeZone);
      labelByZone[p.timeZone] = `${formatHM(s.hour, s.minute)} – ${formatHM(e.hour, e.minute)}`;
    });
    ranges.push({ startInstant: start, endInstant, labelByZone });
  };
  for (let i = 1; i < slots.length; i += 1) {
    const cur = slots[i]!.instant;
    if (cur - prev === HOUR_MS) {
      prev = cur;
    } else {
      flush(prev + HOUR_MS);
      start = cur;
      prev = cur;
    }
  }
  flush(prev + HOUR_MS);
  return ranges;
}

/** 生成从某 UTC 毫秒起、连续 n 天的锚定日 UTC 午夜列表 */
export function nextAnchorDays(dayStartUtc: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => dayStartUtc + i * DAY_MS);
}

/** 校验 IANA 时区名在当前运行环境是否受支持 */
export function isSupportedZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
