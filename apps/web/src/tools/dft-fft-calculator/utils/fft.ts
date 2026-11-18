import {
  ALGORITHM_DFT,
  ALGORITHM_FFT,
  IMAGINARY_DROP_EPSILON,
  MAX_SAMPLE_COUNT,
  PHASE_EPSILON,
  type AlgorithmLabel,
} from '../constants';

/** 复数采样点 */
export interface Complex {
  re: number;
  im: number;
}

/** 单个频率 bin 的计算结果 */
export interface FrequencyBin {
  k: number;
  re: number;
  im: number;
  magnitude: number;
  /** 弧度制相位；幅度过小时为 null（未定义） */
  phase: number | null;
  normalizedFreq: number;
}

/** 一次变换的完整输出 */
export interface TransformOutput {
  bins: FrequencyBin[];
  algorithm: AlgorithmLabel;
  /** 算法理论复杂度标注 */
  complexity: string;
  /** 正变换后自动 IFFT 重构的最大绝对误差 */
  reconstructionError: number;
}

/** 判断正整数是否为 2 的幂（N=1 也算 2^0） */
export function isPowerOfTwo(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && (n & (n - 1)) === 0;
}

/**
 * 解析序列文本为复数数组。
 * 支持逗号 / 空白 / 换行分隔；复数写法 `a+bi`、`a-bi`、`bi`、`i`、`-i`，i/j 均可。
 */
export function parseComplexSequence(raw: string): Complex[] {
  const tokens = raw
    .replace(/,/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    throw new Error('序列为空：请输入至少 1 个采样点');
  }

  return tokens.map((token, index) => parseComplexToken(token, index));
}

function parseComplexToken(token: string, index: number): Complex {
  const text = token.replace(/i$/g, 'j').trim();

  // a+bj / a-bj（含 a 与虚部两部分；虚部数字可省略，如 3+j、3-j），先于纯虚数分支
  const match = text.match(/^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)([+-]\d*\.?\d*(?:e[+-]?\d+)?)j$/);
  if (match) {
    const re = Number(match[1]);
    const im = Number(match[2]);
    if (!Number.isFinite(re) || !Number.isFinite(im)) {
      throw new Error(`第 ${index + 1} 个 token「${token}」不是合法复数`);
    }
    return { re, im };
  }

  // 纯虚数：j、-j、bj、-bj、+bj
  if (text.endsWith('j')) {
    const body = text.slice(0, -1);
    if (body === '' || body === '+') {
      return { re: 0, im: 1 };
    }
    if (body === '-') {
      return { re: 0, im: -1 };
    }
    const im = Number(body);
    if (!Number.isFinite(im)) {
      throw new Error(`第 ${index + 1} 个 token「${token}」不是合法复数`);
    }
    return { re: 0, im };
  }

  // 纯实数
  const re = Number(text);
  if (!Number.isFinite(re)) {
    throw new Error(`第 ${index + 1} 个 token「${token}」不是合法数字或复数`);
  }
  return { re, im: 0 };
}

/** 朴素 DFT：O(N²)，任意 N 均适用。旋转因子 exp(j·θ)，正向 θ=−2πkt/N，逆向 θ=+2πkt/N */
export function naiveDft(input: Complex[], inverse: boolean): Complex[] {
  const n = input.length;
  const sign = inverse ? 1 : -1;
  const output: Complex[] = [];
  for (let k = 0; k < n; k += 1) {
    let sumRe = 0;
    let sumIm = 0;
    for (let t = 0; t < n; t += 1) {
      const angle = (sign * 2 * Math.PI * k * t) / n;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const sample = input[t]!;
      // (cos+j·sin)·(re+j·im) = (re·cos−im·sin) + j(re·sin+im·cos)
      sumRe += sample.re * cos - sample.im * sin;
      sumIm += sample.re * sin + sample.im * cos;
    }
    output.push({ re: sumRe, im: sumIm });
  }
  if (inverse) {
    return output.map((value) => ({ re: value.re / n, im: value.im / n }));
  }
  return output;
}

/**
 * 迭代版 radix-2 Cooley–Tukey FFT（in-place 蝶形运算），O(N log N)。
 * 仅接受 2 的幂长度；inverse=true 时旋转因子取共轭并按 1/N 归一化。
 */
export function radix2Fft(input: Complex[], inverse: boolean): Complex[] {
  const n = input.length;
  if (!isPowerOfTwo(n)) {
    throw new Error('radix-2 FFT 仅支持 2 的幂长度');
  }

  const buffer: Complex[] = input.map((value) => ({ ...value }));

  // 位反转置换
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      const tmp = buffer[i]!;
      buffer[i] = buffer[j]!;
      buffer[j] = tmp;
    }
  }

  // 旋转因子 exp(j·θ)：正向 θ=−2π/length，逆向 θ=+2π/length
  const sign = inverse ? 1 : -1;
  for (let length = 2; length <= n; length <<= 1) {
    const angle = (sign * 2 * Math.PI) / length;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let start = 0; start < n; start += length) {
      let curRe = 1;
      let curIm = 0;
      const half = length >> 1;
      for (let j = 0; j < half; j += 1) {
        const even = buffer[start + j]!;
        const odd = buffer[start + j + half]!;
        const rotatedRe = curRe * odd.re - curIm * odd.im;
        const rotatedIm = curRe * odd.im + curIm * odd.re;
        buffer[start + j] = { re: even.re + rotatedRe, im: even.im + rotatedIm };
        buffer[start + j + half] = { re: even.re - rotatedRe, im: even.im - rotatedIm };
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }

  if (inverse) {
    for (let i = 0; i < n; i += 1) {
      const value = buffer[i]!;
      buffer[i] = { re: value.re / n, im: value.im / n };
    }
  }
  return buffer;
}

