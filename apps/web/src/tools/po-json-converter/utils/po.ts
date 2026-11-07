/**
 * gettext PO/POT 消息目录 ↔ JSON 双向转换纯函数（零依赖）
 *
 * 支持 GNU gettext 手册定义的 PO 子集：
 * - # 注释行（# / #. / #: / #, / #|）原样保留
 * - msgid / msgstr 及复数 msgid_plural、msgstr[0..n]
 * - 相邻字符串字面量跨行拼接，C 风格转义（\n \t \" \\ 等）
 * - header（空 msgid 的 msgstr）作为普通条目透传，往返不丢信息
 */

export interface PoEntry {
  /** 注释行（含 # 前缀，按出现顺序） */
  comments: string[];
  msgctxt: string | null;
  msgid: string;
  msgidPlural: string | null;
  /** 单数形式：msgstr；复数形式：msgstr[0..n] */
  msgstr: string[];
}

export interface PoFile {
  /** 文件头部位于第一个条目之前的注释 */
  leadingComments: string[];
  entries: PoEntry[];
}

export interface ConvertResult {
  output: string;
  error: string | null;
}

/**
 * msgctxt 与 msgid 组合为 JSON 键时的分隔符（SOH, U+0001），
 * 沿用 gettext 生态（如 node-gettext）常用约定；普通译文键不会包含该控制字符
 */
export const MSGCTXT_SEPARATOR = "\u0001";

/** 反转义 PO 字符串字面量内容（不含外层引号） */
export function unescapePoString(raw: string): string {
  let out = "";
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = raw[i + 1];
    switch (next) {
      case "n":
        out += "\n";
        break;
      case "t":
        out += "\t";
        break;
      case "r":
        out += "\r";
        break;
      case "b":
        out += "\b";
        break;
      case "f":
        out += "\f";
        break;
      case "v":
        out += "\v";
        break;
      case "a":
        out += "\x07";
        break;
      case '"':
        out += '"';
        break;
      case "\\":
        out += "\\";
        break;
      case undefined:
        out += "\\";
        break;
      default:
        // \xHH / \ooo 等转义在常规 PO 中罕见，保守保留反斜杠
        out += `\\${next}`;
    }
    i += 1;
  }
  return out;
}

/** 按 gettext 习惯转义并加引号；含换行时拆成多行字面量 */
export function escapePoString(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");

  if (!value.includes("\n")) {
    return `"${escaped}"`;
  }
  // 首行前导换行独立成行，其余按 \n 切分，与 gettext 输出风格一致
  const parts = value.split("\n");
  return parts
    .map((part, index) => {
      const segment = part
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      return index < parts.length - 1 ? `"${segment}\\n"` : `"${segment}"`;
    })
    .join("\n");
}

const KEYWORD_REGEX =
  /^(msgctxt|msgid|msgid_plural|msgstr)(?:\[(\d+)\])?\s+"((?:\\.|[^"\\])*)"$/;

/** 解析 PO/POT 文本为结构化条目 */
export function parsePo(input: string): PoFile {
  const lines = input.split("\n");
  const leadingComments: string[] = [];
  const entries: PoEntry[] = [];

  let current: PoEntry | null = null;
  /** 当前正在收集的字面量目标键 */
  let activeKey: {
    kind: "msgctxt" | "msgid" | "msgid_plural" | "msgstr";
    index: number;
  } | null = null;
  let sawEntry = false;

  const pushCurrent = () => {
    if (current) {
      entries.push(current);
      current = null;
      activeKey = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      pushCurrent();
      continue;
    }

    if (trimmed.startsWith("#")) {
      // 条目尚未开始时先暂存，首个关键字建条目时并入该条目
      if (!current) {
        leadingComments.push(trimmed);
      } else {
        current.comments.push(trimmed);
      }
      continue;
    }

    const match = trimmed.match(KEYWORD_REGEX);
    if (!match) {
      // 续行字面量：以引号开头，拼到当前键
      if (trimmed.startsWith('"') && activeKey && current) {
        const cont = trimmed.slice(1, trimmed.endsWith('"') ? -1 : undefined);
        appendSegment(current, activeKey, unescapePoString(cont));
        continue;
      }
      throw new Error(`无法解析的 PO 行：「${trimmed}」`);
    }

    sawEntry = true;
    if (!current) {
      current = {
        comments: leadingComments.splice(0, leadingComments.length),
        msgctxt: null,
        msgid: "",
        msgidPlural: null,
        msgstr: [],
      };
    }
    const [, keyword, indexRaw, literal] = match;
    const value = unescapePoString(literal!);
    if (keyword === "msgctxt") {
      current.msgctxt = value;
      activeKey = { kind: "msgctxt", index: 0 };
    } else if (keyword === "msgid") {
      current.msgid = value;
      activeKey = { kind: "msgid", index: 0 };
    } else if (keyword === "msgid_plural") {
      current.msgidPlural = value;
      activeKey = { kind: "msgid_plural", index: 0 };
    } else {
      const index = indexRaw === undefined ? 0 : Number(indexRaw);
      current.msgstr[index] = value;
      activeKey = { kind: "msgstr", index };
    }
  }
  pushCurrent();

  // 补全 msgstr 空洞（复数形式可能跳过索引）
  for (const entry of entries) {
    for (let i = 0; i < entry.msgstr.length; i += 1) {
      if (entry.msgstr[i] === undefined) {
        entry.msgstr[i] = "";
      }
    }
  }

  return { leadingComments, entries };
}

