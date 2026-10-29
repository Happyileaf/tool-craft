/**
 * JSON 键名命名风格递归转换（纯函数、零依赖）。
 *
 * 支持 camelCase / PascalCase / snake_case / SCREAMING_SNAKE_CASE / kebab-case
 * 五种风格互转：先把任意原始键名拆成规范化小写词元（处理分隔符、camelCase
 * 边界、连续大写缩写与数字），再按目标风格拼合。递归处理嵌套对象与数组，
 * 原样保留数据值与层级；同一对象内转换后撞键时返回精确错误。
 */

export type CaseStyle =
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'screamingSnake'
  | 'kebab';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** 转换成功结果 */
export interface ConvertSuccess {
  result: JsonValue;
  /** 实际发生变化的键数量 */
  changedKeys: number;
}

/** 转换失败结果 */
export interface ConvertFailure {
  error: string;
}

/**
 * 将任意键名拆分为规范化小写词元。
 *
 * 规则：`_`/`-`/空格等分隔符分词；小写→大写为词边界（camelCase）；
 * 连续大写缩写的末尾大写与随后小写同属一个词（HTMLElement → html, element）；
 * 字母与数字相邻处分词。纯数字键原样保留为一个词元。
 *
 * @param key - 原始键名
 * @returns 小写词元数组
 */
export function splitWords(key: string): string[] {
  if (key === '') {
    return [];
  }
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();
  if (spaced === '') {
    return [];
  }
  return spaced.split(/\s+/).map((word) => word.toLowerCase());
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * 按键名拆分词元拼合目标风格。
 *
 * @param key - 原始键名
 * @param style - 目标风格
 * @returns 转换后的键名
 */
export function convertKey(key: string, style: CaseStyle): string {
  const words = splitWords(key);
  if (words.length === 0) {
    return key;
  }
  switch (style) {
    case 'camel':
      return words
        .map((word, index) => (index === 0 ? word : capitalize(word)))
        .join('');
    case 'pascal':
      return words.map(capitalize).join('');
    case 'snake':
      return words.join('_');
    case 'screamingSnake':
      return words.join('_').toUpperCase();
    case 'kebab':
      return words.join('-');
  }
}

/** 深拷贝（JSON 文档不含函数、循环引用等） */
function cloneJson(value: JsonValue): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function isPlainObject(
  value: JsonValue,
): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 递归转换 JSON 文档的全部键名。
 *
 * @param document - 原始 JSON 文档（不会被修改）
 * @param style - 目标命名风格
 * @returns 成功时返回新文档与变更键数；同级撞键时返回冲突路径与原因
 */
export function convertJsonKeys(
  document: JsonValue,
  style: CaseStyle,
): ConvertSuccess | ConvertFailure {
  let changedKeys = 0;

  function walk(value: JsonValue, path: string): JsonValue {
    if (Array.isArray(value)) {
      return value.map((item, index) => walk(item, `${path}[${index}]`));
    }
    if (!isPlainObject(value)) {
      return value;
    }

    // 先做同级撞键检测
    const targetByKey = new Map<string, string>();
    for (const originalKey of Object.keys(value)) {
      const targetKey = convertKey(originalKey, style);
      const existing = targetByKey.get(targetKey);
      if (existing !== undefined && existing !== originalKey) {
        throw new Error(
          `路径 ${path || '/'} 下键名冲突："${existing}" 与 "${originalKey}" 转换后均为 "${targetKey}"`,
        );
      }
      targetByKey.set(targetKey, originalKey);
    }

    const output: { [key: string]: JsonValue } = {};
    for (const originalKey of Object.keys(value)) {
      const targetKey = convertKey(originalKey, style);
      if (targetKey !== originalKey) {
        changedKeys += 1;
      }
      output[targetKey] = walk(value[originalKey]!, `${path}/${originalKey}`);
    }
    return output;
  }

  try {
    return { result: walk(cloneJson(document), ''), changedKeys };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '键名转换失败',
    };
  }
}
