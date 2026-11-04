/**
 * JSON → Kotlin data class 代码生成
 *
 * 纯函数、零依赖：解析 JSON 示例 → 推断结构 → 输出 Kotlin 源码文本。
 */

export interface KotlinGenOptions {
  rootName: string;
  /** 属性命名风格：保留原键（默认）或转 camelCase */
  propertyNaming: 'preserve' | 'camelCase';
  /** 可空类型后缀（String?） */
  nullableTypes: boolean;
  /** 集合使用 List<T>（false 时输出 Array<T>） */
  useList: boolean;
  packageName?: string;
}

export interface KotlinGenResult {
  code: string;
  warnings: string[];
}

type JsonValue = unknown;

interface ClassDef {
  name: string;
  fields: Map<string, KotlinType>;
  nullable: Set<string>;
  /** 属性名 → 原始 JSON 键（用于 @SerializedName） */
  jsonKeys: Map<string, string>;
  order: string[];
}

type KotlinType =
  | { kind: 'named'; name: string }
  | { kind: 'list'; element: KotlinType }
  | { kind: 'class'; def: ClassDef };

interface InferContext {
  warnings: string[];
  usedNames: Set<string>;
  classDefs: ClassDef[];
}

const OBJECT_TYPE: KotlinType = { kind: 'named', name: 'Any' };
const NULL_TYPE: KotlinType = { kind: 'named', name: '__null__' };

// Kotlin 硬关键字（作为属性名时必须用反引号转义）
const KOTLIN_HARD_KEYWORDS = new Set([
  'as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for', 'fun',
  'if', 'in', 'interface', 'is', 'null', 'object', 'package', 'return',
  'super', 'this', 'throw', 'true', 'try', 'typealias', 'typeof', 'val',
  'var', 'when', 'while',
]);

export function toPascalCase(raw: string): string {
  const parts = raw.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const name = parts
    .map((p) => (/^[0-9]/.test(p) ? `N${p}` : p.charAt(0).toUpperCase() + p.slice(1)))
    .join('');
  return name || 'Generated';
}

export function toCamelCase(raw: string): string {
  const parts = raw.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (parts.length === 0) return 'value';
  let name = parts
    .map((p, i) => {
      if (/^[0-9]/.test(p)) p = `n${p}`;
      return i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join('');
  if (KOTLIN_HARD_KEYWORDS.has(name)) name = `\`${name}\``;
  return name;
}

/** 按命名策略生成属性名；preserve 模式下非法/关键字属性用反引号转义 */
function toPropertyName(raw: string, naming: 'preserve' | 'camelCase'): string {
  if (naming === 'camelCase') return toCamelCase(raw);
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(raw) && !KOTLIN_HARD_KEYWORDS.has(raw)) return raw;
  // 退化为 camelCase（可被反引号安全引用的标识符）；仍无法表达时直接反引号包裹原键
  const camel = toCamelCase(raw);
  return camel === 'value' && raw !== 'value' ? `\`${raw.replace(/`/g, '``')}\`` : camel;
}

function sanitizeRootName(raw: string): string {
  const name = toPascalCase(raw.trim());
  return name === 'Generated' ? 'Root' : name;
}

function registerName(ctx: InferContext, base: string): string {
  let name = base;
  let suffix = 2;
  while (ctx.usedNames.has(name)) name = `${base}${suffix++}`;
  ctx.usedNames.add(name);
  return name;
}

function createClassDef(ctx: InferContext, nameBase: string): ClassDef {
  const def: ClassDef = {
    name: registerName(ctx, nameBase),
    fields: new Map(),
    nullable: new Set(),
    jsonKeys: new Map(),
    order: [],
  };
  ctx.classDefs.push(def);
  return def;
}

