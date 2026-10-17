/**
 * 行级文本处理工具的处理逻辑，全部为纯函数，不依赖 DOM 与 React
 */

/** 行排序方式 */
export enum SortModeEnum {
  /** 不排序，仅执行其它行级操作 */
  NONE = 'none',
  /** 按字典序逐字符比较 */
  LEXICAL = 'lexical',
  /** 自然排序，数字片段按数值比较 */
  NATURAL = 'natural',
  /** 按行长排序 */
  LENGTH = 'length',
  /** 按整行解析出的数值排序 */
  NUMERIC = 'numeric',
}

/** 排序方向 */
export enum SortOrderEnum {
  /** 升序 */
  ASC = 'asc',
  /** 降序 */
  DESC = 'desc',
}

/** 行过滤模式 */
export enum FilterModeEnum {
  /** 不过滤 */
  NONE = 'none',
  /** 按关键字包含过滤 */
  CONTAINS = 'contains',
  /** 按正则匹配过滤 */
  REGEX = 'regex',
}

/** 过滤动作，决定保留还是剔除命中的行 */
export enum FilterActionEnum {
  /** 仅保留命中的行 */
  KEEP = 'keep',
  /** 剔除命中的行 */
  REMOVE = 'remove',
}

/** 行级操作选项 */
export interface LineOperationOptions {
  /** 排序方式 */
  sortMode: SortModeEnum;
  /** 排序方向 */
  order: SortOrderEnum;
  /** 是否去除重复行（保留首次出现） */
  dedupe: boolean;
  /** 比较与匹配是否区分大小写 */
  caseSensitive: boolean;
  /** 是否按行反转顺序 */
  reverse: boolean;
  /** 是否去除每行首尾空白 */
  trimLines: boolean;
  /** 是否移除空行与仅含空白的行 */
  removeEmpty: boolean;
  /** 过滤模式 */
  filterMode: FilterModeEnum;
  /** 过滤关键字或正则表达式 */
  filterKeyword: string;
  /** 过滤动作 */
  filterAction: FilterActionEnum;
}

/** 行级操作结果 */
export interface LineOperationResult {
  /** 处理后的文本 */
  output: string;
  /** 处理前行数 */
  inputCount: number;
  /** 处理后行数 */
  outputCount: number;
  /** 处理失败时的错误信息 */
  error: string | null;
}

/**
 * 将文本按行拆分为数组，兼容 LF / CRLF / CR 三种换行符，并忽略末尾换行产生的空行
 *
 * @param text - 待拆分文本
 * @returns 行数组；空文本返回空数组
 */
export function splitLines(text: string): string[] {
  if (text === '') {
    return [];
  }
  const normalized = text.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

/**
 * 识别文本中占主导的换行符，用于输出时保持原有行尾风格
 *
 * @param text - 原始文本
 * @returns 检测到的换行符，默认 LF
 */
export function detectNewline(text: string): string {
  const crlf = text.match(/\r\n/g);
  const lf = text.match(/(?<!\r)\n/g);
  return (crlf?.length ?? 0) > (lf?.length ?? 0) ? '\r\n' : '\n';
}

/**
 * 自然比较：将字符串切分为数字片段与非数字片段，数字片段按数值比较
 *
 * @param a - 左侧字符串
 * @param b - 右侧字符串
 * @param caseSensitive - 是否区分大小写
 * @returns 负数表示 a 在前，正数表示 b 在前，0 表示相等
 */
export function naturalCompare(
  a: string,
  b: string,
  caseSensitive: boolean,
): number {
  const left = caseSensitive ? a : a.toLowerCase();
  const right = caseSensitive ? b : b.toLowerCase();
  const chunkPattern = /\d+|\D+/g;
  const leftChunks = left.match(chunkPattern) ?? [];
  const rightChunks = right.match(chunkPattern) ?? [];
  const length = Math.min(leftChunks.length, rightChunks.length);

  for (let index = 0; index < length; index += 1) {
    const leftChunk = leftChunks[index] ?? '';
    const rightChunk = rightChunks[index] ?? '';
    const leftIsDigit = /^\d/.test(leftChunk);
    const rightIsDigit = /^\d/.test(rightChunk);

    if (leftIsDigit && rightIsDigit) {
      const leftValue = Number.parseInt(leftChunk, 10);
      const rightValue = Number.parseInt(rightChunk, 10);
      if (leftValue !== rightValue) {
        return leftValue < rightValue ? -1 : 1;
      }
      if (leftChunk !== rightChunk) {
        return leftChunk.length < rightChunk.length ? -1 : 1;
      }
    } else if (leftChunk !== rightChunk) {
      return leftChunk < rightChunk ? -1 : 1;
    }
  }

  return leftChunks.length - rightChunks.length;
}

/**
 * 基础字典序比较，可选忽略大小写
 *
 * @param a - 左侧字符串
 * @param b - 右侧字符串
 * @param caseSensitive - 是否区分大小写
 * @returns 负数表示 a 在前，正数表示 b 在前，0 表示相等
 */
function lexicalCompare(
  a: string,
  b: string,
  caseSensitive: boolean,
): number {
  const left = caseSensitive ? a : a.toLowerCase();
  const right = caseSensitive ? b : b.toLowerCase();
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}

/**
 * 按指定方式与方向对行数组排序，排序稳定，相等行保持原有相对顺序
 *
 * @param lines - 待排序行数组
 * @param mode - 排序方式
 * @param order - 排序方向
 * @param caseSensitive - 是否区分大小写
 * @returns 排序后的新数组
 */
export function sortLines(
  lines: string[],
  mode: SortModeEnum,
  order: SortOrderEnum,
  caseSensitive: boolean,
): string[] {
  if (mode === SortModeEnum.NONE) {
    return [...lines];
  }

  const comparators: Record<
    Exclude<SortModeEnum, SortModeEnum.NONE>,
    (a: string, b: string) => number
  > = {
    [SortModeEnum.LEXICAL]: (a, b) => lexicalCompare(a, b, caseSensitive),
    [SortModeEnum.NATURAL]: (a, b) => naturalCompare(a, b, caseSensitive),
    [SortModeEnum.LENGTH]: (a, b) => a.length - b.length,
    [SortModeEnum.NUMERIC]: (a, b) => {
      const left = Number.parseFloat(a);
      const right = Number.parseFloat(b);
      const leftValue = Number.isNaN(left) ? Number.POSITIVE_INFINITY : left;
      const rightValue = Number.isNaN(right) ? Number.POSITIVE_INFINITY : right;
      if (leftValue === rightValue) {
        return 0;
      }
      return leftValue < rightValue ? -1 : 1;
    },
  };

  const compare = comparators[mode];
  const factor = order === SortOrderEnum.DESC ? -1 : 1;
  return [...lines].sort((a, b) => compare(a, b) * factor);
}

/**
 * 去除重复行，保留首次出现的行
 *
 * @param lines - 行数组
 * @param caseSensitive - 是否区分大小写
 * @returns 去重后的新数组
 */
export function dedupeLines(lines: string[], caseSensitive: boolean): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const key = caseSensitive ? line : line.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(line);
    }
  }
  return result;
}

