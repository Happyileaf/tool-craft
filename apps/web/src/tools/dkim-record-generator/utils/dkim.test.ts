import { describe, it, expect } from "vitest";
import {
  extractBase64,
  generateDkimRecord,
  isSafeTagValue,
  splitTxtChunks,
  type DkimInput,
} from "./dkim";

// 140 字节解码长度的合法 Base64（4 的倍数），仅做语法/长度测试，非真实密钥
const SAMPLE_KEY =
  "BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=";

const baseInput: DkimInput = {
  selector: "s1",
  domain: "example.com",
  keyType: "rsa",
  publicKey: `-----BEGIN PUBLIC KEY-----\n${SAMPLE_KEY}\n-----END PUBLIC KEY-----`,
  granularity: "",
  testing: false,
  subdomainStrict: false,
  note: "",
};

describe("extractBase64", () => {
  it("strips PEM headers and whitespace", () => {
    expect(extractBase64(baseInput.publicKey)).toBe(SAMPLE_KEY);
    expect(extractBase64(`  ${SAMPLE_KEY}  `)).toBe(SAMPLE_KEY);
  });
});

describe("isSafeTagValue", () => {
  it("rejects semicolons, equals and control characters", () => {
    expect(isSafeTagValue("ok value")).toBe(true);
    expect(isSafeTagValue("bad;value")).toBe(false);
    expect(isSafeTagValue("bad=value")).toBe(false);
    expect(isSafeTagValue("bad\nvalue")).toBe(false);
  });
});

describe("splitTxtChunks", () => {
  it("keeps short records in one quoted chunk and splits long ones at 255", () => {
    expect(splitTxtChunks("v=DKIM1; p=abc")).toEqual(['"v=DKIM1; p=abc"']);
    const long = "x".repeat(500);
    const chunks = splitTxtChunks(long);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(257); // 255 + 2 quotes
    expect(chunks[1]).toHaveLength(245 + 2); // 500 - 255 = 245
  });
});

describe("generateDkimRecord happy path", () => {
  it("builds the DNS name and tag list in RFC 6376 order", () => {
    const result = generateDkimRecord(baseInput);
    expect(result.errors).toEqual([]);
    expect(result.dnsName).toBe("s1._domainkey.example.com");
    expect(result.recordValue.startsWith("v=DKIM1; k=rsa; p=")).toBe(true);
    expect(result.recordValue).toContain(SAMPLE_KEY);
    expect(result.publicKeyBytes).toBeGreaterThan(0);
  });

  it("appends optional g, n and t tags", () => {
    const result = generateDkimRecord({
      ...baseInput,
      granularity: "marketing",
      note: "rotate 2026",
      testing: true,
      subdomainStrict: true,
    });
    expect(result.recordValue).toContain("g=marketing");
    expect(result.recordValue).toContain("n=rotate 2026");
    expect(result.recordValue).toContain("t=y:s");
  });

  it("supports ed25519 key type", () => {
    const result = generateDkimRecord({ ...baseInput, keyType: "ed25519" });
    expect(result.recordValue).toContain("k=ed25519");
  });
});

describe("generateDkimRecord validation", () => {
  it("rejects empty or malformed selector and domain", () => {
    const bad = generateDkimRecord({
      ...baseInput,
      selector: "-bad-",
      domain: "not a domain",
    });
    expect(bad.errors.some((e) => e.includes("选择器"))).toBe(true);
    expect(bad.errors.some((e) => e.includes("域名"))).toBe(true);
    expect(bad.recordValue).toBe("");
    expect(bad.dnsName).toBe("");
  });

  it("rejects empty and malformed public keys", () => {
    const empty = generateDkimRecord({ ...baseInput, publicKey: "" });
    expect(empty.errors.some((e) => e.includes("公钥内容不能为空"))).toBe(true);

    const malformed = generateDkimRecord({
      ...baseInput,
      publicKey: "not base64!!!",
    });
    expect(malformed.errors.some((e) => e.includes("合法的 Base64"))).toBe(
      true,
    );
  });

  it("rejects unsafe tag values", () => {
    const result = generateDkimRecord({ ...baseInput, note: "a;b=c" });
    expect(result.errors.some((e) => e.includes("RFC 6376"))).toBe(true);
  });

  it("warns on weak RSA keys and long records", () => {
    const weak = generateDkimRecord({ ...baseInput, publicKey: "YWJjZA==" }); // 4 字节
    expect(weak.warnings.some((w) => w.includes("1024 位"))).toBe(true);

    const long = generateDkimRecord({
      ...baseInput,
      publicKey: "A".repeat(400),
    });
    expect(long.warnings.some((w) => w.includes("255"))).toBe(true);
    expect(long.chunks.length).toBeGreaterThan(1);
  });
});
