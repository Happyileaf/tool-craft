/**
 * JSON 格式化处理结果，成功与失败两种状态通过 success 字段区分
 */
export interface JsonFormatResult {
  /** 是否处理成功：true 表示解析并格式化成功，false 表示存在中文可读错误 */
  success: boolean;
  /** 格式化后的缩进 JSON 文本，仅处理成功时返回 */
  output?: string;
  /** 面向用户的中文错误说明，处理失败时尽量附带行列位置线索 */
  errorMessage?: string;
}

/** 输入去除空白后为空时的提示，直接指引用户补充待处理内容 */
const EMPTY_INPUT_MESSAGE = '请输入 JSON 内容';

/** 无法从解析器信息中定位错误位置时的兜底提示，覆盖括号、引号、逗号三类高频笔误 */
const FALLBACK_ERROR_MESSAGE = 'JSON 格式错误，请检查括号、引号与逗号';

/**
 * 依据字符位置换算其在原始文本中的行列号
 *
 * @param input - 参与解析的原始 JSON 文本
 * @param position - 解析器报告的从零开始的字符位置
 * @returns 从一开始计数的行号与列号
 */
function locateByPosition(input: string, position: number) {
  const before = input.slice(0, position);
  const lines = before.split('\n');
  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
}

/**
 * 将解析器原始错误信息整理为带位置线索的中文可读说明
 *
 * @param message - SyntaxError 的原始信息，不同引擎对位置的表述存在差异
 * @param input - 参与解析的原始 JSON 文本，用于由字符位置反推行列
 * @returns 附带行列位置的中文错误说明；无法提取位置时返回兜底提示
 */
function buildErrorMessage(message: string, input: string): string {
  /** V8 系引擎会给出「at position N」，优先使用精确字符位置 */
  const positionMatch = /position\s+(\d+)/i.exec(message);
  if (positionMatch) {
    const position = Number(positionMatch[1]);
    const { line, column } = locateByPosition(input, position);
    return `${FALLBACK_ERROR_MESSAGE}（错误位置：第 ${line} 行第 ${column} 列附近）`;
  }

  /** 部分引擎直接给出「line N column M」，无需再依据字符数换算 */
  const lineColumnMatch = /line\s+(\d+)[^\d]+column\s+(\d+)/i.exec(message);
  if (lineColumnMatch) {
    return `${FALLBACK_ERROR_MESSAGE}（错误位置：第 ${lineColumnMatch[1]} 行第 ${lineColumnMatch[2]} 列附近）`;
  }

  return FALLBACK_ERROR_MESSAGE;
}

/**
 * 解析并格式化 JSON 文本，计算全部在调用方当前线程完成，不产生任何副作用与网络请求
 *
 * @param input - 待处理的原始 JSON 文本
 * @param indent - 每层缩进使用的空格数，缺省为 2
 * @returns 成功时携带缩进后的 JSON 文本；空输入或解析失败时携带中文可读错误信息
 */
export function formatJson(input: string, indent = 2): JsonFormatResult {
  if (input.trim().length === 0) {
    return {
      success: false,
      errorMessage: EMPTY_INPUT_MESSAGE,
    };
  }

  try {
    const value = JSON.parse(input);
    return {
      success: true,
      output: JSON.stringify(value, null, indent),
    };
  } catch (error) {
    /** 非法 JSON 统一由 SyntaxError 表示，其他意外异常不在此吞掉 */
    if (error instanceof SyntaxError) {
      return {
        success: false,
        errorMessage: buildErrorMessage(error.message, input),
      };
    }
    throw error;
  }
}
