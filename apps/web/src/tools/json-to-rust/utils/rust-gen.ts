/**
 * JSON 样本 → Rust serde 结构体生成的零依赖纯函数
 *
 * 类型规则：
 * - 整数 i64、浮点 f64、布尔 bool、字符串 String
 * - null / 可空 → Option<…>（可用 optionWrap 关闭）
 * - 对象 → 具名 struct（derive Debug/Clone/Serialize/Deserialize）
 * - 非空同型数组 → Vec<T>；空数组 → Vec<serde_json::Value> + warning
 * - int/float 混合 → f64；不可合并的异型 → serde_json::Value + warning
 */

/** Rust 2021 严格关键字与保留字（字段/类型名需规避） */
const RUST_KEYWORDS = new Set([
  'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern',
  'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod',
  'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct',
  'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while',
  'async', 'await', 'dyn', 'abstract', 'become', 'box', 'do', 'final',
  'macro', 'override', 'priv', 'typeof', 'unsized', 'virtual', 'yield', 'try',
]);

/** 推断出的类型节点 */
interface RustType {
  /** Rust 类型表达式，如 String、Vec<Item>、Option<i64> */
  expression: string;
  /** 该类型关联的具名结构体定义（对象 / 对象数组产生） */
  structs: StructDef[];
  /** 是否来自 null（决定 Option 包裹） */
  nullable: boolean;
}

/** 结构体定义 */
interface StructDef {
  name: string;
  fields: FieldDef[];
}

/** 结构体字段 */
interface FieldDef {
  /** 合法 Rust 字段名（snake_case，必要时下划线后缀） */
  rustName: string;
  /** JSON 原始键 */
  jsonKey: string;
  /** 字段类型表达式 */
  typeExpression: string;
  /** 是否需要 serde rename */
  needsRename: boolean;
}

export interface RustGenResult {
  code: string;
  warnings: string[];
}

export interface RustGenOptions {
  /** 根结构体名称 */
  rootName?: string;
  /** 是否为 null / 可空字段包裹 Option，默认 true */
  optionWrap?: boolean;
}

/** 标识符是否为合法 Rust 标识符 */
function isValidIdent(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

/** 规避 Rust 关键字：冲突时加下划线后缀 */
function escapeKeyword(name: string): string {
  return RUST_KEYWORDS.has(name) ? `${name}_` : name;
}

/**
 * 任意键名 → snake_case 字段名
 *
 * 规则：连字符/空白转下划线；驼峰拆词；去除非字母数字；
 * 数字开头补下划线；全非法名回退 field_n 由调用方处理。
 */
export function toSnakeCase(key: string): string {
  let s = key
    .replace(/[\s\-]+/g, '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
  if (/^[0-9]/.test(s)) s = `n${s}`;
  return s;
}

/** snake_case 或任意键名 → PascalCase 结构体名 */
export function toPascalCase(key: string): string {
  const snake = toSnakeCase(key);
  const pascal = snake
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return pascal;
}

/** 判断整数是否在 i64 范围内 */
function withinI64(n: number): boolean {
  return Number.isSafeInteger(n) && n >= -9223372036854775808 && n <= 9223372036854775807;
}

/** 生成器内部上下文：结构体去重与名称分配 */
interface GeneratorContext {
  warnings: string[];
  usedNames: Map<string, number>;
  optionWrap: boolean;
}

/** 分配唯一结构体名：重名时追加 2、3…后缀 */
function allocateName(ctx: GeneratorContext, base: string): string {
  const count = ctx.usedNames.get(base) ?? 0;
  const next = count + 1;
  ctx.usedNames.set(base, next);
  return next === 1 ? base : `${base}${next}`;
}

/** 两个同名字段的类型合并（数组元素 / 多对象样本归并时使用） */
function mergeTypes(
  ctx: GeneratorContext,
  a: RustType,
  b: RustType,
  path: string,
): RustType {
  // null 与具体类型合并 → Option<具体类型>
  if (a.expression === 'serde_json::Value' && a.nullable && !b.nullable) {
    return { ...b, nullable: true };
  }
  if (b.expression === 'serde_json::Value' && b.nullable && !a.nullable) {
    return { ...a, nullable: true };
  }
  if (a.expression === b.expression) {
    return {
      expression: a.expression,
      structs: mergeStructLists(ctx, a.structs, b.structs),
      nullable: a.nullable || b.nullable,
    };
  }
  // int / float 混合 → f64
  const numeric = new Set([a.expression, b.expression]);
  if (numeric.has('i64') && numeric.has('f64')) {
    return { expression: 'f64', structs: [], nullable: a.nullable || b.nullable };
  }
  ctx.warnings.push(
    `字段 "${path}" 存在无法合并的类型（${a.expression} 与 ${b.expression}），已回退为 serde_json::Value`,
  );
  return {
    expression: 'serde_json::Value',
    structs: [],
    nullable: a.nullable || b.nullable,
  };
}

/** 合并同结构的结构体定义列表（数组元素归并） */
function mergeStructLists(
  ctx: GeneratorContext,
  a: StructDef[],
  b: StructDef[],
): StructDef[] {
  if (a.length === 0) return b;
  if (b.length === 0) return a;
  // 当前实现中同型对象数组共享第一个对象的推断结果，不会出现两个并行列表
  return [...a, ...b];
}

/** 从 JSON 值推断类型；structName 为该对象（如有）建议的结构体名 */
function inferType(
  ctx: GeneratorContext,
  value: unknown,
  suggestedName: string,
  path: string,
): RustType {
  if (value === null) {
    return { expression: 'serde_json::Value', structs: [], nullable: true };
  }
  if (typeof value === 'string') {
    return { expression: 'String', structs: [], nullable: false };
  }
  if (typeof value === 'boolean') {
    return { expression: 'bool', structs: [], nullable: false };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value) && withinI64(value)) {
      return { expression: 'i64', structs: [], nullable: false };
    }
    return { expression: 'f64', structs: [], nullable: false };
  }
  if (Array.isArray(value)) {
    return inferArray(ctx, value, suggestedName, path);
  }
  if (typeof value === 'object') {
    return inferObject(ctx, value as Record<string, unknown>, suggestedName, path);
  }
  ctx.warnings.push(`路径 "${path}" 出现无法识别的值类型，已回退为 serde_json::Value`);
  return { expression: 'serde_json::Value', structs: [], nullable: false };
}

