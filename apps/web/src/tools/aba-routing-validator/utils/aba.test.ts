import { describe, it, expect } from "vitest";
import {
  describeRoutingPrefix,
  isValidRoutingPrefix,
  rtnWeightedSum,
  validateAbaBatch,
  validateAbaRtn,
} from "./aba";

describe("validateAbaRtn 公开标准向量", () => {
  it("真实路由号码全部通过（3/7/1 加权和为 10 的倍数）", () => {
    const validCodes = [
      "021000021", // JPMorgan Chase, NY
      "026009593", // Bank of America
      "011401533",
      "111000025",
      "071000301", // 芝加哥联储
      "121000358", // 美西
      "051000017", // PNC
    ];
    for (const code of validCodes) {
      const r = validateAbaRtn(code);
      expect(r.valid, `${code} 应合法：${r.reason ?? ""}`).toBe(true);
    }
  });

  it("021000021 加权和为 30", () => {
    expect(rtnWeightedSum("021000021")).toBe(30);
  });

  it("字段拆解：联邦符号 / 机构号 / 校验位", () => {
    const r = validateAbaRtn("021000021");
    expect(r.frbDistrict).toBe("02");
    expect(r.federalRoutingSymbol).toBe("0210");
    expect(r.institutionId).toBe("0002");
    expect(r.checkDigit).toBe("1");
  });
});

describe("输入规范化", () => {
  it("空格与短横线分隔形式通过", () => {
    expect(validateAbaRtn("0210-0002-1").valid).toBe(true);
    expect(validateAbaRtn(" 0210 0002 1 ").valid).toBe(true);
  });
});

describe("非法输入", () => {
  it("空串提示输入", () => {
    const r = validateAbaRtn("   ");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/9 位/);
  });

  it("含非数字字符被拒", () => {
    const r = validateAbaRtn("02100002A");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/数字/);
  });

  it("长度不是 9 位被拒", () => {
    expect(validateAbaRtn("02100002").reason).toMatch(/8 位/);
    expect(validateAbaRtn("0210000210").reason).toMatch(/10 位/);
  });

  it("末位改错触发校验位不符（前缀合法）", () => {
    const r = validateAbaRtn("021000022");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/校验位/);
  });

  it("前两位 99 不在合法范围", () => {
    const r = validateAbaRtn("991000021");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/合法范围/);
  });

  it("前两位 00 不在合法范围", () => {
    expect(validateAbaRtn("000000000").reason).toMatch(/合法范围/);
  });
});

describe("前缀范围与含义", () => {
  it("isValidRoutingPrefix 合法区间 01–12 / 21–32 / 61–72 / 80", () => {
    expect(isValidRoutingPrefix(1)).toBe(true);
    expect(isValidRoutingPrefix(12)).toBe(true);
    expect(isValidRoutingPrefix(21)).toBe(true);
    expect(isValidRoutingPrefix(32)).toBe(true);
    expect(isValidRoutingPrefix(61)).toBe(true);
    expect(isValidRoutingPrefix(72)).toBe(true);
    expect(isValidRoutingPrefix(80)).toBe(true);
    expect(isValidRoutingPrefix(13)).toBe(false);
    expect(isValidRoutingPrefix(20)).toBe(false);
    expect(isValidRoutingPrefix(33)).toBe(false);
    expect(isValidRoutingPrefix(60)).toBe(false);
    expect(isValidRoutingPrefix(73)).toBe(false);
    expect(isValidRoutingPrefix(79)).toBe(false);
    expect(isValidRoutingPrefix(81)).toBe(false);
  });

  it("describeRoutingPrefix：联储区 / 储蓄机构 / 电子交易 / 旅客支票", () => {
    expect(describeRoutingPrefix(2)).toMatch(/纽约/);
    expect(describeRoutingPrefix(12)).toMatch(/旧金山/);
    expect(describeRoutingPrefix(21)).toMatch(/储蓄/);
    expect(describeRoutingPrefix(61)).toMatch(/电子/);
    expect(describeRoutingPrefix(80)).toMatch(/旅客支票/);
    expect(describeRoutingPrefix(99)).toBeNull();
  });
});

describe("validateAbaBatch 批量校验", () => {
  it("逐行给出结论，空行跳过，行号正确", () => {
    const text = "021000021\n\n021000022\n  \n991000021";
    const lines = validateAbaBatch(text);
    expect(lines).toHaveLength(3);
    expect(lines[0]!.line).toBe(1);
    expect(lines[0]!.valid).toBe(true);
    expect(lines[1]!.line).toBe(3);
    expect(lines[1]!.valid).toBe(false);
    expect(lines[1]!.reason).toMatch(/校验位/);
    expect(lines[2]!.line).toBe(5);
    expect(lines[2]!.reason).toMatch(/合法范围/);
  });

  it("空文本返回空数组", () => {
    expect(validateAbaBatch("\n  \n")).toEqual([]);
  });
});
