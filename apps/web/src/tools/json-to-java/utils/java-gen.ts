/**
 * JSON → Java（class / record）代码生成
 *
 * 纯函数、零依赖：解析 JSON 示例 → 推断结构 → 输出 Java 源码文本。
 */

export interface JavaGenOptions {
  /** 根类名 */
  rootName: string;
  /** 输出风格：record（Java 16+）或 class（POJO） */
  style: 'record' | 'class';
  /** 集合使用 List<T>（true）或数组 T[]（false） */
  useList: boolean;
  /** 大整数/大小数使用 BigInteger/BigDecimal */
  useBigNumbers: boolean;
  /** 可选包名 */
  packageName?: string;
}

export interface JavaGenResult {
  code: string;
  warnings: string[];
}

type JsonValue = unknown;

interface ClassDef {
  name: string;
  /** 字段名 → 推断类型 */
  fields: Map<string, JavaType>;
  /** 出现过 null 的字段名集合 */
  nullable: Set<string>;
  /** 字段原始顺序 */
  order: string[];
}

type JavaType =
  | { kind: 'primitive'; name: string; boxed: string }
  | { kind: 'string' }
  | { kind: 'Object' }
  | { kind: 'null' }
  | { kind: 'list'; element: JavaType }
  | { kind: 'class'; def: ClassDef; external?: string };

const NULL_TYPE: JavaType = { kind: 'null' };

interface InferContext {
  warnings: string[];
  usedNames: Set<string>;
  classDefs: ClassDef[];
  useBigNumbers: boolean;
}

const PRIMITIVES = {
  int: { kind: 'primitive', name: 'int', boxed: 'Integer' },
  long: { kind: 'primitive', name: 'long', boxed: 'Long' },
  double: { kind: 'primitive', name: 'double', boxed: 'Double' },
  boolean: { kind: 'primitive', name: 'boolean', boxed: 'Boolean' },
} as const;

const OBJECT_TYPE: JavaType = { kind: 'Object' };

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
  'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
  'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
  'package', 'private', 'protected', 'public', 'return', 'short', 'static',
  'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
  'transient', 'try', 'void', 'volatile', 'while',
  'true', 'false', 'null',
]);

export function isValidJavaIdentifier(name: string): boolean {
  if (!name || JAVA_KEYWORDS.has(name)) return false;
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

/**
 * 将任意 JSON 键转换为合法 Java 字段标识符（小驼峰）。
 * 非法字符按词分隔；首字符为数字时补 n 前缀；关键字追加 Field。
 */
export function toJavaFieldName(raw: string): string {
  const parts = raw.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  let name: string;
  if (parts.length === 0) {
    name = 'field';
  } else {
    name = parts
      .map((p, i) => {
        if (/^[0-9]/.test(p)) p = `n${p}`;
        return i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1);
      })
      .join('');
  }
  if (JAVA_KEYWORDS.has(name)) name = `${name}Field`;
  return name;
}

/** 键 → 大驼峰类名 */
export function toJavaClassName(raw: string): string {
  const parts = raw.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  let name =
    parts
      .map((p) => (/^[0-9]/.test(p) ? `N${p}` : p.charAt(0).toUpperCase() + p.slice(1)))
      .join('') || 'Generated';
  if (JAVA_KEYWORDS.has(name)) name = `${name}Type`;
  return name;
}

/** 修正用户输入的根类名 */
function sanitizeRootName(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return 'Root';
  const name = toJavaClassName(cleaned);
  return /^[A-Z]/.test(name) ? name : name.charAt(0).toUpperCase() + name.slice(1);
}

function registerClassName(ctx: InferContext, base: string): string {
  let name = base;
  let suffix = 2;
  while (ctx.usedNames.has(name)) {
    name = `${base}${suffix++}`;
  }
  ctx.usedNames.add(name);
  return name;
}

function createClassDef(ctx: InferContext, nameBase: string): ClassDef {
  const def: ClassDef = {
    name: registerClassName(ctx, nameBase),
    fields: new Map(),
    nullable: new Set(),
    order: [],
  };
  ctx.classDefs.push(def);
  return def;
}