/** 是否为普通 JSON 对象（非数组、非 null） */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 轻量探测值的类型类别（不分配结构体名，用于数组元素一致性校验） */
function probeKind(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (isPlainObject(value)) return 'object';
  if (typeof value === 'number') {
    return Number.isInteger(value) && withinI64(value) ? 'i64' : 'f64';
  }
  return typeof value;
}

/** 推断数组类型 */
function inferArray(
  ctx: GeneratorContext,
  values: unknown[],
  suggestedName: string,
  path: string,
): RustType {
  if (values.length === 0) {
    ctx.warnings.push(`字段 "${path}" 是空数组，元素类型未知，已生成 Vec<serde_json::Value>`);
    return { expression: 'Vec<serde_json::Value>', structs: [], nullable: false };
  }

  const itemName = suggestedName.endsWith('s')
    ? suggestedName.slice(0, -1)
    : `${suggestedName}Item`;

  // 全部为对象（允许 null 占位）→ 合并字段生成单个元素结构体
  if (values.every((v) => isPlainObject(v) || v === null)) {
    return inferObjectArray(ctx, values, itemName, path);
  }

  let merged = inferType(ctx, values[0], itemName, `${path}[]`);
  for (let i = 1; i < values.length; i += 1) {
    const next = inferType(ctx, values[i], itemName, `${path}[]`);
    merged = mergeTypes(ctx, merged, next, `${path}[]`);
  }

  return {
    expression: `Vec<${wrappedExpression(merged, ctx.optionWrap)}>`,
    structs: merged.structs,
    nullable: false,
  };
}

/** 推断对象数组：以首个对象为基准合并字段，缺失键 / null 元素标记为可空 */
function inferObjectArray(
  ctx: GeneratorContext,
  values: unknown[],
  itemName: string,
  path: string,
): RustType {
  const first = values.find(isPlainObject);
  if (!first) {
    // 只有 null
    return { expression: 'Vec<Option<serde_json::Value>>', structs: [], nullable: false };
  }

  const base = inferObject(ctx, first, itemName, `${path}[]`);
  const itemDef = base.structs.at(-1)!;
  const fieldMap = new Map(itemDef.fields.map((f) => [f.jsonKey, f]));

  const makeNullable = (field: FieldDef): void => {
    if (!ctx.optionWrap) return;
    if (!field.typeExpression.startsWith('Option<')) {
      field.typeExpression = `Option<${field.typeExpression}>`;
    }
  };

  values.forEach((value, index) => {
    if (value === null) {
      itemDef.fields.forEach(makeNullable);
      return;
    }
    const record = value as Record<string, unknown>;
    // 基准中存在、本元素缺失或为 null → 可空
    for (const field of itemDef.fields) {
      if (!(field.jsonKey in record) || record[field.jsonKey] === null) {
        makeNullable(field);
      } else if (
        probeKind(record[field.jsonKey]) === 'f64' &&
        field.typeExpression.replace(/^Option</, '').replace(/>$/, '') === 'i64'
      ) {
        field.typeExpression = field.typeExpression.startsWith('Option<')
          ? 'Option<f64>'
          : 'f64';
      }
    }
    // 本元素新增的键：补推断并标记可空（基准元素中缺失）
    for (const [key, val] of Object.entries(record)) {
      if (fieldMap.has(key)) continue;
      const childBase = toPascalCase(key) || 'Field';
      const child = inferType(ctx, val, childBase, `${path}[].${key}`);
      const rustName = escapeKeyword(toSnakeCase(key) || `field_${itemDef.fields.length + 1}`);
      const field: FieldDef = {
        rustName,
        jsonKey: key,
        typeExpression:
          val === null
            ? wrappedExpression(
                { expression: 'serde_json::Value', structs: [], nullable: true },
                ctx.optionWrap,
              )
            : wrappedExpression(child, ctx.optionWrap),
        needsRename: rustName !== key || !isValidIdent(key),
      };
      if (val !== null && ctx.optionWrap) makeNullable(field);
      itemDef.fields.push(field);
      fieldMap.set(key, field);
      base.structs.push(...child.structs.filter((s) => s.name !== itemDef.name));
      ctx.warnings.push(
        `数组 "${path}" 中第 ${index + 1} 个对象包含基准对象没有的键 "${key}"，已加入并标记为 Option`,
      );
    }
  });

  return {
    expression: `Vec<${itemDef.name}>`,
    structs: base.structs,
    nullable: false,
  };
}

