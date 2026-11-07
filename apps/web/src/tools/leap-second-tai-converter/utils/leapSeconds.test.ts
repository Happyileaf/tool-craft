import { describe, it, expect } from "vitest";
import {
  LEAP_SECONDS,
  LATEST_OFFSET,
  TABLE_START_UNIX,
  taiOffsetAt,
  unixToTai,
  taiToUnix,
  isLeapSecondDay,
  convertFromUnix,
  convertFromTai,
  formatUtc,
} from "./leapSeconds";

describe("leap second table integrity", () => {
  it("starts at 1972-01-01 with offset 10 and ends at 37", () => {
    expect(LEAP_SECONDS[0]).toMatchObject({
      at: 63072000,
      offset: 10,
      date: "1972-01-01",
    });
    expect(LATEST_OFFSET).toBe(37);
    expect(LEAP_SECONDS[LEAP_SECONDS.length - 1]).toMatchObject({
      at: 1483228800,
      offset: 37,
      date: "2017-01-01",
    });
  });

  it("is sorted by time and each entry increments the offset by one", () => {
    for (let i = 1; i < LEAP_SECONDS.length; i += 1) {
      expect(LEAP_SECONDS[i]!.at).toBeGreaterThan(LEAP_SECONDS[i - 1]!.at);
      expect(LEAP_SECONDS[i]!.offset).toBe(LEAP_SECONDS[i - 1]!.offset + 1);
    }
  });

  it("contains the 1972 baseline plus 27 positive leap seconds (28 rows)", () => {
    expect(LEAP_SECONDS).toHaveLength(28);
  });
});

describe("taiOffsetAt", () => {
  it("returns null before the table coverage starts", () => {
    expect(taiOffsetAt(TABLE_START_UNIX - 1)).toBeNull();
    expect(taiOffsetAt(0)).toBeNull();
  });

  it("returns 10 at the 1972 boundary and 37 after the last leap second", () => {
    expect(taiOffsetAt(63072000)).toBe(10);
    expect(taiOffsetAt(1483228799)).toBe(36);
    expect(taiOffsetAt(1483228800)).toBe(37);
    expect(taiOffsetAt(2000000000)).toBe(37);
  });

  it("switches offset exactly on a leap second day", () => {
    // 2015-07-01 00:00:00 UTC 起偏移 36
    expect(taiOffsetAt(1435708799)).toBe(35);
    expect(taiOffsetAt(1435708800)).toBe(36);
  });
});

describe("unix <-> tai round trip", () => {
  it("applies the documented TAI-UTC offsets at fixed vectors", () => {
    // 1972-01-01T00:00:00Z：unix 63072000，TAI = 63072010
    expect(unixToTai(63072000)).toBe(63072010);
    // 2017-01-01T00:00:00Z：unix 1483228800，TAI = 1483228837
    expect(unixToTai(1483228800)).toBe(1483228837);
    // 1999 年偏移 32
    expect(unixToTai(915148800)).toBe(915148832);
  });

  it("round-trips arbitrary in-range timestamps", () => {
    for (const unix of [
      63072000, 100000000, 78796800, 1435708800, 1893456000,
    ]) {
      const tai = unixToTai(unix);
      expect(tai).not.toBeNull();
      expect(taiToUnix(tai!)).toBe(unix);
    }
  });

  it("rejects pre-1972 inputs in both directions", () => {
    expect(unixToTai(0)).toBeNull();
    expect(taiToUnix(0)).toBeNull();
  });
});

describe("isLeapSecondDay", () => {
  it("identifies a leap second day and ordinary days", () => {
    // 2016-12-31T12:00:00Z 落在 2017-01-01 闰秒生效日
    expect(isLeapSecondDay(1483228800 - 43200)?.offset).toBe(37);
    expect(isLeapSecondDay(1000000000)).toBeNull();
  });
});

describe("formatUtc", () => {
  it("formats an epoch instant as a UTC zh-CN string", () => {
    expect(formatUtc(0)).toMatch(/1970-01-01/);
    expect(formatUtc(1483228800)).toMatch(/2017-01-01/);
  });
});

describe("convertFromUnix", () => {
  it("converts a valid timestamp and reports the offset", () => {
    const result = convertFromUnix("1483228800");
    expect(result.error).toBeNull();
    expect(result.tai).toBe(1483228837);
    expect(result.offset).toBe(37);
    expect(result.utcText).toMatch(/2017-01-01/);
    expect(result.leapDay?.date).toBe("2017-01-01");
  });

  it("supports fractional seconds", () => {
    const result = convertFromUnix("1483228800.5");
    expect(result.error).toBeNull();
    expect(result.tai).toBeCloseTo(1483228837.5, 6);
  });

  it("returns readable errors for empty, non-numeric and pre-1972 input", () => {
    expect(convertFromUnix("   ").error).toMatch(/不能为空/);
    expect(convertFromUnix("abc").error).toMatch(/数字/);
    expect(convertFromUnix("0").error).toMatch(/1972/);
  });
});

describe("convertFromTai", () => {
  it("converts a TAI timestamp back to Unix and UTC", () => {
    const result = convertFromTai("1483228837");
    expect(result.error).toBeNull();
    expect(result.unix).toBe(1483228800);
    expect(result.offset).toBe(37);
  });

  it("returns readable errors for empty and out-of-range input", () => {
    expect(convertFromTai("").error).toMatch(/不能为空/);
    expect(convertFromTai("nope").error).toMatch(/数字/);
    expect(convertFromTai("0").error).toMatch(/1972/);
  });
});