/**
 * 按关键字或正则过滤行，保留或剔除命中的行
 *
 * @param lines - 行数组
 * @param mode - 过滤模式
 * @param keyword - 关键字或正则表达式字符串
 * @param action - 过滤动作
 * @param caseSensitive - 是否区分大小写
 * @returns 过滤后的行数组与错误信息
 */
export function filterLines(
  lines: string[],
  mode: FilterModeEnum,
  keyword: string,
  action: FilterActionEnum,
  caseSensitive: boolean,
): { lines: string[]; error: string | null } {
  if (mode === FilterModeEnum.NONE || keyword === '') {
    return { lines: [...lines], error: null };
  }

  let matches: (line: string) => boolean;

  if (mode === FilterModeEnum.CONTAINS) {
    const needle = caseSensitive ? keyword : keyword.toLowerCase();
    matches = (line) =>
      (caseSensitive ? line : line.toLowerCase()).includes(needle);
  } else {
    let pattern: RegExp;
    try {
      pattern = new RegExp(keyword, caseSensitive ? 'u' : 'iu');
    } catch (caught) {
      const reason = caught instanceof Error ? caught.message : String(caught);
      return { lines: [], error: `正则表达式无效：${reason}` };
    }
    matches = (line) => pattern.test(line);
  }

  const result = lines.filter((line) =>
    action === FilterActionEnum.KEEP ? matches(line) : !matches(line),
  );
  return { lines: result, error: null };
}

/**
 * 按选项对多行文本执行完整的行级处理流水线：
 * 去空白 → 移除空行 → 过滤 → 去重 → 排序 → 反转
 *
 * @param text - 原始文本
 * @param options - 行级操作选项
 * @returns 处理结果，包含输出文本、行数统计与错误信息
 */
export function applyLineOperations(
  text: string,
  options: LineOperationOptions,
): LineOperationResult {
  const newline = detectNewline(text);
  const source = splitLines(text);
  const inputCount = source.length;

  let lines = options.trimLines ? source.map((line) => line.trim()) : source;

  if (options.removeEmpty) {
    lines = lines.filter((line) => line.trim() !== '');
  }

  const filtered = filterLines(
    lines,
    options.filterMode,
    options.filterKeyword,
    options.filterAction,
    options.caseSensitive,
  );
  if (filtered.error) {
    return {
      output: '',
      inputCount,
      outputCount: 0,
      error: filtered.error,
    };
  }
  lines = filtered.lines;

  if (options.dedupe) {
    lines = dedupeLines(lines, options.caseSensitive);
  }

  lines = sortLines(
    lines,
    options.sortMode,
    options.order,
    options.caseSensitive,
  );

  if (options.reverse) {
    lines = [...lines].reverse();
  }

  return {
    output: lines.join(newline),
    inputCount,
    outputCount: lines.length,
    error: null,
  };
}
