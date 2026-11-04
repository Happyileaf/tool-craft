/**
 * JSON → Swift struct / Codable 代码生成
 *
 * 纯函数、零依赖：解析 JSON 示例 → 推断结构 → 输出 Swift 源码文本。
 */

export interface SwiftGenOptions {
  rootName: string;
  /** 属性命名风格：保留原键（仅合法标识符）或统一转 camelCase */
  propertyNaming: 'preserve' | 'camelCase';
  /** 可选类型：出现 null 或缺字段时输出 T? */
  optionalTypes: boolean;
  /** 是否生成 CodingKeys（仅在存在改名键时输出） */
  codingKeys: boolean;
}

export interface SwiftGenResult {
  code: string;
  warnings: string[];
}

type JsonValue = unknown;

interface StructDef {
  name: string;
  fields: Map<string, SwiftType>;
  optional: Set<string>;
  /** 属性名 → 原始 JSON 键（用于 CodingKeys） */
  jsonKeys: Map<string, string>;
  order: string[];
}

type SwiftType =
  | { kind: 'named'; name: string }
  | { kind: 'array'; element: SwiftType }
  | { kind: 'struct'; def: StructDef };

interface InferContext {
  warnings: string[];
  usedNames: Set<string>;
  structDefs: StructDef[];
}

const ANY_TYPE: SwiftType = { kind: 'named', name: 'Any' };
const NULL_TYPE: SwiftType = { kind: 'named', name: '__null__' };