/** java.math 等外部类复用同一个占位 ClassDef（不生成源码） */
function externalClassDef(ctx: InferContext, fqn: string): ClassDef {
  const simple = fqn.split('.').pop()!;
  for (const def of ctx.classDefs) {
    if (def.name === fqn) return def;
  }
  const def: ClassDef = { name: fqn, fields: new Map(), nullable: new Set(), order: [] };
  ctx.classDefs.push(def);
  // 占用简单名避免与生成类冲突
  if (!ctx.usedNames.has(simple)) ctx.usedNames.add(simple);
  return def;
}

/** 合并两个同位置推断类型；冲突时向 Object 兜底 */
function mergeType(a: JavaType, b: JavaType, ctx: InferContext, path: string): JavaType {
  if (a.kind === 'null') return b;
  if (b.kind === 'null') return a;
  if (a.kind === 'Object' || b.kind === 'Object') return OBJECT_TYPE;
  if (a.kind === b.kind && a.kind === 'string') return a;

  if (a.kind === 'primitive' && b.kind === 'primitive') {
    if (a.name === b.name) return a;
    const numeric: Record<string, number> = { int: 1, long: 2, double: 3 };
    const rankA = numeric[a.name];
    const rankB = numeric[b.name];
    if (rankA !== undefined && rankB !== undefined) {
      return rankA >= rankB ? a : b;
    }
    ctx.warnings.push(`字段 "${path}" 类型冲突（${a.name} / ${b.name}），回退为 Object`);
    return OBJECT_TYPE;
  }

  if (a.kind === 'class' && b.kind === 'class') {
    if (a.external || b.external) {
      if (a.def.name === b.def.name) return a;
      ctx.warnings.push(`字段 "${path}" 类型冲突（${a.def.name} / ${b.def.name}），回退为 Object`);
      return OBJECT_TYPE;
    }
    const target = a.def;
    for (const key of b.def.order) {
      const bType = b.def.fields.get(key)!;
      const existing = target.fields.get(key);
      if (!existing) {
        // 该字段仅出现在部分数组元素中，对其他元素等同缺失/可空
        target.order.push(key);
        target.fields.set(key, bType);
        target.nullable.add(key);
      } else {
        target.fields.set(key, mergeType(existing, bType, ctx, `${path}.${key}`));
      }
      if (b.def.nullable.has(key)) target.nullable.add(key);
    }
    // 仅出现在 a 而 b 缺失的字段同样可空
    for (const key of a.def.order) {
      if (!b.def.fields.has(key)) target.nullable.add(key);
    }
    // b 已合并进 a，移除其孤立定义，避免重复输出
    const idx = ctx.classDefs.indexOf(b.def);
    if (idx >= 0) ctx.classDefs.splice(idx, 1);
    return a;
  }

  if (a.kind === 'list' && b.kind === 'list') {
    return { kind: 'list', element: mergeType(a.element, b.element, ctx, `${path}[]`) };
  }

  ctx.warnings.push(`字段 "${path}" 类型冲突（${typeName(a)} / ${typeName(b)}），回退为 Object`);
  return OBJECT_TYPE;
}

