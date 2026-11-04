/**
 * JSON → C#（record / class）代码生成
 *
 * 纯函数、零依赖：解析 JSON 示例 → 推断结构 → 输出 C# 源码文本。
 */

export interface CSharpGenOptions {
  rootName: string;
  /** record（主构造函数，C# 10+）或 class（{ get; set; } 属性） */
  style: 'record' | 'class';
  /** 可空引用类型启用（string? / List<T>?） */
  nullableRefTypes: boolean;
  namespace?: string;
}

export interface CSharpGenResult {
  code: string;
  warnings: string[];
}

type JsonValue = unknown;

interface ClassDef {
  name: string;
  fields: Map<string, CsType>;
  nullable: Set<string>;
  order: string[];
}

type CsType =
  | { kind: 'named'; name: string }
  | { kind: 'list'; element: CsType }
  | { kind: 'class'; def: ClassDef };

interface InferContext {
  warnings: string[];
  usedNames: Set<string>;
  classDefs: ClassDef[];
}

const OBJECT_TYPE: CsType = { kind: 'named', name: 'object' };
const NULL_TYPE: CsType = { kind: 'named', name: '__null__' };

// C# 保留关键字（上下文关键字如 record/var 不强制转义，但一并规避常见者）
const CS_KEYWORDS = new Set([
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char',
  'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate',
  'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false',
  'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit',
  'in', 'int', 'interface', 'internal', 'is', 'lock', 'long', 'namespace',
  'new', 'null', 'object', 'operator', 'out', 'override', 'params', 'private',
  'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed',
  'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch',
  'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked',
  'unsafe', 'ushort', 'using', 'virtual', 'void', 'volatile', 'while',
]);

export function toPascalCase(raw: string): string {
  const parts = raw.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  let name = parts
    .map((p) => (/^[0-9]/.test(p) ? `N${p}` : p.charAt(0).toUpperCase() + p.slice(1)))
    .join('');
  return name || 'Generated';
}

/** JSON 键 → C# 属性名（PascalCase），关键字加 @ 前缀 */
export function toPropertyName(raw: string): string {
  let name = toPascalCase(raw);
  if (name === 'Generated') name = 'Property';
  if (CS_KEYWORDS.has(name.toLowerCase())) name = `@${name}`;
  return name;
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
  const def: ClassDef = { name: registerName(ctx, nameBase), fields: new Map(), nullable: new Set(), order: [] };
  ctx.classDefs.push(def);
  return def;
}

function singularize(word: string): string {
  if (word.endsWith('ies') && word.length > 3) return word.slice(0, -3) + 'y';
  if (['ses', 'xes', 'ches', 'shes'].some((s) => word.endsWith(s))) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function scalarType(value: JsonValue): CsType {
  if (value === null) return NULL_TYPE;
  switch (typeof value) {
    case 'string':
      return { kind: 'named', name: 'string' };
    case 'boolean':
      return { kind: 'named', name: 'bool' };
    case 'number': {
      const n = value as number;
      if (Number.isInteger(n)) {
        if (Number.isSafeInteger(n) && Math.abs(n) <= 0x7fffffff) return { kind: 'named', name: 'int' };
        return { kind: 'named', name: 'long' };
      }
      return { kind: 'named', name: 'double' };
    }
    default:
      return OBJECT_TYPE;
  }
}

function isNullableNamed(t: CsType): boolean {
  return t.kind === 'named' && t.name === '__null__';
}

function mergeType(a: CsType, b: CsType, ctx: InferContext, path: string): CsType {
  if (isNullableNamed(a)) return b;
  if (isNullableNamed(b)) return a;
  if (
    (a.kind === 'named' && a.name === 'object') ||
    (b.kind === 'named' && b.name === 'object')
  ) {
    return OBJECT_TYPE;
  }

  if (a.kind === 'named' && b.kind === 'named') {
    if (a.name === b.name) return a;
    const numeric: Record<string, number> = { int: 1, long: 2, double: 3 };
    const ra = numeric[a.name];
    const rb = numeric[b.name];
    if (ra !== undefined && rb !== undefined) return ra >= rb ? a : b;
    ctx.warnings.push(`字段 "${path}" 类型冲突（${a.name} / ${b.name}），回退为 object`);
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

  ctx.warnings.push(
    `字段 "${path}" 类型冲突（${typeName(a, false, false)} / ${typeName(b, false, false)}），回退为 object`,
  );
  return OBJECT_TYPE;
}

function inferType(value: JsonValue, ctx: InferContext, nameBase: string, path: string): CsType {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      ctx.warnings.push(`字段 "${path}" 为空数组，元素回退为 object`);
      return { kind: 'list', element: OBJECT_TYPE };
    }
    let element = inferType(value[0], ctx, singularize(nameBase), `${path}[]`);
    for (let i = 1; i < value.length; i++) {
      element = mergeType(element, inferType(value[i], ctx, singularize(nameBase), `${path}[]`), ctx, path);
    }
    return { kind: 'list', element };
  }
  if (value !== null && typeof value === 'object') {
    const def = createClassDef(ctx, nameBase);
    const obj = value as Record<string, JsonValue>;
    for (const key of Object.keys(obj)) {
      const prop = toPropertyName(key);
      if (obj[key] === null) def.nullable.add(prop);
      const child = inferType(obj[key], ctx, toPascalCase(key), `${path}.${prop}`);
      const existing = def.fields.get(prop);
      if (existing) def.fields.set(prop, mergeType(existing, child, ctx, `${path}.${prop}`));
      else {
        def.order.push(prop);
        def.fields.set(prop, child);
      }
    }
    return { kind: 'class', def };
  }
  return scalarType(value);
}

