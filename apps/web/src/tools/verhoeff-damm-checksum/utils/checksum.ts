/**
 * Verhoeff / Damm 十进制校验位算法（零依赖纯函数）
 *
 * Verhoeff：基于二面体群 D5 的乘法表、置换表与逆元表，可检出所有单字符错误
 * 与所有相邻换位错误；Damm：基于反对称拟群（弱幂等拉丁方）的单一校验位。
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export type ChecksumAlgorithm = 'verhoeff' | 'damm';

/** generate：为数字串补全校验位；validate：校验末位是否为正确校验位 */
export type ChecksumMode = 'generate' | 'validate';

/** D5 群乘法表 d(i, j)（Verhoeff, 1969） */
const VERHOEFF_MULTIPLICATION: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

/** 逆元表 inv(j)：d(j, inv(j)) = 0 */
const VERHOEFF_INVERSE: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/** 置换表 p(pos, digit)，8 行后循环（pos mod 8） */
const VERHOEFF_PERMUTATION: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 3, 4, 5, 2, 0, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/** Damm 反对称拟群运算表（Damm, 2004，维基百科常用表） */
const DAMM_TABLE: number[][] = [
  [0, 3, 1, 7, 5, 9, 8, 6, 4, 2],
  [7, 0, 9, 2, 1, 5, 4, 8, 6, 3],
  [4, 2, 0, 6, 8, 7, 1, 3, 5, 9],
  [1, 7, 5, 0, 9, 8, 3, 4, 2, 6],
  [6, 1, 2, 3, 0, 4, 5, 9, 7, 8],
  [3, 6, 7, 4, 2, 0, 9, 5, 8, 1],
  [5, 8, 6, 9, 7, 2, 0, 1, 3, 4],
  [8, 9, 4, 5, 3, 6, 2, 0, 1, 7],
  [9, 4, 3, 8, 6, 1, 7, 2, 0, 5],
  [2, 5, 8, 1, 4, 3, 6, 7, 9, 0],
];

/** 去除输入中所有空白与连字符（编号常分组排版） */
function normalize(input: string): string {
  return input.replace(/[\s-]/g, '');
}

/**
 * 对数字串求 Verhoeff 校验中间值。
 * startOffset 为最右侧数字占据的置换位置：校验完整编码时为 0；
 * 仅计算 body 的中间值（校验位尚未追加、占据位置 0）时为 1。
 */
function verhoeffCheck(code: string, startOffset: 0 | 1): number {
  let check = 0;
  for (let i = 0; i < code.length; i += 1) {
    const digit = Number(code[code.length - 1 - i]);
    const permuted = VERHOEFF_PERMUTATION[(i + startOffset) % 8]![digit]!;
    check = VERHOEFF_MULTIPLICATION[check]![permuted]!;
  }
  return check;
}

/** 对含校验位的完整数字串求 Damm 校验中间值（合法时为 0） */
function dammCheck(code: string): number {
  let check = 0;
  for (const ch of code) {
    check = DAMM_TABLE[check]![Number(ch)]!;
  }
  return check;
}

/**
 * 计算校验位。body 为不含校验位的数字串（允许空串，此时校验位为 0）。
 * - Verhoeff：校验位 = inv(check(body))，使完整串校验值为 0
 * - Damm：在表中查找使 check(body + d) = 0 的唯一数字 d
 */
export function computeCheckDigit(body: string, algorithm: ChecksumAlgorithm): string {
  if (algorithm === 'verhoeff') {
    return String(VERHOEFF_INVERSE[verhoeffCheck(body, body.length === 0 ? 0 : 1)]!);
  }
  const interim = dammCheck(body);
  for (let digit = 0; digit <= 9; digit += 1) {
    if (DAMM_TABLE[interim]![digit] === 0) {
      return String(digit);
    }
  }
  // 拉丁方每行恰有一个 0，理论上不可达
  throw new Error('Damm 校验位求解失败');
}

export interface ChecksumResult {
  /** 补全后的完整编码，或校验通过时回显的原编码 */
  output: string;
  checkDigit: string | null;
  valid: boolean;
  error: string | null;
}

/** 单条编号处理：generate 模式补全校验位，validate 模式校验末位合法性 */
export function processCode(
  input: string,
  algorithm: ChecksumAlgorithm,
  mode: ChecksumMode = 'generate',
): ChecksumResult {
  const code = normalize(input);
  const name = algorithm === 'verhoeff' ? 'Verhoeff' : 'Damm';

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

  if (mode === 'generate') {
    const checkDigit = computeCheckDigit(code, algorithm);
    return { output: code + checkDigit, checkDigit, valid: true, error: null };
  }

  const body = code.slice(0, -1);
  const given = code[code.length - 1] ?? '';
  const expected = computeCheckDigit(body, algorithm);
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
}

/** 多行批量处理：每行一个编号，非法行原样保留并逐行标注 */
export function processLines(
  input: string,
  algorithm: ChecksumAlgorithm,
  mode: ChecksumMode = 'generate',
): BatchResult {
  const outputs: string[] = [];
  const warnings: string[] = [];
  input.split('\n').forEach((line, index) => {
    if (line.trim() === '') {
      outputs.push('');
      return;
    }
    const result = processCode(line, algorithm, mode);
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
  return { output: outputs.join('\n'), warnings };
}
