/**
 * JSON → C++17 struct 生成纯函数集合。
 *
 * 本模块不依赖 DOM 与 React，仅对输入字符串做解析与递归类型推断，
 * 输出确定性的 C++17 struct 定义文本与告警列表。
 */
import {
  DEFAULT_EMPTY_ARRAY_STRATEGY,
  DEFAULT_INDENT,
  DEFAULT_ROOT_NAME,
  type EmptyArrayStrategy,
} from '../constants';

/** 合法 C++ 标识符匹配规则 */
const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** 命名空间匹配规则，允许 a::b 形式的多级命名空间 */
const NAMESPACE_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*(::[A-Za-z_][A-Za-z0-9_]*)*$/;

/** 拆分字段名与类型名时使用的分隔规则 */
const NAME_SEPARATOR_PATTERN = /[^A-Za-z0-9]+/;

/** C++ 关键字集合，字段名命中时需要改名 */
const CPP_KEYWORDS = new Set([
  'alignas',
  'alignof',
  'and',
  'and_eq',
  'asm',
  'auto',
  'bitand',
  'bitor',
  'bool',
  'break',
  'case',
  'catch',
  'char',
  'char8_t',
  'char16_t',
  'char32_t',
  'class',
  'compl',
  'concept',
  'const',
  'consteval',
  'constexpr',
  'constinit',
  'const_cast',
  'continue',
  'co_await',
  'co_return',
  'co_yield',
  'decltype',
  'default',
  'delete',
  'do',
  'double',
  'dynamic_cast',
  'else',
  'enum',
  'explicit',
  'export',
  'extern',
  'false',
  'float',
  'for',
  'friend',
  'goto',
  'if',
  'inline',
  'int',
  'long',
  'mutable',
  'namespace',
  'new',
  'noexcept',
  'not',
  'not_eq',
  'nullptr',
  'operator',
  'or',
  'or_eq',
  'private',
  'protected',
  'public',
  'register',
  'reinterpret_cast',
  'requires',
  'return',
  'short',
  'signed',
  'sizeof',
  'static',
  'static_assert',
  'static_cast',
  'struct',
  'switch',
  'template',
  'this',
  'thread_local',
  'throw',
  'true',
  'try',
  'typedef',
  'typeid',
  'typename',
  'union',
  'unsigned',
  'using',
  'virtual',
  'void',
  'volatile',
  'wchar_t',
  'while',
  'xor',
  'xor_eq',
]);

/** int32_t 的取值范围 */
const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;

/**
 * jsonToCpp 的可选配置
 */
export interface JsonToCppOptions {
  /** 根 struct 名称，默认 Root，必须为合法 C++ 标识符 */
  rootName?: string;
  /** 可选命名空间，支持 demo 或 a::b 形式，留空表示不包裹 */
  namespace?: string;
  /** 缩进宽度（空格数），默认 2 */
  indent?: number;
  /** 空数组元素类型策略，默认 std::vector<std::any> */
  emptyArrayType?: EmptyArrayStrategy;
}

/**
 * jsonToCpp 的结果
 */
export interface JsonToCppResult {
  /** 生成的 C++17 源码 */
  code: string;
  /** 类型推断过程中的告警列表 */
  warnings: string[];
}

/**
 * 推断过程中的上下文：已占用类型名、已生成的 struct 定义与告警
 */
interface InferContext {
  /** 已占用的 struct 名称集合，用于重名去重 */
  usedNames: Set<string>;
  /** struct 名称 → 字段行列表，插入顺序即输出顺序 */
  structs: Map<string, string[]>;
  /** 告警列表 */
  warnings: string[];
  /** 空数组策略 */
  emptyArrayType: EmptyArrayStrategy;
}

/**
 * 判断值是否为普通对象（非 null、非数组）
 *
 * @param value - 待判断的值
 * @returns 是否为普通对象
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 定位 JSON 文本中最可能的出错位置，用于补充解析错误信息
 *
 * 优先报告未闭合字符串的起点，其次报告最后一个非空白字符的位置。
 *
 * @param text - 已去除首尾空白的 JSON 文本
 * @returns 出错位置的行号与列号（均从 1 开始）
 */