/** 简单的英文单数化（用于数组元素类名） */
function singularize(word: string): string {
  if (word.endsWith('ies') && word.length > 3) return word.slice(0, -3) + 'y';
  if (word.endsWith('ses') || word.endsWith('xes') || word.endsWith('ches') || word.endsWith('shes')) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function inferScalar(value: JsonValue, ctx: InferContext): JavaType {
  if (value === null) return NULL_TYPE;
  switch (typeof value) {
    case 'string':
      return { kind: 'string' };
    case 'boolean':
      return PRIMITIVES.boolean;
    case 'number': {
      const n = value as number;
      if (Number.isInteger(n)) {
        if (ctx.useBigNumbers && !Number.isSafeInteger(n)) {
          return { kind: 'class', def: externalClassDef(ctx, 'java.math.BigInteger'), external: 'java.math.BigInteger' };
        }
        return Number.isSafeInteger(n) && Math.abs(n) <= 0x7fffffff ? PRIMITIVES.int : PRIMITIVES.long;
      }
      if (ctx.useBigNumbers) {
        return { kind: 'class', def: externalClassDef(ctx, 'java.math.BigDecimal'), external: 'java.math.BigDecimal' };
      }
      return PRIMITIVES.double;
    }
    default:
      return OBJECT_TYPE;
  }
}

function inferType(value: JsonValue, ctx: InferContext, nameBase: string, path: string): JavaType {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      ctx.warnings.push(`字段 "${path}" 为空数组，元素回退为 Object`);
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
      const fieldName = toJavaFieldName(key);
      const child = obj[key];
      if (child === null) def.nullable.add(fieldName);
      const childType = inferType(child, ctx, toJavaClassName(key), `${path}.${fieldName}`);
      const existing = def.fields.get(fieldName);
      if (existing) {
        def.fields.set(fieldName, mergeType(existing, childType, ctx, `${path}.${fieldName}`));
      } else {
        def.order.push(fieldName);
        def.fields.set(fieldName, childType);
      }
    }
    return { kind: 'class', def };
  }

  return inferScalar(value, ctx);
}

/** 生成字段的类型名；nullable 原始类型使用包装类型 */
export function typeName(type: JavaType, useList = true, nullable = false): string {
  switch (type.kind) {
    case 'primitive':
      return nullable ? type.boxed : type.name;
    case 'string':
      return 'String';
    case 'Object':
      return 'Object';
    case 'null':
      return 'Object';
    case 'class':
      return type.def.name.includes('.') ? type.def.name.split('.').pop()! : type.def.name;
    case 'list': {
      const elementName = typeName(type.element, useList, false);
      return useList ? `List<${elementName}>` : `${elementName}[]`;
    }
  }
}

function generateRecord(def: ClassDef, useList: boolean, nested: boolean): string {
  const components = def.order
    .map((key) => `  ${typeName(def.fields.get(key)!, useList, def.nullable.has(key))} ${key}`)
    .join(',\n');
  return `${nested ? 'public static ' : 'public '}record ${def.name}(\n${components}\n) {}`;
}

