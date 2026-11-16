/**
 * ADC / DAC 量化参数计算（零依赖纯函数）
 *
 * 单极性：量程 0..Vref，LSB = Vref / 2^N，码值 0..2^N−1，
 *   理想满幅输出 Vref − 1 LSB。
 * 双极性：量程 −Vref..+Vref，LSB = 2·Vref / 2^N，偏移二进制码
 *   code 0 → −Vref，中点 2^(N−1) → 0，满幅码 → +Vref − 1 LSB。
 *
 * N 允许 1..32；码值整数在 N > 24 时以 BigInt 精确处理，
 * 电压等浮点量仍用 Number（SNR / 噪声为统计指标，不要求整数精度）。
 */

export type Polarity = 'unipolar' | 'bipolar';
export type RoundingMode = 'round' | 'floor';

export interface QuantizerParams {
  /** 分辨率位数 N（1..32 整数） */
  bits: number;
  /** 参考电压 Vref（V，> 0）；双极性时量程为 ±Vref */
  vref: number;
  polarity: Polarity;
}

export interface QuantizerOverview {
  bits: number;
  /** 码值总数 2^N（BigInt 精确值的十进制字符串） */
  codeCount: string;
  /** 满幅码 2^N − 1（BigInt 精确值的十进制字符串） */
  maxCode: string;
  /** LSB 步进电压（V） */
  lsb: number;
  /** 理想满幅输出电压（V）：Vref − 1 LSB（双极性为 +Vref − 1 LSB） */
  fullScaleOutput: number;
  /** 满量程跨度（V）：单极性 Vref，双极性 2·Vref */
  span: number;
  /** 理想 SNR（dB）= 6.02N + 1.76 */
  snrDb: number;
  /** 量化噪声 RMS（V）= LSB / √12 */
  quantizationNoiseRms: number;
  /** 峰值量化误差（V）= ½ LSB */
  peakError: number;
}

function validateParams(params: QuantizerParams): void {
  const { bits, vref } = params;
  if (!Number.isInteger(bits) || bits < 1 || bits > 32) {
    throw new Error('分辨率位数 N 必须是 1–32 之间的整数');
  }
  if (!Number.isFinite(vref) || vref <= 0) {
    throw new Error('参考电压 Vref 必须为正数（V）');
  }
}

const ZERO = BigInt(0);
const ONE = BigInt(1);

function powerOfTwoBigInt(bits: number): bigint {
  return ONE << BigInt(bits);
}

/**
 * 参数总览：码值总数、满幅码、LSB、满幅输出、SNR 与量化噪声
 */
export function getOverview(params: QuantizerParams): QuantizerOverview {
  validateParams(params);
  const { bits, vref, polarity } = params;
  const count = powerOfTwoBigInt(bits);
  const span = polarity === 'unipolar' ? vref : 2 * vref;
  const lsb = span / Number(count);
  const snrDb = 6.02 * bits + 1.76;
  return {
    bits,
    codeCount: count.toString(),
    maxCode: (count - ONE).toString(),
    lsb,
    fullScaleOutput: span - lsb + (polarity === 'bipolar' ? -vref : 0),
    span,
    snrDb,
    quantizationNoiseRms: lsb / Math.sqrt(12),
    peakError: lsb / 2,
  };
}

export interface VoltageToCodeResult {
  /** 量化码值（BigInt 精确值的十进制字符串） */
  code: string;
  /** 码值对应的十六进制（按 N 位补齐） */
  hex: string;
  /** 该码值还原出的电压（V） */
  reconstructedVoltage: number;
  /** 实际量化误差（V）= 还原电压 − 输入电压 */
  error: number;
  /** 误差折合 LSB 个数 */
  errorInLsb: number;
  /** 是否发生超量程夹取 */
  clipped: boolean;
}

/**
 * 电压 → 码值量化。
 *
 * 超量程时夹取到 0 或满幅码并标注 clipped=true；
 * round 模式四舍五入，floor 模式向下截断。
 */
export function voltageToCode(
  params: QuantizerParams,
  voltage: number,
  mode: RoundingMode = 'round',
): VoltageToCodeResult {
  validateParams(params);
  if (!Number.isFinite(voltage)) {
    throw new Error('输入电压不是有效数字');
  }
  const overview = getOverview(params);
  const lsb = overview.lsb;
  const maxCode = powerOfTwoBigInt(params.bits) - ONE;

  const lowerBound = params.polarity === 'unipolar' ? 0 : -params.vref;
  let clipped = false;
  let working = voltage;
  if (voltage < lowerBound) {
    clipped = true;
    working = lowerBound;
  } else if (voltage > params.vref) {
    clipped = true;
    working = params.vref;
  }

  const shifted = params.polarity === 'unipolar' ? working : working + params.vref;
  const rawIndex = shifted / lsb;
  const indexNumber = mode === 'round' ? Math.round(rawIndex) : Math.floor(rawIndex);

  let code = BigInt(indexNumber);
  if (code < ZERO) code = ZERO;
  if (code > maxCode) code = maxCode;

  const reconstructedVoltage = codeToVoltage(params, code).voltage;
  const error = reconstructedVoltage - voltage;
  return {
    code: code.toString(),
    hex: toHexPadded(code, params.bits),
    reconstructedVoltage,
    error,
    errorInLsb: error / lsb,
    clipped,
  };
}

export interface CodeToVoltageResult {
  /** 还原电压（V） */
  voltage: number;
  /** 双极性模式下的有符号十进制（单极性与无符号码相同） */
  signedCode: string;
}

/**
 * 码值 → 电压还原。
 *
 * 单极性：Vout = code × LSB；
 * 双极性（偏移二进制）：Vout = (code − 2^(N−1)) × LSB。
 */
export function codeToVoltage(params: QuantizerParams, codeInput: bigint | number | string): CodeToVoltageResult {
  validateParams(params);
  let code: bigint;
  try {
    code = typeof codeInput === 'bigint' ? codeInput : BigInt(codeInput);
  } catch {
    throw new Error('码值必须是整数（十进制）');
  }
  const maxCode = powerOfTwoBigInt(params.bits) - ONE;
  if (code < ZERO || code > maxCode) {
    throw new Error(`码值超出范围：当前 N=${params.bits}，合法码值为 0..${maxCode.toString()}`);
  }
  const lsb = getOverview(params).lsb;
  if (params.polarity === 'unipolar') {
    return { voltage: Number(code) * lsb, signedCode: code.toString() };
  }
  const offset = powerOfTwoBigInt(params.bits - 1);
  const signed = code - offset;
  return { voltage: Number(signed) * lsb, signedCode: signed.toString() };
}

/**
 * 由实测 SINAD 反算有效位数 ENOB = (SINAD − 1.76) / 6.02
 */
export function sinadToEnob(sinadDb: number): number {
  if (!Number.isFinite(sinadDb)) {
    throw new Error('SINAD 不是有效数字');
  }
  return (sinadDb - 1.76) / 6.02;
}

/**
 * 码值转十六进制并按 N 位所需宽度补齐（每 hex 字符 4 bit）
 */
export function toHexPadded(code: bigint, bits: number): string {
  const width = Math.ceil(bits / 4);
  const hex = code.toString(16).toUpperCase();
  return hex.padStart(width, '0');
}