/** 推断对象类型并产出具名结构体 */
function inferObject(
  ctx: GeneratorContext,
  obj: Record<string, unknown>,
  suggestedName: string,
  path: string,
): RustType {
  const fields: FieldDef[] = [];
  const nested: StructDef[] = [];
  const usedFieldNames = new Set<string>();

  Object.entries(obj).forEach(([key, value], index) => {
    const childBase = toPascalCase(key) || 'Field';
    const child = inferType(ctx, value, childBase, path ? `${path}.${key}` : key);
    nested.push(...child.structs);

    let rustName = escapeKeyword(toSnakeCase(key) || `field_${index + 1}`);
    while (usedFieldNames.has(rustName)) {
      rustName = `${rustName}_${index + 1}`;
    }
    usedFieldNames.add(rustName);

    fields.push({
      rustName,
      jsonKey: key,
      typeExpression: wrappedExpression(child, ctx.optionWrap),
      needsRename: rustName !== key || !isValidIdent(key),
    });
  });

  const name = allocateName(ctx, suggestedName || 'Object');
  const def: StructDef = { name, fields };
  return {
    expression: name,
    structs: [...nested, def],
    nullable: false,
  };
}

/** 按可空与选项包裹类型表达式 */
function wrappedExpression(t: RustType, optionWrap: boolean): string {
  if (t.nullable && optionWrap) return `Option<${t.expression}>`;
  return t.expression;
}

/** 渲染单个结构体为 Rust 代码 */
function renderStruct(def: StructDef): string {
  const lines: string[] = [
    '#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]',
    `pub struct ${def.name} {`,
  ];
  for (const field of def.fields) {
    if (field.needsRename) {
      lines.push(`    #[serde(rename = ${JSON.stringify(field.jsonKey)})]`);
    }
    lines.push(`    pub ${field.rustName}: ${field.typeExpression},`);
  }
  lines.push('}');
  return lines.join('\n');
}

/**
 * 从 JSON 字符串生成 Rust 结构体代码
 *
 * @param jsonText - JSON 文本
 * @param options - 根名称与 Option 开关
 * @returns code 与 warnings；解析失败返回错误信息
 */
export function generateRust(
  jsonText: string,
  options: RustGenOptions = {},
): RustGenResult {
  const rootName = options.rootName?.trim() || 'Root';
  const optionWrap = options.optionWrap ?? true;

  const trimmed = jsonText.trim();
  if (!trimmed) {
    return { code: '', warnings: ['输入为空，未生成任何结构体'] };
  }

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch (e) {
    return {
      code: '',
      warnings: [`JSON 解析失败：${e instanceof Error ? e.message : String(e)}`],
    };
  }

  const rootStructName = toPascalCase(rootName) || 'Root';
  const ctx: GeneratorContext = { warnings: [], usedNames: new Map(), optionWrap };
  const rootType = inferType(ctx, data, rootStructName, '');

  const blocks: string[] = [];

  if (isPlainObject(data)) {
    // 根为对象：根结构体排在推断列表末尾，嵌套结构体在前
    for (const def of rootType.structs) blocks.push(renderStruct(def));
  } else {
    // 根为标量 / 数组 / null：生成包装结构体持有 data 字段
    for (const def of rootType.structs) blocks.push(renderStruct(def));
    const rootStruct: StructDef = {
      name: rootStructName,
      fields: [
        {
          rustName: 'data',
          jsonKey: 'data',
          typeExpression: wrappedExpression(rootType, optionWrap),
          needsRename: false,
        },
      ],
    };
    blocks.push(renderStruct(rootStruct));
    ctx.warnings.unshift('JSON 根节点不是对象，已生成单字段包装结构体（字段 data）');
  }

  return { code: blocks.join('\n\n'), warnings: ctx.warnings };
}
