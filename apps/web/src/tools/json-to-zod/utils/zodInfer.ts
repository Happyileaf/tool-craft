/**
 * JSON → Zod v3 schema 推断纯函数集合。
 *
 * 仅输出 Zod schema 源码文本，不引入 zod 运行时依赖。
 * 支持：
 * - z.object / z.array / 基本类型 / z.literal / z.enum / z.union / .nullable() / .optional()
 * - 字符串格式提示：email、uuid、datetime、date、url
 * - 多个样例（以空行分隔的多个 JSON 文档）合并推断可选字段与联合类型
 */
import { DEFAULT_INDENT, DEFAULT_ROOT_NAME } from "../constants";

/** 合法 JS 标识符 */
const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** 属性名切词 */
const NAME_SEPARATOR_PATTERN = /[^A-Za-z0-9$]+/;

/** 触发枚举推断的最大不同字符串数量 */
const MAX_ENUM_VALUES = 10;

/** 推断出的 Zod 类型节点 */
type ZodType =
  | { kind: "string"; format?: StringFormat }
  | { kind: "number"; mode: NumberMode }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "unknown" }
  | { kind: "array"; element: ZodType }
  | { kind: "object"; ref: string }
  | { kind: "enum"; values: string[] }
  | { kind: "literalUnion"; literals: string[]; nullable?: boolean }
  | { kind: "union"; members: ZodType[]; nullable?: boolean };

/** 字符串格式提示 */
type StringFormat = "email" | "url" | "uuid" | "datetime" | "date";

/** 数字模式：全部整数 / 含小数 / 无样本 */
type NumberMode = "int" | "float" | "empty";

/** 对象字段 */
interface ZodField {
  key: string;
  optional: boolean;
  type: ZodType;
}

/** 推断上下文 */
interface ZodContext {
  usedNames: Set<string>;
  objects: Map<string, ZodField[]>;
}

