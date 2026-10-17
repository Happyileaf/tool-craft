/**
 * JSON → TypeScript 类型推断纯函数集合。
 *
 * 本模块不依赖 DOM 与 React，仅对输入字符串做解析与递归类型推断，
 * 输出确定性的 TypeScript interface / type 定义文本。
 */
import { DEFAULT_INDENT, DEFAULT_ROOT_NAME } from '../constants';

/** 合法 TypeScript 标识符匹配规则 */
const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** 拼接嵌套类型名时用于切分属性名的分隔规则 */
const NAME_SEPARATOR_PATTERN = /[^A-Za-z0-9$]+/;

/** 联合类型排序权重，保证 string | number | boolean | null 稳定排在前面 */
const UNION_RANK: Record<string, number> = {
  string: 0,
  number: 1,
  boolean: 2,
  null: 3,
};

/** 除基本类型外的类型（interface、数组等）统一排在最后 */
const OTHER_RANK = 4;

/**
 * jsonToTypeScript 的可选配置
 */
export interface JsonToTsOptions {
  /** 根类型名，默认 Root，必须为合法标识符 */
  rootName?: string;
  /** 缩进宽度（空格数），默认 2 */
  indent?: number;
  /** 根类型是否添加 export 前缀，默认 true */
  exportRoot?: boolean;
}

/**
 * jsonToTypeScript 的结果包装，函数本身返回字符串，此接口供需要对象形式的调用方使用
 */
export interface JsonToTsResult {
  /** 生成的 TypeScript 源码 */
  code: string;
}

/**
 * 推断过程中的上下文：已占用类型名与已生成的 interface 定义
 */
interface InferContext {
  /** 已占用的类型名集合，用于重名去重 */
  usedNames: Set<string>;
  /** 类型名 → 属性行列表，键的插入顺序即输出顺序 */
  interfaces: Map<string, string[]>;
}

/**
 * 判断值是否为普通对象（非 null、非数组）
 *
 * @param value - 待判断的值
 * @returns 是否为普通过对象
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 把属性名转换为 PascalCase，用于拼接嵌套类型名
 *
 * @param name - 原始属性名
 * @returns PascalCase 形式的名称
 */
function pascalCase(name: string): string {
  const parts = name.split(NAME_SEPARATOR_PATTERN).filter((part) => part.length > 0);
  if (parts.length === 0) {
    return 'Value';
  }
  return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

/**
 * 占用一个类型名，重名时追加数字后缀
 *
 * @param baseName - 期望的基础类型名
 * @param context - 推断上下文
 * @returns 去重后实际使用的类型名
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
 * 取联合类型中某个类型在稳定排序中的权重
 *
 * @param type - 单个类型文本
 * @returns 排序权重
 */
function unionRank(type: string): number {
  return UNION_RANK[type] ?? OTHER_RANK;
}

/**
 * 判断联合类型作为数组元素时是否需要加括号
 *
 * @param type - 元素类型文本
 * @returns 是否需要用括号包裹
 */
function needsParens(type: string): boolean {
  return type.includes(' | ');
}

/**
 * 格式化对象属性键，非合法标识符用双引号包裹
 *
 * @param key - 属性名
 * @returns 可直接写入源码的属性名文本
 */
function formatKey(key: string): string {
  return IDENTIFIER_PATTERN.test(key) ? key : JSON.stringify(key);
}

/**
 * 合并一组对象为单个 interface：取键的并集，缺失键标记为可选
 *
 * @param objects - 需要合并的对象集合
 * @param baseName - 该 interface 期望的基础名称
 * @param context - 推断上下文
 * @returns 生成的 interface 名称
 */
function collectObjectType(
  objects: Record<string, unknown>[],
  baseName: string,
  context: InferContext,
): string {
  const name = reserveName(baseName, context);
  // 先占位以保证 Map 中的插入顺序为「父类型在前」，随后再回填属性行
  context.interfaces.set(name, []);

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
  for (const key of keys) {
    const presentValues: unknown[] = [];
    for (const object of objects) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        presentValues.push(object[key]);
      }
    }
    const optional = presentValues.length < objects.length;
    const propertyType = mergeValues(presentValues, `${name}${pascalCase(key)}`, context);
    lines.push(`${formatKey(key)}${optional ? '?' : ''}: ${propertyType};`);
  }

  context.interfaces.set(name, lines);
  return name;
}

