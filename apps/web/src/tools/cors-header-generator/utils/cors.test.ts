import { describe, it, expect } from "vitest";
import { generateCorsHeaders, isValidOrigin, type CorsConfig } from "./cors";

const baseConfig: CorsConfig = {
  originMode: "wildcard",
  origins: [],
  credentials: false,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  maxAge: 86400,
  exposeHeaders: [],
};

describe("isValidOrigin", () => {
  it("accepts http/https origins with optional port", () => {
    expect(isValidOrigin("https://example.com")).toBe(true);
    expect(isValidOrigin("http://localhost:3000")).toBe(true);
    expect(isValidOrigin("  https://a.b.example:8443  ")).toBe(true);
  });

  it("rejects paths, wildcards and non-http schemes", () => {
    expect(isValidOrigin("https://example.com/path")).toBe(false);
    expect(isValidOrigin("*")).toBe(false);
    expect(isValidOrigin("ftp://example.com")).toBe(false);
    expect(isValidOrigin("example.com")).toBe(false);
  });
});

describe("generateCorsHeaders wildcard mode", () => {
  it("emits a wildcard origin without credentials or Vary", () => {
    const result = generateCorsHeaders(baseConfig);
    expect(result.errors).toEqual([]);
    expect(result.responseHeaders["Access-Control-Allow-Origin"]).toBe("*");
    expect(result.responseHeaders.Vary).toBeUndefined();
    expect(
      result.responseHeaders["Access-Control-Allow-Credentials"],
    ).toBeUndefined();
    expect(result.preflightHeaders["Access-Control-Allow-Methods"]).toBe(
      "GET, POST",
    );
    expect(result.preflightHeaders["Access-Control-Max-Age"]).toBe("86400");
  });

  it("rejects credentials combined with wildcard (Fetch spec hard rule)", () => {
    const result = generateCorsHeaders({ ...baseConfig, credentials: true });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/不能为通配/);
    expect(result.nginxSnippet).toBe("");
  });
});

describe("generateCorsHeaders reflect mode", () => {
  it("reflects the request origin and always adds Vary: Origin", () => {
    const result = generateCorsHeaders({
      ...baseConfig,
      originMode: "reflect",
      credentials: true,
    });
    expect(result.errors).toEqual([]);
    expect(result.responseHeaders["Access-Control-Allow-Origin"]).toBe(
      "$http_origin",
    );
    expect(result.responseHeaders.Vary).toBe("Origin");
    expect(result.responseHeaders["Access-Control-Allow-Credentials"]).toBe(
      "true",
    );
  });
});

describe("generateCorsHeaders whitelist mode", () => {
  it("uses the first origin and warns when multiple origins are given", () => {
    const result = generateCorsHeaders({
      ...baseConfig,
      originMode: "list",
      origins: ["https://a.example", "https://b.example"],
    });
    expect(result.responseHeaders["Access-Control-Allow-Origin"]).toBe(
      "https://a.example",
    );
    expect(result.responseHeaders.Vary).toBe("Origin");
    expect(result.warnings.some((w) => w.includes("单值"))).toBe(true);
  });

  it("errors on empty whitelist and malformed origins", () => {
    const empty = generateCorsHeaders({
      ...baseConfig,
      originMode: "list",
      origins: [],
    });
    expect(empty.errors.some((e) => e.includes("至少需要一个"))).toBe(true);

    const bad = generateCorsHeaders({
      ...baseConfig,
      originMode: "list",
      origins: ["not-an-origin"],
    });
    expect(bad.errors.some((e) => e.includes("不是合法的 Origin"))).toBe(true);
  });
});

describe("preflight and nginx snippet", () => {
  it("joins expose headers and warns on missing allowed headers", () => {
    const result = generateCorsHeaders({
      ...baseConfig,
      allowedHeaders: [],
      exposeHeaders: ["X-Request-Id", "X-Trace-Id"],
    });
    expect(result.responseHeaders["Access-Control-Expose-Headers"]).toBe(
      "X-Request-Id, X-Trace-Id",
    );
    expect(result.warnings.some((w) => w.includes("Allow-Headers"))).toBe(true);
  });

  it("rejects negative Max-Age", () => {
    const result = generateCorsHeaders({ ...baseConfig, maxAge: -1 });
    expect(result.errors.some((e) => e.includes("Max-Age"))).toBe(true);
  });

  it("renders an nginx add_header snippet", () => {
    const result = generateCorsHeaders(baseConfig);
    expect(result.nginxSnippet).toContain(
      'add_header Access-Control-Allow-Origin "*" always;',
    );
    expect(result.nginxSnippet).toContain(
      'add_header Access-Control-Allow-Methods "GET, POST" always;',
    );
  });
});