function appendSegment(
  entry: PoEntry,
  key: { kind: string; index: number },
  segment: string,
): void {
  if (key.kind === "msgctxt") {
    entry.msgctxt = (entry.msgctxt ?? "") + segment;
  } else if (key.kind === "msgid") {
    entry.msgid += segment;
  } else if (key.kind === "msgid_plural") {
    entry.msgidPlural = (entry.msgidPlural ?? "") + segment;
  } else {
    entry.msgstr[key.index] = (entry.msgstr[key.index] ?? "") + segment;
  }
}

/** 将结构化条目序列化为 PO 文本 */
export function serializePo(file: PoFile): string {
  const blocks: string[] = [];
  if (file.leadingComments.length > 0) {
    blocks.push(file.leadingComments.join("\n"));
  }

  for (const entry of file.entries) {
    const lines: string[] = [];
    lines.push(...entry.comments);
    if (entry.msgctxt !== null) {
      lines.push(`msgctxt ${escapePoString(entry.msgctxt)}`);
    }
    lines.push(`msgid ${escapePoString(entry.msgid)}`);
    if (entry.msgidPlural !== null) {
      lines.push(`msgid_plural ${escapePoString(entry.msgidPlural)}`);
      entry.msgstr.forEach((value, index) => {
        lines.push(`msgstr[${index}] ${escapePoString(value)}`);
      });
    } else {
      lines.push(`msgstr ${escapePoString(entry.msgstr[0] ?? "")}`);
    }
    blocks.push(lines.join("\n"));
  }

  return blocks.join("\n\n") + (blocks.length > 0 ? "\n" : "");
}

/**
 * PO → JSON。
 * 普通条目映射为 { msgid: msgstr }；复数条目映射为 { msgid: [str0, str1...] }；
 * 带 msgctxt 的条目以 "context<SOH>msgid" 作键（gettext 生态常用约定）。
 */
export function poToJson(input: string): ConvertResult {
  try {
    const file = parsePo(input);
    const root: Record<string, string | string[]> = {};
    for (const entry of file.entries) {
      const key =
        entry.msgctxt !== null
          ? `${entry.msgctxt}${MSGCTXT_SEPARATOR}${entry.msgid}`
          : entry.msgid;
      root[key] =
        entry.msgidPlural !== null
          ? [...entry.msgstr]
          : (entry.msgstr[0] ?? "");
    }
    return { output: JSON.stringify(root, null, 2), error: null };
  } catch (err) {
    return {
      output: "",
      error: err instanceof Error ? err.message : "PO 解析失败",
    };
  }
}

/**
 * JSON → PO。
 * 值为字符串生成普通条目；值为数组生成复数条目；键含 SOH 分隔符时拆为 msgctxt + msgid。
 */
export function jsonToPo(input: string): ConvertResult {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (err) {
    return {
      output: "",
      error: `JSON 解析失败：${err instanceof Error ? err.message : String(err)}`,
    };
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { output: "", error: "JSON 顶层必须是对象（键值映射）" };
  }

  const entries: PoEntry[] = [];
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const sepIndex = key.indexOf(MSGCTXT_SEPARATOR);
    const msgctxt = sepIndex >= 0 ? key.slice(0, sepIndex) : null;
    const msgid = sepIndex >= 0 ? key.slice(sepIndex + 1) : key;

    if (Array.isArray(value)) {
      if (!value.every((item) => typeof item === "string")) {
        return { output: "", error: `键「${key}」的数组值必须全部为字符串` };
      }
      entries.push({
        comments: [],
        msgctxt,
        msgid,
        msgidPlural: `${msgid} plural`,
        msgstr: value as string[],
      });
    } else if (typeof value === "string") {
      entries.push({
        comments: [],
        msgctxt,
        msgid,
        msgidPlural: null,
        msgstr: [value],
      });
    } else {
      return { output: "", error: `键「${key}」的值必须是字符串或字符串数组` };
    }
  }

  return { output: serializePo({ leadingComments: [], entries }), error: null };
}
