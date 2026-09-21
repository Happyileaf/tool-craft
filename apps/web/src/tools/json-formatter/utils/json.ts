/**
 * 格式化结果统计信息，行数、字符数与 UTF-8 字节体积
 */
export interface JsonStats {
  /** 输出文本按换行切分后的总行数 */
  lines: number;
  /** 输出文本的字符总数 */
  chars: number;
  /** 输出文本按 UTF-8 编码后的字节数 */
  bytes: number;
}

/**
 * JSON 格式化处理结果，成功与失败通过 success 字段区分
 */
export interface JsonProcessResult {
  /** 是否处理成功：true 表示解析并格式化成功，false 表示存在语法错误 */
  success: boolean;
  /** 格式化后的 JSON 文本，仅处理成功时返回 */
  output?: string;
  /** 解析器抛出的原始错误信息，处理失败时返回，供 UI 配合本地化提示展示 */
  errorMessage?: string;
}

/**
 * 递归地对对象的键按字母顺序排序，数组元素保持原顺序但递归处理其内部
 *
 * @param value - 待处理的任意 JSON 值
 * @returns 键名有序的新对象，或未做结构变更的原值
 */
export function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
  if (typeof value === 'object' && value !== null) {
    const source = value as Record<string, unknown>;
    const sortedKeys = Object.keys(source).sort();
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      result[key] = sortObjectKeys(source[key]);
    }
    return result;
  }
  return value;
}

/**
 * 修复两类常见的 JSON 笔误：单引号替换为双引号、未加双引号的键名补上双引号
 *
 * @param input - 用户输入的疑似 JSON 文本
 * @returns 完成字面替换后的文本，是否仍为合法 JSON 需由解析阶段再次确认
 */
export function repairJsonText(input: string): string {
  return input
    .replace(/'/g, '"')
    .replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');
}

/**
 * 统计格式化结果的行数、字符数与 UTF-8 字节体积，字节数按 TextEncoder 实际编码计算
 *
 * @param text - 格式化后的 JSON 文本
 * @returns 行数、字符数与字节数
 */
export function getJsonStats(text: string): JsonStats {
  return {
    lines: text.split('\n').length,
    chars: text.length,
    bytes: new TextEncoder().encode(text).length,
  };
}

/**
 * 解析并格式化 JSON 文本，全部计算在调用方线程完成，不产生副作用与网络请求
 *
 * @param input - 待处理的原始 JSON 文本
 * @param indent - 每层缩进使用的空格数，0 表示单行压缩
 * @param sort - 是否递归地按键名字母顺序排序
 * @returns 成功时携带格式化文本，失败时携带解析器原始错误信息；空输入返回 success 为 false 且无错误
 */
export function processJson(
  input: string,
  indent: number,
  sort: boolean,
): JsonProcessResult {
  if (input.trim().length === 0) {
    return { success: false };
  }

  try {
    let parsed: unknown = JSON.parse(input);
    if (sort) {
      parsed = sortObjectKeys(parsed);
    }
    const output =
      indent === 0 ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
    return { success: true, output };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, errorMessage: error.message };
    }
    throw error;
  }
}