function accessorSuffix(key: string): string {
  if (/^is[A-Z]/.test(key)) return key.slice(2);
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** boolean 且字段名已是 isXxx 时直接用字段名作 getter，否则 is + 大写字段名；其余类型 getXxx */
function getterName(typeText: string, key: string): string {
  if (typeText === 'boolean') return /^is[A-Z]/.test(key) ? key : `is${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  return `get${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}

function generateClass(def: ClassDef, useList: boolean, nested: boolean): string {
  const lines: string[] = [`${nested ? 'public static ' : 'public '}class ${def.name} {`];
  for (const key of def.order) {
    lines.push(`    private ${typeName(def.fields.get(key)!, useList, def.nullable.has(key))} ${key};`);
  }
  lines.push('');
  for (const key of def.order) {
    const typeText = typeName(def.fields.get(key)!, useList, def.nullable.has(key));
    const suffix = accessorSuffix(key);
    lines.push(`    public ${typeText} ${getterName(typeText, key)}() {`);
    lines.push(`        return ${key};`);
    lines.push('    }');
    lines.push('');
    lines.push(`    public void set${suffix}(${typeText} ${key}) {`);
    lines.push(`        this.${key} = ${key};`);
    lines.push('    }');
    lines.push('');
  }
  lines.push('}');
  return lines.join('\n');
}

/**
 * 主入口：解析 JSON 文本并生成 Java 源码。
 */
export function generateJava(jsonText: string, options: JavaGenOptions): JavaGenResult {
  const warnings: string[] = [];
  const trimmed = jsonText.trim();
  if (!trimmed) return { code: '', warnings };

  let data: JsonValue;
  try {
    data = JSON.parse(trimmed);
  } catch (err) {
    return { code: '', warnings: [`JSON 解析失败：${(err as Error).message}`] };
  }

  const rootName = sanitizeRootName(options.rootName);
  const ctx: InferContext = {
    warnings,
    usedNames: new Set([rootName]),
    classDefs: [],
    useBigNumbers: options.useBigNumbers,
  };

  let rootDef: ClassDef;
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    rootDef = { name: rootName, fields: new Map(), nullable: new Set(), order: [] };
    ctx.classDefs.push(rootDef);
    const obj = data as Record<string, JsonValue>;
    for (const key of Object.keys(obj)) {
      const fieldName = toJavaFieldName(key);
      if (obj[key] === null) rootDef.nullable.add(fieldName);
      const childType = inferType(obj[key], ctx, toJavaClassName(key), fieldName);
      const existing = rootDef.fields.get(fieldName);
      if (existing) {
        rootDef.fields.set(fieldName, mergeType(existing, childType, ctx, fieldName));
      } else {
        rootDef.order.push(fieldName);
        rootDef.fields.set(fieldName, childType);
      }
    }
  } else if (Array.isArray(data)) {
    warnings.push('顶层 JSON 为数组，已包装为根对象的 items 字段');
    rootDef = { name: rootName, fields: new Map(), nullable: new Set(), order: ['items'] };
    ctx.classDefs.push(rootDef);
    let element = inferType(data[0] ?? null, ctx, 'Item', 'items[]');
    for (let i = 1; i < data.length; i++) {
      element = mergeType(element, inferType(data[i], ctx, 'Item', 'items[]'), ctx, 'items');
    }
    rootDef.fields.set('items', { kind: 'list', element });
  } else {
    warnings.push('顶层 JSON 为标量，已包装为根对象的 value 字段');
    rootDef = { name: rootName, fields: new Map(), nullable: new Set(), order: ['value'] };
    ctx.classDefs.push(rootDef);
    rootDef.fields.set('value', inferScalar(data, ctx));
  }

  const generated = ctx.classDefs.filter((d) => d === rootDef || !d.name.includes('.'));

  const imports = new Set<string>();
  let needsList = false;
  let needsBigInteger = false;
  let needsBigDecimal = false;
  const scan = (def: ClassDef, seen: Set<ClassDef>) => {
    if (seen.has(def)) return;
    seen.add(def);
    for (const type of def.fields.values()) {
      if (type.kind === 'list') {
        needsList = true;
        if (type.element.kind === 'class') {
          if (type.element.external === 'java.math.BigInteger') needsBigInteger = true;
          else if (type.element.external === 'java.math.BigDecimal') needsBigDecimal = true;
          else if (!type.element.def.name.includes('.')) scan(type.element.def, seen);
        }
      } else if (type.kind === 'class') {
        if (type.external === 'java.math.BigInteger') needsBigInteger = true;
        else if (type.external === 'java.math.BigDecimal') needsBigDecimal = true;
        else if (!type.def.name.includes('.')) scan(type.def, seen);
      }
    }
  };
  for (const def of generated) scan(def, new Set());
  if (options.useList && needsList) imports.add('java.util.List');
  if (needsBigInteger) imports.add('java.math.BigInteger');
  if (needsBigDecimal) imports.add('java.math.BigDecimal');

  const body: string[] = [];
  const emitter = options.style === 'record' ? generateRecord : generateClass;
  body.push(emitter(rootDef, options.useList, false));
  for (const def of generated) {
    if (def !== rootDef) {
      body.push('');
      body.push(emitter(def, options.useList, true));
    }
  }

  const header: string[] = [];
  if (options.packageName?.trim()) header.push(`package ${options.packageName.trim()};`, '');
  if (imports.size > 0) {
    [...imports].sort().forEach((i) => header.push(`import ${i};`));
    header.push('');
  }

  return { code: `${header.join('\n')}${body.join('\n')}\n`, warnings };
}
