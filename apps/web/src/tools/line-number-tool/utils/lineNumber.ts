/**
 * 文本行号添加与剥离（零依赖纯字符串函数）
 *
 * 添加模式：为每一行拼接「编号 + 分隔符 + 可选空格」前缀，支持起始号、步长、
 * 零填充对齐宽度、分隔符与是否给空行编号。
 * 剥离模式：识别行首「数字 + 分隔符 + 可选空白」前缀并移除，无前缀行原样保留。
 */

export const DEFAULT_SEPARATORS = [':', '.', ')', '|'] as const;

export interface AddLineNumbersOptions {
  /** 起始编号，整数 */
  start: number;
  /** 步长，非零整数 */
  step: number;
  /** 编号与内容之间的分隔符 */
  separator: string;
  /** 零填充对齐宽度；<=0 表示不填充，0 也可由调用方按自动宽度传入 */
  padWidth: number;
  /** 是否给空行也加编号 */
  numberBlankLines: boolean;
  /** 编号与内容之间分隔符后是否补一个空格 */
  spaceAfterSeparator: boolean;
}

export interface LineResult {
  output: string;
  error: string | null;
  /** 实际使用的填充宽度（自动模式下计算得出） */
  effectivePadWidth: number;
}

const INTEGER_RE = /^-?\d+$/;

function validateInteger(value: number, label: string): string | null {
  if (!Number.isFinite(value) || !INTEGER_RE.test(String(value))) {
    return `${label}必须是整数`;
  }
  return null;
}

/**
 * 为多行文本添加行号。
 * 注意：按「逻辑行」计数（包括空行），但 numberBlankLines=false 时空行不输出前缀。
 */
export function addLineNumbers(input: string, options: AddLineNumbersOptions): LineResult {
  const { start, step, separator, padWidth, numberBlankLines, spaceAfterSeparator } = options;

  const startError = validateInteger(start, '起始号');
  if (startError) return { output: '', error: startError, effectivePadWidth: 0 };
  const stepError = validateInteger(step, '步长');
  if (stepError) return { output: '', error: stepError, effectivePadWidth: 0 };
  if (step === 0) {
    return { output: '', error: '步长不能为 0', effectivePadWidth: 0 };
  }
  if (!Number.isInteger(padWidth) || padWidth < 0) {
    return { output: '', error: '填充宽度必须是不小于 0 的整数', effectivePadWidth: 0 };
  }
  if (separator === '') {
    return { output: '', error: '分隔符不能为空', effectivePadWidth: 0 };
  }

  const lines = input.split('\n');
  // 自动宽度：按最后一个编号的位数兜底（至少 1）
  const lastNumber = start + step * (lines.length - 1);
  const autoWidth = String(Math.abs(lastNumber)).length;
  const effectivePadWidth = padWidth > 0 ? Math.max(padWidth, autoWidth) : autoWidth;

  const suffix = separator + (spaceAfterSeparator ? ' ' : '');
  let counter = 0;
  const output = lines
    .map((line) => {
      if (line === '' && !numberBlankLines) {
        return '';
      }
      const number = start + step * counter;
      counter += 1;
      const padded = String(number).padStart(effectivePadWidth, '0');
      return `${padded}${suffix}${line}`;
    })
    .join('\n');

  return { output, error: null, effectivePadWidth };
}

/** 行首行号前缀：可选前导空格 + 一个或多个数字 + 单个分隔符 + 可选空白 */
const LINE_NUMBER_PREFIX_RE = /^\s*\d+\s*[:.)|]\s?/;

/**
 * 剥离行号前缀。支持自定义分隔符集合（默认覆盖 : . ) |，也可传入多字符分隔符如 `->`）。
 * 无前缀的行原样保留；仅去除一次前缀，避免误伤正文中的数字开头。
 */
export function stripLineNumbers(input: string, separators: string[] = [...DEFAULT_SEPARATORS]): string {
  const literals = separators
    .filter((sep) => sep !== '')
    // 长分隔符优先，避免 `->` 被单字符 `-` 提前截断
    .sort((a, b) => b.length - a.length)
    .map((sep) => sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re =
    literals.length === 0
      ? LINE_NUMBER_PREFIX_RE
      : new RegExp(`^\\s*\\d+\\s*(?:${literals.join('|')})\\s?`);
  return input
    .split('\n')
    .map((line) => line.replace(re, ''))
    .join('\n');
}
