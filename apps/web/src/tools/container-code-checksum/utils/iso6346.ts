/**
 * ISO 6346 集装箱箱号（BIC Code）校验位计算与合法性校验（零依赖纯函数）
 *
 * 箱号结构：4 个大写字母（箱主代码 3 位 + 设备类别标识符 1 位，U/J/Z）
 * + 6 位流水号数字 + 1 位校验位，共 11 位。
 * 字母映射：A=10 起，跳过所有 11 的倍数（11、22、33）；
 * 前 10 位依次乘以 2^0 … 2^9 求和，总和对 11 取模即校验位；
 * 余数为 10 时按标准记作 0。
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

/** ISO 6346 字母数值表（跳过 11、22、33） */
const LETTER_VALUES: Record<string, number> = {
  A: 10,
  B: 12,
  C: 13,
  D: 14,
  E: 15,
  F: 16,
  G: 17,
  H: 18,
  I: 19,
  J: 20,
  K: 21,
  L: 23,
  M: 24,
  N: 25,
  O: 26,
  P: 27,
  Q: 28,
  R: 29,
  S: 30,
  T: 31,
  U: 32,
  V: 34,
  W: 35,
  X: 36,
  Y: 37,
  Z: 38,
};

/** 设备类别标识符（第 4 位字母）含义 */
const CATEGORY_HINTS: Record<string, string> = {
  U: 'U：集装箱（Freight Container）',
  J: 'J：可拆卸设备（Detachable Freight Equipment）',
  Z: 'Z：挂车 / 底盘车（Trailer / Chassis）',
};

export interface WeightStep {
  /** 位序，从 1 开始（1-4 为字母，5-10 为数字） */
  position: number;
  char: string;
  /** 该位映射数值 */
  value: number;
  /** 权重 2^(position-1) */
  weight: number;
  /** 映射值 × 权重 */
  contribution: number;
}

export interface ContainerResult {
  /** 补全或纠正后的完整 11 位箱号；硬错误时为空串 */
  output: string;
  checkDigit: string | null;
  /** 完整箱号输入时，用户给出的末位校验位 */
  givenDigit: string | null;
  valid: boolean;
  error: string | null;
  /** 非致命提示，如第 4 位不是常见的 U/J/Z */
  notices: string[];
  /** 逐位加权明细 */
  steps: WeightStep[];
  /** 加权总和 */
  sum: number;
}

