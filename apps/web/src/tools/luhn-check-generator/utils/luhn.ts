/**
 * Luhn（模 10 / ISO/IEC 7812 附录 B）校验位算法（零依赖纯函数）
 *
 * 从最右侧数字起向左遍历：偶数位置（从右数，校验位占第 1 位）保持原值，
 * 奇数位置数字乘以 2，若结果大于 9 则减 9（等价于各位数字之和），
 * 全部数字求和后模 10 为 0 即合法。本模块不触碰 DOM 与 React，错误以结果对象返回。
 */

/** generate：为数字串补全 Luhn 校验位；validate：校验末位是否为正确校验位 */
export type LuhnMode = "generate" | "validate";

/** 去除输入中所有空白与连字符（卡号 / IMEI 常分组排版） */
export function normalize(input: string): string {
  return input.replace(/[\s-]/g, "");
}

/**
 * 对数字串求 Luhn 求和值（未取模）。
 * startOffset 为最右侧数字占据的位置（从右数，1 起始）：
 * 校验完整编码时为 1；仅计算 body（校验位尚未追加、将占据位置 1）时为 2。
 */
function luhnSum(code: string, startOffset: number): number {
  let sum = 0;
  for (let i = 0; i < code.length; i += 1) {
    const digit = Number(code[code.length - 1 - i]);
    const position = i + startOffset;
    if (position % 2 === 0) {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += digit;
    }
  }
  return sum;
}

/** 判断完整数字串是否通过 Luhn 校验 */
export function isLuhnValid(code: string): boolean {
  if (!/^\d+$/.test(code)) {
    return false;
  }
  return luhnSum(code, 1) % 10 === 0;
}

/**
 * 计算 body（不含校验位的数字串）对应的 Luhn 校验位，
 * 使 body + checkDigit 的总和模 10 为 0。空 body 的校验位为 0。
 */
export function computeCheckDigit(body: string): string {
  // body 最右位将占据完整编码的位置 2，故 startOffset = 2
  return String((10 - (luhnSum(body, 2) % 10)) % 10);
}

export interface LuhnResult {
  /** 补全后的完整编码，或校验通过时回显的原编码（已清洗分组字符） */
  output: string;
  checkDigit: string | null;
  valid: boolean;
  error: string | null;
}

/** 单条编号处理：generate 模式补全校验位，validate 模式校验末位合法性 */
export function processCode(
  input: string,
  mode: LuhnMode = "generate",
): LuhnResult {
  const code = normalize(input);

  if (code.length === 0) {
    return {
      output: "",
      checkDigit: null,
      valid: false,
      error: "内容不能为空",
    };
  }
  if (!/^\d+$/.test(code)) {
    return {
      output: "",
      checkDigit: null,
      valid: false,
      error: `「${input}」包含非数字字符：Luhn 只接受 0-9（空白与连字符可忽略）`,
    };
  }

  if (mode === "generate") {
    const checkDigit = computeCheckDigit(code);
    return { output: code + checkDigit, checkDigit, valid: true, error: null };
  }

  const body = code.slice(0, -1);
  const given = code[code.length - 1] ?? "";
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
  /** 批量校验时的统计（仅 validate 模式有意义） */
  total: number;
  validCount: number;
  invalidCount: number;
}

/** 多行批量处理：每行一个编号，非法行原样保留并逐行标注 */
export function processLines(
  input: string,
  mode: LuhnMode = "generate",
): BatchResult {
  const outputs: string[] = [];
  const warnings: string[] = [];
  let total = 0;
  let validCount = 0;
  let invalidCount = 0;

  input.split("\n").forEach((line, index) => {
    if (line.trim() === "") {
      outputs.push("");
      return;
    }
    total += 1;
    const result = processCode(line, mode);
    if (result.error && result.output === "") {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
      outputs.push(line);
      invalidCount += 1;
    } else if (result.error) {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
      outputs.push(result.output);
      invalidCount += 1;
    } else {
      outputs.push(result.output);
      validCount += 1;
    }
  });

  return {
    output: outputs.join("\n"),
    warnings,
    total,
    validCount,
    invalidCount,
  };
}
