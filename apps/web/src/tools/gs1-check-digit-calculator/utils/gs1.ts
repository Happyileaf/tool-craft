/**
 * GS1 模 10 加权校验位与 SSCC / ITF-14(GTIN-14) 数字串生成（零依赖纯函数）
 *
 * 算法对齐 GS1 General Specifications：
 * - 从 payload 最右侧数字起，权重按 3、1 交替（右起第 1 位 ×3，第 2 位 ×1 …）
 * - 加权和 S 对 10 取模，校验位 = (10 − S mod 10) mod 10
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export interface Gs1Error {
  error: string;
}

export interface CheckDigitResult {
  checkDigit: number;
  /** 加权求和过程，便于 UI 分步复算 */
  weightedSum: number;
  /** 每位数字与对应权重（自右向左） */
  steps: Array<{ digit: number; weight: 1 | 3; product: number }>;
}

export interface VerifyResult {
  valid: boolean;
  expected: number | null;
  actual: number | null;
  error: string | null;
}

export interface BuildResult {
  output: string;
  payload: string;
  checkDigit: number | null;
  error: string | null;
}

/** 去除输入中所有空白与连字符（条码常按分组排版） */
export function normalizeDigits(input: string): string {
  return input.replace(/[\s-]/g, '');
}

/** 校验清洗后的串是否为纯数字，返回带原因的错误或 null */
export function digitsError(input: string): string | null {
  if (input === '') {
    return '内容不能为空';
  }
  if (!/^\d+$/.test(input)) {
    return '包含非数字字符：只接受 0-9（空白与连字符会被忽略）';
  }
  return null;
}

/**
 * 通用模 10 加权：从 digits 最右侧起按 weightsFromRight 循环取权重。
 * GS1 标准权重序列为 [3, 1]。
 */
export function mod10Weighted(digits: string, weightsFromRight: number[] = [3, 1]): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    const digit = Number(digits[digits.length - 1 - i]);
    const weight = weightsFromRight[i % weightsFromRight.length] ?? 1;
    sum += digit * weight;
  }
  return (10 - (sum % 10)) % 10;
}

/** GS1 校验位：返回校验位、加权和与分步过程 */
export function gs1CheckDigit(payload: string): CheckDigitResult | Gs1Error {
  const code = normalizeDigits(payload);
  const invalid = digitsError(code);
  if (invalid !== null) {
    return { error: invalid };
  }
  const steps: CheckDigitResult['steps'] = [];
  let weightedSum = 0;
  for (let i = 0; i < code.length; i += 1) {
    const digit = Number(code[code.length - 1 - i]);
    const weight = (i % 2 === 0 ? 3 : 1) as 1 | 3;
    const product = digit * weight;
    weightedSum += product;
    steps.push({ digit, weight, product });
  }
  const checkDigit = (10 - (weightedSum % 10)) % 10;
  return { checkDigit, weightedSum, steps };
}

/** 在 payload 末尾追加校验位，返回完整编码 */
export function appendCheckDigit(payload: string): BuildResult {
  const result = gs1CheckDigit(payload);
  if ('error' in result) {
    return { output: '', payload: '', checkDigit: null, error: result.error };
  }
  const code = normalizeDigits(payload);
  return {
    output: code + String(result.checkDigit),
    payload: code,
    checkDigit: result.checkDigit,
    error: null,
  };
}

/** 验证完整编码的末位校验位 */
export function verifyCheckDigit(fullCode: string): VerifyResult {
  const code = normalizeDigits(fullCode);
  const invalid = digitsError(code);
  if (invalid !== null) {
    return { valid: false, expected: null, actual: null, error: invalid };
  }
  if (code.length < 2) {
    return {
      valid: false,
      expected: null,
      actual: null,
      error: `完整编码至少需要 2 位数字，当前为 ${code.length} 位`,
    };
  }
  const payload = code.slice(0, -1);
  const actual = Number(code[code.length - 1]);
  const result = gs1CheckDigit(payload);
  if ('error' in result) {
    return { valid: false, expected: null, actual, error: result.error };
  }
  return {
    valid: result.checkDigit === actual,
    expected: result.checkDigit,
    actual,
    error: null,
  };
}

/** 左侧补零到指定长度；超长时返回错误而非截断 */
function padLeft(code: string, length: number, label: string): { value: string } | Gs1Error {
  if (code.length > length) {
    return { error: `${label}长度不能超过 ${length} 位，当前为 ${code.length} 位` };
  }
  return { value: code.padStart(length, '0') };
}

/**
 * 生成 SSCC（18 位）：扩展位(1) + 厂商识别代码 + 序列号，payload 左侧补零对齐 17 位后加校验位。
 */
