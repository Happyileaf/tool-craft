import { describe, it, expect } from "vitest";
import {
  COMMON_TIMEZONES,
  toWallTime,
  offsetMinutes,
  formatOffset,
  formatHM,
  isWithinWorkWindow,
  anchorDayStartUtc,
  buildDayGrid,
  findCommonSlots,
  mergeSlots,
  isSupportedZone,
  type Participant,
} from "./tz";

// 固定锚点：2026-11-09T12:00:00Z（北半球冬令时，南半球夏令时，偏移稳定）
const ANCHOR = Date.UTC(2026, 10, 9, 12, 0, 0);

describe("toWallTime and offsets", () => {
  it("converts UTC instant to Shanghai wall time (UTC+8, no DST)", () => {
    const wall = toWallTime(ANCHOR, "Asia/Shanghai");
    expect(wall.hour).toBe(20);
    expect(wall.minute).toBe(0);
    expect(wall.day).toBe(9);
    expect(offsetMinutes(ANCHOR, "Asia/Shanghai")).toBe(480);
  });

  it("converts to New York standard time (UTC-5 in November)", () => {
    const wall = toWallTime(ANCHOR, "America/New_York");
    expect(wall.hour).toBe(7);
    expect(offsetMinutes(ANCHOR, "America/New_York")).toBe(-300);
  });

  it("reports UTC as zero offset", () => {
    expect(offsetMinutes(ANCHOR, "UTC")).toBe(0);
    expect(toWallTime(ANCHOR, "UTC").hour).toBe(12);
  });

  it("formats signed and half-hour offsets", () => {
    expect(formatOffset(480)).toBe("GMT+08:00");
    expect(formatOffset(-330)).toBe("GMT-05:30");
    expect(formatOffset(0)).toBe("GMT+00:00");
    expect(formatHM(9, 5)).toBe("09:05");
  });
});

describe("DST handling", () => {
  it("New York observes -4 in July (EDT) and -5 in November (EST)", () => {
    const july = Date.UTC(2026, 6, 15, 12, 0, 0);
    expect(offsetMinutes(july, "America/New_York")).toBe(-240);
    expect(offsetMinutes(ANCHOR, "America/New_York")).toBe(-300);
  });

  it("Sydney is +11 in November (AEDT) vs +10 in July (AEST)", () => {
    const july = Date.UTC(2026, 6, 15, 12, 0, 0);
    expect(offsetMinutes(ANCHOR, "Australia/Sydney")).toBe(660);
    expect(offsetMinutes(july, "Australia/Sydney")).toBe(600);
  });
});

describe("work window", () => {
  it("handles ordinary windows", () => {
    expect(isWithinWorkWindow(8, 9, 18)).toBe(false);
    expect(isWithinWorkWindow(9, 9, 18)).toBe(true);
    expect(isWithinWorkWindow(17, 9, 18)).toBe(true);
    expect(isWithinWorkWindow(18, 9, 18)).toBe(false);
  });

  it("handles overnight windows", () => {
    expect(isWithinWorkWindow(23, 22, 6)).toBe(true);
    expect(isWithinWorkWindow(3, 22, 6)).toBe(true);
    expect(isWithinWorkWindow(12, 22, 6)).toBe(false);
  });

  it("treats equal bounds as never working", () => {
    expect(isWithinWorkWindow(10, 9, 9)).toBe(false);
  });
});

describe("anchor day and grid", () => {
  it("anchorDayStartUtc maps to local midnight in the anchor zone", () => {
    const start = anchorDayStartUtc(ANCHOR, "Asia/Shanghai");
    const wall = toWallTime(start, "Asia/Shanghai");
    expect([wall.hour, wall.minute]).toEqual([0, 0]);
    expect(wall.day).toBe(9);
    // 上海 11/9 00:00 = UTC 11/8 16:00
    expect(start).toBe(Date.UTC(2026, 10, 8, 16, 0, 0));
  });

  it("grid has 24 cells and marks working hours in target zone", () => {
    const start = anchorDayStartUtc(ANCHOR, "Asia/Shanghai");
    const grid = buildDayGrid(start, "America/New_York", 9, 18);
    expect(grid.cells).toHaveLength(24);
    // 上海日 UTC 16:00 = 纽约 11:00（EST），首格应在工作窗内
    expect(grid.cells[0]!.working).toBe(true);
    expect(grid.cells[0]!.hour).toBe(11);
  });
});

describe("common slots", () => {
  const participants: Participant[] = [
    { id: "cn", label: "北京", timeZone: "Asia/Shanghai", workStart: 9, workEnd: 18 },
    { id: "ny", label: "纽约", timeZone: "America/New_York", workStart: 9, workEnd: 18 },
  ];

  it("finds the overlapping evening-Beijing / morning-NewYork window", () => {
    const start = anchorDayStartUtc(ANCHOR, "Asia/Shanghai");
    const slots = findCommonSlots(start, participants);
    // 北京 9-18 与纽约 9-18（EST, -5）在上海日的交集：
    // 纽约 9:00 = UTC 14:00 = 北京 22:00 不在北京窗；反向：北京 18:00 截止，
    // 纽约 9:00 起 → 交集应为空（13 小时时差 > 9 小时工作窗）
    expect(slots).toHaveLength(0);
  });

  it("returns slots when work windows are wide enough to overlap", () => {
    const wide: Participant[] = [
      { id: "cn", label: "北京", timeZone: "Asia/Shanghai", workStart: 7, workEnd: 23 },
      { id: "ny", label: "纽约", timeZone: "America/New_York", workStart: 7, workEnd: 20 },
    ];
    const start = anchorDayStartUtc(ANCHOR, "Asia/Shanghai");
    const slots = findCommonSlots(start, wide);
    expect(slots.length).toBeGreaterThan(0);
    // 北京 21:00（UTC 13:00）= 纽约 8:00，两者都在窗内
    const utc13 = start + 21 * 3600_000;
    expect(slots.some((s) => s.instant === utc13)).toBe(true);
  });

  it("merges adjacent hourly slots into ranges with per-zone labels", () => {
    const start = anchorDayStartUtc(ANCHOR, "Asia/Shanghai");
    const wide: Participant[] = [
      { id: "cn", label: "北京", timeZone: "Asia/Shanghai", workStart: 7, workEnd: 23 },
      { id: "ny", label: "纽约", timeZone: "America/New_York", workStart: 7, workEnd: 20 },
    ];
    const ranges = mergeSlots(findCommonSlots(start, wide), wide);
    expect(ranges.length).toBeGreaterThan(0);
    const first = ranges[0]!;
    expect(first.labelByZone["Asia/Shanghai"]).toMatch(/\d{2}:\d{2} – \d{2}:\d{2}/);
    expect(first.endInstant - first.startInstant).toBeGreaterThanOrEqual(3600_000);
  });

  it("returns no slots for empty participant list", () => {
    expect(findCommonSlots(ANCHOR, [])).toEqual([]);
    expect(mergeSlots([], [])).toEqual([]);
  });
});

describe("timezone support", () => {
  it("accepts IANA zones and rejects garbage", () => {
    expect(isSupportedZone("Asia/Shanghai")).toBe(true);
    expect(isSupportedZone("Not/AZone")).toBe(false);
  });

  it("ships a non-empty common timezone list with unique IANA names", () => {
    expect(COMMON_TIMEZONES.length).toBeGreaterThan(10);
    const names = COMMON_TIMEZONES.map((t) => t.iana);
    expect(new Set(names).size).toBe(names.length);
    names.forEach((n) => expect(isSupportedZone(n)).toBe(true));
  });
});