const VALUE_TYPES = new Set(['int', 'long', 'double', 'bool', 'object']);

/** 生成字段类型文本；nullable 时值类型加 ?，引用类型按开关加 ? */
export function typeName(type: CsType, nullable: boolean, nullableRefTypes: boolean): string {
  let name: string;
  switch (type.kind) {
    case 'named':
      name = type.name === '__null__' ? 'object' : type.name;
      break;
    case 'class':
      name = type.def.name;
      break;
    case 'list':
      name = `List<${typeName(type.element, false, nullableRefTypes)}>`;
      break;
  }
  if (!nullable) return name;
  // 值类型始终可空标注；引用类型（含 object）在 NRT 开启时标注
  const isValueType = type.kind === 'named' && VALUE_TYPES.has(name) && name !== 'object';
  if (isValueType || nullableRefTypes) return `${name}?`;
  return name;
}

function generateRecord(def: ClassDef, nrt: boolean, nested: boolean): string {
  const head = `${nested ? 'public sealed ' : 'public '}record ${def.name}(`;
  const params = def.order
    .map((key) => `    ${typeName(def.fields.get(key)!, def.nullable.has(key), nrt)} ${key}`)
    .join(',\n');
  return `${head}\n${params}\n);`;
}

function generateClass(def: ClassDef, nrt: boolean, nested: boolean): string {
  const lines: string[] = [`${nested ? 'public sealed ' : 'public '}class ${def.name}`, '{'];
  for (const key of def.order) {
    lines.push(`    public ${typeName(def.fields.get(key)!, def.nullable.has(key), nrt)} ${key} { get; set; }`);
  }
  lines.push('}');
  return lines.join('\n');
}

export function generateCSharp(jsonText: string, options: CSharpGenOptions): CSharpGenResult {
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

  let rootDef: ClassDef;
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    rootDef = { name: rootName, fields: new Map(), nullable: new Set(), order: [] };
    ctx.classDefs.push(rootDef);
    const obj = data as Record<string, JsonValue>;
    for (const key of Object.keys(obj)) {
      const prop = toPropertyName(key);
      if (obj[key] === null) rootDef.nullable.add(prop);
      const child = inferType(obj[key], ctx, toPascalCase(key), prop);
      const existing = rootDef.fields.get(prop);
      if (existing) rootDef.fields.set(prop, mergeType(existing, child, ctx, prop));
      else {
        rootDef.order.push(prop);
        rootDef.fields.set(prop, child);
      }
    }
  } else if (Array.isArray(data)) {
    warnings.push('顶层 JSON 为数组，已包装为根对象的 Items 属性');
    rootDef = { name: rootName, fields: new Map(), nullable: new Set(), order: ['Items'] };
    ctx.classDefs.push(rootDef);
    let element = inferType(data[0] ?? null, ctx, 'Item', 'Items[]');
    for (let i = 1; i < data.length; i++) {
      element = mergeType(element, inferType(data[i], ctx, 'Item', 'Items[]'), ctx, 'Items');
    }
    rootDef.fields.set('Items', { kind: 'list', element });
  } else {
    warnings.push('顶层 JSON 为标量，已包装为根对象的 Value 属性');
    rootDef = { name: rootName, fields: new Map(), nullable: new Set(), order: ['Value'] };
    ctx.classDefs.push(rootDef);
    rootDef.fields.set('Value', scalarType(data));
  }

  const generated = ctx.classDefs;
  const imports = ['using System;', 'using System.Collections.Generic;'];

  const emitter = options.style === 'record' ? generateRecord : generateClass;
  const body: string[] = [emitter(rootDef, options.nullableRefTypes, false)];
  for (const def of generated) {
    if (def !== rootDef) {
      body.push('');
      body.push(emitter(def, options.nullableRefTypes, true));
    }
  }

  const header: string[] = [];
  header.push(imports.join('\n'));
  if (options.nullableRefTypes) header.push('#nullable enable');
  if (options.namespace?.trim()) header.push(`namespace ${options.namespace.trim()};`, '');
  else header.push('');

  return { code: `${header.join('\n')}${body.join('\n')}\n`, warnings };
}