function singularize(word: string): string {
  if (word.endsWith('ies') && word.length > 3) return word.slice(0, -3) + 'y';
  if (['ses', 'xes', 'ches', 'shes'].some((s) => word.endsWith(s))) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function scalarType(value: JsonValue): KotlinType {
  if (value === null) return NULL_TYPE;
  switch (typeof value) {
    case 'string':
      return { kind: 'named', name: 'String' };
    case 'boolean':
      return { kind: 'named', name: 'Boolean' };
    case 'number': {
      const n = value as number;
      if (Number.isInteger(n)) {
        if (Number.isSafeInteger(n) && Math.abs(n) <= 0x7fffffff) return { kind: 'named', name: 'Int' };
        return { kind: 'named', name: 'Long' };
      }
      return { kind: 'named', name: 'Double' };
    }
    default:
      return OBJECT_TYPE;
  }
}

function isNullType(t: KotlinType): boolean {
  return t.kind === 'named' && t.name === '__null__';
}

function mergeType(a: KotlinType, b: KotlinType, ctx: InferContext, path: string): KotlinType {
  if (isNullType(a)) return b;
  if (isNullType(b)) return a;
  if (a.kind === 'named' && a.name === 'Any') return OBJECT_TYPE;
  if (b.kind === 'named' && b.name === 'Any') return OBJECT_TYPE;

  if (a.kind === 'named' && b.kind === 'named') {
    if (a.name === b.name) return a;
    const numeric: Record<string, number> = { Int: 1, Long: 2, Double: 3 };
    const ra = numeric[a.name];
    const rb = numeric[b.name];
    if (ra !== undefined && rb !== undefined) return ra >= rb ? a : b;
    ctx.warnings.push(`字段 "${path}" 类型冲突（${a.name} / ${b.name}），回退为 Any`);
    return OBJECT_TYPE;
  }

  if (a.kind === 'class' && b.kind === 'class') {
    const target = a.def;
    for (const key of b.def.order) {
      const bType = b.def.fields.get(key)!;
      const existing = target.fields.get(key);
      if (!existing) {
        target.order.push(key);
        target.fields.set(key, bType);
        target.jsonKeys.set(key, b.def.jsonKeys.get(key) ?? key);
        target.nullable.add(key);
      } else {
        target.fields.set(key, mergeType(existing, bType, ctx, `${path}.${key}`));
      }
      if (b.def.nullable.has(key)) target.nullable.add(key);
    }
    for (const key of a.def.order) if (!b.def.fields.has(key)) target.nullable.add(key);
    const idx = ctx.classDefs.indexOf(b.def);
    if (idx >= 0) ctx.classDefs.splice(idx, 1);
    return a;
  }

  if (a.kind === 'list' && b.kind === 'list') {
    return { kind: 'list', element: mergeType(a.element, b.element, ctx, `${path}[]`) };
  }

  ctx.warnings.push(`字段 "${path}" 类型冲突（${typeName(a, true, false)} / ${typeName(b, true, false)}），回退为 Any`);
  return OBJECT_TYPE;
}

function inferType(
  value: JsonValue,
  ctx: InferContext,
  nameBase: string,
  path: string,
  naming: 'preserve' | 'camelCase',
): KotlinType {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      ctx.warnings.push(`字段 "${path}" 为空数组，元素回退为 Any`);
      return { kind: 'list', element: OBJECT_TYPE };
    }
    let element = inferType(value[0], ctx, singularize(nameBase), `${path}[]`, naming);
    for (let i = 1; i < value.length; i++) {
      element = mergeType(
        element,
        inferType(value[i], ctx, singularize(nameBase), `${path}[]`, naming),
        ctx,
        path,
      );
    }
    return { kind: 'list', element };
  }
  if (value !== null && typeof value === 'object') {
    const def = createClassDef(ctx, nameBase);
    const obj = value as Record<string, JsonValue>;
    for (const key of Object.keys(obj)) {
      const prop = toPropertyName(key, naming);
      if (obj[key] === null) def.nullable.add(prop);
      if (prop !== key) def.jsonKeys.set(prop, key);
      const child = inferType(obj[key], ctx, toPascalCase(key), `${path}.${prop}`, naming);
      const existing = def.fields.get(prop);
      if (existing) def.fields.set(prop, mergeType(existing, child, ctx, `${path}.${prop}`));
      else {
        def.order.push(prop);
        def.fields.set(prop, child);
        def.jsonKeys.set(prop, key);
      }
    }
    return { kind: 'class', def };
  }
  return scalarType(value);
}

export function typeName(type: KotlinType, useList: boolean, nullable: boolean): string {
  let name: string;
  switch (type.kind) {
    case 'named':
      name = type.name === '__null__' ? 'Any' : type.name;
      break;
    case 'class':
      name = type.def.name;
      break;
    case 'list':
      name = useList
        ? `List<${typeName(type.element, useList, false)}>`
        : `Array<${typeName(type.element, useList, false)}>`;
      break;
  }
  return nullable ? `${name}? = null` : name;
}