/** 生成选项 */
export interface JsonToZodOptions {
  /** 根 schema 名（合法标识符），默认 Schema */
  rootName?: string;
  /** 缩进空格数，默认 2 */
  indent?: number;
  /** 根 schema 是否 export，默认 true */
  exportRoot?: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pascalCase(name: string): string {
  const parts = name
    .split(NAME_SEPARATOR_PATTERN)
    .filter((part) => part.length > 0);
  if (parts.length === 0) {
    return "Item";
  }
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function reserveName(baseName: string, context: ZodContext): string {
  let candidate = baseName;
  let suffix = 2;
  while (context.usedNames.has(candidate)) {
    candidate = `${baseName}${suffix}`;
    suffix += 1;
  }
  context.usedNames.add(candidate);
  return candidate;
}

/**
 * 把多个 JSON 文档文本切分为独立文档：按空行分隔；
 * 若整体本身就是一个合法 JSON（含内部换行），直接返回单文档
 *
 * @param text - 已 trim 的输入
 * @returns 各文档文本
 */
export function splitJsonDocuments(text: string): string[] {
  if (text === "") {
    return [];
  }
  // 单文档优先（绝大多数场景）
  try {
    JSON.parse(text);
    return [text];
  } catch {
    // 继续尝试按空行切分多样例
  }

  const chunks = text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);

  // 逐段必须都能独立解析，否则报错（由调用方在 parse 阶段抛出）
  return chunks;
}

/**
 * 解析一个或多个（空行分隔的）JSON 文档
 *
 * @param input - 原始输入文本
 * @returns 解析后的值数组
 * @throws 输入为空或 JSON 非法时抛出中文错误
 */
export function parseJsonSamples(input: string): unknown[] {
  const trimmed = input.trim();
  if (trimmed === "") {
    return [];
  }
  const docs = splitJsonDocuments(trimmed);
  return docs.map((doc, index) => {
    try {
      return JSON.parse(doc);
    } catch (catchError) {
      const msg =
        catchError instanceof Error ? catchError.message : String(catchError);
      throw new Error(`第 ${index + 1} 个样例 JSON 解析失败：${msg}`);
    }
  });
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL_PATTERN = /^https?:\/\/[^\s]+$/i;
const DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 依据字符串内容给出 Zod 格式方法提示
 *
 * @param value - 字符串样本
 * @returns 格式类型；无法识别返回 null
 */
export function detectStringFormat(value: string): StringFormat | null {
  if (EMAIL_PATTERN.test(value)) {
    return "email";
  }
  if (UUID_PATTERN.test(value)) {
    return "uuid";
  }
  if (DATETIME_PATTERN.test(value)) {
    return "datetime";
  }
  if (DATE_PATTERN.test(value)) {
    return "date";
  }
  if (URL_PATTERN.test(value)) {
    return "url";
  }
  return null;
}

/** 合并两个格式提示：相同则保留，否则放弃（null） */
function mergeFormat(
  a: StringFormat | undefined,
  b: StringFormat | undefined,
): StringFormat | undefined {
  if (a !== undefined && a === b) {
    return a;
  }
  return undefined;
}

/**
 * 合并多个值为一个 Zod 类型节点
 *
 * @param values - 样例值集合
 * @param baseName - 嵌套对象 / 数组元素命名基准
 * @param context - 推断上下文
 * @returns Zod 类型节点
 */
function mergeValues(
  values: unknown[],
  baseName: string,
  context: ZodContext,
): ZodType {
  if (values.length === 0) {
    return { kind: "unknown" };
  }

  const objectValues: Record<string, unknown>[] = [];
  const arrayElements: unknown[] = [];
  let hasArray = false;
  const strings: string[] = [];
  let numberMode: NumberMode = "empty";
  let hasBoolean = false;
  let hasNull = false;

  for (const value of values) {
    if (value === null) {
      hasNull = true;
    } else if (typeof value === "string") {
      strings.push(value);
    } else if (typeof value === "number") {
      const valueMode: NumberMode = Number.isInteger(value) ? "int" : "float";
      numberMode =
        numberMode === "empty"
          ? valueMode
          : numberMode === "int" && valueMode === "int"
            ? "int"
            : "float";
    } else if (typeof value === "boolean") {
      hasBoolean = true;
    } else if (Array.isArray(value)) {
      hasArray = true;
      arrayElements.push(...value);
    } else if (isPlainObject(value)) {
      objectValues.push(value);
    }
  }

  const members: ZodType[] = [];

  if (strings.length > 0) {
    members.push(inferStringType(strings));
  }
  if (numberMode !== "empty") {
    members.push({ kind: "number", mode: numberMode });
  }
  if (hasBoolean) {
    members.push({ kind: "boolean" });
  }
  if (hasArray) {
    members.push({
      kind: "array",
      element: mergeValues(arrayElements, baseName, context),
    });
  }
  if (objectValues.length > 0) {
    members.push({
      kind: "object",
      ref: collectObject(objectValues, baseName, context),
    });
  }
  if (hasNull) {
    members.push({ kind: "null" });
  }

  return combineMembers(members);
}

/**
 * 字符串样本推断：少量离散值 → z.enum，否则带格式提示的 z.string
 */
function inferStringType(strings: string[]): ZodType {
  const unique = Array.from(new Set(strings));
  // 枚举判定：2–10 个离散取值，且至少一个取值在多样本间重复出现
  //（单次出现的短数组如 ["a","b","c"] 不判枚举，避免误伤普通字符串数组）
  const hasRepeatedValue = unique.length < strings.length;
  if (
    hasRepeatedValue &&
    unique.length >= 2 &&
    unique.length <= MAX_ENUM_VALUES
  ) {
    return { kind: "enum", values: unique.slice().sort() };
  }
  let format: StringFormat | undefined;
  for (const value of unique) {
    const detected = detectStringFormat(value);
    format =
      format === undefined
        ? (detected ?? undefined)
        : mergeFormat(format, detected ?? undefined);
  }
  return { kind: "string", format };
}

/**
 * 把收集到的候选成员组合为单个类型节点：
 * 去重 → 单成员直接返回 → null 折叠为 .nullable() → 字面量联合 → z.union
 */
function combineMembers(membersInput: ZodType[]): ZodType {
  // 对象按 ref、枚举按值集合去重；其余同构类型天然相同
  const members = dedupeMembers(membersInput);

  if (members.length === 1) {
    return members[0] ?? { kind: "unknown" };
  }

  const nonNull = members.filter((member) => member.kind !== "null");
  const hasNull = nonNull.length < members.length;

  if (nonNull.length === 1) {
    const only = nonNull[0] ?? { kind: "unknown" };
    return hasNull ? withNullable(only) : only;
  }

  // 全为单值枚举（离散字符串字面量，如 "a" | "b"）→ z.literal 联合
  const literals = nonNull.filter(
    (member): member is { kind: "enum"; values: string[] } =>
      member.kind === "enum",
  );
  if (
    literals.length === nonNull.length &&
    literals.every((member) => member.values.length === 1)
  ) {
    const lits = literals.map((member) => member.values[0] ?? "");
    return {
      kind: "literalUnion",
      literals: lits,
      ...(hasNull ? { nullable: true } : {}),
    };
  }

  // 多成员联合：null 提升为整体 .nullable()，由渲染层处理
  return {
    kind: "union",
    members: nonNull,
    ...(hasNull ? { nullable: true } : {}),
  };
}

/** 成员去重（对象引用名 / 枚举值集合判同） */
function dedupeMembers(members: ZodType[]): ZodType[] {
  const seen = new Set<string>();
  const result: ZodType[] = [];
  for (const member of members) {
    let key: string;
    if (member.kind === "object") {
      key = `object:${member.ref}`;
    } else if (member.kind === "enum") {
      key = `enum:${member.values.join("|")}`;
    } else if (member.kind === "array") {
      key = `array:${typeKey(member.element)}`;
    } else {
      key = member.kind;
    }
    if (!seen.has(key)) {
      seen.add(key);
      result.push(member);
    }
  }
  return result;
}

function typeKey(type: ZodType): string {
  switch (type.kind) {
    case "object":
      return `object:${type.ref}`;
    case "enum":
      return `enum:${type.values.join("|")}`;
    case "array":
      return `array:${typeKey(type.element)}`;
    case "union":
      return `union:${type.members.map(typeKey).join("|")}`;
    default:
      return type.kind;
  }
}

/** 给类型节点打 nullable 标记（原子类型用合成 union 承载） */
function withNullable(type: ZodType): ZodType {
  if (type.kind === "null") {
    return type;
  }
  if (type.kind === "union" || type.kind === "literalUnion") {
    return { ...type, nullable: true };
  }
  return { kind: "union", members: [type], nullable: true };
}

/**
 * 合并多个对象样本为一个命名 object schema
 */
function collectObject(
  objects: Record<string, unknown>[],
  baseName: string,
  context: ZodContext,
): string {
  const name = reserveName(baseName, context);
  context.objects.set(name, []); // 先占位保证父类型先输出

  const keys: string[] = [];
  const seenKeys = new Set<string>();
  for (const object of objects) {
    for (const key of Object.keys(object)) {
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        keys.push(key);
      }
    }
  }

  const fields: ZodField[] = keys.map((key) => {
    const present = objects.filter((object) =>
      Object.prototype.hasOwnProperty.call(object, key),
    );
    const values = present.map((object) => object[key]);
    return {
      key,
      optional: present.length < objects.length,
      type: mergeValues(values, `${name}${pascalCase(key)}`, context),
    };
  });

  context.objects.set(name, fields);
  return name;
}

/* ----------------------------- 代码渲染 ----------------------------- */

function formatKey(key: string): string {
  return IDENTIFIER_PATTERN.test(key) ? key : JSON.stringify(key);
}

/** 渲染原子（非 object）类型为 Zod 表达式；null 出现在联合内时用 z.null() */
function renderExpr(type: ZodType, unitIndent: string): string {
  switch (type.kind) {
    case "string":
      return type.format ? `z.string().${type.format}()` : "z.string()";
    case "number":
      return type.mode === "int" ? "z.number().int()" : "z.number()";
    case "boolean":
      return "z.boolean()";
    case "null":
      return "z.null()";
    case "unknown":
      return "z.unknown()";
    case "enum":
      return `z.enum([${type.values.map((value) => JSON.stringify(value)).join(", ")}])`;
    case "object":
      return type.ref;
    case "array": {
      const element = renderExpr(type.element, unitIndent);
      // 元素是对象引用、原子类型可直接拼接；含联合时需要括号无意义（z.array 本身是函数调用）
      return `z.array(${element})`;
    }
    case "literalUnion": {
      const expr = type.literals.reduce(
        (acc, literal) =>
          acc === null
            ? `z.literal(${JSON.stringify(literal)})`
            : `${acc}.or(z.literal(${JSON.stringify(literal)}))`,
        null as string | null,
      );
      return type.nullable ? `${expr}.nullable()` : (expr ?? "z.never()");
    }
    case "union": {
      // 单成员 + nullable：直接在原子表达式上追加 .nullable()
      if (type.members.length === 1) {
        const expr = renderExpr(
          type.members[0] ?? { kind: "unknown" },
          unitIndent,
        );
        return type.nullable ? `${expr}.nullable()` : expr;
      }
      const unionExpr = `z.union([${type.members
        .map((member) => renderExpr(member, unitIndent))
        .join(", ")}])`;
      return type.nullable ? `${unionExpr}.nullable()` : unionExpr;
    }
  }
}

/** 渲染一个对象 schema 为 z.object({ ... }) 表达式 */
function renderObjectExpr(fields: ZodField[], unitIndent: string): string {
  if (fields.length === 0) {
    return "z.object({})";
  }
  const childPad = `${unitIndent}`;
  const lines = fields.map((field) => {
    let expr = renderExpr(field.type, childPad);
    if (field.optional) {
      expr += ".optional()";
    }
    return `${childPad}${formatKey(field.key)}: ${expr},`;
  });
  return `z.object({\n${lines.join("\n")}\n})`;
}

/**
 * JSON → Zod schema 主入口
 *
 * @param input - 一个或多个（空行分隔）JSON 样例文本
 * @param options - 根名 / 缩进 / export 选项
 * @returns Zod v3 schema 源码；空输入返回空串
 * @throws JSON 非法或根名不合法时抛出中文错误
 */
export function jsonToZodSchema(
  input: string,
  options: JsonToZodOptions = {},
): string {
  const samples = parseJsonSamples(input);
  if (samples.length === 0) {
    return "";
  }

  const rootName = (options.rootName ?? DEFAULT_ROOT_NAME).trim();
  if (!IDENTIFIER_PATTERN.test(rootName)) {
    throw new Error("根 schema 名必须是合法标识符：" + rootName);
  }
  const indentCount = Math.max(0, Math.floor(options.indent ?? DEFAULT_INDENT));
  const indentText = " ".repeat(indentCount);
  const exportPrefix = (options.exportRoot ?? true) ? "export " : "";

  const context: ZodContext = { usedNames: new Set(), objects: new Map() };
  const rootType = mergeValues(samples, rootName, context);

  // 收集一个类型节点引用的全部对象名
  const collectRefs = (type: ZodType, refs: Set<string>): void => {
    if (type.kind === "object") {
      refs.add(type.ref);
    } else if (type.kind === "array") {
      collectRefs(type.element, refs);
    } else if (type.kind === "union" || type.kind === "literalUnion") {
      for (const member of type.kind === "union" ? type.members : []) {
        collectRefs(member, refs);
      }
    }
  };

  // 按依赖深度后序排列：被引用的对象声明在引用者之前，避免 TDZ
  const depthCache = new Map<string, number>();
  const depthOf = (name: string, visiting: Set<string>): number => {
    const cached = depthCache.get(name);
    if (cached !== undefined) {
      return cached;
    }
    if (visiting.has(name)) {
      return 0; // JSON 样例为无环结构，防御性处理
    }
    visiting.add(name);
    let maxChild = -1;
    const fields = context.objects.get(name) ?? [];
    for (const field of fields) {
      const refs = new Set<string>();
      collectRefs(field.type, refs);
      for (const ref of refs) {
        if (ref !== name) {
          maxChild = Math.max(maxChild, depthOf(ref, visiting));
        }
      }
    }
    visiting.delete(name);
    const depth = maxChild + 1;
    depthCache.set(name, depth);
    return depth;
  };

  const orderedNames = Array.from(context.objects.keys()).sort(
    (a, b) => depthOf(a, new Set()) - depthOf(b, new Set()),
  );

  const blocks: string[] = [];
  for (const name of orderedNames) {
    const fields = context.objects.get(name);
    if (!fields) {
      continue;
    }
    const isRoot = rootType.kind === "object" && rootType.ref === name;
    const prefix = isRoot ? exportPrefix : "";
    blocks.push(
      `${prefix}const ${name} = ${renderObjectExpr(fields, indentText)}`,
    );
  }

  // 根不是对象（数组 / 基本类型 / 联合）时输出根常量
  if (rootType.kind !== "object") {
    blocks.push(
      `${exportPrefix}const ${rootName} = ${renderExpr(rootType, indentText)}`,
    );
  }

  return blocks.join("\n\n");
}
