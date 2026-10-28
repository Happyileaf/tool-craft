/**
 * JSONC / 宽松 JSON 清洗：剥离 //、/* *\/ 注释与尾随逗号，
 * 输出可被标准 JSON.parse 消费的严格 JSON 文本。
 * 纯词法扫描、零依赖；字符串字面量内部的注释符号、逗号一律原样保留。
 */

/** 转换结果，成功与失败通过 success 字段区分 */
export interface JsoncConvertResult {
  /** 是否转换成功：true 表示清洗后为合法 JSON */
  success: boolean;
  /** 严格 JSON 输出文本，仅成功时存在 */
  output?: string;
  /** 仅做词法清洗（保留原始空白）后的文本，成功时存在，便于对照 */
  cleaned?: string;
  /** 失败原因（面向用户的中文信息或解析器原始报错） */
  errorMessage?: string;
}

/** 输出排版模式：minify 为单行压缩，数字为每层缩进空格数 */
export type JsoncIndent = 0 | 2 | 4;

/**
 * 剥离 JSONC 注释：行注释 // 与块注释 /* *\/ 均替换为等长空白
 * （其中换行予以保留，使后续 JSON 解析报错的行列号仍与原文一致）。
 * 双引号字符串内部的 //、/* 不会被当作注释，转义符 \" 已正确处理。
 *
 * @param input - 原始 JSONC 文本
 * @returns 移除注释后的文本
 * @throws 块注释未闭合时抛出错误
 */
export function stripJsonComments(input: string): string {
  let output = '';
  let inString = false;
  let i = 0;

  while (i < input.length) {
    const char = input[i]!;

    if (inString) {
      output += char;
      if (char === '\\' && i + 1 < input.length) {
        // 转义字符与下一字符整体原样保留
        output += input[i + 1]!;
        i += 2;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      i += 1;
      continue;
    }

    if (char === '/' && input[i + 1] === '/') {
      // 两个斜杠也替换为空格，保证后续解析报错行列号与原文一致
      output += '  ';
      i += 2;
      while (i < input.length && input[i] !== '\n') {
        output += ' ';
        i += 1;
      }
      continue;
    }

    if (char === '/' && input[i + 1] === '*') {
      output += '  ';
      i += 2;
      let closed = false;
      while (i < input.length) {
        if (input[i] === '*' && input[i + 1] === '/') {
          output += '  ';
          i += 2;
          closed = true;
          break;
        }
        // 保留块注释内的换行，维持行列位置
        output += input[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      if (!closed) {
        throw new Error('存在未闭合的块注释（缺少 */）');
      }
      continue;
    }

    output += char;
    i += 1;
  }

  return output;
}

/**
 * 移除尾随逗号：仅删除 } 或 ] 之前（允许中间有空白）的那个逗号。
 * 必须在注释剥离之后调用，且扫描会跳过双引号字符串。
 *
 * @param input - 已移除注释的 JSON 文本
 * @returns 移除尾随逗号后的文本
 */
export function stripTrailingCommas(input: string): string {
  let output = '';
  let inString = false;
  let i = 0;

  while (i < input.length) {
    const char = input[i]!;

    if (inString) {
      output += char;
      if (char === '\\' && i + 1 < input.length) {
        output += input[i + 1]!;
        i += 2;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      i += 1;
      continue;
    }

    if (char === ',') {
      let j = i + 1;
      while (j < input.length && /\s/.test(input[j]!)) {
        j += 1;
      }
      if (input[j] === '}' || input[j] === ']') {
        // 用空格顶替逗号，保留后续空白与换行位置
        output += ' ';
        i += 1;
        continue;
      }
    }

    output += char;
    i += 1;
  }

  return output;
}

/**
 * 把 JSONC / 宽松 JSON 转换为严格 JSON：
 * 先词法剥离注释与尾随逗号（字符串内部不受影响），再用 JSON.parse 校验，
 * 最后按缩进模式重新序列化。空输入返回 success 为 false 且无错误。
 *
 * @param input - 待转换的 JSONC 文本
 * @param indent - 排版模式，0 为单行压缩，2 / 4 为缩进空格数
 * @returns 转换结果；成功携带 output 与 cleaned，失败携带 errorMessage
 */
export function convertJsonc(
  input: string,
  indent: JsoncIndent = 2,
): JsoncConvertResult {
  if (input.trim().length === 0) {
    return { success: false };
  }

  let cleaned: string;
  try {
    cleaned = stripTrailingCommas(stripJsonComments(input));
  } catch (error) {
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : '词法清洗失败',
    };
  }

  try {
    const parsed: unknown = JSON.parse(cleaned);
    const output =
      indent === 0 ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
    return { success: true, output, cleaned };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, cleaned, errorMessage: error.message };
    }
    throw error;
  }
}