// Swift 关键字（作为属性名时需反引号转义）
const SWIFT_KEYWORDS = new Set([
  'associatedtype', 'class', 'deinit', 'enum', 'extension', 'fileprivate',
  'func', 'import', 'init', 'inout', 'internal', 'let', 'open', 'operator',
  'private', 'protocol', 'public', 'rethrows', 'static', 'struct', 'subscript',
  'typealias', 'var', 'break', 'case', 'continue', 'default', 'defer', 'do',
  'else', 'fallthrough', 'for', 'guard', 'if', 'in', 'repeat', 'return',
  'switch', 'where', 'while', 'as', 'Any', 'false', 'is', 'nil', 'self',
  'Self', 'super', 'throw', 'throws', 'true', 'try',
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
  if (SWIFT_KEYWORDS.has(name)) name = `\`${name}\``;
  return name;
}

/** 按命名策略生成属性名；preserve 模式下非法/关键字属性退化为 camelCase */
function toPropertyName(raw: string, naming: 'preserve' | 'camelCase'): string {
  if (naming === 'camelCase') return toCamelCase(raw);
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(raw) && !SWIFT_KEYWORDS.has(raw)) return raw;
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

function createStructDef(ctx: InferContext, nameBase: string): StructDef {
  const def: StructDef = {
    name: registerName(ctx, nameBase),
    fields: new Map(),
    optional: new Set(),
    jsonKeys: new Map(),
    order: [],
  };
  ctx.structDefs.push(def);
  return def;
}

function singularize(word: string): string {
  if (word.endsWith('ies') && word.length > 3) return word.slice(0, -3) + 'y';
  if (['ses', 'xes', 'ches', 'shes'].some((s) => word.endsWith(s))) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function scalarType(value: JsonValue): SwiftType {
  if (value === null) return NULL_TYPE;
  switch (typeof value) {
    case 'string':
      return { kind: 'named', name: 'String' };
    case 'boolean':
      return { kind: 'named', name: 'Bool' };
    case 'number':
      return Number.isInteger(value as number)
        ? { kind: 'named', name: 'Int' }
        : { kind: 'named', name: 'Double' };
    default:
      return ANY_TYPE;
  }
}

function isNullType(t: SwiftType): boolean {
  return t.kind === 'named' && t.name === '__null__';
}

function mergeType(a: SwiftType, b: SwiftType, ctx: InferContext, path: string): SwiftType {
  if (isNullType(a)) return b;
  if (isNullType(b)) return a;
  if (a.kind === 'named' && a.name === 'Any') return ANY_TYPE;
  if (b.kind === 'named' && b.name === 'Any') return ANY_TYPE;

  if (a.kind === 'named' && b.kind === 'named') {
    if (a.name === b.name) return a;
    const numeric: Record<string, number> = { Int: 1, Double: 2 };
    const ra = numeric[a.name];
    const rb = numeric[b.name];
    if (ra !== undefined && rb !== undefined) return ra >= rb ? a : b;
    ctx.warnings.push(`字段 "${path}" 类型冲突（${a.name} / ${b.name}），回退为 Any`);
    return ANY_TYPE;
  }

  if (a.kind === 'struct' && b.kind === 'struct') {
    const target = a.def;
    for (const key of b.def.order) {
      const bType = b.def.fields.get(key)!;
      const existing = target.fields.get(key);
      if (!existing) {
        target.order.push(key);
        target.fields.set(key, bType);
        target.jsonKeys.set(key, b.def.jsonKeys.get(key) ?? key);
        target.optional.add(key);
      } else {
        target.fields.set(key, mergeType(existing, bType, ctx, `${path}.${key}`));
      }
      if (b.def.optional.has(key)) target.optional.add(key);
    }
    for (const key of a.def.order) if (!b.def.fields.has(key)) target.optional.add(key);
    const idx = ctx.structDefs.indexOf(b.def);
    if (idx >= 0) ctx.structDefs.splice(idx, 1);
    return a;
  }

  if (a.kind === 'array' && b.kind === 'array') {
    return { kind: 'array', element: mergeType(a.element, b.element, ctx, `${path}[]`) };
  }

  ctx.warnings.push(`字段 "${path}" 类型冲突（${typeName(a, false)} / ${typeName(b, false)}），回退为 Any`);
  return ANY_TYPE;
}

function inferType(
  value: JsonValue,
  ctx: InferContext,
  nameBase: string,
  path: string,
  naming: 'preserve' | 'camelCase',
): SwiftType {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      ctx.warnings.push(`字段 "${path}" 为空数组，元素回退为 Any`);
      return { kind: 'array', element: ANY_TYPE };
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
    return { kind: 'array', element };
  }
  if (value !== null && typeof value === 'object') {
    const def = createStructDef(ctx, nameBase);
    const obj = value as Record<string, JsonValue>;
    for (const key of Object.keys(obj)) {
      const prop = toPropertyName(key, naming);
      if (obj[key] === null) def.optional.add(prop);
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
    return { kind: 'struct', def };
  }
  return scalarType(value);
}

export function typeName(type: SwiftType, optional: boolean): string {
  let name: string;
  switch (type.kind) {
    case 'named':
      name = type.name === '__null__' ? 'Any' : type.name;
      break;
    case 'struct':
      name = type.def.name;
      break;
    case 'array':
      name = `[${typeName(type.element, false)}]`;
      break;
  }
  return optional ? `${name}?` : name;
}

function generateStruct(def: StructDef, opts: SwiftGenOptions, nested: boolean): string {
  const indent = nested ? '    ' : '';
  const lines: string[] = [`${indent}struct ${def.name}: Codable {`];
  def.order.forEach((key) => {
    const optional = opts.optionalTypes && def.optional.has(key);
    lines.push(`${indent}    let ${key}: ${typeName(def.fields.get(key)!, optional)}`);
  });

  const renamed = [...def.jsonKeys.entries()].filter(([prop, key]) => prop !== key);
  if (opts.codingKeys && renamed.length > 0) {
    lines.push('');
    lines.push(`${indent}    enum CodingKeys: String, CodingKey {`);
    for (const [prop, key] of renamed) {
      lines.push(`${indent}        case ${prop} = "${key.replace(/"/g, '\\"')}"`);
    }
    // 未改名的键也需在 CodingKeys 中声明
    for (const key of def.order) {
      if (!def.jsonKeys.get(key) || def.jsonKeys.get(key) === key) {
        lines.push(`${indent}        case ${key}`);
      }
    }
    lines.push(`${indent}    }`);
  }

  lines.push(`${indent}}`);
  return lines.join('\n');
}

export function generateSwift(jsonText: string, options: SwiftGenOptions): SwiftGenResult {
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
  const ctx: InferContext = { warnings, usedNames: new Set([rootName]), structDefs: [] };
  const naming = options.propertyNaming;

  let rootDef: StructDef;
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    rootDef = { name: rootName, fields: new Map(), optional: new Set(), jsonKeys: new Map(), order: [] };
    ctx.structDefs.push(rootDef);
    const obj = data as Record<string, JsonValue>;
    for (const key of Object.keys(obj)) {
      const prop = toPropertyName(key, naming);
      if (obj[key] === null) rootDef.optional.add(prop);
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
    warnings.push('顶层 JSON 为数组，已包装为根结构体的 items 字段');
    rootDef = {
      name: rootName,
      fields: new Map(),
      optional: new Set(),
      jsonKeys: new Map([['items', 'items']]),
      order: ['items'],
    };
    ctx.structDefs.push(rootDef);
    let element = inferType(data[0] ?? null, ctx, 'Item', 'items[]', naming);
    for (let i = 1; i < data.length; i++) {
      element = mergeType(element, inferType(data[i], ctx, 'Item', 'items[]', naming), ctx, 'items');
    }
    rootDef.fields.set('items', { kind: 'array', element });
  } else {
    warnings.push('顶层 JSON 为标量，已包装为根结构体的 value 字段');
    rootDef = {
      name: rootName,
      fields: new Map([['value', scalarType(data)]]),
      optional: new Set(),
      jsonKeys: new Map([['value', 'value']]),
      order: ['value'],
    };
    ctx.structDefs.push(rootDef);
  }

  const nestedDefs = ctx.structDefs.filter((d) => d !== rootDef);

  const blocks: string[] = [generateStruct(rootDef, options, false)];
  if (nestedDefs.length > 0) {
    // 嵌套 struct 放在根结构体之外、按声明顺序平铺
    blocks.push('');
    nestedDefs.forEach((def) => blocks.push(generateStruct(def, options, false), ''));
  }

  const code = `${blocks.join('\n').replace(/\n$/, '')}\n`;
  return { code, warnings };
}