function generateDataClass(def: ClassDef, opts: KotlinGenOptions, nested: boolean): string {
  const indent = nested ? '    ' : '';
  const lines: string[] = [`${indent}data class ${def.name}(`];
  def.order.forEach((key, i) => {
    const comma = i < def.order.length - 1 ? ',' : '';
    const rawKey = def.jsonKeys.get(key);
    if (rawKey && rawKey !== key) {
      lines.push(`${indent}    @SerializedName("${rawKey.replace(/"/g, '\\"')}")`);
    }
    const nullable = opts.nullableTypes && def.nullable.has(key);
    lines.push(`${indent}    val ${key}: ${typeName(def.fields.get(key)!, opts.useList, nullable)}${comma}`);
  });
  lines.push(`${indent})`);
  return lines.join('\n');
}

export function generateKotlin(jsonText: string, options: KotlinGenOptions): KotlinGenResult {
  const warnings: string[] = [];
  const trimmed = jsonText.trim();
  if (!trimmed) return { code: '', warnings };

  let data: JsonValue;
  try {
    data = JSON.parse(trimmed);
  } catch (err) {
    return { code: '', warnings: [`JSON 解析失败：${(err as Error).message}`] };
  }

  const rootName = sanitizeRootName(options.rootName || 'Root');
  const ctx: InferContext = { warnings, usedNames: new Set([rootName]), classDefs: [] };
  const naming = options.propertyNaming;

  let rootDef: ClassDef;
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    rootDef = { name: rootName, fields: new Map(), nullable: new Set(), jsonKeys: new Map(), order: [] };
    ctx.classDefs.push(rootDef);
    const obj = data as Record<string, JsonValue>;
    for (const key of Object.keys(obj)) {
      const prop = toPropertyName(key, naming);
      if (obj[key] === null) rootDef.nullable.add(prop);
      const child = inferType(obj[key], ctx, toPascalCase(key), prop, naming);
      const existing = rootDef.fields.get(prop);
      if (existing) rootDef.fields.set(prop, mergeType(existing, child, ctx, prop));
      else {
        rootDef.order.push(prop);
        rootDef.fields.set(prop, child);
      }
      rootDef.jsonKeys.set(prop, key);
    }
  } else if (Array.isArray(data)) {
    warnings.push('顶层 JSON 为数组，已包装为根对象的 items 字段');
    rootDef = { name: rootName, fields: new Map(), nullable: new Set(), jsonKeys: new Map(), order: ['items'] };
    ctx.classDefs.push(rootDef);
    rootDef.jsonKeys.set('items', 'items');
    let element = inferType(data[0] ?? null, ctx, 'Item', 'items[]', naming);
    for (let i = 1; i < data.length; i++) {
      element = mergeType(element, inferType(data[i], ctx, 'Item', 'items[]', naming), ctx, 'items');
    }
    rootDef.fields.set('items', { kind: 'list', element });
  } else {
    warnings.push('顶层 JSON 为标量，已包装为根对象的 value 字段');
    rootDef = { name: rootName, fields: new Map(), nullable: new Set(), jsonKeys: new Map(), order: ['value'] };
    ctx.classDefs.push(rootDef);
    rootDef.jsonKeys.set('value', 'value');
    rootDef.fields.set('value', scalarType(data));
  }

  // 嵌套类输出：根类内按声明顺序内嵌
  const nestedDefs = ctx.classDefs.filter((d) => d !== rootDef);

  const needsSerializedName =
    rootDef.jsonKeys.size > 0 &&
    [...rootDef.jsonKeys.entries()].some(([prop, key]) => prop !== key) ||
    nestedDefs.some((d) => [...d.jsonKeys.entries()].some(([prop, key]) => prop !== key));

  const header: string[] = [];
  if (options.packageName?.trim()) header.push(`package ${options.packageName.trim()}`, '');
  if (needsSerializedName) header.push('import com.google.gson.annotations.SerializedName', '');

  const body: string[] = [];
  body.push('');
  body.push(`data class ${rootDef.name}(`);
  for (const key of rootDef.order) {
    const rawKey = rootDef.jsonKeys.get(key);
    if (rawKey && rawKey !== key) {
      body.push(`    @SerializedName("${rawKey.replace(/"/g, '\\"')}")`);
    }
    const nullable = options.nullableTypes && rootDef.nullable.has(key);
    body.push(`    val ${key}: ${typeName(rootDef.fields.get(key)!, options.useList, nullable)},`);
  }
  if (nestedDefs.length > 0) {
    body.push(') {');
    nestedDefs.forEach((def, idx) => {
      const classText = generateDataClass(def, options, true);
      body.push(classText);
      if (idx < nestedDefs.length - 1) body.push('');
    });
    body.push('}');
  } else {
    body.push(')');
  }

  return { code: `${header.join('\n')}${body.join('\n')}\n`, warnings };
}
