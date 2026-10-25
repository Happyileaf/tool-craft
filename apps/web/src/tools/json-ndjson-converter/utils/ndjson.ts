/**
 * JSON 数组与 JSON Lines（NDJSON）互转纯函数实现，不依赖 DOM 与 React。
 * JSON Lines：每行一个独立 JSON 值（紧凑单行序列化），无外层数组、无行尾逗号，空行允许跳过。
 */

/** JSON 数组输出的格式化选项 */
export interface NdjsonToJsonOptions {
  /** 输出 JSON 数组的缩进空格数，默认 2 */
  indent?: number;
}

/**
 * 把 JSON 数组文本转换为 NDJSON 文本（每行一个紧凑 JSON 值）
 *
 * @param input - JSON 数组文本
 * @returns NDJSON 文本
 * @throws 输入不是合法 JSON 数组时抛出带原因的错误
 */
export function jsonToNdjson(input: string): string {
  const trimmed = input.trim();
  if (trimmed === '') {
    return '';
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('输入不是合法的 JSON，请检查语法（多余逗号、缺少引号等）');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('JSON → NDJSON 要求输入是数组（Array），NDJSON 的每一行对应数组的一个元素');
  }

  return parsed.map((item) => JSON.stringify(item)).join('\n');
}

/**
 * 把 NDJSON 文本（每行一个 JSON 值）转换为格式化的 JSON 数组文本
 *
 * @param input - NDJSON 文本
 * @param options - 输出格式化选项
 * @returns JSON 数组文本
 * @throws 任一非空行不是合法 JSON 时抛出带行号与原因的错误
 */
export function ndjsonToJson(input: string, options: NdjsonToJsonOptions = {}): string {
  const { indent = 2 } = options;
  const records: unknown[] = [];

  const lines = input.split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = (lines[lineIndex] ?? '').trim();
    if (line === '') {
      continue;
    }
    try {
      records.push(JSON.parse(line));
    } catch {
      throw new Error(`第 ${lineIndex + 1} 行不是合法的 JSON，每行必须是一个独立完整的 JSON 值`);
    }
  }

  if (records.length === 0) {
    return '';
  }

  return JSON.stringify(records, null, indent);
}
