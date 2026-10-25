/**
 * JSON 嵌套对象与点路径单层结构互转的纯逻辑集合。
 * 扁平化时递归遍历对象与数组，以分隔符连接键路径（如 `a.b[0].c`）；
 * unflatten 按路径还原嵌套对象 / 数组。不触碰 DOM / React。
 */

/** 扁平化选项 */
export interface FlattenOptions {
  /** 键路径分隔符，默认 "." */
  separator?: string;
  /** 数组是否展开为带索引的路径，默认 true；false 时整体作为叶子保留 */
  expandArrays?: boolean;
}

/** 扁平化后的单层键值结构 */
export type FlatRecord = Record<string, unknown>;

/** 操作结果 */
export interface FlatResult {
  /** 成功时的结果对象 */
  data: FlatRecord | unknown | null;
  /** 失败时的错误信息 */
  error: string | null;
}

/** 默认分隔符 */
const DEFAULT_SEPARATOR = '.';

/**
 * 规范化选项并校验分隔符
 *
 * @param options - 原始选项
 * @returns 完整选项
 */
function normalizeOptions(options: FlattenOptions = {}): Required<FlattenOptions> {
  const separator = options.separator ?? DEFAULT_SEPARATOR;
  if (separator === '') {
    throw new Error('分隔符不能为空');
  }
  return { separator, expandArrays: options.expandArrays ?? true };
}

/**
 * 判断值是否为可继续下钻的普通对象或数组
 *
 * @param value - 任意值
 * @returns 是否为容器
 */
function isContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return typeof value === 'object' && value !== null;
}

/**
 * 判断容器在当前选项下是否应继续展开
 *
 * @param value - 容器值
 * @param options - 扁平化选项
 * @returns 是否展开
 */
function shouldExpand(
  value: Record<string, unknown> | unknown[],
  options: Required<FlattenOptions>,
): boolean {
  if (Array.isArray(value)) {
    return options.expandArrays && value.length > 0;
  }
  return Object.keys(value).length > 0;
}

/**
 * 递归扁平化
 *
 * @param value - 当前节点
 * @param prefix - 当前路径前缀
 * @param output - 结果累积对象
 * @param options - 规范化后的选项
 */
function walk(
  value: unknown,
  prefix: string,
  output: FlatRecord,
  options: Required<FlattenOptions>,
): void {
  if (isContainer(value) && shouldExpand(value, options)) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        walk(item, `${prefix}[${index}]`, output, options);
      });
    } else {
      Object.keys(value).forEach((key) => {
        const nextPrefix = prefix === '' ? key : `${prefix}${options.separator}${key}`;
        walk(value[key], nextPrefix, output, options);
      });
    }
    return;
  }
  output[prefix] = value;
}

/**
 * 把解析后的 JSON 值扁平化为单层键值对象
 *
 * 根为数组时路径从 `[0]` 开始；根为标量时输出空路径键。
 *
 * @param input - 已解析的 JSON 值
 * @param options - 扁平化选项
 * @returns 单层键值对象
 */
export function flattenJson(input: unknown, options: FlattenOptions = {}): FlatRecord {
  const normalized = normalizeOptions(options);
  const output: FlatRecord = {};
  if (Array.isArray(input)) {
    input.forEach((item, index) => {
      walk(item, `[${index}]`, output, normalized);
    });
    return output;
  }
  if (isContainer(input) && !shouldExpand(input, normalized)) {
    return output;
  }
  walk(input, '', output, normalized);
  return output;
}

/**
 * 解析 JSON 文本并扁平化
 *
 * @param text - JSON 文本
 * @param options - 扁平化选项
 * @returns 单层结果或解析错误
 */
