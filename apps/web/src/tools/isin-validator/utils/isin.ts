/**
 * ISO 6166 ISIN（国际证券识别码）校验工具（零依赖纯函数）
 *
 * ISIN 为 12 位字母数字：2 位国家/地区码（字母）+ 9 位字母数字主体 + 1 位十进制校验位。
 * 校验时先将字母按 A=10…Z=35 展开为两位数字（数字保持原样），
 * 再对展开后的数字串应用 Luhn（mod 10）算法。
 */

export interface IsinStep {
  /** 原始字符 */
  char: string;
  /** 展开后的数字（1–2 位） */
  expanded: string;
}

export interface IsinResult {
  /** 规范化后的 ISIN（大写、无分隔符） */
  normalized: string;
  valid: boolean;
  /** 输入中给出的校验位；格式非法时为 null */
  givenCheck: string | null;
  /** 按主体重新计算的校验位；格式非法时为 null */
  expectedCheck: string | null;
  /** 主体（前 11 位）的逐字符展开过程 */
  steps: IsinStep[];
  /** 展开后的完整数字串（主体） */
  expanded: string;
  /** Luhn 加权求和（主体末位乘 2，向左交替） */
  weightedSum: number | null;
  error: string | null;
}

/** 完整 ISIN 结构：2 位字母国家码 + 9 位字母数字 + 1 位数字校验位 */
const ISIN_FULL_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}\d$/;

/** 缺校验位的 11 位主体 */
const ISIN_BODY_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}$/;

/**
 * 规范化输入：去除空白与常见分隔符（空格、连字符、全角空格），转大写，全角数字/字母转半角
 */
export function normalizeIsinInput(input: string): string {
  return input
    .replace(/[\s\u00a0\u3000-]/g, '')
    .toUpperCase()
    .replace(/[０-９]/g, (ch) => String(ch.charCodeAt(0) - 0xff10))
    .replace(/[Ａ-Ｚ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}

/**
 * 将单个 ISIN 字符展开为数字：数字原样，字母 A=10…Z=35
 */
export function expandChar(ch: string): string {
  if (/^[0-9]$/.test(ch)) return ch;
  return String(ch.charCodeAt(0) - 55);
}

/**
 * 由 11 位主体计算 Luhn 校验位
 *
 * @param body - 11 位 ISIN 主体
 * @returns 一位十进制校验位
 */
export function computeIsinCheckDigit(body: string): string {
  const digits = body.split('').map(expandChar).join('');
  let sum = 0;
  let doubleNext = true;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (doubleNext) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleNext = !doubleNext;
  }
  return String((10 - (sum % 10)) % 10);
}

/**
 * 单条 ISIN 处理
 *
 * - validate：校验完整 12 位 ISIN
 * - generate：接受 11 位主体补全校验位，或对完整 ISIN 纠错（输出正确校验位版本）
 */
export function processIsin(input: string, mode: 'validate' | 'generate' = 'validate'): IsinResult {
  const normalized = normalizeIsinInput(input);

  const empty: IsinResult = {
    normalized,
    valid: false,
    givenCheck: null,
    expectedCheck: null,
    steps: [],
    expanded: '',
    weightedSum: null,
    error: '内容不能为空',
  };

  if (normalized === '') return empty;

  if (!/^[A-Z0-9]+$/.test(normalized)) {
    return { ...empty, error: '包含非法字符：ISIN 仅接受大写字母与数字（A–Z、0–9）' };
  }

  // 生成模式：11 位主体直接补全
  if (mode === 'generate' && ISIN_BODY_PATTERN.test(normalized)) {
    const check = computeIsinCheckDigit(normalized);
    const steps = normalized.split('').map((ch) => ({ char: ch, expanded: expandChar(ch) }));
    return {
      normalized: `${normalized}${check}`,
      valid: true,
      givenCheck: null,
      expectedCheck: check,
      steps,
      expanded: steps.map((s) => s.expanded).join(''),
      weightedSum: luhnSum(steps.map((s) => s.expanded).join('')),
      error: null,
    };
  }

  if (!ISIN_FULL_PATTERN.test(normalized)) {
    if (normalized.length !== 12) {
      return {
        ...empty,
        error: `长度为 ${normalized.length} 位：ISIN 必须为 12 位（2 位国家码 + 9 位字母数字 + 1 位校验位）${
          mode === 'generate' ? '；补全模式也接受 11 位主体' : ''
        }`,
      };
    }
    return {
      ...empty,
      error:
        '结构不符合 ISO 6166：前 2 位必须为字母国家/地区码，第 12 位必须为十进制校验数字',
    };
  }

  const body = normalized.slice(0, 11);
  const givenCheck = normalized[11];
  const steps = body.split('').map((ch) => ({ char: ch, expanded: expandChar(ch) }));
  const expanded = steps.map((s) => s.expanded).join('');
  const weightedSum = luhnSum(expanded);
  const expectedCheck = String((10 - (weightedSum % 10)) % 10);

  if (givenCheck === expectedCheck) {
    return {
      normalized,
      valid: true,
      givenCheck,
      expectedCheck,
      steps,
      expanded,
      weightedSum,
      error: null,
    };
  }

  return {
    normalized: mode === 'generate' ? `${body}${expectedCheck}` : normalized,
    valid: false,
    givenCheck,
    expectedCheck,
    steps,
    expanded,
    weightedSum,
    error:
      mode === 'generate'
        ? null
        : `校验位不正确：末位为 ${givenCheck}，正确校验位应为 ${expectedCheck}（合法编号 ${body}${expectedCheck}）`,
  };
}

/** 对展开后的主体数字串做 Luhn 加权求和（最右侧权重 ×2，向左交替） */
function luhnSum(expanded: string): number {
  let sum = 0;
  let doubleNext = true;
  for (let i = expanded.length - 1; i >= 0; i -= 1) {
    let digit = Number(expanded[i]);
    if (doubleNext) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleNext = !doubleNext;
  }
  return sum;
}

export interface IsinBatchResult {
  output: string;
  warnings: string[];
  validCount: number;
  totalCount: number;
}

/** 多行批量处理：每行一个 ISIN，非法行原样保留并逐行告警 */
export function processIsinLines(
  input: string,
  mode: 'validate' | 'generate' = 'validate',
): IsinBatchResult {
  const outputs: string[] = [];
  const warnings: string[] = [];
  let validCount = 0;
  let totalCount = 0;

  input.split('\n').forEach((line, index) => {
    if (line.trim() === '') {
      outputs.push('');
      return;
    }
    totalCount += 1;
    const result = processIsin(line, mode);
    if (result.error) {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
      outputs.push(mode === 'generate' && result.expectedCheck ? result.normalized : line.trim());
    } else {
      if (result.valid) validCount += 1;
      outputs.push(result.normalized);
    }
  });

  return { output: outputs.join('\n'), warnings, validCount, totalCount };
}