/** 去除空白与连字符并转大写（箱号常按 ABCU-123456-7 排版） */
function normalize(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

function letterValue(ch: string): number {
  return LETTER_VALUES[ch] ?? 0;
}

/**
 * 计算 ISO 6346 校验位。body 为不含校验位的前 10 位（4 字母 + 6 数字）。
 * 调用前需保证字符格式合法。
 */
export function computeCheckDigit(body: string): string {
  let sum = 0;
  for (let i = 0; i < 10; i += 1) {
    const ch = body[i] ?? '';
    const value = i < 4 ? letterValue(ch) : Number(ch);
    sum += value * 2 ** i;
  }
  const remainder = sum % 11;
  return remainder === 10 ? '0' : String(remainder);
}

/** 构建逐位加权明细 */
function buildSteps(body: string): { steps: WeightStep[]; sum: number } {
  const steps: WeightStep[] = [];
  let sum = 0;
  for (let i = 0; i < 10; i += 1) {
    const ch = body[i] ?? '';
    const value = i < 4 ? letterValue(ch) : Number(ch);
    const weight = 2 ** i;
    const contribution = value * weight;
    sum += contribution;
    steps.push({ position: i + 1, char: ch, value, weight, contribution });
  }
  return { steps, sum };
}

/** 单条箱号处理：10 位补全校验位，11 位校验合法性 */
export function processCode(input: string): ContainerResult {
  const code = normalize(input);

  if (code.length === 0) {
    return {
      output: '',
      checkDigit: null,
      givenDigit: null,
      valid: false,
      error: '内容不能为空',
      notices: [],
      steps: [],
      sum: 0,
    };
  }
  if (code.length !== 10 && code.length !== 11) {
    return {
      output: '',
      checkDigit: null,
      givenDigit: null,
      valid: false,
      error: `长度必须为 10 位（4 字母 + 6 数字，补全校验位）或 11 位（含校验位，校验合法性），当前为 ${code.length} 位`,
      notices: [],
      steps: [],
      sum: 0,
    };
  }

  for (let i = 0; i < 4; i += 1) {
    if (!/^[A-Z]$/.test(code[i] ?? '')) {
      return {
        output: '',
        checkDigit: null,
        givenDigit: null,
        valid: false,
        error: `第 ${i + 1} 位「${code[i] ?? ''}」不是大写字母：箱号前 4 位必须为字母（箱主代码 + 设备类别 U/J/Z）`,
        notices: [],
        steps: [],
        sum: 0,
      };
    }
  }
  for (let i = 4; i < 10; i += 1) {
    if (!/^\d$/.test(code[i] ?? '')) {
      return {
        output: '',
        checkDigit: null,
        givenDigit: null,
        valid: false,
        error: `第 ${i + 1} 位「${code[i] ?? ''}」不是数字：箱号第 5-10 位必须为流水号数字`,
        notices: [],
        steps: [],
        sum: 0,
      };
    }
  }

  const body = code.slice(0, 10);
  const { steps, sum } = buildSteps(body);
  const checkDigit = computeCheckDigit(body);
  const notices: string[] = [];
  const category = code[3] ?? '';
  if (!CATEGORY_HINTS[category]) {
    notices.push(`第 4 位设备类别标识符为「${category}」，标准箱号通常为 U / J / Z`);
  } else {
    notices.push(CATEGORY_HINTS[category]);
  }

  if (code.length === 10) {
    return {
      output: body + checkDigit,
      checkDigit,
      givenDigit: null,
      valid: true,
      error: null,
      notices,
      steps,
      sum,
    };
  }

  if (!/^\d$/.test(code[10] ?? '')) {
    return {
      output: '',
      checkDigit: null,
      givenDigit: null,
      valid: false,
      error: `第 11 位校验位「${code[10] ?? ''}」不是数字：校验位必须为 0-9`,
      notices,
      steps,
      sum,
    };
  }

  const given = code[10] ?? '';
  if (given === checkDigit) {
    return {
      output: code,
      checkDigit,
      givenDigit: given,
      valid: true,
      error: null,
      notices,
      steps,
      sum,
    };
  }
  return {
    output: body + checkDigit,
    checkDigit,
    givenDigit: given,
    valid: false,
    error: `校验位不正确：末位为 ${given}，按前 10 位加权求和 ${sum} mod 11 = ${checkDigit}，合法箱号应为 ${body + checkDigit}`,
    notices,
    steps,
    sum,
  };
}

export interface BatchResult {
  output: string;
  warnings: string[];
  /** 第一条可计算行的逐位明细，供界面展示计算过程 */
  detail: ContainerResult | null;
  /** 明细对应的行号（从 1 开始） */
  detailLine: number | null;
}

/** 多行批量处理：每行一个箱号，非法行原样保留并逐行标注 */
export function processLines(input: string): BatchResult {
  const outputs: string[] = [];
  const warnings: string[] = [];
  let detail: ContainerResult | null = null;
  let detailLine: number | null = null;

  input.split('\n').forEach((line, index) => {
    if (line.trim() === '') {
      outputs.push('');
      return;
    }
    const result = processCode(line);
    if (detail === null && result.steps.length > 0) {
      detail = result;
      detailLine = index + 1;
    }
    if (result.error) {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
      outputs.push(result.output === '' ? line : result.output);
    } else {
      outputs.push(result.output);
    }
  });

  return { output: outputs.join('\n'), warnings, detail, detailLine };
}