/**
 * 合并多个值的推断结果为一个类型文本。
 *
 * 对象值会被合并为单个 interface；数组值会被展平后合并元素类型；
 * 基本类型按 string | number | boolean | null 的稳定顺序排成联合类型。
 *
 * @param values - 待合并的值集合
 * @param baseName - 若产生 interface 时使用的基础名称
 * @param context - 推断上下文
 * @returns 推断出的类型文本
 */
function mergeValues(values: unknown[], baseName: string, context: InferContext): string {
  if (values.length === 0) {
    return 'unknown';
  }

  const objectValues: Record<string, unknown>[] = [];
  const arrayElements: unknown[] = [];
  let hasArray = false;
  const primitiveTypes = new Set<string>();

  for (const value of values) {
    if (value === null) {
      primitiveTypes.add('null');
    } else if (typeof value === 'string') {
      primitiveTypes.add('string');
    } else if (typeof value === 'number') {
      primitiveTypes.add('number');
    } else if (typeof value === 'boolean') {
      primitiveTypes.add('boolean');
    } else if (Array.isArray(value)) {
      hasArray = true;
      arrayElements.push(...value);
    } else if (isPlainObject(value)) {
      objectValues.push(value);
    }
  }

  const types: string[] = [];
  if (primitiveTypes.has('string')) {
    types.push('string');
  }
  if (primitiveTypes.has('number')) {
    types.push('number');
  }
  if (primitiveTypes.has('boolean')) {
    types.push('boolean');
  }
  if (primitiveTypes.has('null')) {
    types.push('null');
  }

  if (hasArray) {
    const elementType = mergeValues(arrayElements, baseName, context);
    types.push(needsParens(elementType) ? `(${elementType})[]` : `${elementType}[]`);
  }

  if (objectValues.length > 0) {
    types.push(collectObjectType(objectValues, baseName, context));
  }

  const uniqueTypes = Array.from(new Set(types));
  uniqueTypes.sort((left, right) => unionRank(left) - unionRank(right));
  return uniqueTypes.join(' | ');
}

/**
 * 渲染单个 interface 定义
 *
 * @param name - interface 名称
 * @param lines - 属性行列表
 * @param indentText - 缩进文本
 * @param exportPrefix - export 前缀（可能为空串）
 * @returns 完整的 interface 源码块
 */
function renderInterface(
  name: string,
  lines: string[],
  indentText: string,
  exportPrefix: string,
): string {
  if (lines.length === 0) {
    return `${exportPrefix}interface ${name} {\n}`;
  }
  const body = lines.map((line) => `${indentText}${line}`).join('\n');
  return `${exportPrefix}interface ${name} {\n${body}\n}`;
}

/**
 * 解析 JSON 文本并生成 TypeScript 类型定义
 *
 * @param input - JSON 文本
 * @param options - 可选配置（根类型名、缩进、是否导出根类型）
 * @returns 生成的 TypeScript 源码；输入为空时返回空串
 * @throws 当输入不是合法 JSON 或根类型名不是合法标识符时抛出可读错误
 */
export function jsonToTypeScript(input: string, options: JsonToTsOptions = {}): string {
  const trimmed = input.trim();
  if (trimmed === '') {
    return '';
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    throw new Error('JSON 解析失败：' + message);
  }

  const rootName = (options.rootName ?? DEFAULT_ROOT_NAME).trim();
  if (!IDENTIFIER_PATTERN.test(rootName)) {
    throw new Error('根类型名必须是合法的 TypeScript 标识符：' + rootName);
  }

  const indent = Math.max(0, Math.floor(options.indent ?? DEFAULT_INDENT));
  const indentText = ' '.repeat(indent);
  const exportPrefix = (options.exportRoot ?? true) ? 'export ' : '';

  const context: InferContext = {
    usedNames: new Set<string>(),
    interfaces: new Map<string, string[]>(),
  };

  const blocks: string[] = [];

  if (isPlainObject(parsed)) {
    const rootInterfaceName = collectObjectType([parsed], rootName, context);
    for (const [name, lines] of context.interfaces) {
      const prefix = name === rootInterfaceName ? exportPrefix : '';
      blocks.push(renderInterface(name, lines, indentText, prefix));
    }
  } else {
    // 根节点为数组或基本类型时输出类型别名，嵌套对象仍生成独立 interface
    context.usedNames.add(rootName);
    const aliasType = mergeValues([parsed], `${rootName}Item`, context);
    blocks.push(`${exportPrefix}type ${rootName} = ${aliasType};`);
    for (const [name, lines] of context.interfaces) {
      blocks.push(renderInterface(name, lines, indentText, ''));
    }
  }

  return blocks.join('\n\n');
}