/** 按长度自动选择算法执行变换 */
export function transform(input: Complex[], inverse: boolean): { output: Complex[]; algorithm: AlgorithmLabel } {
  if (input.length > MAX_SAMPLE_COUNT) {
    throw new Error(`采样点数 ${input.length} 超过上限 ${MAX_SAMPLE_COUNT}，请缩短序列后再计算`);
  }
  if (isPowerOfTwo(input.length)) {
    return { output: radix2Fft(input, inverse), algorithm: ALGORITHM_FFT };
  }
  return { output: naiveDft(input, inverse), algorithm: ALGORITHM_DFT };
}

function toMagnitude(value: Complex): number {
  return Math.hypot(value.re, value.im);
}

function toPhase(value: Complex, magnitude: number): number | null {
  if (magnitude < PHASE_EPSILON) {
    return null;
  }
  return Math.atan2(value.im, value.re);
}

/** 构造频率 bin 列表（双边谱） */
export function buildBins(spectrum: Complex[]): FrequencyBin[] {
  const n = spectrum.length;
  return spectrum.map((value, k) => {
    const magnitude = toMagnitude(value);
    return {
      k,
      re: value.re,
      im: value.im,
      magnitude,
      phase: toPhase(value, magnitude),
      normalizedFreq: k / n,
    };
  });
}

/**
 * 单边谱：仅保留前 N/2+1 个 bin。
 * 幅度按 2/N 缩放，DC（k=0）与 Nyquist（k=N/2）不翻倍。
 */
export function toSingleSidedBins(bins: FrequencyBin[]): FrequencyBin[] {
  const n = bins.length;
  const keep = Math.floor(n / 2) + 1;
  return bins.slice(0, keep).map((bin) => {
    const edge = bin.k === 0 || bin.k === n / 2;
    const scale = edge ? 1 / n : 2 / n;
    return { ...bin, magnitude: bin.magnitude * scale };
  });
}

/** 两个复数序列的最大绝对误差（实部与虚部一并计入） */
export function maxAbsoluteError(a: Complex[], b: Complex[]): number {
  let max = 0;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i]!;
    const right = b[i]!;
    max = Math.max(max, Math.abs(left.re - right.re), Math.abs(left.im - right.im));
  }
  return max;
}

/** 正变换完整流水线：DFT/FFT + 往返自检 */
export function analyzeForward(rawSamples: string): {
  input: Complex[];
  output: Complex[];
  result: TransformOutput;
} {
  const input = parseComplexSequence(rawSamples);
  const { output, algorithm } = transform(input, false);
  const inverse = transform(output, true);
  const reconstructionError = maxAbsoluteError(input, inverse.output);
  return {
    input,
    output,
    result: {
      bins: buildBins(output),
      algorithm,
      complexity: algorithm === ALGORITHM_FFT ? 'O(N log N)' : 'O(N²)',
      reconstructionError,
    },
  };
}

/** 逆变换流水线：频域复数序列 → 时域；实数输入残差低于阈值时自动取实 */
export function analyzeInverse(rawFrequency: string): {
  input: Complex[];
  output: Complex[];
  algorithm: AlgorithmLabel;
  complexity: string;
} {
  const input = parseComplexSequence(rawFrequency);
  const { output, algorithm } = transform(input, true);
  const allNearReal = output.every((value) => Math.abs(value.im) < IMAGINARY_DROP_EPSILON);
  const timeDomain = allNearReal
    ? output.map((value) => ({ re: value.re, im: 0 }))
    : output;
  return {
    input,
    output: timeDomain,
    algorithm,
    complexity: algorithm === ALGORITHM_FFT ? 'O(N log N)' : 'O(N²)',
  };
}

/** 将复数序列导出为单行 CSV 文本（re,im 每行一个点） */
export function binsToCsv(bins: FrequencyBin[], phaseUnit: 'radian' | 'degree'): string {
  const header = 'k,normalized_freq,re,im,magnitude,phase';
  const rows = bins.map((bin) => {
    const phase =
      bin.phase === null
        ? ''
        : String(phaseUnit === 'degree' ? (bin.phase * 180) / Math.PI : bin.phase);
    return [bin.k, bin.normalizedFreq, bin.re, bin.im, bin.magnitude, phase].join(',');
  });
  return [header, ...rows].join('\n');
}
