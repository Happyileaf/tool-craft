export const BOM = '\uFEFF';

export type LineEndingType = 'LF' | 'CRLF' | 'CR';

export interface LineEndingCounts {
  lf: number;
  crlf: number;
  cr: number;
}

export interface LineEndingAnalysis {
  counts: LineEndingCounts;
  totalEndings: number;
  types: LineEndingType[];
  isMixed: boolean;
  dominant: LineEndingType | null;
  lineCount: number;
  hasBom: boolean;
  hasFinalNewline: boolean;
  byteLength: number;
}

export interface ConversionResult {
  output: string;
  target: LineEndingType;
  bytesBefore: number;
  bytesAfter: number;
  byteDelta: number;
  endingsConverted: number;
  bomStripped: boolean;
  hasFinalNewline: boolean;
}

const LINE_ENDING_PATTERN = /\r\n|\r|\n/g;

/**
 * 以 UTF-8 编码计算字符串字节长度
 *
 * @param input - 输入字符串
 * @returns UTF-8 字节数
 */
export function getUtf8ByteLength(input: string): number {
  let total = 0;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    if (code < 0x80) {
      total += 1;
    } else if (code < 0x800) {
      total += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      total += 4;
      index += 1;
    } else {
      total += 3;
    }
  }
  return total;
}

/**
 * 检测文本的行结束符构成、BOM、末尾换行与字节大小
 *
 * @param input - 待检测文本（可包含开头的 U+FEFF BOM）
 * @returns 行结束符统计与文本结构信息
 */
export function analyzeLineEndings(input: string): LineEndingAnalysis {
  const hasBom = input.charCodeAt(0) === 0xfeff;
  const body = hasBom ? input.slice(1) : input;

  const counts: LineEndingCounts = { lf: 0, crlf: 0, cr: 0 };
  const matches = body.match(LINE_ENDING_PATTERN);
  if (matches) {
    for (const token of matches) {
      if (token === '\r\n') {
        counts.crlf += 1;
      } else if (token === '\n') {
        counts.lf += 1;
      } else {
        counts.cr += 1;
      }
    }
  }

  const totalEndings = counts.lf + counts.crlf + counts.cr;
  const countByType: Record<LineEndingType, number> = {
    LF: counts.lf,
    CRLF: counts.crlf,
    CR: counts.cr,
  };
  const types = (Object.keys(countByType) as LineEndingType[]).filter(
    (type) => countByType[type] > 0,
  );
  const isMixed = types.length > 1;

  let dominant: LineEndingType | null = null;
  if (totalEndings > 0) {
    dominant = types.reduce((a, b) => (countByType[a] >= countByType[b] ? a : b));
  }

  const hasFinalNewline = /(?:\r\n|\r|\n)$/.test(body);

  let lineCount: number;
  if (totalEndings === 0) {
    lineCount = body.length > 0 ? 1 : 0;
  } else {
    lineCount = totalEndings + 1 - (hasFinalNewline ? 1 : 0);
  }

  return {
    counts,
    totalEndings,
    types,
    isMixed,
    dominant,
    lineCount,
    hasBom,
    hasFinalNewline,
    byteLength: getUtf8ByteLength(input),
  };
}

/**
 * 将文本的全部行结束符归一化为目标类型，可选剥离开头的 UTF-8 BOM
 *
 * @param input - 原始文本
 * @param target - 目标行结束符
 * @param stripBom - 是否剥离开头 BOM，默认 true
 * @returns 转换结果与字节变化统计
 */
export function convertLineEndings(
  input: string,
  target: LineEndingType,
  stripBom = true,
): ConversionResult {
  const analysis = analyzeLineEndings(input);
  const body = analysis.hasBom && stripBom ? input.slice(1) : input;
  const normalized = body.replace(LINE_ENDING_PATTERN, (token) => {
    if (token === target) {
      return token;
    }
    if (target === 'CRLF') {
      return '\r\n';
    }
    return target === 'LF' ? '\n' : '\r';
  });

  const bytesBefore = getUtf8ByteLength(input);
  const bytesAfter = getUtf8ByteLength(normalized);

  return {
    output: normalized,
    target,
    bytesBefore,
    bytesAfter,
    byteDelta: bytesAfter - bytesBefore,
    endingsConverted: analysis.totalEndings,
    bomStripped: analysis.hasBom && stripBom,
    hasFinalNewline: /(?:\r\n|\r|\n)$/.test(normalized),
  };
}

/**
 * 仅剥离开头的 UTF-8 BOM，其余内容保持不变
 *
 * @param input - 原始文本
 * @returns 剥离 BOM 后的文本
 */
export function stripBom(input: string): string {
  return input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
}
