import { describe, it, expect } from "vitest";
import {
  decodeSmdCode,
  encodeSmdCode,
  formatOhms,
  EIA96_MANTISSAS,
  EIA96_MULTIPLIER_LETTERS,
} from "./smd";

describe("SMD 3 位数字码（E24 ±5%）", () => {
  it("472 -> 4.7 kΩ", () => {
    const r = decodeSmdCode("472");
    expect(r.ok).toBe(true);
    expect(r.ohms).toBe(4700);
    expect(r.kind).toBe("three-digit");
    expect(r.tolerance).toBe("±5%");
  });

  it("103 -> 10 kΩ", () => {
    expect(decodeSmdCode("103").ohms).toBe(10000);
  });

  it("100 -> 10 Ω（乘数 0 次幂）", () => {
    expect(decodeSmdCode("100").ohms).toBe(10);
  });

  it('小写与空格自动规范化：" 472 " -> 4700 Ω', () => {
    expect(decodeSmdCode(" 472 ").ohms).toBe(4700);
  });

  it("000 为零欧姆跳线", () => {
    const r = decodeSmdCode("000");
    expect(r.ok).toBe(true);
    expect(r.ohms).toBe(0);
    expect(r.kind).toBe("zero-ohm");
  });
});

describe("SMD 4 位数字码（±1%）", () => {
  it("4701 -> 4700 Ω", () => {
    const r = decodeSmdCode("4701");
    expect(r.ohms).toBe(4700);
    expect(r.kind).toBe("four-digit");
    expect(r.tolerance).toBe("±1%");
  });

  it("1001 -> 1000 Ω", () => {
    expect(decodeSmdCode("1001").ohms).toBe(1000);
  });

  it("0000 为零欧姆跳线", () => {
    expect(decodeSmdCode("0000").ohms).toBe(0);
  });
});

describe("R / 小数点位置码", () => {
  it("R10 -> 0.1 Ω ±5%", () => {
    const r = decodeSmdCode("R10");
    expect(r.ohms).toBeCloseTo(0.1, 10);
    expect(r.kind).toBe("three-digit");
  });

  it("1R0 -> 1 Ω ±5%", () => {
    expect(decodeSmdCode("1R0").ohms).toBe(1);
  });

  it("10R0 -> 10 Ω ±1%（4 位体系）", () => {
    const r = decodeSmdCode("10R0");
    expect(r.ohms).toBe(10);
    expect(r.kind).toBe("four-digit");
    expect(r.tolerance).toBe("±1%");
  });

  it("0R01 -> 0.01 Ω", () => {
    expect(decodeSmdCode("0R01").ohms).toBeCloseTo(0.01, 10);
  });
});

describe("EIA-96 字母码（±1%）", () => {
  it("01A -> 100 Ω", () => {
    const r = decodeSmdCode("01A");
    expect(r.ohms).toBe(100);
    expect(r.kind).toBe("eia96");
    expect(r.tolerance).toBe("±1%");
  });

  it("47A -> 301 Ω（E96 基数表）", () => {
    expect(decodeSmdCode("47A").ohms).toBe(301);
  });

  it("01B -> 1 kΩ，01C -> 10 kΩ", () => {
    expect(decodeSmdCode("01B").ohms).toBe(1000);
    expect(decodeSmdCode("01C").ohms).toBe(10000);
  });

  it("01X -> 10 Ω，01Y -> 1 Ω", () => {
    expect(decodeSmdCode("01X").ohms).toBe(10);
    expect(decodeSmdCode("01Y").ohms).toBeCloseTo(1, 10);
  });

  it("96Z -> 97.6 GΩ", () => {
    expect(decodeSmdCode("96Z").ohms).toBe(976 * 10 ** 8);
  });

  it("小写 eia-96 输入自动转大写：47a -> 301 Ω", () => {
    expect(decodeSmdCode("47a").ohms).toBe(301);
  });
});

describe("非法输入", () => {
  it("空串给出原因", () => {
    expect(decodeSmdCode("").ok).toBe(false);
    expect(decodeSmdCode("").reason).toBeTruthy();
  });

  it("含非字母数字字符被拒", () => {
    expect(decodeSmdCode("47-2").reason).toMatch(/非法字符/);
  });

  it("EIA-96 序号 00 越界被拒", () => {
    expect(decodeSmdCode("00A").reason).toMatch(/01-96/);
  });

  it("EIA-96 不使用 I、O 乘数字母", () => {
    expect(decodeSmdCode("10I").reason).toMatch(/不使用字母 I/);
    expect(decodeSmdCode("10O").reason).toMatch(/不使用字母 O/);
  });

  it("3 位码前两位为 00 被拒", () => {
    expect(decodeSmdCode("002").reason).toMatch(/有效数字/);
  });
});

describe("formatOhms 格式化", () => {
  it("常用量级词头", () => {
    expect(formatOhms(0)).toContain("0 Ω");
    expect(formatOhms(301)).toBe("301 Ω");
    expect(formatOhms(4700)).toBe("4.7 kΩ");
    expect(formatOhms(2_200_000)).toBe("2.2 MΩ");
    expect(formatOhms(0.1)).toBe("100 mΩ");
  });
});

describe("encodeSmdCode 阻值 -> 印字码", () => {
  it("4700 Ω 的 3 位码候选为 472（零偏差）", () => {
    const candidates = encodeSmdCode(4700);
    const three = candidates.find((c) => c.kind === "three-digit");
    expect(three).toBeDefined();
    expect(three!.code).toBe("472");
    expect(three!.deviationPct).toBe(0);
  });

  it("301 Ω 的 EIA-96 候选为 47A（零偏差）", () => {
    const candidates = encodeSmdCode(301);
    const eia = candidates.find((c) => c.kind === "eia96");
    expect(eia).toBeDefined();
    expect(eia!.code).toBe("47A");
    expect(eia!.deviationPct).toBe(0);
  });

  it("1500 Ω 的 4 位码候选为 1501（零偏差）", () => {
    const candidates = encodeSmdCode(1500);
    const four = candidates.find((c) => c.kind === "four-digit");
    expect(four).toBeDefined();
    expect(four!.code).toBe("1501");
    expect(four!.deviationPct).toBe(0);
  });

  it("候选按偏差升序，且每体系至多一条", () => {
    const candidates = encodeSmdCode(333);
    expect(candidates.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < candidates.length; i += 1) {
      expect(candidates[i]!.deviationPct).toBeGreaterThanOrEqual(
        candidates[i - 1]!.deviationPct,
      );
    }
    const kinds = candidates.map((c) => c.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it("非正数返回空数组", () => {
    expect(encodeSmdCode(0)).toEqual([]);
    expect(encodeSmdCode(-10)).toEqual([]);
    expect(encodeSmdCode(Number.NaN)).toEqual([]);
  });
});

describe("EIA-96 常量表完整性", () => {
  it("共 96 个基数且单调递增", () => {
    expect(EIA96_MANTISSAS).toHaveLength(96);
    for (let i = 1; i < EIA96_MANTISSAS.length; i += 1) {
      expect(EIA96_MANTISSAS[i]!).toBeGreaterThan(EIA96_MANTISSAS[i - 1]!);
    }
  });

  it("乘数字母幂次覆盖 Y(-2) 到 Z(8)", () => {
    expect(EIA96_MULTIPLIER_LETTERS.Y).toBe(-2);
    expect(EIA96_MULTIPLIER_LETTERS.A).toBe(0);
    expect(EIA96_MULTIPLIER_LETTERS.Z).toBe(8);
  });
});
