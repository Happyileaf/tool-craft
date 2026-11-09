/**
 * ISSN（国际标准连续出版物号，ISO 3297）校验位与规范化工具。
 * 纯字符与整数运算，无外部依赖，固定输入必有固定输出。
 */

export type IssnMode = 'validate' | 'complete';

export interface IssnResult {
  ok: boolean;
  /** 规范化标准格式 NNNN-NNNC（合法时输出） */
  normalized: string | null;
  /** 实际/补全后的校验位字符（0..9 或 X） */
  checkDigit: string | null;
  /** 期望值，用于错号提示 */
  expectedCheckDigit: string | null;
  error: string | null;
}

export interface BatchRow extends IssnResult {
  index: number;
  raw: string;
}

export interface BatchResult {
  rows: BatchRow[];
  total: number;
  valid: number;
  invalid: number;
}

/** 剥离空格与连字符，转大写 */
export function normalizeDigits(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

/** 按权重 8..2 对前 7 位加权求和，返回 mod-11 校验位字符（10 -> X，11 -> 0） */
export function computeCheckDigit(prefix7: string): string {
  let sum = 0;
  for (let i = 0; i < 7; i += 1) {
    sum += Number(prefix7[i]) * (8 - i);
  }
  const r = 11 - (sum % 11);
  if (r === 10) return 'X';
  if (r === 11) return '0';
  return String(r);
}

function formatStandard(digits8: string): string {
  return `${digits8.slice(0, 4)}-${digits8.slice(4)}`;
}

/** 校验完整 8 位 ISSN（允许带连字符/空格、末位小写 x） */
export function validateIssn(raw: string): IssnResult {
  const digits = normalizeDigits(raw);
  if (digits.length === 0) {
    return { ok: false, normalized: null, checkDigit: null, expectedCheckDigit: null, error: '输入为空' };
  }
  if (digits.length !== 8) {
    return {
      ok: false,
      normalized: null,
      checkDigit: null,
      expectedCheckDigit: null,
      error: `长度为 ${digits.length} 位，完整 ISSN 必须为 8 位`,
    };
  }
  const prefix = digits.slice(0, 7);
  if (!/^\d{7}$/.test(prefix)) {
    return { ok: false, normalized: null, checkDigit: null, expectedCheckDigit: null, error: '前 7 位必须全部为数字' };
  }
  if (!/^[0-9X]$/.test(digits[7] ?? '')) {
    return { ok: false, normalized: null, checkDigit: null, expectedCheckDigit: null, error: '校验位必须为数字或 X' };
  }

  const expected = computeCheckDigit(prefix);
  const actual = digits[7] ?? '';
  if (actual !== expected) {
    return {
      ok: false,
      normalized: null,
      checkDigit: actual,
      expectedCheckDigit: expected,
      error: `校验位错误：实际为 ${actual}，期望为 ${expected}`,
    };
  }
  return {
    ok: true,
    normalized: formatStandard(digits),
    checkDigit: actual,
    expectedCheckDigit: expected,
    error: null,
  };
}

/** 为 7 位前缀补全校验位，返回完整标准 ISSN */
export function completeIssn(raw: string): IssnResult {
  const digits = normalizeDigits(raw);
  if (digits.length !== 7) {
    return {
      ok: false,
      normalized: null,
      checkDigit: null,
      expectedCheckDigit: null,
      error: `补全模式需要 7 位前缀，当前为 ${digits.length} 位`,
    };
  }
  if (!/^\d{7}$/.test(digits)) {
    return { ok: false, normalized: null, checkDigit: null, expectedCheckDigit: null, error: '前缀必须全部为数字' };
  }
  const check = computeCheckDigit(digits);
  const full = digits + check;
  return {
    ok: true,
    normalized: formatStandard(full),
    checkDigit: check,
    expectedCheckDigit: check,
    error: null,
  };
}

/** 批量校验：每行一个号码，空行跳过，逐条标注合法/非法与原因 */
export function validateBatch(text: string): BatchResult {
  const lines = text.split(/\r?\n/);
  const rows: BatchRow[] = [];
  let valid = 0;
  let invalid = 0;

  lines.forEach((line, i) => {
    const raw = line.trim();
    if (raw === '') return;
    const result = validateIssn(raw);
    if (result.ok) valid += 1;
    else invalid += 1;
    rows.push({ index: i + 1, raw, ...result });
  });

  return { rows, total: rows.length, valid, invalid };
}
