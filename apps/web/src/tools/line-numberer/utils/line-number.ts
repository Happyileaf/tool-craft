/** 文本行号添加与剥离的核心纯函数 */

/** 添加行号时的可配置项 */
export interface LineNumberOptions {
  /** 起始编号 */
  start: number;
  /** 相邻编号的步长 */
  step: number;
  /** 编号与正文之间的分隔符 */
  separator: string;
  /** 零填充宽度，0 表示按最大编号自动对齐 */
  padWidth: number;
  /** 是否为空行编号 */
  numberBlankLines: boolean;
}

/**
 * 校验行号参数，非法时抛出可直接展示的错误信息
 */
export function validateOptions(options: LineNumberOptions): void {
  if (!Number.isInteger(options.start) || options.start < 0 || options.start > 999999) {
    throw new Error('起始编号需为 0–999999 的整数');
  }
  if (!Number.isInteger(options.step) || options.step < 1 || options.step > 9999) {
    throw new Error('步长需为 1–9999 的整数');
  }
  if (!Number.isInteger(options.padWidth) || options.padWidth < 0 || options.padWidth > 12) {
    throw new Error('对齐宽度需为 0–12 的整数（0 表示自动）');
  }
  if (typeof options.separator !== 'string' || options.separator === '') {
    throw new Error('分隔符不能为空');
  }
}

/**
 * 为多行文本添加行号，空行是否编号由配置决定
 */
export function addLineNumbers(input: string, options: LineNumberOptions): string {
  if (input === '') {
    return '';
  }
  validateOptions(options);

  const lines = input.split('\n');
  const shouldNumber = (line: string): boolean =>
    options.numberBlankLines || line.trim() !== '';
  const numberedCount = lines.filter(shouldNumber).length;
  const maxNumber = options.start + Math.max(numberedCount - 1, 0) * options.step;
  const width = options.padWidth > 0 ? options.padWidth : String(maxNumber).length;

  let current = options.start;
  return lines
    .map((line) => {
      if (!shouldNumber(line)) {
        return line;
      }
      const prefix = `${String(current).padStart(width, '0')}${options.separator}`;
      current += options.step;
      return `${prefix}${line}`;
    })
    .join('\n');
}

/**
 * 移除行首的「数字 + : . ) | Tab」编号前缀，无前缀的行保持原样
 */
export function stripLineNumbers(input: string): string {
  if (input === '') {
    return '';
  }
  const prefixPattern = /^[ \t]*\d+[ \t]*(?:[.:|)][ \t]+|\t[ \t]*)/;
  return input
    .split('\n')
    .map((line) => line.replace(prefixPattern, ''))
    .join('\n');
}
