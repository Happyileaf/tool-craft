import { COMMON_TIMEZONES } from "./utils/tz";

export { COMMON_TIMEZONES };

export const DEFAULT_WORK_START = 9;
export const DEFAULT_WORK_END = 18;
export const DAY_COUNT = 7;

export const WEEKDAY_ZH: Record<string, string> = {
  Mon: "周一",
  Tue: "周二",
  Wed: "周三",
  Thu: "周四",
  Fri: "周五",
  Sat: "周六",
  Sun: "周日",
};

/** 网格配色（仅工作/非工作两态，保持低饱和） */
export const CELL_WORK = "#d6f2e0";
export const CELL_REST = "#f5f5f5";
export const CELL_MATCH = "#1677ff";
