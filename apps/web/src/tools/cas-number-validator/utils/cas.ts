/**
 * CAS 化学物质登记号（CAS Registry Number）模 10 校验位算法（零依赖纯函数）
 *
 * CAS RN 形如 `7732-18-5`（水），由三段组成：登记号主体（2–7 位，
 * 未来扩展至最多 10 位）- 两位序号 - 一位校验位。
 * 校验规则：去掉全部连字符后，从右向左对校验位之前的数字依次乘以
 * 权重 1,2,3,…，求和后对 10 取模，结果须等于末位校验数字。
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

/** 当前 CAS RN 三段结构：首段 2–10 位、次段固定 2 位、末段 1 位校验位 */
const CAS_FULL_PATTERN = /^\d{2,10}-\d{2}-\d$/;

/** 缺校验位的两段形式（生成模式允许的输入，如 `7732-18`） */
const CAS_BODY_PATTERN = /^\d{2,10}-\d{2}$/;

/**
 * 规范化输入：去除所有空白（含全角空格），全角数字转半角，
 * 全角连字符（U+FF0D、U+2010 系列排版连字符）统一为半角 `-`。
 */
export function normalizeCasInput(input: string): string {
  return input
    .replace(/[\s\u00a0\u3000]/g, '')
    .replace(/[－﹣―]/g, '-')
    .replace(/[０-９]/g, (ch) => String(ch.charCodeAt(0) - 0xff10));
}

/**
 * 由登记号主体（连字符前的全部数字，不含校验位）计算校验位。
 * 从最右侧数字起依次乘以 1,2,3,…。
 */
export function computeCasCheckDigit(bodyDigits: string): string {
  let sum = 0;
  for (let i = 0; i < bodyDigits.length; i += 1) {
    const digit = Number(bodyDigits[bodyDigits.length - 1 - i]);
    sum += digit * (i + 1);
  }
  return String(sum % 10);
}

export interface CasResult {
  /** 规范化后的标准排版（校验模式回显；生成模式为补全后的完整号） */
  output: string;
  /** 实际算出的校验位 */
  checkDigit: string | null;
  valid: boolean;
  error: string | null;
}

/** 结构校验：三段位数合法且首段首位非 0（0 开头号段未分配） */
function checkStructure(formatted: string): string | null {
  if (!CAS_FULL_PATTERN.test(formatted)) {
    return '格式不符合 CAS RN 结构：应为「2–10 位数字-2 位数字-1 位校验位」（如 7732-18-5）';
  }
  if (formatted.startsWith('0')) {
    return '首段以 0 开头：CAS 登记号首位不能为 0';
  }
  return null;
}

/**
 * 单条处理。
 * - validate：输入完整 CAS RN，校验结构与末位校验位，合法时回显原号
 * - generate：输入两段主体（`7732-18`）补全校验位；输入完整号则校验并纠错
 */
export function processCas(input: string, mode: 'validate' | 'generate' = 'validate'): CasResult {
  const formatted = normalizeCasInput(input);

  if (formatted === '') {
    return { output: '', checkDigit: null, valid: false, error: '内容不能为空' };
  }
  if (!/^[\d-]+$/.test(formatted)) {
    return {
      output: '',
      checkDigit: null,
      valid: false,
      error: `「${input}」包含非数字字符：CAS RN 只接受数字与连字符`,
    };
  }

  // 生成模式且输入为两段主体：直接补全校验位
  if (mode === 'generate' && CAS_BODY_PATTERN.test(formatted) && !formatted.startsWith('0')) {
    const bodyDigits = formatted.replace(/-/g, '');
    const checkDigit = computeCasCheckDigit(bodyDigits);
    return { output: `${formatted}-${checkDigit}`, checkDigit, valid: true, error: null };
  }

  const structureError = checkStructure(formatted);
  if (structureError) {
    return { output: '', checkDigit: null, valid: false, error: structureError };
  }

  const parts = formatted.split('-');
  const bodyDigits = (parts[0] ?? '') + (parts[1] ?? '');
  const given = parts[2] ?? '';
  const expected = computeCasCheckDigit(bodyDigits);

  if (given === expected) {
    return { output: formatted, checkDigit: expected, valid: true, error: null };
  }
  return {
    output: `${parts[0]}-${parts[1]}-${expected}`,
    checkDigit: expected,
    valid: false,
    error: `校验位不正确：末位为 ${given}，正确校验位应为 ${expected}（合法编号 ${parts[0]}-${parts[1]}-${expected}）`,
  };
}

export interface CasBatchResult {
  output: string;
  warnings: string[];
  /** 合法条数 */
  validCount: number;
  /** 参与校验的非空行总数 */
  totalCount: number;
}

/** 多行批量处理：每行一个 CAS RN，非法行原样保留并逐行告警 */
export function processCasLines(
  input: string,
  mode: 'validate' | 'generate' = 'validate',
): CasBatchResult {
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
    const result = processCas(line, mode);
    if (result.error) {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
      outputs.push(result.output === '' ? line : result.output);
    } else {
      validCount += 1;
      outputs.push(result.output);
    }
  });

  return { output: outputs.join('\n'), warnings, validCount, totalCount };
}