function locateError(text: string): { line: number; column: number } {
  let inString = false;
  let escaped = false;
  let lastMeaningful = 0;
  for (let index = 0; index < text.length; index += 1) {
    const character = text.charAt(index);
    if (character.trim() !== '') {
      lastMeaningful = index;
    }
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') {
      inString = true;
    }
  }

  const offset = inString ? lastMeaningful + 1 : lastMeaningful;
  let line = 1;
  let column = 1;
  for (let index = 0; index < offset && index < text.length; index += 1) {
    if (text.charAt(index) === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

/**
 * 把原始名称转换为 PascalCase，用于 struct 名称
 *
 * @param name - 原始名称
 * @returns PascalCase 形式的名称
 */
function pascalCase(name: string): string {
  const parts = name.split(NAME_SEPARATOR_PATTERN).filter((part) => part.length > 0);
  if (parts.length === 0) {
    return 'Item';
  }
  const joined = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return IDENTIFIER_PATTERN.test(joined) ? joined : `Type${joined}`;
}

/**
 * 把原始字段名转换为 camelCase，并规避非法起始字符与 C++ 关键字
 *
 * @param raw - 原始字段名
 * @returns 规范化后的字段名与改名说明；未改名时说明为 undefined
 */
function toFieldName(raw: string): { name: string; warning?: string } {
  const parts = raw.split(NAME_SEPARATOR_PATTERN).filter((part) => part.length > 0);
  let base =
    parts.length === 0
      ? 'field'
      : parts
          .map((part, index) =>
            index === 0
              ? part.charAt(0).toLowerCase() + part.slice(1)
              : part.charAt(0).toUpperCase() + part.slice(1),
          )
          .join('');
  if (!IDENTIFIER_PATTERN.test(base)) {
    base = `field${base}`;
  }

  if (CPP_KEYWORDS.has(base)) {
    const renamed = `${base}Value`;
    return {
      name: renamed,
      warning: `字段名 "${raw}" 是 C++ 关键字，已改名为 "${renamed}"`,
    };
  }

  if (base !== raw) {
    return {
      name: base,
      warning: `字段名 "${raw}" 已规范化为 "${base}"`,
    };
  }

  return { name: base };
}

/**
 * 占用一个 struct 名称，重名时追加数字后缀
 *
 * @param baseName - 期望的基础名称
 * @param context - 推断上下文
 * @returns 去重后实际使用的名称
 */
function reserveName(baseName: string, context: InferContext): string {
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
 * 为一个类型文本包上 std::optional，已包裹时保持原样
 *
 * @param type - 类型文本
 * @returns 可空类型文本
 */
function wrapOptional(type: string): string {
  if (type.startsWith('std::optional<')) {
    return type;
  }
  return `std::optional<${type}>`;
}

/**
 * 合并一组对象为单个 struct：取键的并集，缺失键或 null 值标记为 std::optional
 *
 * 嵌套 struct 在收集字段时递归注册，因此先于当前 struct 写入上下文，
 * 输出顺序天然保证依赖在前。
 *
 * @param objects - 需要合并的对象集合
 * @param baseName - 该 struct 期望的基础名称
 * @param context - 推断上下文
 * @returns 实际使用的 struct 名称
 */
function collectObjectType(
  objects: Record<string, unknown>[],
  baseName: string,
  context: InferContext,
): string {
  const name = reserveName(baseName, context);

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

  const lines: string[] = [];
  const usedFieldNames = new Set<string>();
  for (const key of keys) {
    const presentValues: unknown[] = [];
    for (const object of objects) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        presentValues.push(object[key]);
      }
    }
    const missing = presentValues.length < objects.length;
    const nonNullValues = presentValues.filter((value) => value !== null);
    const optional = missing || nonNullValues.length < presentValues.length;

    const field = toFieldName(key);
    let fieldName = field.name;
    if (usedFieldNames.has(fieldName)) {
      let suffix = 2;
      while (usedFieldNames.has(`${field.name}${suffix}`)) {
        suffix += 1;
      }
      context.warnings.push(`字段名 "${key}" 规范化后与已有字段重名，已改为 "${fieldName}${suffix}"`);
      fieldName = `${field.name}${suffix}`;
    } else if (field.warning) {
      context.warnings.push(field.warning);
    }
    usedFieldNames.add(fieldName);

    const fieldType = inferValues(nonNullValues, pascalCase(key), context, key);
    const finalType = optional ? wrapOptional(fieldType) : fieldType;
    const renamed = fieldName !== key ? ` // JSON key: ${JSON.stringify(key)}` : '';
    lines.push(`${finalType} ${fieldName};${renamed}`);
  }

  context.structs.set(name, lines);
  return name;
}

/**
 * 推断一组非 null 值的 C++ 类型文本
 *
 * @param values - 非 null 值集合
 * @param baseName - 若产生 struct 时使用的基础名称
 * @param context - 推断上下文
 * @param path - 告警中展示的字段路径
 * @returns 推断出的类型文本
 */
function inferNonNull(
  values: unknown[],
  baseName: string,
  context: InferContext,
  path: string,
): string {
  const numbers: number[] = [];
  let stringCount = 0;
  let booleanCount = 0;
  const arrays: unknown[][] = [];
  const objects: Record<string, unknown>[] = [];

  for (const value of values) {
    if (typeof value === 'number') {
      numbers.push(value);
    } else if (typeof value === 'string') {
      stringCount += 1;
    } else if (typeof value === 'boolean') {
      booleanCount += 1;
    } else if (Array.isArray(value)) {
      arrays.push(value);
    } else if (isPlainObject(value)) {
      objects.push(value);
    }
  }

  const categories =
    (numbers.length > 0 ? 1 : 0) +
    (stringCount > 0 ? 1 : 0) +
    (booleanCount > 0 ? 1 : 0) +
    (arrays.length > 0 ? 1 : 0) +
    (objects.length > 0 ? 1 : 0);

  if (categories > 1) {
    context.warnings.push(`字段 "${path}" 包含多种不兼容类型，已退化为 std::any`);
    return 'std::any';
  }

  if (numbers.length > 0) {
    if (!numbers.every((value) => Number.isSafeInteger(value))) {
      const hasFloat = numbers.some((value) => !Number.isInteger(value) && Number.isFinite(value));
      if (hasFloat) {
        return 'double';
      }
      context.warnings.push(`字段 "${path}" 的整数超出安全整数范围，为避免精度丢失已使用 std::string`);
      return 'std::string';
    }
    const inInt32Range = numbers.every((value) => value >= INT32_MIN && value <= INT32_MAX);
    return inInt32Range ? 'int32_t' : 'int64_t';
  }

  if (stringCount > 0) {
    return 'std::string';
  }

  if (booleanCount > 0) {
    return 'bool';
  }

  if (arrays.length > 0) {
    const elements = arrays.flat();
    if (elements.length === 0) {
      context.warnings.push(
        `字段 "${path}" 的数组为空，无法推断元素类型，已使用 ${
          context.emptyArrayType === 'any' ? 'std::any' : 'std::vector<std::any>'
        }`,
      );
      return context.emptyArrayType === 'any' ? 'std::any' : 'std::vector<std::any>';
    }
    const elementType = inferValues(elements, baseName, context, path);
    return `std::vector<${elementType}>`;
  }

  if (objects.length > 0) {
    return collectObjectType(objects, baseName, context);
  }

  return 'std::any';
}

/**
 * 推断一组值的 C++ 类型文本，null 会包上 std::optional
 *
 * @param values - 值集合
 * @param baseName - 若产生 struct 时使用的基础名称
 * @param context - 推断上下文
 * @param path - 告警中展示的字段路径
 * @returns 推断出的类型文本
 */
function inferValues(
  values: unknown[],
  baseName: string,
  context: InferContext,
  path: string,
): string {
  if (values.length === 0) {
    return 'std::any';
  }
  const nonNullValues = values.filter((value) => value !== null);
  if (nonNullValues.length === 0) {
    return 'std::any';
  }
  const type = inferNonNull(nonNullValues, baseName, context, path);
  return nonNullValues.length < values.length ? wrapOptional(type) : type;
}

/**
 * 渲染单个 struct 定义
 *
 * @param name - struct 名称
 * @param lines - 字段行列表
 * @param indentText - 缩进文本
 * @returns 完整的 struct 源码块
 */
function renderStruct(name: string, lines: string[], indentText: string): string {
  if (lines.length === 0) {
    return `struct ${name} {\n};`;
  }
  const body = lines.map((line) => `${indentText}${line}`).join('\n');
  return `struct ${name} {\n${body}\n};`;
}

/**
 * 按实际使用情况生成前置包含指令
 *
 * @param body - 命名空间内部的源码文本
 * @returns 包含指令列表
 */
function buildIncludes(body: string): string[] {
  const includes: string[] = [];
  if (/int(32|64)_t/.test(body)) {
    includes.push('#include <cstdint>');
  }
  if (body.includes('std::optional')) {
    includes.push('#include <optional>');
  }
  if (body.includes('std::string')) {
    includes.push('#include <string>');
  }
  if (body.includes('std::vector')) {
    includes.push('#include <vector>');
  }
  if (body.includes('std::any')) {
    includes.push('#include <any>');
  }
  return includes;
}

/**
 * 解析 JSON 文本并生成 C++17 struct 定义
 *
 * @param input - JSON 文本
 * @param options - 可选配置（根名称、命名空间、缩进、空数组策略）
 * @returns 生成的 C++ 源码与告警列表；输入为空时返回空源码
 * @throws 当输入不是合法 JSON、根名称或命名空间非法时抛出可读错误
 */
export function jsonToCpp(input: string, options: JsonToCppOptions = {}): JsonToCppResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { code: '', warnings: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    const position = locateError(trimmed);
    throw new Error(`JSON 解析失败：${message}（第 ${position.line} 行第 ${position.column} 列附近）`);
  }

  const rootName = (options.rootName ?? DEFAULT_ROOT_NAME).trim() || DEFAULT_ROOT_NAME;
  if (!IDENTIFIER_PATTERN.test(rootName) || CPP_KEYWORDS.has(rootName)) {
    throw new Error(`根名称必须是合法的 C++ 标识符：${rootName}`);
  }

  const namespaceName = (options.namespace ?? '').trim();
  if (namespaceName !== '' && !NAMESPACE_PATTERN.test(namespaceName)) {
    throw new Error(`命名空间必须是合法的 C++ 标识符：${namespaceName}`);
  }

  const indent = Math.max(0, Math.floor(options.indent ?? DEFAULT_INDENT));
  const indentText = ' '.repeat(indent);

  const context: InferContext = {
    usedNames: new Set<string>(),
    structs: new Map<string, string[]>(),
    warnings: [],
    emptyArrayType: options.emptyArrayType ?? DEFAULT_EMPTY_ARRAY_STRATEGY,
  };

  const blocks: string[] = [];
  if (isPlainObject(parsed)) {
    collectObjectType([parsed], rootName, context);
    for (const [name, lines] of context.structs) {
      blocks.push(renderStruct(name, lines, indentText));
    }
  } else {
    context.usedNames.add(rootName);
    if (Array.isArray(parsed) && parsed.length > 0) {
      context.warnings.push('顶层为数组，已生成元素 struct 与 using 别名');
    }
    const aliasType = inferValues([parsed], 'Item', context, rootName);
    for (const [name, lines] of context.structs) {
      blocks.push(renderStruct(name, lines, indentText));
    }
    blocks.push(`using ${rootName} = ${aliasType};`);
  }

  const body = blocks.join('\n\n');
  const includes = buildIncludes(body);
  const wrapped =
    namespaceName === ''
      ? body
      : `namespace ${namespaceName} {\n\n${body}\n\n} // namespace ${namespaceName}`;

  const code = [includes.join('\n'), wrapped].filter((part) => part !== '').join('\n\n');

  return {
    code,
    warnings: Array.from(new Set(context.warnings)),
  };
}
