export const ROMAN_MIN = 1;
export const ROMAN_MAX = 3999;

const VALUE_SYMBOLS: ReadonlyArray<readonly [number, string]> = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

const SYMBOL_VALUES: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

/**
 * 把 1–3999 的整数转为标准减法记法罗马数字
 *
 * @param value - 待转换整数
 * @returns 大写罗马数字
 */
export function integerToRoman(value: number): string {
  if (!Number.isInteger(value) || value < ROMAN_MIN || value > ROMAN_MAX) {
    throw new Error(`仅支持 ${ROMAN_MIN}–${ROMAN_MAX} 的整数`);
  }
  let remaining = value;
  let result = '';
  for (const [amount, symbol] of VALUE_SYMBOLS) {
    while (remaining >= amount) {
      result += symbol;
      remaining -= amount;
    }
  }
  return result;
}

/**
 * 解析单个罗马数字字符串（容忍大小写与首尾空白），并严格校验为标准减法记法
 *
 * @param input - 罗马数字字符串
 * @returns 对应整数
 */
export function romanToInteger(input: string): number {
  const normalized = input.trim().toUpperCase();
  if (normalized.length === 0) {
    throw new Error('罗马数字不能为空');
  }
  if (!/^[IVXLCDM]+$/.test(normalized)) {
    throw new Error('包含非罗马数字字符（仅允许 I、V、X、L、C、D、M）');
  }
  let total = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    const current = SYMBOL_VALUES[normalized[index] as string] as number;
    const next = index + 1 < normalized.length ?
      (SYMBOL_VALUES[normalized[index + 1] as string] as number) :
      0;
    total += current < next ? -current : current;
  }
  if (total < ROMAN_MIN || total > ROMAN_MAX || integerToRoman(total) !== normalized) {
    throw new Error('不是标准减法记法（请检查重复或减法组合，如 IIII、VX、IC、MMMM 均非法）');
  }
  return total;
}

/**
 * 自动识别输入方向：纯数字按整数→罗马，否则按罗马→整数
 *
 * @param input - 单行输入
 * @returns 转换结果字符串
 */
export function convertLine(input: string): string {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    return integerToRoman(Number(trimmed));
  }
  return String(romanToInteger(trimmed));
}

export interface BatchLineResult {
  line: number;
  input: string;
  output: string | null;
  error: string | null;
}

/**
 * 逐行批量转换，每行独立成功或失败
 *
 * @param input - 多行文本
 * @returns 每行的转换结果
 */
export function convertBatch(input: string): BatchLineResult[] {
  return input
    .split('\n')
    .map((raw, index) => ({ raw, line: index + 1 }))
    .filter(({ raw }) => raw.trim().length > 0)
    .map(({ raw, line }) => {
      try {
        return { line, input: raw.trim(), output: convertLine(raw), error: null };
      } catch (caught) {
        return {
          line,
          input: raw.trim(),
          output: null,
          error: caught instanceof Error ? caught.message : '转换失败',
        };
      }
    });
}
