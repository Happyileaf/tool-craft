/**
 * JSON Patch（RFC 6902）纯函数实现。
 *
 * 支持 add / remove / replace / move / copy / test 六个操作，
 * 路径采用 RFC 6901 JSON Pointer（按 "/" 分段，"~1" 解码为 "/"，"~0" 解码为 "~"）。
 * 零依赖、不触碰 DOM，可在浏览器与 Node 环境直接运行。
 */

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** 单个补丁操作 */
export interface JsonPatchOperation {
  op?: unknown;
  path?: unknown;
  from?: unknown;
  value?: unknown;
}

/** 应用成功结果 */
export interface JsonPatchSuccess {
  result: JsonValue;
  applied: number;
}

/** 应用失败结果 */
export interface JsonPatchFailure {
  error: string;
}

/** 解析 JSON 文本失败（附带行列信息） */
export class JsonParseError extends Error {
  line: number;
  column: number;

  constructor(message: string, line: number, column: number) {
    super(message);
    this.name = 'JsonParseError';
    this.line = line;
    this.column = column;
  }
}

const VALID_OPS = new Set(['add', 'remove', 'replace', 'move', 'copy', 'test']);

/** 补丁整体的结构性错误（消息自带操作序号） */
class PatchStructureError extends Error {}

/** 第 index 个操作内部的语义错误（消息不带序号，由外层包装） */
class OperationError extends Error {}

/**
 * 解析 JSON 文本，失败时尽量附带位置信息。
 *
 * @param text - JSON 文本
 * @returns 解析后的值
 */
export function parseJsonInput(text: string): JsonValue {
  try {
    return JSON.parse(text) as JsonValue;
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'JSON 解析失败';
    const match = raw.match(/position (\d+)/);
    if (match) {
      const pos = Number(match[1]);
      const before = text.slice(0, pos);
      const line = before.split('\n').length;
      const column = pos - before.lastIndexOf('\n');
      throw new JsonParseError(
        raw.split('\n')[0]!.replace(/\s*in JSON.*$/, ''),
        line,
        column,
      );
    }
    throw new JsonParseError(raw, 0, 0);
  }
}

/** 简单深拷贝（JSON 文档不含函数、循环引用等） */
function cloneJson(value: JsonValue): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

/** RFC 6901 转义还原 */
function unescapeToken(token: string): string {
  if (/~[^01]/.test(token)) {
    throw new OperationError(
      `JSON Pointer 分段 "${token}" 含非法转义（"~" 后只能为 0 或 1）`,
    );
  }
  if (token.endsWith('~')) {
    throw new OperationError(
      `JSON Pointer 分段 "${token}" 以单个 "~" 结尾，转义不完整`,
    );
  }
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

/** 将 JSON Pointer 拆分为 token 数组（空串表示根，返回空数组） */
function parsePointer(pointer: unknown): string[] {
  if (typeof pointer !== 'string') {
    throw new OperationError('路径必须为 RFC 6901 JSON Pointer 字符串');
  }
  if (pointer === '') {
    return [];
  }
  if (!pointer.startsWith('/')) {
    throw new OperationError(`路径 "${pointer}" 必须为空串或以 "/" 开头`);
  }
  return pointer
    .split('/')
    .slice(1)
    .map((raw) => unescapeToken(raw));
}

function isPlainObject(
  value: JsonValue,
): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 解析数组下标 token：允许 "0"、"12" 等无前导零的非负整数。
 *
 * @param token - 指针分段
 * @param length - 当前数组长度
 * @returns 下标
 */
function parseArrayIndex(token: string, length: number): number {
  if (!/^(0|[1-9]\d*)$/.test(token)) {
    throw new OperationError(`数组下标 "${token}" 非法（应为非负整数）`);
  }
  const index = Number(token);
  if (index >= length) {
    throw new OperationError(`数组下标 ${index} 越界（当前长度 ${length}）`);
  }
  return index;
}

/**
 * 沿 tokens 定位到父容器与最后一个键。
 * 路径不存在或中途遇到标量时抛出操作级错误。
 */
function locateParent(
  root: JsonValue,
  tokens: string[],
): { parent: JsonValue; key: string } {
  if (tokens.length === 0) {
    throw new OperationError('该操作不能作用于文档根节点');
  }
  let current: JsonValue = root;
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const token = tokens[i]!;
    if (Array.isArray(current)) {
      current = current[parseArrayIndex(token, current.length)]!;
    } else if (isPlainObject(current)) {
      if (!Object.prototype.hasOwnProperty.call(current, token)) {
        throw new OperationError(`路径在 "${token}" 处不存在`);
      }
      current = current[token]!;
    } else {
      throw new OperationError(
        `路径在 "${token}" 处无法继续深入（当前值不是对象或数组）`,
      );
    }
  }
  return { parent: current, key: tokens[tokens.length - 1]! };
}

