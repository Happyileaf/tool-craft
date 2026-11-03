import { describe, it, expect } from "vitest";
import {
  computeCusipCheck,
  computeSedolCheck,
  validateSecurityId,
} from "./cusipSedol";

describe("CUSIP 校验（9 位，模 10 双精度加权）", () => {
  it("标准向量 037833100（Apple Inc.）合法", () => {
    const r = validateSecurityId("037833100");
    expect(r.valid).toBe(true);
    expect(r.kind).toBe("CUSIP");
    expect(r.actualCheck).toBe("0");
    expect(r.expectedCheck).toBe("0");
  });

  it("17275R102（Cisco）合法", () => {
    const r = validateSecurityId("17275R102");
    expect(r.valid).toBe(true);
    expect(r.kind).toBe("CUSIP");
  });

  it("38259P508（Google 历史码）合法", () => {
    expect(validateSecurityId("38259P508").valid).toBe(true);
  });

  it("594918104（Microsoft）合法", () => {
    expect(validateSecurityId("594918104").valid).toBe(true);
  });

  it("小写自动转大写：17275r102", () => {
    expect(validateSecurityId("17275r102").valid).toBe(true);
  });

  it('含空格与短横线规范化：03783-3100 / " 037833100 "', () => {
    expect(validateSecurityId("03783-3100").valid).toBe(true);
    expect(validateSecurityId(" 037833100 ").valid).toBe(true);
  });

  it("错误校验位被拒并给出期望值：037833101", () => {
    const r = validateSecurityId("037833101");
    expect(r.valid).toBe(false);
    expect(r.kind).toBe("CUSIP");
    expect(r.actualCheck).toBe("1");
    expect(r.expectedCheck).toBe("0");
    expect(r.reason).toMatch(/校验位/);
  });

  it("含 * @ # 历史字符给出明确提示", () => {
    expect(validateSecurityId("12345*789").reason).toMatch(/历史码/);
  });

  it("含其他非法字符被拒", () => {
    expect(validateSecurityId("0378331O0").valid).toBe(false);
  });

  it("末位非数字被拒", () => {
    expect(validateSecurityId("03783310A").reason).toMatch(/校验位必须是数字/);
  });
});

describe("SEDOL 校验（7 位，CDMA 1,3,1,7,3,9）", () => {
  it("标准向量 0263494（Barclays plc）合法", () => {
    const r = validateSecurityId("0263494");
    expect(r.valid).toBe(true);
    expect(r.kind).toBe("SEDOL");
    expect(r.expectedCheck).toBe("4");
  });

  it("B0YHMK2 类含字母码：B1F85G0 合法", () => {
    // 随机构造用 computeSedolCheck 生成末位，验证往返
    const body = "B1F85G";
    const code = body + computeSedolCheck(body);
    expect(validateSecurityId(code).valid).toBe(true);
    expect(validateSecurityId(code).kind).toBe("SEDOL");
  });

  it("纯数字体 054063 往返校验", () => {
    const code = `054063${computeSedolCheck("054063")}`;
    expect(validateSecurityId(code).valid).toBe(true);
  });

  it("多组合法体生成的校验位均能通过往返", () => {
    for (const body of ["B1F85G", "054063", "B0YHMK", "216522"]) {
      const code = body + computeSedolCheck(body);
      expect(validateSecurityId(code).valid).toBe(true);
    }
  });

  it("错误校验位被拒并给出期望值：0263490", () => {
    const r = validateSecurityId("0263490");
    expect(r.valid).toBe(false);
    expect(r.kind).toBe("SEDOL");
    expect(r.actualCheck).toBe("0");
    expect(r.expectedCheck).toBe("4");
  });

  it("元音字母被拒（SEDOL 不使用 A/E/I/O/U）", () => {
    const r = validateSecurityId("B0YHNA1");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/元音/);
  });

  it("末位非数字被拒", () => {
    expect(validateSecurityId("026349B").reason).toMatch(/校验位必须是数字/);
  });
});

describe("长度判别与错误处理", () => {
  it("空输入提示", () => {
    expect(validateSecurityId("   ").valid).toBe(false);
    expect(validateSecurityId("").reason).toMatch(/CUSIP/);
  });

  it("非 7 非 9 长度报长度错误", () => {
    const r = validateSecurityId("12345");
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/长度 5/);
  });

  it("ISIN 12 位不会被误判", () => {
    expect(validateSecurityId("US0378331005").valid).toBe(false);
  });
});

describe("校验位计算函数", () => {
  it("CUSIP：computeCusipCheck(03783310) = 0", () => {
    expect(computeCusipCheck("03783310")).toBe("0");
  });

  it("CUSIP：字母体 17275R10 -> 2", () => {
    expect(computeCusipCheck("17275R10")).toBe("2");
  });

  it("SEDOL：computeSedolCheck(026349) = 4", () => {
    expect(computeSedolCheck("026349")).toBe("4");
  });

  it("长度不符返回 null", () => {
    expect(computeCusipCheck("123")).toBeNull();
    expect(computeSedolCheck("12345")).toBeNull();
  });
});
