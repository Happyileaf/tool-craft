import { NormalizationFormEnum } from '../constants';

export interface CodePoint {
  codePoint: number;
  hex: string;
  char: string;
}

export interface TextMeasure {
  codePointCount: number;
  utf16Length: number;
  utf8Bytes: number;
}

export interface DiffToken extends CodePoint {
  type: 'equal' | 'removed' | 'added';
}

/**
 * 对文本应用指定的 Unicode 规范化形式。
 *
 * @param text - 原始文本
 * @param form - NFC / NFD / NFKC / NFKD
 * @returns 规范化后的文本
 */
export function normalizeText(text: string, form: NormalizationFormEnum): string {
  return text.normalize(form);
}

/**
 * 将码点数值格式化为 U+XXXX（增补平面为 U+XXXXX）。
 *
 * @param codePoint - 码点数值
 * @returns U+XXXX 文本
 */
export function formatCodePoint(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
}

/**
 * 按 Unicode 码点拆分文本，正确处理代理对，不拆分增补平面字符。
 *
 * @param text - 输入文本
 * @returns 码点序列
 */
export function toCodePoints(text: string): CodePoint[] {
  const points: CodePoint[] = [];
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (typeof codePoint !== 'number') {
      continue;
    }
    points.push({ codePoint, hex: formatCodePoint(codePoint), char });
  }
  return points;
}

/**
 * 度量文本的码点数、UTF-16 码元数与 UTF-8 字节数。
 *
 * @param text - 输入文本
 * @returns 三项长度指标
 */
export function measureText(text: string): TextMeasure {
  return {
    codePointCount: toCodePoints(text).length,
    utf16Length: text.length,
    utf8Bytes: new TextEncoder().encode(text).length,
  };
}

/**
 * 基于 LCS（最长公共子序列）对齐转换前后的码点序列，
 * 输出带 equal / removed / added 标记的差异序列。
 *
 * @param before - 转换前码点序列
 * @param after - 转换后码点序列
 * @returns 差异 token 序列
 */
export function diffCodePoints(before: CodePoint[], after: CodePoint[]): DiffToken[] {
  const rows = before.length;
  const cols = after.length;
  const lcs: number[][] = Array.from({ length: rows + 1 }, () =>
    new Array<number>(cols + 1).fill(0),
  );

  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      if (before[i]?.codePoint === after[j]?.codePoint) {
        lcs[i]![j] = (lcs[i + 1]?.[j + 1] ?? 0) + 1;
      } else {
        lcs[i]![j] = Math.max(lcs[i + 1]?.[j] ?? 0, lcs[i]?.[j + 1] ?? 0);
      }
    }
  }

  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < cols) {
    if (before[i]?.codePoint === after[j]?.codePoint) {
      tokens.push({ ...(before[i] as CodePoint), type: 'equal' });
      i += 1;
      j += 1;
    } else if ((lcs[i + 1]?.[j] ?? 0) >= (lcs[i]?.[j + 1] ?? 0)) {
      tokens.push({ ...(before[i] as CodePoint), type: 'removed' });
      i += 1;
    } else {
      tokens.push({ ...(after[j] as CodePoint), type: 'added' });
      j += 1;
    }
  }
  while (i < rows) {
    tokens.push({ ...(before[i] as CodePoint), type: 'removed' });
    i += 1;
  }
  while (j < cols) {
    tokens.push({ ...(after[j] as CodePoint), type: 'added' });
    j += 1;
  }
  return tokens;
}