/** 读取指针指向的值（test / move 的 from / copy 的 from 使用） */
function getValueAt(root: JsonValue, tokens: string[]): JsonValue {
  let current: JsonValue = root;
  for (const token of tokens) {
    if (Array.isArray(current)) {
      current = current[parseArrayIndex(token, current.length)]!;
    } else if (isPlainObject(current)) {
      if (!Object.prototype.hasOwnProperty.call(current, token)) {
        throw new OperationError(`路径 "/${token}" 不存在`);
      }
      current = current[token]!;
    } else {
      throw new OperationError(
        `路径 "/${token}" 处无法读取（当前值不是对象或数组）`,
      );
    }
  }
  return current;
}

/**
 * 执行 add：对象新增/覆盖键；数组在指定下标插入，"-" 表示追加；
 * 路径为空时整体替换文档。
 *
 * @returns 应用后的文档（根替换时可能是新值）
 */
function applyAdd(
  root: JsonValue,
  tokens: string[],
  value: JsonValue,
): JsonValue {
  if (tokens.length === 0) {
    return value;
  }

  const { parent, key } = locateParent(root, tokens);
  if (Array.isArray(parent)) {
    if (key === '-') {
      parent.push(value);
      return root;
    }
    if (!/^(0|[1-9]\d*)$/.test(key)) {
      throw new OperationError(`数组下标 "${key}" 非法（应为非负整数或 "-"）`);
    }
    const index = Number(key);
    if (index > parent.length) {
      throw new OperationError(
        `数组插入位置 ${index} 越界（当前长度 ${parent.length}，允许 0..${parent.length}）`,
      );
    }
    parent.splice(index, 0, value);
  } else if (isPlainObject(parent)) {
    parent[key] = value;
  } else {
    throw new OperationError('add 的父节点不是对象或数组');
  }
  return root;
}

/** 执行 remove（不允许删除根节点） */
function applyRemove(root: JsonValue, tokens: string[]): void {
  const { parent, key } = locateParent(root, tokens);
  if (Array.isArray(parent)) {
    const index = parseArrayIndex(key, parent.length);
    parent.splice(index, 1);
  } else if (isPlainObject(parent)) {
    if (!Object.prototype.hasOwnProperty.call(parent, key)) {
      throw new OperationError(`待删除的键 "/${key}" 不存在`);
    }
    delete parent[key];
  } else {
    throw new OperationError('remove 的父节点不是对象或数组');
  }
}

/**
 * 执行 replace：要求目标路径已存在。
 *
 * @returns 应用后的文档（根替换时可能是新值）
 */
function applyReplace(
  root: JsonValue,
  tokens: string[],
  value: JsonValue,
): JsonValue {
  if (tokens.length === 0) {
    return value;
  }
  getValueAt(root, tokens);
  const { parent, key } = locateParent(root, tokens);
  if (Array.isArray(parent)) {
    const index = parseArrayIndex(key, parent.length);
    parent[index] = value;
  } else if (isPlainObject(parent)) {
    parent[key] = value;
  } else {
    throw new OperationError('replace 的父节点不是对象或数组');
  }
  return root;
}

/** ancestor 是否为 descendant 的前缀（相等也算） */
function isPrefixOrEqual(ancestor: string[], descendant: string[]): boolean {
  if (descendant.length < ancestor.length) {
    return false;
  }
  return ancestor.every((token, i) => token === descendant[i]);
}

