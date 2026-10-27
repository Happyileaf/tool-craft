/**
 * IEEE 754 浮点数位表示转换纯函数：基于 ArrayBuffer / DataView / BigInt
 * 完成单精度（32 位）与双精度（64 位）的确定性编解码，零第三方依赖。
 */

import { PRECISION_CONFIG, PrecisionEnum } from '../constants';

/** 特殊值类型 */
export type SpecialKind = 'none' | 'zero' | 'inf' | 'nan';

/** 编码结果：浮点数值拆解后的位域信息 */
export interface EncodedFloat {
  /** 完整二进制位串（长度 32 / 64） */
  binary: string;
  /** 大写十六进制表示（不带 0x 前缀） */
  hex: string;
  /** 符号位，0 为正、1 为负 */
  sign: 0 | 1;
  /** 指数位域二进制串（8 / 11 位） */
  exponentBits: string;
  /** 去偏置后的指数值；非规约数 / 零按 1-bias 给出 */
  exponentValue: number;
  /** 尾数位域二进制串（23 / 52 位，不含隐藏位） */
  mantissaBits: string;
  /** 尾数的十六进制表示（不带前导 0x，按尾数位宽补零） */
  mantissaHex: string;
  /** 指数位是否为全 1（Infinity / NaN） */
  exponentAllOnes: boolean;
  /** 指数位是否为全 0（零 / 非规约数） */
  exponentAllZeros: boolean;
  /** 特殊值类型 */
  isSpecial: SpecialKind;
}

/** 解码结果 */
export interface DecodedBits {
  /** 还原出的数值（含 ±0、±Infinity、NaN） */
  value: number;
  /** 特殊值类型 */
  isSpecial: SpecialKind;
  /** 识别出的输入进制 */
  base: 2 | 16;
}

/**
 * 非负整数转指定宽度的二进制串（高位补零）。
 *
 * @param value - BigInt 非负整数
 * @param width - 目标位宽
 * @returns 定宽二进制串
 */
export function toBinary(value: bigint, width: number): string {
  return value.toString(2).padStart(width, '0');
}

/**
 * 非负整数转指定宽度的十六进制串（大写、高位补零）。
 *
 * @param value - BigInt 非负整数
 * @param width - 二进制位宽（按 4 位对应 1 个十六进制字符）
 * @returns 定宽十六进制串
 */
export function toHex(value: bigint, width: number): string {
  return value.toString(16).toUpperCase().padStart(Math.ceil(width / 4), '0');
}

/**
 * 定宽二进制串还原为 BigInt。
 *
 * @param bits - 二进制串
 * @returns 位模式对应的非负 BigInt
 */
export function fromBits(bits: string): bigint {
  return BigInt(`0b${bits}`);
}

/**
 * 把 JS 数值编码为 IEEE 754 位域信息。
 *
 * @param value - 任意 JS number（含 ±Infinity、NaN、±0）
 * @param precision - 目标精度
 * @returns 位域拆解结果
 */
export function encodeFloat(value: number, precision: PrecisionEnum): EncodedFloat {
  const config = PRECISION_CONFIG[precision];
  const byteLength = config.totalBits / 8;
  const buffer = new ArrayBuffer(byteLength);
  const view = new DataView(buffer);
  if (precision === PrecisionEnum.SINGLE_32) {
    view.setFloat32(0, value, false);
  } else {
    view.setFloat64(0, value, false);
  }

  let raw = BigInt(0);
  for (let offset = 0; offset < byteLength; offset += 1) {
    raw = (raw << BigInt(8)) | BigInt(view.getUint8(offset));
  }

  const binary = toBinary(raw, config.totalBits);
  const signBit = binary.charAt(0) === '1' ? 1 : 0;
  const exponentBits = binary.slice(config.signBits, config.signBits + config.exponentBits);
  const mantissaBits = binary.slice(config.signBits + config.exponentBits);
  const exponentField = Number.parseInt(exponentBits, 2);
  const exponentAllZeros = exponentField === 0;
  const exponentAllOnes = exponentField === 2 ** config.exponentBits - 1;
  const mantissaValue = fromBits(mantissaBits);

  let isSpecial: SpecialKind = 'none';
  if (exponentAllOnes) {
    isSpecial = mantissaValue === BigInt(0) ? 'inf' : 'nan';
  } else if (exponentAllZeros && mantissaValue === BigInt(0)) {
    isSpecial = 'zero';
  }

  const exponentValue = exponentAllZeros ? 1 - config.bias : exponentField - config.bias;
  const mantissaHex = mantissaValue
    .toString(16)
    .toUpperCase()
    .padStart(Math.ceil(config.mantissaBits / 4), '0');

  return {
    binary,
    hex: toHex(raw, config.totalBits),
    sign: signBit as 0 | 1,
    exponentBits,
    exponentValue,
    mantissaBits,
    mantissaHex,
    exponentAllOnes,
    exponentAllZeros,
    isSpecial,
  };
}

