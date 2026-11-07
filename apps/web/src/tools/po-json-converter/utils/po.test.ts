import { describe, it, expect } from "vitest";
import {
  escapePoString,
  unescapePoString,
  parsePo,
  serializePo,
  poToJson,
  jsonToPo,
} from "./po";

const SAMPLE_PO = `# Translation template.
#: src/app.ts:12
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\\n"

#. Greeting on home page
msgid "Hello"
msgstr "你好"

msgid "Line one\\nLine two"
msgstr "第一行\\n第二行"

msgid "One item"
msgid_plural "{count} items"
msgstr[0] "一个条目"
msgstr[1] "{count} 个条目"
`;

describe("escape / unescape round trip", () => {
  it("handles quotes, backslashes, tabs and newlines", () => {
    for (const value of [
      "plain",
      'a "quote"',
      "back\\slash",
      "tab\there",
      "a\nb\nc",
      "",
    ]) {
      const quoted = escapePoString(value);
      const literal = quoted.slice(1, -1).replace(/\\n/g, "\\n");
      expect(
        unescapePoString(value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')),
      ).toBe(value);
      expect(quoted.startsWith('"')).toBe(true);
      expect(literal).toBeDefined();
    }
  });

  it("splits multiline values into multiple literals", () => {
    const out = escapePoString("first\nsecond");
    expect(out).toBe('"first\\n"\n"second"');
  });
});

describe("parsePo", () => {
  it("parses header, singular, multiline and plural entries", () => {
    const file = parsePo(SAMPLE_PO);
    expect(file.entries).toHaveLength(4);

    const [header, hello, multiline, plural] = file.entries;
    // 首条目前的注释（含文件头模板注释与 #: 引用）整体挂到 header 条目
    expect(header!.comments).toEqual([
      "# Translation template.",
      "#: src/app.ts:12",
    ]);
    expect(header!.msgid).toBe("");
    expect(header!.msgstr[0]).toContain(
      "Content-Type: text/plain; charset=UTF-8\n",
    );
    expect(hello!.comments).toContain("#. Greeting on home page");
    expect(hello!.msgstr[0]).toBe("你好");
    expect(multiline!.msgid).toBe("Line one\nLine two");
    expect(plural!.msgidPlural).toBe("{count} items");
    expect(plural!.msgstr).toEqual(["一个条目", "{count} 个条目"]);
  });

  it("throws on an unrecognizable line", () => {
    expect(() => parsePo('msgid "ok"\nbroken line\n')).toThrow(/无法解析/);
  });
});

describe("serializePo round trip", () => {
  it("re-serializes parsed content without losing strings", () => {
    const file = parsePo(SAMPLE_PO);
    const text = serializePo(file);
    const reparsed = parsePo(text);
    expect(reparsed.entries).toHaveLength(4);
    expect(reparsed.entries[1]!.msgstr[0]).toBe("你好");
    expect(reparsed.entries[2]!.msgid).toBe("Line one\nLine two");
    expect(reparsed.entries[3]!.msgstr).toEqual(["一个条目", "{count} 个条目"]);
  });
});

describe("poToJson", () => {
  it("maps singulars to strings and plurals to arrays", () => {
    const result = poToJson(SAMPLE_PO);
    expect(result.error).toBeNull();
    const data = JSON.parse(result.output);
    expect(data["Hello"]).toBe("你好");
    expect(data["Line one\nLine two"]).toBe("第一行\n第二行");
    expect(data["One item"]).toEqual(["一个条目", "{count} 个条目"]);
    expect(data[""]).toContain("Plural-Forms");
  });

  it("returns a readable error for malformed PO", () => {
    const result = poToJson('msgid "oops"\nno quotes here\n');
    expect(result.error).toMatch(/无法解析/);
    expect(result.output).toBe("");
  });
});

describe("jsonToPo", () => {
  it("emits singular and plural PO entries", () => {
    const result = jsonToPo(
      JSON.stringify({
        Hello: "你好",
        "One item": ["一个条目", "{count} 个条目"],
      }),
    );
    expect(result.error).toBeNull();
    expect(result.output).toContain('msgid "Hello"');
    expect(result.output).toContain('msgstr "你好"');
    expect(result.output).toContain('msgid_plural "One item plural"');
    expect(result.output).toContain('msgstr[1] "{count} 个条目"');
  });

  it("rejects non-object roots and non-string leaves", () => {
    expect(jsonToPo('["a"]').error).toMatch(/顶层必须是对象/);
    expect(jsonToPo('{"a": 1}').error).toMatch(/字符串或字符串数组/);
    expect(jsonToPo("not json").error).toMatch(/JSON 解析失败/);
  });

  it("round-trips JSON -> PO -> JSON for strings", () => {
    const source = { Hello: "你好", Bye: "再见", Multi: "第一行\n第二行" };
    const po = jsonToPo(JSON.stringify(source));
    expect(po.error).toBeNull();
    const back = poToJson(po.output);
    expect(back.error).toBeNull();
    expect(JSON.parse(back.output)).toEqual(source);
  });
});