/** JSON 深度相等（test 操作语义） */
export function deepEqual(a: JsonValue, b: JsonValue): boolean {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    return a.every((item, i) => deepEqual(item, b[i]!));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }
    return keysA.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(b, key) &&
        deepEqual(a[key]!, b[key]!),
    );
  }
  return false;
}

/**
 * 顺序应用补丁数组，返回结果文档。
 *
 * @param document - 原始 JSON 文档（不会被修改）
 * @param patch - RFC 6902 补丁操作数组
 * @returns 成功时返回结果文档与已应用操作数；失败时返回带操作序号的中文错误
 */
export function applyJsonPatch(
  document: JsonValue,
  patch: unknown,
): JsonPatchSuccess | JsonPatchFailure {
  if (!Array.isArray(patch)) {
    return { error: '补丁必须是 JSON Patch 操作数组（[]）' };
  }

  let working: JsonValue = cloneJson(document);
  const operations = patch as JsonPatchOperation[];

  for (let i = 0; i < operations.length; i += 1) {
    const sequence = i + 1;
    const rawOp = operations[i];
    let opName = '?';

    try {
      if (typeof rawOp !== 'object' || rawOp === null || Array.isArray(rawOp)) {
        throw new PatchStructureError(`第 ${sequence} 个操作必须是对象`);
      }
      const op = rawOp as JsonPatchOperation;
      if (typeof op.op !== 'string') {
        throw new PatchStructureError(
          `第 ${sequence} 个操作缺少字符串类型的 "op" 字段`,
        );
      }
      opName = op.op;
      if (!VALID_OPS.has(op.op)) {
        throw new PatchStructureError(
          `第 ${sequence} 个操作的 op "${op.op}" 未知（仅支持 add/remove/replace/move/copy/test）`,
        );
      }
      if (typeof op.path !== 'string') {
        throw new OperationError('缺少字符串类型的 "path" 字段');
      }

      const tokens = parsePointer(op.path);

      if (op.op === 'add' || op.op === 'replace' || op.op === 'test') {
        if (!('value' in op)) {
          throw new OperationError('缺少 "value" 字段');
        }
        const value = op.value as JsonValue;

        if (op.op === 'add') {
          working = applyAdd(working, tokens, value);
        } else if (op.op === 'replace') {
          working = applyReplace(working, tokens, value);
        } else {
          const actual = getValueAt(working, tokens);
          if (!deepEqual(actual, value)) {
            throw new OperationError(
              `test 断言失败：路径 ${op.path} 的实际值与期望值不相等`,
            );
          }
        }
      } else if (op.op === 'remove') {
        applyRemove(working, tokens);
      } else if (op.op === 'move') {
        if (typeof op.from !== 'string') {
          throw new OperationError('缺少字符串类型的 "from" 字段');
        }
        const fromTokens = parsePointer(op.from);
        // RFC 6902：from 不能是 path 的真前缀（不能把节点移入自身后代）
        if (
          fromTokens.length < tokens.length &&
          isPrefixOrEqual(fromTokens, tokens)
        ) {
          throw new OperationError(
            `move 的目标路径 ${op.path} 位于源路径 ${op.from} 之下，无法将节点移入其自身后代`,
          );
        }
        if (fromTokens.length === 0) {
          // 移动整个文档：以空对象为容器重新落入目标路径
          const moved = cloneJson(getValueAt(working, fromTokens));
          working = applyAdd({}, tokens, moved);
        } else {
          const moved = getValueAt(working, fromTokens);
          applyRemove(working, fromTokens);
          working = applyAdd(working, tokens, moved);
        }
      } else {
        // copy
        if (typeof op.from !== 'string') {
          throw new OperationError('缺少字符串类型的 "from" 字段');
        }
        const fromTokens = parsePointer(op.from);
        const copied = cloneJson(getValueAt(working, fromTokens));
        working = applyAdd(working, tokens, copied);
      }
    } catch (error) {
      if (error instanceof PatchStructureError) {
        return { error: error.message };
      }
      const reason = error instanceof Error ? error.message : '未知错误';
      return { error: `第 ${sequence} 个操作（${opName}）失败：${reason}` };
    }
  }

  return { result: working, applied: operations.length };
}
