/**
 * UPC-A（12 位标准码）与 UPC-E（8 位压缩码）双向转换零依赖纯函数
 *
 * 规则依据 GS1 General Specifications：
 * - UPC-E 仅支持编号系统位（NS）为 0 或 1 的 UPC-A
 * - UPC-E 8 位结构：NS + 信息位 X1..X6 + 校验位；X6 为模式位（0..9）
 * - UPC-A 12 位结构：NS + 厂商码 M1..M5 + 产品码 I1..I5 + 校验位
 * - UPC-E 校验位等于展开后 11 位 UPC-A 数据位的模 10 校验位
 *
 * 信息位 X1..X6 与厂商/产品码的映射（expand 表，compress 为其严格逆映射）：
 *   模式 0/1/2：M = X1 X2 X6 0 0      I = 0 0 X3 X4 X5
 *   模式 3    ：M = X1 0 0 X2 0      I = 0 0 X3 X4 X5
 *   模式 4    ：M = X1 X2 0 0 0      I = 0 0 X3 X4 X5
 *   模式 5..9 ：M = X1 X2 X3 X4 X5   I = 0 0 0 0 X6
 *
 * 本模块不触碰 DOM 与 React，所有错误以结果对象返回而非抛出，支持多行批量处理。
 */

export type UpcDirection = 'a-to-e' | 'e-to-a';

export interface UpcResult {
  valid: boolean;
  /** 转换后的编码（含校验位的标准长度字符串） */
  output: string;
  /** 输入携带或计算出的模 10 校验位 */
  checkDigit: string;
  /** 结构化展示用的分段（系统位 / 信息位 / 校验位等） */
  parts: string[];
  error: string | null;
}

/** 去除输入中的空白，仅保留数字字符以外的容错由调用方校验 */
function normalizeDigits(input: string): string {
  return input.replace(/\s+/g, '');
}

/**
 * 模 10（加权 3/1）校验位
 * UPC-A 数据位为 11 位：左起奇数位（下标 0,2,…）权重 3，偶数位权重 1
 */
export function mod10CheckDigit(digits: string): string {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    const value = Number(digits[i]);
    sum += i % 2 === 0 ? value * 3 : value;
  }
  return String((10 - (sum % 10)) % 10);
}

/** 校验输入是否为纯数字字符串 */
function assertDigits(input: string): string | null {
  if (input === '') return '内容不能为空';
  if (!/^\d+$/.test(input)) return '只能包含数字字符';
  return null;
}

function fail(error: string): UpcResult {
  return { valid: false, output: '', checkDigit: '', parts: [], error };
}

/**
 * UPC-A → UPC-E 压缩
 * 接受 11 位（自动补校验位）或 12 位（校验校验位）UPC-A
 */
export function compressUpcA(rawInput: string): UpcResult {
  const input = normalizeDigits(rawInput);
  const formatError = assertDigits(input);
  if (formatError) return fail(formatError);
  if (input.length !== 11 && input.length !== 12) {
    return fail('UPC-A 必须为 11 位（不含校验位）或 12 位（含校验位）数字');
  }

  const ns = input[0];
  if (ns !== '0' && ns !== '1') {
    return fail(`UPC-E 仅支持编号系统位为 0 或 1 的 UPC-A，当前为 ${ns}`);
  }

  const data = input.slice(0, 11);
  const expectedCheck = mod10CheckDigit(data);
  if (input.length === 12 && input[11] !== expectedCheck) {
    return fail(`校验位错误：末位应为 ${expectedCheck}，实际为 ${input[11]}`);
  }

  // UPC-A：NS(1) + 厂商码 M(5) + 产品码 I(5)
  const m = data.slice(1, 6);
  const p = data.slice(6, 11);

  let info: string | null = null;
  // 与 expandUpcE 严格互逆，信息位恒为 6 位
  if (/^[012]\d{2}00$/.test(m) && /^00\d{3}$/.test(p)) {
    // 模式 0/1/2：M = X1 X2 X6 0 0（M3=X6 ∈ 0..2）；I = 0 0 X3 X4 X5
    info = `${m[0]}${m[1]}${p.slice(2)}${m[2]}`;
  } else if (/^\d00\d0$/.test(m) && /^00\d{3}$/.test(p)) {
    // 模式 3：M = X1 0 0 X2 0；I = 0 0 X3 X4 X5
    info = `${m[0]}${m[3]}${p.slice(2)}3`;
  } else if (/^[56]\d000$/.test(m) && /^00\d{3}$/.test(p)) {
    // 模式 4：M = X1(∈5/6) X2 0 0 0；I = 0 0 X3 X4 X5。
    // M1 ∈ {5,6} 是与模式 0..2（M3 ∈ 0..2）消歧的硬约束
    info = `${m[0]}${m[1]}${p.slice(2)}4`;
  } else if (/^0000\d$/.test(p)) {
    // 模式 5..9：M = X1..X5（任意 5 位）；I = 0 0 0 0 X6，信息位 = M + I5
    info = `${m}${p[4]}`;
  }

  if (info === null) {
    return fail('该 UPC-A 不满足 UPC-E 零串压缩模式（厂商码/产品码的连续 0 布局不符合 GS1 规则）');
  }

  const output = `${ns}${info}${expectedCheck}`;
  return {
    valid: true,
    output,
    checkDigit: expectedCheck,
    parts: [ns, info, expectedCheck],
    error: null,
  };
}

