/**
 * ISSN（ISO 3297）模 11 加权校验位（零依赖纯函数）
 *
 * 规则：前 7 位数字分别乘以权重 8、7、6、5、4、3、2 求和 S；
 * r = 11 - (S mod 11)；r=11 时校验位为 '0'，r=10 时为 'X'，否则为对应数字。
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export interface IssnResult {
  /** 标准格式的 ISSN（NNNN-NNNN），非法输入为空串 */
  output: string;
  checkDigit: string | null;
  valid: boolean;
  error: string | null;
}

/** 去除输入中所有空白与连字符（ISSN 常按 NNNN-NNNN 分组排版），X 统一转大写 */
function normalize(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

/** 按 NNNN-NNNN 插入连字符，code 必须为 8 位且末位为数字或 X */
export function formatIssn(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * 计算 ISSN 校验位。body 为不含校验位的 7 位数字串，
 * 自左向右按权重 8…2 加权求和后对 11 取补码。
 */
export function computeCheckDigit(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i += 1) {
    sum += Number(body[i]) * (8 - i);
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) {
    return '0';
  }
  if (remainder === 10) {
    return 'X';
  }
  return String(remainder);
}

/** 单条 ISSN 处理：7 位补全校验位，8 位校验合法性 */
export function processIssn(input: string): IssnResult {
  const code = normalize(input);

  if (code.length === 0) {
    return { output: '', checkDigit: null, valid: false, error: '内容不能为空' };
  }
  if (!/^[\dX]+$/.test(code)) {
    return {
      output: '',
      checkDigit: null,
      valid: false,
      error: `「${input}」包含非法字符：ISSN 只接受 0-9，且仅末位可以为 X（空白与连字符可忽略）`,
    };
  }
  if (code.length !== 7 && code.length !== 8) {
    return {
      output: '',
      checkDigit: null,
      valid: false,
      error: `长度必须为 7 位（补全校验位）或 8 位（校验合法性），当前为 ${code.length} 位`,
    };
  }
  if (!/^\d{7}[\dX]?$/.test(code)) {
    return {
      output: '',
      checkDigit: null,
      valid: false,
      error: `「${input}」包含非法字符：ISSN 的 X 只能出现在末位（空白与连字符可忽略）`,
    };
  }

  const body = code.slice(0, 7);
  const expected = computeCheckDigit(body);

  if (code.length === 7) {
    const full = body + expected;
    return { output: formatIssn(full), checkDigit: expected, valid: true, error: null };
  }

  const given = code[7];
  if (given === expected) {
    return { output: formatIssn(code), checkDigit: expected, valid: true, error: null };
  }
  const corrected = body + expected;
  return {
    output: formatIssn(corrected),
    checkDigit: expected,
    valid: false,
    error: `校验位不正确：末位为 ${given}，正确校验位应为 ${expected}（合法 ISSN ${formatIssn(corrected)}）`,
  };
}

export interface BatchResult {
  output: string;
  warnings: string[];
  error: null;
}

/** 多行批量处理：每行一个 ISSN，空行保留，非法行原样保留并逐行标注 */
export function processLines(input: string): BatchResult {
  const outputs: string[] = [];
  const warnings: string[] = [];
  input.split('\n').forEach((line, index) => {
    if (line.trim() === '') {
      outputs.push('');
      return;
    }
    const result = processIssn(line);
    if (result.error && result.output === '') {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
      outputs.push(line);
    } else if (result.error) {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
      outputs.push(result.output);
    } else {
      outputs.push(result.output);
    }
  });
  return { output: outputs.join('\n'), warnings, error: null };
}
