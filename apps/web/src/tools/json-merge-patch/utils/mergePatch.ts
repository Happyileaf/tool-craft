/**
 * JSON 解析错误：携带行列定位信息
 */
export interface JsonParseError {
  message: string;
  line: number;
  column: number;
}

/**
 * 任意 JSON 值
 */
export type JsonValue = unknown;

/**
 * JSON 对象的键值记录形式
 */
export type JsonObject = Record<string, JsonValue>;

/**
 * 判断值是否为普通 JSON 对象（排除 null 与数组）。
 *
 * @param value - 待判断的值
 * @returns 是否为普通对象
 */
export function isPlainObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 解析 JSON 文本，失败时抛出带行 / 列定位的错误。
 *
 * @param text - JSON 文本
 * @returns 解析结果
 * @throws 含 message / line / column 的解析错误
 */
export function parseJson(text: string): JsonValue {
  try {
    return JSON.parse(text) as JsonValue;
  } catch (error) {
    const fallback: JsonParseError = {
      message: error instanceof Error ? error.message : 'JSON 解析失败',
      line: 1,
      column: 1,
    };
    const match = fallback.message.match(/position (\d+)/);
    if (match && match[1] !== undefined) {
      const position = Number(match[1]);
      const before = text.slice(0, position);
      const lines = before.split('\n');
      fallback.line = lines.length;
      fallback.column = (lines[lines.length - 1] ?? '').length + 1;
    }
    throw fallback;
  }
}

/**
 * 按 RFC 7386 语义把 merge patch 应用到目标文档：
 * - patch 为非对象（含数组 / 标量 / null）时整体替换目标；
 * - patch 为对象时逐键处理：值为 null 删除键，双方均为普通对象则递归，其余整体替换该键。
 *
 * @param target - 原文档
 * @param patch - merge patch
 * @returns 应用补丁后的新文档（不修改入参）
 */
export function applyPatch(target: JsonValue, patch: JsonValue): JsonValue {
  if (!isPlainObject(patch)) {
    return patch;
  }
  const result: JsonObject = isPlainObject(target) ? { ...target } : {};
  Object.keys(patch).forEach((key) => {
    const value = patch[key];
    if (value === null) {
      delete result[key];
    } else if (isPlainObject(value)) {
      result[key] = applyPatch(result[key], value);
    } else {
      result[key] = value;
    }
  });
  return result;
}

/**
 * 按 RFC 7396 语义在两个 JSON 文档之间生成最小 merge patch，
 * 保证 applyPatch(source, generatePatch(source, target)) 深等于 target。
 *
 * @param source - 原文档
 * @param target - 目标文档
 * @returns merge patch 文档
 */
export function generatePatch(source: JsonValue, target: JsonValue): JsonValue {
  if (!isPlainObject(target)) {
    return target;
  }
  const patch: JsonObject = {};
  const sourceObject = isPlainObject(source) ? source : {};
  Object.keys(target).forEach((key) => {
    const targetValue = target[key];
    const sourceValue = sourceObject[key];
    if (targetValue === null) {
      patch[key] = null;
    } else if (isPlainObject(targetValue)) {
      const nested = generatePatch(sourceValue, targetValue);
      if (isPlainObject(nested) && Object.keys(nested).length > 0) {
        patch[key] = nested;
      }
    } else if (JSON.stringify(sourceValue) !== JSON.stringify(targetValue)) {
      patch[key] = targetValue;
    }
  });
  Object.keys(sourceObject).forEach((key) => {
    if (!(key in target)) {
      patch[key] = null;
    }
  });
  return patch;
}
