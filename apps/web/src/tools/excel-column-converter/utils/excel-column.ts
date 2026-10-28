/**
 * Excel 字母列名（bijective base-26）与 1 起始列序号互转（零依赖纯函数）
 *
 * 本模块不触碰 DOM 与 React，所有错误以结果对象返回而非抛出。
 * Excel 最大列为 XFD = 16384。
 */

export const EXCEL_MAX_COLUMN = 16384;

export type ExcelDirection = 'toNumber' | 'toColumn';

export interface SingleResult {
  /** 转换后的主结果（合法时） */
  output: string;
  error: string | null;
}

export interface BatchResult {
  output: string;
  warnings: string[];
  error: string | null;
}

/**
 * 字母列名 → 序号：A→1、Z→26、AA→27、XFD→16384。
 * 大小写不敏感，由调用方保证已 trim；非法输入抛错。
 */
export function columnToNumber(column: string): number {
  const normalized = column.trim();
  if (normalized.length === 0) {
    throw new Error('列名不能为空');
  }
  if (!/^[A-Za-z]+$/.test(normalized)) {
    throw new Error(`「${column}」不是合法列名：仅允许 A-Z 字母（如 A、Z、AA、XFD）`);
  }
  let number = 0;
  for (const char of normalized.toUpperCase()) {
    number = number * 26 + (char.charCodeAt(0) - 64);
    if (number > EXCEL_MAX_COLUMN) {
      throw new Error(
        `列「${column}」超出 Excel 最大列 XFD（${EXCEL_MAX_COLUMN}）`,
      );
    }
  }
  return number;
}

/**
 * 序号 → 字母列名：1→A、26→Z、27→AA、16384→XFD。
 * 入参为正整数且不超过 16384，否则抛错。
 */
export function numberToColumn(value: number): string {
  if (!Number.isInteger(value)) {
    throw new Error('列序号必须是整数');
  }
  if (value < 1) {
    throw new Error('列序号必须从 1 开始（Excel 没有第 0 列）');
  }
  if (value > EXCEL_MAX_COLUMN) {
    throw new Error(
      `列序号 ${value} 超出 Excel 最大列 XFD（${EXCEL_MAX_COLUMN}）`,
    );
  }
  let remaining = value;
  let column = '';
  while (remaining > 0) {
    const remainder = (remaining - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    remaining = Math.floor((remaining - 1) / 26);
  }
  return column;
}

/** 单行转换（方向自动判断：toNumber 按字母解析，toColumn 按数字解析） */
export function convertLine(line: string, direction: ExcelDirection): SingleResult {
  const trimmed = line.trim();
  try {
    if (direction === 'toNumber') {
      return { output: String(columnToNumber(trimmed)), error: null };
    }
    if (!/^[+-]?\d+$/.test(trimmed)) {
      throw new Error(`「${line}」不是合法列序号：请输入 1–${EXCEL_MAX_COLUMN} 的整数`);
    }
    return { output: numberToColumn(Number(trimmed)), error: null };
  } catch (err) {
    return { output: '', error: (err as Error).message };
  }
}

/** 多行批量转换：每行一个值，非法行原样标注错误且不影响其他行 */
export function convertLines(input: string, direction: ExcelDirection): BatchResult {
  const lines = input.split('\n');
  const outputs: string[] = [];
  const warnings: string[] = [];
  lines.forEach((line, index) => {
    if (line.trim() === '') {
      outputs.push('');
      return;
    }
    const result = convertLine(line, direction);
    if (result.error) {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
      outputs.push(line);
    } else {
      outputs.push(result.output);
    }
  });
  return { output: outputs.join('\n'), warnings, error: null };
}