/**
 * 解析用户输入的位串：自动识别或按指定进制解析，校验字符合法性与位宽。
 *
 * @param input - 原始输入文本
 * @param precision - 目标精度
 * @param forcedBase - 可选，强制按 2 / 16 进制解析；缺省时自动识别
 * @returns 位串与识别出的进制
 * @throws 输入为空、含非法字符或位宽不符时抛出错误（中文提示）
 */
export function parseBitString(
  input: string,
  precision: PrecisionEnum,
  forcedBase?: 2 | 16,
): { bits: string; base: 2 | 16 } {
  const config = PRECISION_CONFIG[precision];
  let text = input.trim();
  if (!text) {
    throw new Error('请输入二进制或十六进制位串');
  }

  let base: 2 | 16;
  if (forcedBase !== undefined) {
    base = forcedBase;
  } else if (/^0[xX]/.test(text)) {
    base = 16;
  } else if (/^0[bB]/.test(text)) {
    base = 2;
  } else if (/^[01]+$/.test(text) && text.length === config.totalBits) {
    base = 2;
  } else {
    base = 16;
  }

  text = text.replace(/^0[xX]/, '').replace(/^0[bB]/, '').replace(/[\s_]/g, '');

  if (base === 2) {
    if (!/^[01]+$/.test(text)) {
      throw new Error('二进制串只能包含字符 0 和 1');
    }
    if (text.length !== config.totalBits) {
      throw new Error(`${precision} 表示应为 ${config.totalBits} 位二进制，当前为 ${text.length} 位`);
    }
    return { bits: text, base };
  }

  if (!/^[0-9a-fA-F]+$/.test(text)) {
    throw new Error('十六进制串只能包含 0-9、a-f 字符');
  }
  const hexWidth = config.totalBits / 4;
  if (text.length !== hexWidth) {
    throw new Error(
      `${precision} 表示应为 ${hexWidth} 个十六进制字符，当前为 ${text.length} 个`,
    );
  }
  return { bits: toBinary(BigInt(`0x${text}`), config.totalBits), base };
}

/**
 * 把 IEEE 754 位串还原为 JS 数值。
 *
 * @param input - 二进制 / 十六进制文本（自动识别）
 * @param precision - 源精度
 * @param forcedBase - 可选强制进制
 * @returns 数值、特殊值类型与识别进制
 */
export function decodeBits(
  input: string,
  precision: PrecisionEnum,
  forcedBase?: 2 | 16,
): DecodedBits {
  const config = PRECISION_CONFIG[precision];
  const { bits, base } = parseBitString(input, precision, forcedBase);
  const raw = fromBits(bits);

  const byteLength = config.totalBits / 8;
  const buffer = new ArrayBuffer(byteLength);
  const view = new DataView(buffer);
  let shiftBits = BigInt(config.totalBits - 8);
  for (let offset = 0; offset < byteLength; offset += 1) {
    view.setUint8(offset, Number((raw >> shiftBits) & BigInt(0xff)));
    shiftBits -= BigInt(8);
  }

  const value =
    precision === PrecisionEnum.SINGLE_32 ? view.getFloat32(0, false) : view.getFloat64(0, false);

  const exponentBits = bits.slice(config.signBits, config.signBits + config.exponentBits);
  const exponentField = Number.parseInt(exponentBits, 2);
  const mantissaValue = fromBits(bits.slice(config.signBits + config.exponentBits));
  let isSpecial: SpecialKind = 'none';
  if (exponentField === 2 ** config.exponentBits - 1) {
    isSpecial = mantissaValue === BigInt(0) ? 'inf' : 'nan';
  } else if (exponentField === 0 && mantissaValue === BigInt(0)) {
    isSpecial = 'zero';
  }

  return { value, isSpecial, base };
}

/**
 * 解析十进制文本为 JS number；支持 Infinity / -Infinity / NaN。
 *
 * @param text - 十进制数字面量
 * @returns 数值
 * @throws 无法解析为有限数字或特殊常量时抛出错误
 */
export function parseDecimal(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('请输入十进制数值');
  }
  if (trimmed === 'Infinity' || trimmed === '+Infinity') {
    return Number.POSITIVE_INFINITY;
  }
  if (trimmed === '-Infinity') {
    return Number.NEGATIVE_INFINITY;
  }
  if (trimmed === 'NaN') {
    return Number.NaN;
  }
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) {
    throw new Error('无法解析为十进制数值（支持 Infinity、-Infinity、NaN 与科学计数法）');
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    throw new Error('数值超出可表示范围');
  }
  return value;
}
