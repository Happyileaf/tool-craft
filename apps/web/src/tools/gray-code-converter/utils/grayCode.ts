/**
 * 二进制 ↔ Gray 码（反射二进制格雷码）双向转换（零依赖纯函数）
 *
 * 正向（二进制 → Gray）：G = B xor (B >> 1)
 * 反向（Gray → 二进制）：从最高位起逐位异或累加 b[n-1]=g[n-1]，b[i]=g[i] xor b[i+1]
 *
 * 全部使用 BigInt 运算，支持任意位宽；本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export type GrayMode = 'bin2gray' | 'gray2bin';

export interface GrayResult {
  /** 转换结果的二进制字符串（不含 0b 前缀，零值为 '0'） */
  output: string;
  /** 输入的二进制字符串（规范化后） */
  inputBits: string;
  /** 十进制对照（BigInt 转字符串，避免大整数丢精度） */
  decimal: string;
  /** 大写十六进制对照（不含 0x 前缀，零值为 '0'） */
  hex: string;
  /** 逐位推导步骤：下标 i 处输入位、输出位与依据 */
  steps: GrayStep[];
  valid: boolean;
  error: string | null;
}

export interface GrayStep {
  /** 位下标（0 = 最低位） */
  index: number;
  inputBit: string;
  outputBit: string;
  /** 该位的推导依据（如 G3 = B3 xor B2 = 1 xor 1 = 0） */
  reason: string;
}

/** 去除空白、下划线与 0b/0B 前缀 */
function normalizeBits(input: string): string {
  const trimmed = input.trim().replace(/[\s_]/g, '');
  return trimmed.replace(/^0[bB]/, '');
}

function toHex(value: bigint): string {
  if (value === BigInt(0)) return '0';
  return value.toString(16).toUpperCase();
}

/** 单个二进制串转换；bitLength 为输出位宽（至少 1 位） */
function convertBits(bits: string, mode: GrayMode): Omit<GrayResult, 'valid' | 'error'> {
  const n = BigInt(`0b${bits}`);
  const one = BigInt(1);
  const zero = BigInt(0);
  let out: bigint;
  if (mode === 'bin2gray') {
    out = n ^ (n >> one);
  } else {
    // 反向：逐位异或累加（前缀异或）
    out = n;
    let rest = n;
    while (rest > zero) {
      rest >>= one;
      out ^= rest;
    }
  }

  const width = Math.max(bits.length, 1);
  const inputBits = n.toString(2).padStart(width, '0');
  const outputBits = out.toString(2).padStart(width, '0');

  const steps: GrayStep[] = [];
  const top = width - 1;
  for (let pos = top; pos >= 0; pos -= 1) {
    const inBit = inputBits[top - pos] ?? '0';
    const outBit = outputBits[top - pos] ?? '0';
    let reason: string;
    if (mode === 'bin2gray') {
      if (pos === top) {
        reason = `G${pos} = B${pos} = ${inBit}（最高位直接保留）`;
      } else {
        const higher = inputBits[top - pos - 1] ?? '0';
        reason = `G${pos} = B${pos} xor B${pos + 1} = ${inBit} xor ${higher} = ${outBit}`;
      }
    } else if (pos === top) {
      reason = `B${pos} = G${pos} = ${inBit}（最高位直接保留）`;
    } else {
      const higherOut = outputBits[top - pos - 1] ?? '0';
      reason = `B${pos} = G${pos} xor B${pos + 1} = ${inBit} xor ${higherOut} = ${outBit}`;
    }
    steps.push({ index: pos, inputBit: inBit, outputBit: outBit, reason });
  }

  return { output: outputBits, inputBits, decimal: out.toString(10), hex: toHex(out), steps };
}

/** 单条转换入口，校验输入并组装结果 */
export function processCode(input: string, mode: GrayMode): GrayResult {
  const bits = normalizeBits(input);
  if (bits.length === 0) {
    return {
      output: '',
      inputBits: '',
      decimal: '',
      hex: '',
      steps: [],
      valid: false,
      error: '内容不能为空',
    };
  }
  if (!/^[01]+$/.test(bits)) {
    return {
      output: '',
      inputBits: bits,
      decimal: '',
      hex: '',
      steps: [],
      valid: false,
      error: '只接受二进制数字 0/1（可含空白、下划线与 0b 前缀）',
    };
  }
  return { ...convertBits(bits, mode), valid: true, error: null };
}

export interface BatchResult {
  output: string;
  warnings: string[];
}

/** 多行批量处理：每行一个二进制串，非法行原样保留并逐行标注 */
export function processLines(input: string, mode: GrayMode): BatchResult {
  const outputs: string[] = [];
  const warnings: string[] = [];
  input.split('\n').forEach((line, index) => {
    if (line.trim() === '') {
      outputs.push('');
      return;
    }
    const result = processCode(line, mode);
    if (result.error) {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
      outputs.push(line);
    } else {
      outputs.push(result.output);
    }
  });
  return { output: outputs.join('\n'), warnings };
}
