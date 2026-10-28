/**
 * EAN-13 / GTIN-13 与 UPC-A / GTIN-12 模 10 加权校验位（零依赖纯函数）
 *
 * 规则：从校验位左侧一位开始自右向左，奇数位 ×3、偶数位 ×1 求和；
 * 校验位 = (10 - (总和 mod 10)) mod 10。
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export type EanMode = 'ean13' | 'upca';

export interface EanResult {
  /** 补全后的完整编码，或校验通过时回显的原编码 */
  output: string;
  checkDigit: string | null;
  valid: boolean;
  error: string | null;
}

/** 去除输入中所有空白与连字符（条码常按 1-3-4-? 分组排版） */
function normalize(input: string): string {
  return input.replace(/[\s-]/g, '');
}

/**
 * 计算模 10 校验位。body 为不含校验位的数字串（EAN-13 为 12 位，UPC-A 为 11 位）。
 * 从最右侧数字起按 ×3、×1 交替加权。
 */
export function computeCheckDigit(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i += 1) {
    const digit = Number(body[body.length - 1 - i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return String((10 - (sum % 10)) % 10);
}

/** 单条条码处理：12/11 位补全，13/12 位校验（按模式决定期望长度） */
export function processCode(input: string, mode: EanMode): EanResult {
  const code = normalize(input);
  const bodyLength = mode === 'ean13' ? 12 : 11;
  const fullLength = bodyLength + 1;
  const name = mode === 'ean13' ? 'EAN-13' : 'UPC-A';

  if (code.length === 0) {
    return { output: '', checkDigit: null, valid: false, error: '内容不能为空' };
  }
  if (!/^\d+$/.test(code)) {
    return {
      output: '',
      checkDigit: null,
      valid: false,
      error: `「${input}」包含非数字字符：${name} 只接受 0-9（空白与连字符可忽略）`,
    };
  }
  if (code.length !== bodyLength && code.length !== fullLength) {
    return {
      output: '',
      checkDigit: null,
      valid: false,
      error: `长度必须为 ${bodyLength} 位（补全校验位）或 ${fullLength} 位（校验合法性），当前为 ${code.length} 位`,
    };
  }

  if (code.length === bodyLength) {
    const checkDigit = computeCheckDigit(code);
    return { output: code + checkDigit, checkDigit, valid: true, error: null };
  }

  const body = code.slice(0, bodyLength);
  const given = code[fullLength - 1] ?? '';
  const expected = computeCheckDigit(body);
  if (given === expected) {
    return { output: code, checkDigit: expected, valid: true, error: null };
  }
  return {
    output: body + expected,
    checkDigit: expected,
    valid: false,
    error: `校验位不正确：末位为 ${given}，正确校验位应为 ${expected}（合法编码 ${body + expected}）`,
  };
}

export interface BatchResult {
  output: string;
  warnings: string[];
  error: null;
}

/** 多行批量处理：每行一个条码，非法行原样保留并逐行标注 */
export function processLines(input: string, mode: EanMode): BatchResult {
  const outputs: string[] = [];
  const warnings: string[] = [];
  input.split('\n').forEach((line, index) => {
    if (line.trim() === '') {
      outputs.push('');
      return;
    }
    const result = processCode(line, mode);
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
