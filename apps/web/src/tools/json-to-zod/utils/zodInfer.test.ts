import { describe, it, expect } from "vitest";
import {
  detectStringFormat,
  jsonToZodSchema,
  parseJsonSamples,
  splitJsonDocuments,
} from "./zodInfer";

describe("基本类型推断", () => {
  it("字符串 / 整数 / 浮点 / 布尔 / null", () => {
    expect(
      jsonToZodSchema('{"a":"hi","b":3,"c":3.5,"d":true,"e":null}'),
    ).toContain("a: z.string()");
    const out = jsonToZodSchema('{"b":3,"c":3.5}');
    expect(out).toContain("z.number().int()");
    expect(out).toContain("z.number(),");
    expect(jsonToZodSchema('{"d":true}')).toContain("d: z.boolean()");
    expect(jsonToZodSchema('{"e":null}')).toContain("e: z.null()");
  });

  it("空数组 → z.array(z.unknown())", () => {
    expect(jsonToZodSchema('{"items":[]}')).toContain(
      "items: z.array(z.unknown())",
    );
  });

  it("空对象 → z.object({})", () => {
    expect(jsonToZodSchema("{}")).toBe("export const Schema = z.object({})");
  });
});

describe("字符串格式提示", () => {
  it("detectStringFormat 识别 email/uuid/url/datetime/date", () => {
    expect(detectStringFormat("a@b.com")).toBe("email");
    expect(detectStringFormat("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "uuid",
    );
    expect(detectStringFormat("https://example.com/x")).toBe("url");
    expect(detectStringFormat("2026-11-04T10:00:00Z")).toBe("datetime");
    expect(detectStringFormat("2026-11-04")).toBe("date");
    expect(detectStringFormat("hello")).toBeNull();
  });

  it("生成 z.string().email() 等方法链", () => {
    const out = jsonToZodSchema(
      '{"email":"a@b.com","id":"550e8400-e29b-41d4-a716-446655440000","site":"http://x.io","at":"2026-01-02","ts":"2026-01-02T03:04:05Z"}',
    );
    expect(out).toContain("z.string().email()");
    expect(out).toContain("z.string().uuid()");
    expect(out).toContain("z.string().url()");
    expect(out).toContain("z.string().date()");
    expect(out).toContain("z.string().datetime()");
  });

  it("多样本格式不一致时退化为普通 z.string()", () => {
    const out = jsonToZodSchema('{"x":"a@b.com"}\n\n{"x":"not-an-email"}');
    expect(out).toContain("x: z.string()");
    expect(out).not.toContain("email()");
  });
});

describe("枚举", () => {
  it("少量离散字符串 → z.enum（值排序）", () => {
    const out = jsonToZodSchema('{"s":"open"}\n\n{"s":"done"}\n\n{"s":"open"}');
    expect(out).toContain('z.enum(["done", "open"])');
  });

  it("单值不成枚举；超过 10 个离散值不成枚举", () => {
    expect(jsonToZodSchema('{"s":"only"}')).toContain("s: z.string()");
    const docs = Array.from({ length: 11 }, (_, i) => `{"s":"v${i}"}`).join(
      "\n\n",
    );
    const out = jsonToZodSchema(docs);
    expect(out).toContain("s: z.string()");
    expect(out).not.toContain("z.enum");
  });
});

describe("数组与嵌套对象", () => {
  it("字符串数组与对象数组（嵌套 schema 独立 const）", () => {
    const input = '{"tags":["a","b","c"],"users":[{"name":"Ada","age":36}]}';
    const out = jsonToZodSchema(input);
    expect(out).toContain("tags: z.array(z.string())");
    expect(out).toMatch(/const SchemaUsers = z\.object\(\{/);
    expect(out).toContain("users: z.array(SchemaUsers)");
    expect(out).toContain("name: z.string()");
    expect(out).toContain("age: z.number().int()");
  });

  it("数组内元素多样本合并", () => {
    const out = jsonToZodSchema('{"xs":[{"n":1},{"n":2,"extra":"s"}]}');
    expect(out).toContain("extra: z.string().optional()");
  });
});

describe("可选与可空", () => {
  it("多样本缺失字段 → .optional()", () => {
    const out = jsonToZodSchema('{"a":1}\n\n{"a":2,"b":"x"}');
    expect(out).toContain("a: z.number().int()");
    expect(out).toContain("b: z.string().optional()");
  });

  it("字段出现 null 与其他类型 → .nullable()", () => {
    const out = jsonToZodSchema('{"a":"x"}\n\n{"a":null}');
    expect(out).toContain("a: z.string().nullable()");
  });

  it("字段同时缺失且可空 → .nullable().optional()", () => {
    const out = jsonToZodSchema('{"a":"x"}\n\n{"a":null}\n\n{"b":1}');
    expect(out).toContain("a: z.string().nullable().optional()");
  });
});

describe("联合类型", () => {
  it("string | number → z.union", () => {
    const out = jsonToZodSchema('{"x":"s"}\n\n{"x":1}');
    expect(out).toContain("z.union([z.string(), z.number().int()])");
  });

  it("对象 | 标量联合与可空联合", () => {
    const out = jsonToZodSchema('{"x":{"a":1}}\n\n{"x":"s"}\n\n{"x":null}');
    expect(out).toMatch(
      /x: z\.union\(\[z\.string\(\), SchemaX\]\)\.nullable\(\)/,
    );
  });
});

describe("多样本文档切分", () => {
  it("单文档含内部换行不被切分", () => {
    const docs = splitJsonDocuments('{\n  "a": 1\n}');
    expect(docs).toHaveLength(1);
    expect(parseJsonSamples(docs[0] ?? "")).toEqual([{ a: 1 }]);
  });

  it("空行分隔两个文档", () => {
    expect(parseJsonSamples('{"a":1}\n\n{"b":2}')).toEqual([
      { a: 1 },
      { b: 2 },
    ]);
  });

  it("空输入返回空数组", () => {
    expect(parseJsonSamples("  \n ")).toEqual([]);
    expect(jsonToZodSchema("")).toBe("");
  });

  it("非法 JSON 抛中文错误并指明第几个样例", () => {
    expect(() => jsonToZodSchema('{"a":1}\n\n{bad}')).toThrowError(
      /第 2 个样例/,
    );
  });
});

describe("渲染选项", () => {
  it("自定义根名、4 空格缩进、不导出", () => {
    const out = jsonToZodSchema('{"a":1}', {
      rootName: "UserDto",
      indent: 4,
      exportRoot: false,
    });
    expect(out).toContain("const UserDto = z.object({");
    expect(out).toContain("\n    a: z.number().int(),");
    expect(out).not.toContain("export const UserDto");
  });

  it("非法根名抛错", () => {
    expect(() => jsonToZodSchema('{"a":1}', { rootName: "1bad" })).toThrowError(
      /标识符/,
    );
  });

  it("根为数组 / 标量时输出 const 表达式", () => {
    expect(jsonToZodSchema("[1,2,3]")).toBe(
      "export const Schema = z.array(z.number().int())",
    );
    expect(jsonToZodSchema('"hi"')).toBe("export const Schema = z.string()");
  });

  it("非标识符字段名加双引号", () => {
    const out = jsonToZodSchema('{"a-b": 1}');
    expect(out).toContain('"a-b": z.number().int()');
  });

  it("深嵌套时被引用的子 schema 声明在根之前（无 TDZ）", () => {
    const out = jsonToZodSchema('{"a":{"b":{"c":1}}}');
    const rootPos = out.indexOf("export const Schema =");
    const childPos = out.indexOf("const SchemaA =");
    const grandPos = out.indexOf("const SchemaAB =");
    expect(grandPos).toBeGreaterThanOrEqual(0);
    expect(childPos).toBeGreaterThanOrEqual(0);
    expect(grandPos).toBeLessThan(childPos);
    expect(childPos).toBeLessThan(rootPos);
  });
});
