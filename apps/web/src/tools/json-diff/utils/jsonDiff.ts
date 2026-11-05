/**
 * JSON 结构化差异对比纯函数，不依赖 DOM 与 React。
 * 解析左右两段 JSON 文本后递归对比，输出 JSONPath 风格路径级差异列表，
 * 差异类型包括新增、删除、修改与类型变化，数组按索引逐项对比并报告长度差异。
 */

/** 差异类型：新增 / 删除 / 修改 / 类型变化 */
export type JsonDiffType = 'added' | 'removed' | 'changed' | 'type-changed';

/** 单条路径级差异记录 */
export interface JsonDiffEntry {
  /** JSONPath 风格路径，如 $.user.name、$.items[0].id */
  path: string;
  /** 差异类型 */
  type: JsonDiffType;
  /** 左侧值的安全字符串展示，新增时为空字符串 */
  leftValue: string;
  /** 右侧值的安全字符串展示，删除时为空字符串 */
  rightValue: string;
}

/** JSON 解析成功结果 */
export interface JsonParseSuccess {
  /** 解析是否成功 */
  ok: true;
  /** 解析得到的 JSON 值 */
  value: unknown;
}

/** JSON 解析失败结果 */
export interface JsonParseFailure {
  /** 解析是否成功 */
  ok: false;
  /** 解析错误信息 */
  error: string;
}

/** JSON 解析结果（成功或失败的判别联合） */
export type JsonParseResult = JsonParseSuccess | JsonParseFailure;

/**
 * 判断一个值是否为普通 JSON 对象（非 null、非数组）。
 *
 * @param value - 待判断的值
 * @returns 是普通对象时返回 true
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 稳定序列化任意 JSON 值：对象按 key 字典序输出，保证结构相同的对象结果一致。
 * JSON 由 parse 得到，不存在循环引用。
 *
 * @param value - 待序列化的值
 * @returns JSON 字符串
 */
function stableStringify(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const parts = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`);
    return `{${parts.join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * 将任意 JSON 值转为安全的展示字符串。
 * 基本类型直接输出字面量，对象与数组使用稳定 JSON 序列化，避免循环引用问题。
 *
 * @param value - 待展示的值
 * @returns 可安全展示的字符串
 */
export function formatValue(value: unknown): string {
  if (value === undefined) {
    return '';
  }
  if (isPlainObject(value) || Array.isArray(value)) {
    return stableStringify(value);
  }
  return JSON.stringify(value);
}

/**
 * 解析 JSON 文本，捕获异常并返回判别联合结果，不向外抛出错误。
 *
 * @param text - 原始 JSON 文本
 * @returns 解析成功携带 value，失败携带错误信息
 */
export function parseJson(text: string): JsonParseResult {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { ok: false, error: '内容为空，请输入合法的 JSON 文本' };
  }
  try {
    return { ok: true, value: JSON.parse(trimmed) as unknown };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

/**
 * 拼接对象属性的 JSONPath 片段：合法标识符用点号，其余用方括号。
 *
 * @param path - 父级路径
 * @param key - 对象键名
 * @returns 子级路径
 */
function joinObjectPath(path: string, key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
}

/**
 * 递归对比两个 JSON 值，将差异写入累积数组。
 *
 * @param left - 左侧值
 * @param right - 右侧值
 * @param path - 当前节点的 JSONPath 路径
 * @param entries - 差异累积数组
 */
function walk(left: unknown, right: unknown, path: string, entries: JsonDiffEntry[]): void {
  const leftIsObject = isPlainObject(left);
  const rightIsObject = isPlainObject(right);
  const leftIsArray = Array.isArray(left);
  const rightIsArray = Array.isArray(right);

  if (leftIsObject && rightIsObject) {
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
    for (const key of keys) {
      const childPath = joinObjectPath(path, key);
      const hasLeft = Object.prototype.hasOwnProperty.call(left, key);
      const hasRight = Object.prototype.hasOwnProperty.call(right, key);
      if (!hasLeft && hasRight) {
        entries.push({
          path: childPath,
          type: 'added',
          leftValue: '',
          rightValue: formatValue(right[key]),
        });
      } else if (hasLeft && !hasRight) {
        entries.push({
          path: childPath,
          type: 'removed',
          leftValue: formatValue(left[key]),
          rightValue: '',
        });
      } else {
        walk(left[key], right[key], childPath, entries);
      }
    }
    return;
  }

  if (leftIsArray && rightIsArray) {
    if (left.length !== right.length) {
      entries.push({
        path,
        type: 'changed',
        leftValue: `数组长度 ${left.length}`,
        rightValue: `数组长度 ${right.length}`,
      });
    }
    const commonLength = Math.min(left.length, right.length);
    for (let index = 0; index < commonLength; index += 1) {
      walk(left[index], right[index], `${path}[${index}]`, entries);
    }
    for (let index = commonLength; index < right.length; index += 1) {
      entries.push({
        path: `${path}[${index}]`,
        type: 'added',
        leftValue: '',
        rightValue: formatValue(right[index]),
      });
    }
    for (let index = commonLength; index < left.length; index += 1) {
      entries.push({
        path: `${path}[${index}]`,
        type: 'removed',
        leftValue: formatValue(left[index]),
        rightValue: '',
      });
    }
    return;
  }

  if (leftIsObject !== rightIsObject || leftIsArray !== rightIsArray || typeof left !== typeof right) {
    entries.push({
      path,
      type: 'type-changed',
      leftValue: formatValue(left),
      rightValue: formatValue(right),
    });
    return;
  }

  if (!Object.is(left, right)) {
    entries.push({
      path,
      type: 'changed',
      leftValue: formatValue(left),
      rightValue: formatValue(right),
    });
  }
}

/**
 * 对两个已解析的 JSON 值做结构化递归对比，输出路径级差异列表。
 * 对象按 key 递归，数组按索引逐项对比并报告长度差异；
 * 完全相同（结构与值均一致）时返回空数组。
 *
 * @param left - 左侧 JSON 值
 * @param right - 右侧 JSON 值
 * @returns 差异记录数组，按路径排序
 */
export function diffJson(left: unknown, right: unknown): JsonDiffEntry[] {
  const entries: JsonDiffEntry[] = [];
  walk(left, right, '$', entries);
  return entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}