/**
 * UPC-E → UPC-A 展开
 * 接受 7 位（NS + 6 信息位，自动补校验位）或 8 位（含校验位并验证）
 */
export function expandUpcE(rawInput: string): UpcResult {
  const input = normalizeDigits(rawInput);
  const formatError = assertDigits(input);
  if (formatError) return fail(formatError);
  if (input.length !== 7 && input.length !== 8) {
    return fail('UPC-E 必须为 7 位（不含校验位）或 8 位（含校验位）数字');
  }

  const ns = input[0];
  if (ns !== '0' && ns !== '1') {
    return fail(`UPC-E 编号系统位只能为 0 或 1，当前为 ${ns}`);
  }

  const info = input.slice(1, 7); // X1..X6
  const mode = Number(info[5]);
  let manufacturer: string;
  let product: string;

  // GS1 展开表：厂商码与产品码各 5 位，NS(1)+M(5)+I(5) 恒为 11 数据位
  if (mode >= 0 && mode <= 2) {
    // M = X1 X2 X6 0 0；I = 0 0 X3 X4 X5
    manufacturer = `${info[0]}${info[1]}${info[5]}00`;
    product = `00${info.slice(2, 5)}`;
  } else if (mode === 3) {
    // M = X1 0 0 X2 0；I = 0 0 X3 X4 X5
    manufacturer = `${info[0]}00${info[1]}0`;
    product = `00${info.slice(2, 5)}`;
  } else if (mode === 4) {
    // M = X1 X2 0 0 0；I = 0 0 X3 X4 X5
    manufacturer = `${info[0]}${info[1]}000`;
    product = `00${info.slice(2, 5)}`;
  } else {
    // 模式 5..9：M = X1 X2 X3 X4 X5（信息位前 5 位）；I = 0 0 0 0 X6
    manufacturer = info.slice(0, 5);
    product = `0000${info[5]}`;
  }

  const data = `${ns}${manufacturer}${product}`;
  const expectedCheck = mod10CheckDigit(data);
  if (input.length === 8 && input[7] !== expectedCheck) {
    return fail(`校验位错误：UPC-E 末位应为 ${expectedCheck}，实际为 ${input[7]}`);
  }

  return {
    valid: true,
    output: `${data}${expectedCheck}`,
    checkDigit: expectedCheck,
    parts: [ns, manufacturer, product, expectedCheck],
    error: null,
  };
}

/** 批量处理多行，逐行返回结果（空行跳过） */
export function convertBatch(rawBatch: string, direction: UpcDirection): UpcResult[] {
  return rawBatch
    .split(/\r?\n/)
    .map((line) => (line.trim() === '' ? null : direction === 'a-to-e' ? compressUpcA(line) : expandUpcE(line)))
    .filter((result): result is UpcResult => result !== null);
}