export function buildSSCC(
  extensionDigit: string,
  companyPrefixAndSerial: string,
): BuildResult {
  const ext = normalizeDigits(extensionDigit);
  const rest = normalizeDigits(companyPrefixAndSerial);
  if (ext === '' || !/^\d$/.test(ext)) {
    return {
      output: '',
      payload: '',
      checkDigit: null,
      error: '扩展位必须是 0-9 的单个数字',
    };
  }
  const invalid = digitsError(rest);
  if (invalid !== null) {
    return { output: '', payload: '', checkDigit: null, error: invalid };
  }
  if (rest.length > 16) {
    return {
      output: '',
      payload: '',
      checkDigit: null,
      error: `厂商识别代码与序列号合计不能超过 16 位，当前为 ${rest.length} 位`,
    };
  }
  const payload = ext + rest.padStart(16, '0');
  const result = appendCheckDigit(payload);
  if (result.error !== null || result.output.length !== 18) {
    return {
      output: '',
      payload,
      checkDigit: null,
      error: result.error ?? 'SSCC 生成结果长度异常',
    };
  }
  return result;
}

/**
 * 生成 ITF-14 / GTIN-14（14 位）：包装指示符(1 位, 0-9) + 12 位内容（短码补零）组成
 * 13 位 payload，再追加 1 位校验位。
 */
export function buildItf14(packagingLevel: string, gtinWithoutCheck: string): BuildResult {
  const level = normalizeDigits(packagingLevel);
  const body = normalizeDigits(gtinWithoutCheck);
  if (level === '' || !/^\d$/.test(level)) {
    return {
      output: '',
      payload: '',
      checkDigit: null,
      error: '包装指示符必须是 0-9 的单个数字',
    };
  }
  const invalid = digitsError(body);
  if (invalid !== null) {
    return { output: '', payload: '', checkDigit: null, error: invalid };
  }
  if (body.length > 12) {
    return {
      output: '',
      payload: '',
      checkDigit: null,
      error: `包装内容码（不含校验位）不能超过 12 位，当前为 ${body.length} 位`,
    };
  }
  const payload = level + body.padStart(12, '0');
  const result = appendCheckDigit(payload);
  if (result.error !== null || result.output.length !== 14) {
    return {
      output: '',
      payload,
      checkDigit: null,
      error: result.error ?? 'ITF-14 生成结果长度异常',
    };
  }
  return result;
}

/**
 * 短码转 GTIN-14：接受 GTIN-8/12/13（含原校验位），
 * 左侧补零到 14 位；补零不改变模 10 加权结果，故校验位保持一致。
 */
export function toGtin14(gtin: string): BuildResult {
  const code = normalizeDigits(gtin);
  const invalid = digitsError(code);
  if (invalid !== null) {
    return { output: '', payload: '', checkDigit: null, error: invalid };
  }
  if (![8, 12, 13, 14].includes(code.length)) {
    return {
      output: '',
      payload: '',
      checkDigit: null,
      error: `仅支持 GTIN-8 / GTIN-12 / GTIN-13 / GTIN-14 长度，当前为 ${code.length} 位`,
    };
  }
  const verify = verifyCheckDigit(code);
  if (verify.error !== null) {
    return { output: '', payload: '', checkDigit: null, error: verify.error };
  }
  if (!verify.valid) {
    return {
      output: '',
      payload: '',
      checkDigit: verify.expected,
      error: `原码校验位不合法：末位为 ${verify.actual}，应为 ${verify.expected}，请先修正再转换`,
    };
  }
  const padded = padLeft(code, 14, 'GTIN');
  if ('error' in padded) {
    return { output: '', payload: '', checkDigit: null, error: padded.error };
  }
  return { output: padded.value, payload: padded.value.slice(0, -1), checkDigit: verify.actual, error: null };
}

export interface BatchRow {
  index: number;
  input: string;
  output: string;
  valid: boolean;
  detail: string;
}

/** 批量校验：每行一个完整编码，输出逐行结论；空行跳过 */
export function verifyLines(input: string): BatchRow[] {
  const rows: BatchRow[] = [];
  input.split('\n').forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === '') {
      return;
    }
    const result = verifyCheckDigit(line);
    if (result.error !== null) {
      rows.push({ index: index + 1, input: line, output: '', valid: false, detail: result.error });
      return;
    }
    rows.push({
      index: index + 1,
      input: line,
      output: normalizeDigits(line),
      valid: result.valid,
      detail: result.valid
        ? `校验通过（末位 ${result.actual}）`
        : `校验失败：末位 ${result.actual}，应为 ${result.expected}`,
    });
  });
  return rows;
}
