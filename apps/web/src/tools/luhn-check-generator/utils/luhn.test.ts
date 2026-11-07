import { describe, it, expect } from "vitest";
import {
  computeCheckDigit,
  isLuhnValid,
  normalize,
  processCode,
  processLines,
} from "./luhn";

describe("computeCheckDigit", () => {
  it("matches the canonical Luhn vectors", () => {
    // ISO/IEC 7812 / 维基百科标准示例
    expect(computeCheckDigit("7992739871")).toBe("3");
    expect(computeCheckDigit("4992739871")).toBe("6");
  });

  it("round-trips: appending the check digit validates", () => {
    for (const body of [
      "411111111111111",
      "35693803564380",
      "123456789",
      "0",
      "999999",
    ]) {
      const full = body + computeCheckDigit(body);
      expect(isLuhnValid(full)).toBe(true);
    }
  });

  it("returns 0 for the empty body", () => {
    expect(computeCheckDigit("")).toBe("0");
  });
});

describe("isLuhnValid", () => {
  it("accepts well-known valid card / IMEI numbers", () => {
    expect(isLuhnValid("79927398713")).toBe(true);
    expect(isLuhnValid("4111111111111111")).toBe(true);
    expect(isLuhnValid("356938035643809")).toBe(true);
  });

  it("rejects a corrupted digit and a transposition Luhn cannot catch", () => {
    expect(isLuhnValid("79927398710")).toBe(false);
    // Luhn 的已知局限：09 与 90 换位无法检出，测试固化该行为
    expect(isLuhnValid("09")).toBe(isLuhnValid("90"));
  });

  it("returns false for non-digit input", () => {
    expect(isLuhnValid("12a3")).toBe(false);
    expect(isLuhnValid("")).toBe(false);
  });
});

describe("normalize", () => {
  it("strips spaces and hyphens but keeps digits", () => {
    expect(normalize("4111-1111 1111-1111")).toBe("4111111111111111");
  });
});

describe("processCode generate mode", () => {
  it("appends the check digit", () => {
    expect(processCode("7992739871", "generate").output).toBe("79927398713");
  });

  it("tolerates spaces and hyphens", () => {
    const result = processCode("4111 1111-1111 111", "generate");
    expect(result.output).toBe("4111111111111111");
    expect(result.error).toBeNull();
  });

  it("returns readable errors for empty and non-digit input", () => {
    expect(processCode("   ", "generate").error).toMatch(/不能为空/);
    expect(processCode("12a3", "generate").error).toMatch(/非数字字符/);
  });
});

describe("processCode validate mode", () => {
  it("accepts a valid code and echoes it cleaned", () => {
    const result = processCode("4111-1111 1111-1111", "validate");
    expect(result.valid).toBe(true);
    expect(result.output).toBe("4111111111111111");
    expect(result.checkDigit).toBe("1");
  });

  it("flags a wrong check digit and suggests the correct code", () => {
    const result = processCode("79927398710", "validate");
    expect(result.valid).toBe(false);
    expect(result.checkDigit).toBe("3");
    expect(result.output).toBe("79927398713");
    expect(result.error).toMatch(/正确校验位应为 3/);
  });

  it("handles the single-digit code 0 (its own check digit)", () => {
    const result = processCode("0", "validate");
    expect(result.valid).toBe(true);
    expect(result.output).toBe("0");
  });
});

describe("processLines", () => {
  it("generates check digits in batch and keeps blank lines", () => {
    const result = processLines("7992739871\n\n4992739871", "generate");
    expect(result.output).toBe("79927398713\n\n49927398716");
    expect(result.warnings).toEqual([]);
  });

  it("flags invalid lines with line numbers and keeps statistics in validate mode", () => {
    const result = processLines("79927398713\nabc\n79927398710", "validate");
    const lines = result.output.split("\n");
    expect(lines[0]).toBe("79927398713");
    expect(lines[1]).toBe("abc");
    expect(lines[2]).toBe("79927398713");
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toMatch(/第 2 行/);
    expect(result.warnings[1]).toMatch(/第 3 行/);
    expect(result.total).toBe(3);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(2);
  });

  it("returns empty output for empty input", () => {
    expect(processLines("", "generate").output).toBe("");
  });
});