export function flattenJsonText(text: string, options?: FlattenOptions): FlatResult {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { data: null, error: null };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    return {
      data: null,
      error: `JSON 解析失败：${error instanceof Error ? error.message : String(error)}`,
    };
  }
  try {
    return { data: flattenJson(parsed, options), error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

type PathToken =
  | { kind: 'key'; value: string }
  | { kind: 'index'; value: number };

/**
 * 把单段路径键解析为 token 序列
 *
 * 支持形如 `a.b`、`a[0].b`、`[0].a`、`a[0][1]` 的路径；每段内以
 * `[数字]` 识别数组索引，其余视为对象键（键本身可包含方括号）。
 *
 * @param path - 扁平化键路径
 * @param separator - 分隔符
 * @returns token 序列
 */
function tokenizePath(path: string, separator: string): PathToken[] {
  const tokens: PathToken[] = [];
  const escaped = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const segments = path.split(new RegExp(escaped));
  const bracketPattern = /\[(\d+)\]/g;

  segments.forEach((segment) => {
    let lastIndex = 0;
    let match: RegExpExecArray | null = bracketPattern.exec(segment);
    while (match !== null) {
      if (match.index > lastIndex) {
        tokens.push({ kind: 'key', value: segment.slice(lastIndex, match.index) });
      }
      tokens.push({ kind: 'index', value: Number(match[1]) });
      lastIndex = match.index + match[0].length;
      match = bracketPattern.exec(segment);
    }
    if (lastIndex < segment.length) {
      tokens.push({ kind: 'key', value: segment.slice(lastIndex) });
    }
  });

  return tokens;
}

/**
 * 按路径在目标结构上赋值，必要时创建中间对象 / 数组
 *
 * @param target - 根结构引用
 * @param tokens - 路径 token
 * @param value - 叶子值
 * @throws 当路径与已有叶子冲突（如同时存在 a 与 a.b）时抛错
 */
function assignByTokens(target: { root: unknown }, tokens: PathToken[], value: unknown): void {
  if (tokens.length === 0) {
    if (target.root !== undefined) {
      throw new Error('根路径存在多个值，无法还原为单个对象');
    }
    target.root = value;
    return;
  }

  if (target.root === undefined) {
    target.root = tokens[0]!.kind === 'index' ? [] : {};
  }

  let node: unknown = target.root;
  tokens.forEach((token, depth) => {
    const isLast = depth === tokens.length - 1;
    const record = node as Record<string | number, unknown>;

    if (token.kind === 'index') {
      if (!Array.isArray(node)) {
        throw new Error(`路径冲突：索引 [${token.value}] 与已有非数组值冲突`);
      }
      if (isLast) {
        if (isContainer(node[token.value])) {
          throw new Error(`路径冲突：[${token.value}] 已包含下级路径，无法覆盖为叶子值`);
        }
        node[token.value] = value;
        return;
      }
      if (node[token.value] === undefined) {
        const next = tokens[depth + 1]!;
        node[token.value] = next.kind === 'index' ? [] : {};
      } else if (!isContainer(node[token.value])) {
        throw new Error(`路径冲突：[${token.value}] 已是叶子值，无法继续向下还原`);
      }
      node = node[token.value];
      return;
    }

    if (Array.isArray(node) || typeof node !== 'object' || node === null) {
      throw new Error(`路径冲突：键 “${token.value}” 与已有非对象值冲突`);
    }
    if (isLast) {
      if (isContainer(record[token.value])) {
        throw new Error(`路径冲突：“${token.value}” 已包含下级路径，无法覆盖为叶子值`);
      }
      record[token.value] = value;
      return;
    }
    if (record[token.value] === undefined) {
      const next = tokens[depth + 1]!;
      record[token.value] = next.kind === 'index' ? [] : {};
    } else if (!isContainer(record[token.value])) {
      throw new Error(`路径冲突：“${token.value}” 已是叶子值，无法继续向下还原`);
    }
    node = record[token.value];
  });
}

/**
 * 把单层键值对象还原为嵌套结构
 *
 * @param input - 扁平化键值对象
 * @param separator - 扁平化时使用的分隔符
 * @returns 还原后的嵌套值
 */
export function unflattenJson(
  input: FlatRecord,
  separator: string = DEFAULT_SEPARATOR,
): unknown {
  if (separator === '') {
    throw new Error('分隔符不能为空');
  }
  const target: { root: unknown } = { root: undefined };
  Object.keys(input).forEach((path) => {
    const tokens = tokenizePath(path, separator);
    assignByTokens(target, tokens, input[path]);
  });
  return target.root;
}

/**
 * 解析扁平 JSON 文本（单层键值对象）并还原嵌套结构
 *
 * @param text - 单层 JSON 对象文本
 * @param separator - 分隔符
 * @returns 嵌套结果或错误
 */
export function unflattenJsonText(
  text: string,
  separator: string = DEFAULT_SEPARATOR,
): FlatResult {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { data: null, error: null };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    return {
      data: null,
      error: `JSON 解析失败：${error instanceof Error ? error.message : String(error)}`,
    };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { data: null, error: 'unflatten 输入必须是单层 JSON 对象（{ "a.b": 1 } 形式）' };
  }
  try {
    return { data: unflattenJson(parsed as FlatRecord, separator), error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
